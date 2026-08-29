// src/app/api/(user)/orders/route.js
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { query } from "@/lib/postgres";

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

function getAuthUser(request) {
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return null;
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return null;
    }
}

// Generates a random order id: "ORD-" + 8 digits
async function generateUniqueOrderId() {
    for (let attempt = 0; attempt < 5; attempt++) {
        let id = "ORD-";
        for (let i = 0; i < 8; i++) id += Math.floor(Math.random() * 10);
        const { rows } = await query(`SELECT order_id FROM orders WHERE order_id = $1`, [id]);
        if (rows.length === 0) return id;
    }
    return `ORD-${Date.now().toString().slice(-8)}`;
}

async function nextId(table, column, prefix) {
    const { rows } = await query(
        `SELECT ${column} FROM ${table} WHERE ${column} LIKE $1 ORDER BY ${column} DESC LIMIT 1`,
        [`${prefix}-%`]
    );

    let next = 1;
    if (rows.length) {
        const last = rows[0][column];
        const num = parseInt(last.split("-")[1], 10);
        if (!Number.isNaN(num)) next = num + 1;
    }
    return `${prefix}-${String(next).padStart(8, "0")}`;
}

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

function getInitials(name) {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function formatBudget(amount) {
    const n = Number(amount) || 0;
    return `₹${n.toLocaleString("en-IN")}`;
}

function formatDate(date) {
    if (!date) return "No deadline";
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return "No deadline";
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatRelativeCreatedAt(date) {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return "";
    const diffMs = Date.now() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) {
        return `Today, ${d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
    }
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
}

// DB status -> UI status
const STATUS_TO_UI = {
    pending: "Pending",
    in_progress: "In Progress",
    completed: "Completed",
    discarded: "Rejected",
};

// Shapes a raw joined order row into what OrdersModal.jsx expects
function mapOrderRow(row) {
    return {
        id: row.order_id,
        taskId: row.task_id,
        title: row.title || "Task Order",
        clientName: row.other_full_name || "User",
        clientCollege: row.other_college_name || "Unaffiliated",
        clientAvatar: getInitials(row.other_full_name),
        amount: formatBudget(row.amount),
        rawAmount: Number(row.amount),
        platformFee: Number(row.platform_fee_amount || 0),
        escrowStatus: row.status === "completed" ? "Escrow Released" : row.status === "discarded" ? "Escrow Refunded" : "Escrow Funded & Verified",
        deadline: formatDate(row.deadline),
        status: STATUS_TO_UI[row.status] || "Pending",
        requirements: row.description || "",
        category: row.category || "General",
        createdAt: formatRelativeCreatedAt(row.created_at),
        myRole: row.my_role,
    };
}

// ------------------------------------------------------------------
// GET /api/orders
// Returns orders where current user is either client or worker.
// ------------------------------------------------------------------
export async function GET(request) {
    const auth = getAuthUser(request);
    if (!auth) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { rows } = await query(
            `SELECT
                o.order_id, o.task_id, o.amount, o.platform_fee_amount,
                o.status, o.deadline, o.created_at, o.completed_at, o.canceled_at,
                t.title, t.description, t.category,
                CASE WHEN o.client_user_id = $1 THEN 'client' ELSE 'worker' END AS my_role,
                other.user_id AS other_user_id,
                other.full_name AS other_full_name,
                cc.college_name AS other_college_name
             FROM orders o
             LEFT JOIN tasks t ON t.task_id = o.task_id
             JOIN users other ON other.user_id = CASE WHEN o.client_user_id = $1 THEN o.worker_user_id ELSE o.client_user_id END
             LEFT JOIN colleges cc ON cc.college_id = other.college_id
             WHERE o.client_user_id = $1 OR o.worker_user_id = $1
             ORDER BY o.created_at DESC
             LIMIT 200`,
            [auth.user_id]
        );

        return NextResponse.json({ orders: rows.map(mapOrderRow) }, { status: 200 });
    } catch (err) {
        console.error("Orders GET error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// ------------------------------------------------------------------
// POST /api/orders
// User sends an offer on a task or sends an order.
// Body: { task_id, worker_user_id?, client_user_id?, amount, deadline?, note?, platform_fee_percent? }
// ------------------------------------------------------------------
export async function POST(request) {
    const auth = getAuthUser(request);
    if (!auth) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const {
        task_id,
        worker_user_id: reqWorkerId,
        client_user_id: reqClientId,
        amount,
        deadline = null,
        note = "",
        platform_fee_percent = 8.0,
    } = body;

    const numAmount = Number(String(amount).replace(/[^0-9.]/g, ""));
    if (!task_id || !numAmount || numAmount <= 0) {
        return NextResponse.json(
            { error: "task_id and a valid amount greater than 0 are required" },
            { status: 400 }
        );
    }

    try {
        // Confirm task exists and retrieve owner
        const { rows: taskRows } = await query(
            `SELECT task_id, user_id, title, end_date FROM tasks WHERE task_id = $1`,
            [task_id]
        );
        if (taskRows.length === 0) {
            return NextResponse.json({ error: "Task listing not found" }, { status: 404 });
        }

        const task = taskRows[0];

        // Determine client and worker
        let clientId = reqClientId;
        let workerId = reqWorkerId;

        if (String(task.user_id) === String(auth.user_id)) {
            // Auth user is the task owner (client sending order to worker)
            clientId = auth.user_id;
            if (!workerId) {
                return NextResponse.json({ error: "worker_user_id is required when creating an order on your own task" }, { status: 400 });
            }
        } else {
            // Auth user is a freelancer making an offer on another user's task
            clientId = task.user_id;
            workerId = auth.user_id;
        }

        if (String(clientId) === String(workerId)) {
            return NextResponse.json({ error: "Client and worker cannot be the same user" }, { status: 400 });
        }

        const order_id = await generateUniqueOrderId();
        const effectiveDeadline = deadline || task.end_date || null;

        const { rows } = await query(
            `INSERT INTO orders
                (order_id, task_id, client_user_id, worker_user_id, amount, platform_fee_percent, deadline, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
             RETURNING order_id, task_id, client_user_id, worker_user_id, amount, platform_fee_amount, status, deadline, created_at`,
            [order_id, task_id, clientId, workerId, numAmount, Number(platform_fee_percent), effectiveDeadline]
        );

        const newOrder = rows[0];

        // Auto-create conversation and optionally insert initial offer note message
        // seller = worker (who delivers the work), buyer = client (who pays for the task)
        const conversationId = await findOrCreateConversation(order_id, workerId, clientId);
        if (note && note.trim()) {
            await insertMessage(conversationId, auth.user_id, note.trim());
        }

        return NextResponse.json(
            { message: "Offer submitted successfully", order: newOrder, conversation_id: conversationId },
            { status: 201 }
        );
    } catch (err) {
        console.error("Orders POST error:", err);
        return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
    }
}

// ------------------------------------------------------------------
// PATCH /api/orders
// Either party accepts/rejects a pending order, or completes/cancels it.
// Body: { order_id, action: "accept" | "reject" | "complete" | "cancel" }
// ------------------------------------------------------------------
export async function PATCH(request) {
    const auth = getAuthUser(request);
    if (!auth) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { order_id, action } = body;
    const VALID_ACTIONS = ["accept", "reject", "complete", "cancel"];

    if (!order_id || !VALID_ACTIONS.includes(action)) {
        return NextResponse.json(
            { error: `order_id is required and action must be one of ${VALID_ACTIONS.join(", ")}` },
            { status: 400 }
        );
    }

    try {
        const { rows: orderRows } = await query(
            `SELECT order_id, client_user_id, worker_user_id, status FROM orders WHERE order_id = $1`,
            [order_id]
        );

        if (orderRows.length === 0) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        const order = orderRows[0];
        const isWorker = String(order.worker_user_id) === String(auth.user_id);
        const isClient = String(order.client_user_id) === String(auth.user_id);

        if (!isWorker && !isClient) {
            return NextResponse.json({ error: "Forbidden: You are not part of this order" }, { status: 403 });
        }

        let sql, params;

        if (action === "accept") {
            if (order.status !== "pending" && order.status !== "discarded") {
                return NextResponse.json({ error: `Cannot accept an order in '${order.status}' status` }, { status: 409 });
            }
            sql = `UPDATE orders SET status = 'in_progress', canceled_at = NULL WHERE order_id = $1 RETURNING *`;
            params = [order_id];
        } else if (action === "reject") {
            if (order.status !== "pending") {
                return NextResponse.json({ error: `Cannot reject an order in '${order.status}' status` }, { status: 409 });
            }
            sql = `UPDATE orders SET status = 'discarded', canceled_at = now() WHERE order_id = $1 RETURNING *`;
            params = [order_id];
        } else if (action === "complete") {
            if (order.status !== "in_progress") {
                return NextResponse.json({ error: `Cannot complete an order in '${order.status}' status` }, { status: 409 });
            }
            sql = `UPDATE orders SET status = 'completed', completed_at = now() WHERE order_id = $1 RETURNING *`;
            params = [order_id];
        } else if (action === "cancel") {
            if (order.status !== "in_progress" && order.status !== "pending") {
                return NextResponse.json({ error: `Cannot cancel an order in '${order.status}' status` }, { status: 409 });
            }
            sql = `UPDATE orders SET status = 'discarded', canceled_at = now() WHERE order_id = $1 RETURNING *`;
            params = [order_id];
        }

        const { rows } = await query(sql, params);

        // Ensure conversation is ready
        await findOrCreateConversation(order_id);

        return NextResponse.json({ message: `Order ${action}ed`, order: rows[0] }, { status: 200 });
    } catch (err) {
        console.error("Orders PATCH error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}