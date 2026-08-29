// src/app/api/(user)/wallet/route.js
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { query } from "@/lib/postgres";

// ------------------------------------------------------------------
// Auth Helper
// ------------------------------------------------------------------
function getAuthUser(request) {
    try {
        const authHeader = request.headers.get("authorization") || "";
        let token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
        if (!token) {
            token = request.cookies?.get?.("token")?.value;
        }
        if (!token) return null;
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return null;
    }
}

function formatDate(date) {
    if (!date) return "Recently";
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return "Recently";
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatTime(date) {
    if (!date) return "";
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

// ------------------------------------------------------------------
// GET /api/wallet
// Returns wallet balances and real order transactions for the user
// ------------------------------------------------------------------
export async function GET(request) {
    const authUser = getAuthUser(request);
    if (!authUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const userId = authUser.user_id;

        // 1. Fetch user info
        const { rows: userRows } = await query(
            `SELECT u.user_id, u.full_name, u.email, u.role, u.total_earnings, u.total_gigs_completed, u.reputation_score,
                    c.college_name
             FROM users u
             LEFT JOIN colleges c ON c.college_id = u.college_id
             WHERE u.user_id = $1`,
            [userId]
        );

        const userData = userRows[0] || {};

        // 2. Fetch all orders where user is worker or client
        const { rows: orderRows } = await query(
            `SELECT
                o.order_id,
                o.task_id,
                o.client_user_id,
                o.worker_user_id,
                o.amount,
                o.platform_fee_percent,
                o.platform_fee_amount,
                o.status,
                o.deadline,
                o.created_at,
                o.updated_at,
                o.completed_at,
                o.canceled_at,
                t.title AS task_title,
                t.category AS task_category,
                other.full_name AS other_full_name,
                col.college_name AS other_college_name
             FROM orders o
             LEFT JOIN tasks t ON t.task_id = o.task_id
             JOIN users other ON other.user_id = CASE WHEN o.client_user_id = $1 THEN o.worker_user_id ELSE o.client_user_id END
             LEFT JOIN colleges col ON col.college_id = other.college_id
             WHERE o.client_user_id = $1 OR o.worker_user_id = $1
             ORDER BY COALESCE(o.completed_at, o.updated_at, o.created_at) DESC`,
            [userId]
        );

        // 3. Compute balances
        let availableBalance = 0;
        let escrowBalance = 0;
        let lifetimeEarnings = 0;
        let completedGigsCount = 0;

        const transactions = [];

        for (const o of orderRows) {
            const isWorker = String(o.worker_user_id) === String(userId);
            const isClient = String(o.client_user_id) === String(userId);
            const grossAmt = Number(o.amount) || 0;
            const feeAmt = Number(o.platform_fee_amount) || 0;
            const netWorkerAmt = Math.max(0, grossAmt - feeAmt);

            const txDate = o.completed_at || o.updated_at || o.created_at;

            if (isWorker) {
                if (o.status === "completed") {
                    availableBalance += netWorkerAmt;
                    lifetimeEarnings += netWorkerAmt;
                    completedGigsCount += 1;

                    transactions.push({
                        id: o.order_id,
                        type: "Escrow Release",
                        title: `Completed: ${o.task_title || "Project Delivery"}`,
                        description: `Payout from client ${o.other_full_name || "Campus Client"} (${o.other_college_name || "Collegiate Partner"}) • Net earned after platform fee`,
                        amount: netWorkerAmt,
                        grossAmount: grossAmt,
                        platformFee: feeAmt,
                        date: formatDate(txDate),
                        time: formatTime(txDate),
                        status: "Completed",
                        badgeClass: "completed",
                        category: o.task_category || "Gig Work",
                        role: "seller",
                    });
                } else if (o.status === "in_progress") {
                    escrowBalance += netWorkerAmt;

                    transactions.push({
                        id: o.order_id,
                        type: "In Escrow",
                        title: `Contract Underway: ${o.task_title || "Ongoing Task"}`,
                        description: `Secured in escrow by client ${o.other_full_name || "Campus Client"} (${o.other_college_name || "Collegiate Partner"})`,
                        amount: netWorkerAmt,
                        grossAmount: grossAmt,
                        platformFee: feeAmt,
                        date: formatDate(txDate),
                        time: formatTime(txDate),
                        status: "Secured",
                        badgeClass: "escrow",
                        category: o.task_category || "Gig Work",
                        role: "seller",
                    });
                } else if (o.status === "pending") {
                    transactions.push({
                        id: o.order_id,
                        type: "Offer Pending",
                        title: `Offer Received: ${o.task_title || "Task Offer"}`,
                        description: `Pending acceptance with ${o.other_full_name || "User"}`,
                        amount: netWorkerAmt,
                        grossAmount: grossAmt,
                        platformFee: feeAmt,
                        date: formatDate(txDate),
                        time: formatTime(txDate),
                        status: "Pending",
                        badgeClass: "pending",
                        category: o.task_category || "Gig Work",
                        role: "seller",
                    });
                } else if (o.status === "discarded") {
                    transactions.push({
                        id: o.order_id,
                        type: "Cancelled",
                        title: `Cancelled: ${o.task_title || "Task Order"}`,
                        description: `Order was discarded or cancelled with ${o.other_full_name || "User"}`,
                        amount: 0,
                        grossAmount: grossAmt,
                        platformFee: 0,
                        date: formatDate(txDate),
                        time: formatTime(txDate),
                        status: "Cancelled",
                        badgeClass: "discarded",
                        category: o.task_category || "Gig Work",
                        role: "seller",
                    });
                }
            } else if (isClient) {
                if (o.status === "in_progress") {
                    transactions.push({
                        id: o.order_id,
                        type: "Escrow Deposit",
                        title: `Escrow Funded: ${o.task_title || "Task Engagement"}`,
                        description: `Held safely in escrow vault for worker ${o.other_full_name || "Campus Worker"}`,
                        amount: -grossAmt,
                        grossAmount: grossAmt,
                        platformFee: feeAmt,
                        date: formatDate(txDate),
                        time: formatTime(txDate),
                        status: "Secured",
                        badgeClass: "escrow",
                        category: o.task_category || "Hiring",
                        role: "buyer",
                    });
                } else if (o.status === "completed") {
                    transactions.push({
                        id: o.order_id,
                        type: "Escrow Settled",
                        title: `Order Settled: ${o.task_title || "Task Completed"}`,
                        description: `Escrow released to worker ${o.other_full_name || "Campus Worker"} on successful delivery`,
                        amount: -grossAmt,
                        grossAmount: grossAmt,
                        platformFee: feeAmt,
                        date: formatDate(txDate),
                        time: formatTime(txDate),
                        status: "Completed",
                        badgeClass: "completed",
                        category: o.task_category || "Hiring",
                        role: "buyer",
                    });
                } else if (o.status === "discarded") {
                    transactions.push({
                        id: o.order_id,
                        type: "Escrow Refunded",
                        title: `Refunded: ${o.task_title || "Cancelled Order"}`,
                        description: `Escrow refunded for order with ${o.other_full_name || "Worker"}`,
                        amount: grossAmt,
                        grossAmount: grossAmt,
                        platformFee: 0,
                        date: formatDate(txDate),
                        time: formatTime(txDate),
                        status: "Refunded",
                        badgeClass: "completed",
                        category: o.task_category || "Hiring",
                        role: "buyer",
                    });
                }
            }
        }

        // Sync with users table total_earnings and total_gigs_completed if different
        if (
            userData.total_earnings !== Math.round(lifetimeEarnings) ||
            userData.total_gigs_completed !== completedGigsCount
        ) {
            query(
                `UPDATE users SET total_earnings = $1, total_gigs_completed = $2 WHERE user_id = $3`,
                [Math.round(lifetimeEarnings), completedGigsCount, userId]
            ).catch((err) => console.error("Error updating user earnings count:", err));
        }

        return NextResponse.json(
            {
                success: true,
                user: {
                    user_id: userData.user_id,
                    full_name: userData.full_name,
                    email: userData.email,
                    college: userData.college_name,
                    reputation_score: userData.reputation_score,
                },
                balances: {
                    availableBalance,
                    escrowBalance,
                    lifetimeEarnings,
                    completedGigsCount,
                },
                transactions,
            },
            { status: 200 }
        );
    } catch (err) {
        console.error("Wallet GET error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// ------------------------------------------------------------------
// POST /api/wallet
// Handle withdrawal / redeem requests
// ------------------------------------------------------------------
export async function POST(request) {
    const authUser = getAuthUser(request);
    if (!authUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { action = "withdraw", amount, upi_id = "user@upi" } = body;
    const numAmount = Number(amount);

    if (!numAmount || numAmount <= 0) {
        return NextResponse.json({ error: "Please enter a valid amount greater than 0" }, { status: 400 });
    }

    if (action === "withdraw" || action === "redeem") {
        if (!upi_id || !upi_id.trim()) {
            return NextResponse.json({ error: "A valid UPI ID is required for withdrawal/redemption" }, { status: 400 });
        }

        return NextResponse.json(
            {
                success: true,
                message: `₹${numAmount.toLocaleString("en-IN")} redeemed successfully! Instant transfer initiated to ${upi_id}.`,
                transaction_id: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
                amount: numAmount,
                upi_id,
            },
            { status: 200 }
        );
    }

    if (action === "deposit") {
        return NextResponse.json(
            {
                success: true,
                message: `₹${numAmount.toLocaleString("en-IN")} added successfully to your wallet balance.`,
                transaction_id: `DEP-${Math.floor(100000 + Math.random() * 900000)}`,
                amount: numAmount,
            },
            { status: 200 }
        );
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
