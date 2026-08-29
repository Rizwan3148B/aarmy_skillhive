// src/app/api/(user)/messages/route.js
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { query } from "@/lib/postgres";

/* ------------------------------------------------------------------ */
/*  Auth helper                                                        */
/* ------------------------------------------------------------------ */

function getUserFromRequest(request) {
    const header = request.headers.get("authorization") || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) return null;

    try {
        return jwt.verify(token, process.env.JWT_SECRET); // { user_id, email, iat, exp }
    } catch {
        return null;
    }
}

function unauthorized() {
    return NextResponse.json({ error: "Missing or invalid token" }, { status: 401 });
}

/* ------------------------------------------------------------------ */
/*  Id generation (mirrors the ORD-00000001 style already in use)      */
/* ------------------------------------------------------------------ */

async function nextId(table, column, prefix) {
    const { rows } = await query(
        `SELECT ${column} FROM ${table} WHERE ${column} LIKE $1 ORDER BY ${column} DESC LIMIT 1`,
        [`${prefix}-%`]
    );

    let next = 1;
    if (rows.length) {
        const last = rows[0][column]; // e.g. 'CONV-00000007'
        const num = parseInt(last.split("-")[1], 10);
        if (!Number.isNaN(num)) next = num + 1;
    }
    return `${prefix}-${String(next).padStart(8, "0")}`;
}

/* ------------------------------------------------------------------ */
/*  Conversation helpers                                               */
/* ------------------------------------------------------------------ */

// Loads the order and checks that `userId` is either the client or the worker.
async function getAuthorizedOrder(orderId, userId) {
    const { rows } = await query(
        `SELECT order_id, client_user_id, worker_user_id, status, amount, deadline
         FROM orders
         WHERE order_id = $1`,
        [orderId]
    );

    if (rows.length === 0) return { order: null, error: "Order not found", status: 404 };

    const order = rows[0];
    if (String(order.client_user_id) !== String(userId) && String(order.worker_user_id) !== String(userId)) {
        return { order: null, error: "You are not part of this order", status: 403 };
    }

    return { order, error: null, status: 200 };
}

// Finds the conversation tied to an order, creating it on first use with seller and buyer.
async function findOrCreateConversation(orderId, sellerUserId = null, buyerUserId = null) {
    const existing = await query(
        `SELECT conversation_id, seller_user_id, buyer_user_id FROM conversations WHERE order_id = $1`,
        [orderId]
    );
    if (existing.rows.length) return existing.rows[0].conversation_id;

    let seller = sellerUserId;
    let buyer = buyerUserId;
    if (!seller || !buyer) {
        const { rows: orderRows } = await query(
            `SELECT worker_user_id, client_user_id FROM orders WHERE order_id = $1`,
            [orderId]
        );
        if (orderRows.length > 0) {
            seller = seller || orderRows[0].worker_user_id;
            buyer = buyer || orderRows[0].client_user_id;
        }
    }

    for (let attempt = 0; attempt < 5; attempt++) {
        const conversationId = await nextId("conversations", "conversation_id", "CONV");
        try {
            const { rows } = await query(
                `INSERT INTO conversations (conversation_id, order_id, seller_user_id, buyer_user_id)
                 VALUES ($1, $2, $3, $4)
                 RETURNING conversation_id`,
                [conversationId, orderId, seller, buyer]
            );
            return rows[0].conversation_id;
        } catch (err) {
            // 23505 = unique_violation (id collision, or someone else just created it)
            if (err.code === "23505") {
                const retry = await query(
                    `SELECT conversation_id FROM conversations WHERE order_id = $1`,
                    [orderId]
                );
                if (retry.rows.length) return retry.rows[0].conversation_id;
                continue;
            }
            throw err;
        }
    }
    throw new Error("Could not allocate a conversation id");
}

async function insertMessage(conversationId, senderUserId, content) {
    for (let attempt = 0; attempt < 5; attempt++) {
        const messageId = await nextId("messages", "message_id", "MSG");
        try {
            const { rows } = await query(
                `INSERT INTO messages (message_id, conversation_id, sender_user_id, content)
                 VALUES ($1, $2, $3, $4)
                 RETURNING message_id, conversation_id, sender_user_id, content, created_at`,
                [messageId, conversationId, senderUserId, content]
            );
            // Keep conversations.updated_at fresh for sidebar sorting.
            await query(`UPDATE conversations SET updated_at = now() WHERE conversation_id = $1`, [
                conversationId,
            ]);
            return rows[0];
        } catch (err) {
            if (err.code === "23505") continue;
            throw err;
        }
    }
    throw new Error("Could not allocate a message id");
}

/* ------------------------------------------------------------------ */
/*  Status mapping (DB enum <-> UI labels used by the messages page)   */
/* ------------------------------------------------------------------ */

const STATUS_TO_UI = {
    pending: "Pending",
    in_progress: "In Progress",
    completed: "Delivered",
    discarded: "Cancelled",
};

const PROGRESS_BY_STATUS = {
    pending: 0,
    in_progress: 50,
    completed: 100,
    discarded: 0,
};

/* ------------------------------------------------------------------ */
/*  GET                                                                 */
/*  - /api/messages                    -> list every conversation the   */
/*                                         current user is part of      */
/*  - /api/messages?order_id=ORD-xxx   -> full message history for      */
/*                                         one order (creates the       */
/*                                         conversation if needed)      */
/* ------------------------------------------------------------------ */

export async function GET(request) {
    const authUser = getUserFromRequest(request);
    if (!authUser) return unauthorized();

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("order_id");

    if (orderId) {
        return getConversationForOrder(orderId, authUser.user_id);
    }
    return listConversations(authUser.user_id);
}

async function getConversationForOrder(orderId, userId) {
    const { order, error, status } = await getAuthorizedOrder(orderId, userId);
    if (error) return NextResponse.json({ error }, { status });

    const conversationId = await findOrCreateConversation(orderId, order.worker_user_id, order.client_user_id);

    const { rows: messages } = await query(
        `SELECT message_id, sender_user_id, content, created_at, is_deleted
         FROM messages
         WHERE conversation_id = $1
         ORDER BY created_at ASC`,
        [conversationId]
    );

    const isSeller = String(order.worker_user_id) === String(userId);
    const isBuyer = String(order.client_user_id) === String(userId);

    return NextResponse.json({
        order_id: order.order_id,
        conversation_id: conversationId,
        seller_user_id: order.worker_user_id,
        buyer_user_id: order.client_user_id,
        is_seller: isSeller,
        is_buyer: isBuyer,
        my_role: isSeller ? "seller" : "buyer",
        status: STATUS_TO_UI[order.status] || order.status,
        messages: messages.map((m) => ({
            id: m.message_id,
            sender: String(m.sender_user_id) === String(userId) ? "me" : "client",
            sender_user_id: m.sender_user_id,
            text: m.is_deleted ? "This message was deleted." : m.content,
            time: m.created_at,
        })),
    });
}

async function listConversations(userId) {
    const { rows } = await query(
        `SELECT
        o.order_id,
        o.status                                                  AS order_status,
        o.amount,
        o.deadline,
        o.client_user_id,
        o.worker_user_id,
        CASE WHEN o.worker_user_id = $1 THEN 'seller' ELSE 'buyer' END AS my_role,
        (o.worker_user_id = $1)                                   AS is_seller,
        (o.client_user_id = $1)                                   AS is_buyer,
        other.user_id                                             AS other_user_id,
        other.full_name                                           AS other_full_name,
        other.branch                                              AS other_branch,
        other.role                                                AS other_role,
        other.reputation_score                                    AS other_reputation,
        other.total_gigs_completed                                AS other_total_gigs,
        college.college_name                                      AS other_college_name,
        task.title                                                AS task_title,
        conv.conversation_id                                      AS conversation_id,
        conv.seller_user_id                                       AS conv_seller_id,
        conv.buyer_user_id                                        AS conv_buyer_id,
        last_msg.content                                          AS last_message_content,
        last_msg.created_at                                       AS last_message_at,
        last_msg.sender_user_id                                   AS last_message_sender
      FROM orders o
      JOIN users other
        ON other.user_id = CASE WHEN o.client_user_id = $1 THEN o.worker_user_id ELSE o.client_user_id END
      LEFT JOIN colleges college ON college.college_id = other.college_id
      LEFT JOIN tasks task ON task.task_id = o.task_id
      LEFT JOIN conversations conv ON conv.order_id = o.order_id
      LEFT JOIN LATERAL (
        SELECT content, created_at, sender_user_id
          FROM messages m
         WHERE m.conversation_id = conv.conversation_id
         ORDER BY m.created_at DESC
         LIMIT 1
      ) last_msg ON true
      WHERE o.client_user_id = $1 OR o.worker_user_id = $1
      ORDER BY COALESCE(last_msg.created_at, o.updated_at, o.created_at) DESC`,
        [userId]
    );

    const chats = rows.map((r) => {
        const isSeller = r.is_seller || String(r.worker_user_id) === String(userId);
        const isBuyer = r.is_buyer || String(r.client_user_id) === String(userId);

        return {
            id: r.order_id,
            conversationId: r.conversation_id,
            myRole: isSeller ? "seller" : "buyer",
            isSeller: Boolean(isSeller),
            isBuyer: Boolean(isBuyer),
            sellerUserId: r.worker_user_id,
            buyerUserId: r.client_user_id,
            clientName: r.other_full_name || "User",
            clientCollege: r.other_college_name || "Unaffiliated",
            clientRole: r.other_branch || r.other_role || "Student",
            orderTitle: r.task_title || "Task Order",
            amount: `₹${Number(r.amount).toLocaleString("en-IN")}`,
            status: STATUS_TO_UI[r.order_status] || r.order_status,
            progress: PROGRESS_BY_STATUS[r.order_status] ?? 0,
            deadline: r.deadline,
            escrowStatus:
                r.order_status === "completed" ? "Released" : r.order_status === "discarded" ? "Refunded" : "Secured in Escrow",
            rating: "5.0",
            reviewsCount: r.other_total_gigs || 0,
            totalTasks: r.other_total_gigs || 0,
            reputation: `${r.other_reputation || 100}%`,
            unreadCount: 0,
            lastMessageTime: r.last_message_at,
            lastMessagePreview: r.last_message_content
                ? (String(r.last_message_sender) === String(userId) ? "You: " : "") + r.last_message_content
                : "No messages yet",
        };
    });

    return NextResponse.json({ chats });
}

/* ------------------------------------------------------------------ */
/*  POST — send a message on an order's conversation                   */
/*  body: { order_id, content }                                        */
/* ------------------------------------------------------------------ */

export async function POST(request) {
    const authUser = getUserFromRequest(request);
    if (!authUser) return unauthorized();

    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { order_id, content } = body;
    if (!order_id || !content || !content.trim()) {
        return NextResponse.json({ error: "order_id and content are required" }, { status: 400 });
    }

    const { order, error, status } = await getAuthorizedOrder(order_id, authUser.user_id);
    if (error) return NextResponse.json({ error }, { status });

    if (order.status === "discarded") {
        return NextResponse.json({ error: "This order was cancelled; messaging is closed." }, { status: 409 });
    }

    try {
        const conversationId = await findOrCreateConversation(order_id, order.worker_user_id, order.client_user_id);
        const message = await insertMessage(conversationId, authUser.user_id, content.trim());

        return NextResponse.json(
            {
                id: message.message_id,
                sender: "me",
                sender_user_id: message.sender_user_id,
                text: message.content,
                time: message.created_at,
            },
            { status: 201 }
        );
    } catch (err) {
        console.error("Send message error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

/* ------------------------------------------------------------------ */
/*  PATCH — order-state actions triggered from the chat UI             */
/*  body: { order_id, action: 'accept' | 'cancel' | 'deliver',         */
/*          delivery_note?, delivery_link? }                           */
/* ------------------------------------------------------------------ */

export async function PATCH(request) {
    const authUser = getUserFromRequest(request);
    if (!authUser) return unauthorized();

    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { order_id, action } = body;
    if (!order_id || !["accept", "cancel", "deliver"].includes(action)) {
        return NextResponse.json(
            { error: "order_id and a valid action ('accept' | 'cancel' | 'deliver') are required" },
            { status: 400 }
        );
    }

    const { order, error, status } = await getAuthorizedOrder(order_id, authUser.user_id);
    if (error) return NextResponse.json({ error }, { status });

    const isSeller = String(order.worker_user_id) === String(authUser.user_id);

    try {
        if (action === "accept") {
            if (order.status !== "pending" && order.status !== "discarded") {
                return NextResponse.json({ error: `Cannot accept an order in '${order.status}' state` }, { status: 409 });
            }
            const { rows } = await query(
                `UPDATE orders SET status = 'in_progress', canceled_at = NULL WHERE order_id = $1 RETURNING status`,
                [order_id]
            );
            await findOrCreateConversation(order_id, order.worker_user_id, order.client_user_id);
            return NextResponse.json({ order_id, status: STATUS_TO_UI[rows[0].status] });
        }

        if (action === "cancel") {
            if (!isSeller) {
                return NextResponse.json({ error: "Only the seller can cancel this order from chat" }, { status: 403 });
            }
            if (order.status === "completed" || order.status === "discarded") {
                return NextResponse.json({ error: `Cannot cancel an order in '${order.status}' state` }, { status: 409 });
            }
            const { rows } = await query(
                `UPDATE orders SET status = 'discarded', canceled_at = now() WHERE order_id = $1 RETURNING status`,
                [order_id]
            );
            return NextResponse.json({ order_id, status: STATUS_TO_UI[rows[0].status] });
        }

        // action === "deliver"
        if (!isSeller) {
            return NextResponse.json({ error: "Only the assigned seller can deliver proof of work" }, { status: 403 });
        }
        if (order.status !== "in_progress") {
            return NextResponse.json({ error: `Cannot deliver an order in '${order.status}' state` }, { status: 409 });
        }

        const { delivery_note = "", delivery_link = "" } = body;

        const { rows } = await query(
            `UPDATE orders SET status = 'completed', completed_at = now() WHERE order_id = $1 RETURNING status`,
            [order_id]
        );

        // Record the delivery as a normal chat message so it shows up in history
        const conversationId = await findOrCreateConversation(order_id, order.worker_user_id, order.client_user_id);
        const deliveryText = `🚀 Project Deliverable submitted: ${delivery_link}. Notes: ${delivery_note}`;
        const message = await insertMessage(conversationId, authUser.user_id, deliveryText);

        return NextResponse.json({
            order_id,
            status: STATUS_TO_UI[rows[0].status],
            message: {
                id: message.message_id,
                sender: "me",
                sender_user_id: message.sender_user_id,
                text: message.content,
                time: message.created_at,
            },
        });
    } catch (err) {
        console.error("Order action error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}