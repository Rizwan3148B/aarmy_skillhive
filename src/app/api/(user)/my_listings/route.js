// src/app/api/(user)/my_listings/route.js
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { query } from "@/lib/postgres";

// ─── Helpers ──────────────────────────────────────────────────────────

function getAuthUser(request) {
    try {
        const authHeader = request.headers.get("authorization");
        let token = null;

        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.slice(7);
        } else {
            token = request.cookies.get("token")?.value;
        }

        if (!token) return null;
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return null;
    }
}

function generateTaskId() {
    let id = "TSK";
    for (let i = 0; i < 11; i++) {
        id += Math.floor(Math.random() * 10);
    }
    return id;
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

function mapStatusToLabel(status) {
    switch (status) {
        case "open":
            return "Active";
        case "in_progress":
            return "In Progress";
        case "completed":
            return "Completed";
        case "cancelled":
            return "Paused";
        default:
            return "Active";
    }
}

function mapLabelToStatus(label) {
    if (!label) return "open";
    const lower = String(label).toLowerCase();
    if (lower === "active" || lower === "open") return "open";
    if (lower === "in progress" || lower === "hired" || lower === "in_progress") return "in_progress";
    if (lower === "completed") return "completed";
    if (lower === "paused" || lower === "cancelled") return "cancelled";
    return "open";
}

function mapTaskRow(row) {
    return {
        id: row.task_id,
        taskId: row.task_id,
        title: row.title,
        description: row.description || "",
        category: row.category,
        targetAudience: row.target === "own_college" ? "My College" : "All Campuses",
        target: row.target,
        budget: formatBudget(row.max_budget),
        rawBudget: row.max_budget,
        deliveryDate: formatDate(row.end_date),
        endDate: row.end_date ? new Date(row.end_date).toISOString().split("T")[0] : "",
        roleType: row.role_type || "remote",
        status: mapStatusToLabel(row.status),
        rawStatus: row.status,
        tags: row.tags || [],
        createdAt: formatDate(row.created_at),
        createdAtRaw: row.created_at,
        applicants: 0,
        views: 12,
        offers: [],
    };
}

// ─── GET /api/my_listings ─────────────────────────────────────────────
// Returns all task listings for the authenticated user + categories
export async function GET(request) {
    const auth = getAuthUser(request);
    if (!auth) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Fetch user's listings
        const { rows: taskRows } = await query(
            `SELECT task_id, user_id, title, description, category,
                    max_budget, end_date, role_type, status, target,
                    tags, created_at
             FROM tasks
             WHERE user_id = $1
             ORDER BY created_at DESC`,
            [auth.user_id]
        );

        // Fetch categories list from skills table
        let categories = [];
        try {
            const { rows: skillRows } = await query(
                `SELECT DISTINCT category FROM skills WHERE category IS NOT NULL ORDER BY category ASC`
            );
            categories = skillRows.map((s) => s.category).filter(Boolean);
        } catch {
            categories = [
                "Programming & Tech",
                "AI Services",
                "Graphics & Design",
                "Digital Marketing",
                "Business",
                "Video & Animation",
                "Music & Audio",
            ];
        }

        // Fetch user basic profile info
        const { rows: userRows } = await query(
            `SELECT u.user_id, u.full_name, u.email, u.college_id, c.college_name,
                    u.total_gigs_posted, u.total_gigs_completed, u.total_earnings
             FROM users u
             LEFT JOIN colleges c ON c.college_id = u.college_id
             WHERE u.user_id = $1`,
            [auth.user_id]
        );

        const user = userRows[0] || null;
        const listings = taskRows.map(mapTaskRow);

        return NextResponse.json(
            {
                success: true,
                user: user
                    ? {
                          user_id: user.user_id,
                          full_name: user.full_name,
                          email: user.email,
                          college: user.college_name || "Unknown College",
                          total_gigs_posted: user.total_gigs_posted || listings.length,
                          total_gigs_completed: user.total_gigs_completed || 0,
                          total_earnings: formatBudget(user.total_earnings || 0),
                      }
                    : null,
                listings,
                categories,
            },
            { status: 200 }
        );
    } catch (err) {
        console.error("GET /api/my_listings error:", err);
        return NextResponse.json({ error: "Failed to fetch user listings" }, { status: 500 });
    }
}

// ─── POST /api/my_listings ────────────────────────────────────────────
// Create a new task listing
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
        title,
        description = "",
        category,
        max_budget,
        budget,
        end_date = null,
        deliveryDate,
        role_type = "remote",
        targetAudience = "My College",
        target,
        tags = [],
    } = body;

    const rawBudget = Number(String(max_budget || budget || "0").replace(/[^0-9.]/g, ""));

    if (!title || !category || rawBudget <= 0) {
        return NextResponse.json(
            { error: "Title, category, and a valid budget greater than 0 are required" },
            { status: 400 }
        );
    }

    const computedTarget = target || (targetAudience === "My College" ? "own_college" : "others");
    const computedRoleType = ["hybrid", "remote"].includes(role_type) ? role_type : "remote";
    const computedEndDate = end_date || (deliveryDate ? new Date(deliveryDate) : null);

    if (computedEndDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selected = new Date(computedEndDate);
        selected.setHours(0, 0, 0, 0);
        if (selected <= today) {
            return NextResponse.json(
                { error: "Delivery date must be at least tomorrow. You cannot select today or a past date." },
                { status: 400 }
            );
        }
    }

    const cleanTags = Array.isArray(tags)
        ? tags.map((t) => String(t).trim()).filter(Boolean)
        : String(tags)
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean);

    try {
        const task_id = generateTaskId();

        const { rows } = await query(
            `INSERT INTO tasks
                (task_id, user_id, title, description, category, max_budget, end_date, role_type, status, target, tags)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'open', $9, $10)
             RETURNING task_id, user_id, title, description, category, max_budget, end_date, role_type, status, target, tags, created_at`,
            [
                task_id,
                auth.user_id,
                title.trim(),
                description.trim(),
                category.trim(),
                rawBudget,
                computedEndDate,
                computedRoleType,
                computedTarget,
                cleanTags,
            ]
        );

        // Increment user's total_gigs_posted count
        await query(
            `UPDATE users SET total_gigs_posted = COALESCE(total_gigs_posted, 0) + 1 WHERE user_id = $1`,
            [auth.user_id]
        );

        const newListing = mapTaskRow(rows[0]);

        return NextResponse.json(
            {
                success: true,
                message: "Listing published successfully",
                listing: newListing,
            },
            { status: 201 }
        );
    } catch (err) {
        console.error("POST /api/my_listings error:", err);
        return NextResponse.json({ error: "Failed to create listing" }, { status: 500 });
    }
}

// ─── PUT /api/my_listings ─────────────────────────────────────────────
// Update an existing task listing
export async function PUT(request) {
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
        id,
        taskId,
        task_id = id || taskId,
        title,
        description,
        category,
        budget,
        max_budget,
        end_date,
        deliveryDate,
        role_type,
        status,
        targetAudience,
        target,
        tags,
    } = body;

    if (!task_id) {
        return NextResponse.json({ error: "task_id is required" }, { status: 400 });
    }

    // Verify task exists and belongs to auth user
    const { rows: existingRows } = await query(
        `SELECT * FROM tasks WHERE task_id = $1 AND user_id = $2`,
        [task_id, auth.user_id]
    );

    if (existingRows.length === 0) {
        return NextResponse.json({ error: "Listing not found or unauthorized" }, { status: 404 });
    }

    const existing = existingRows[0];

    const rawBudget =
        budget || max_budget
            ? Number(String(max_budget || budget).replace(/[^0-9.]/g, ""))
            : existing.max_budget;

    const newTarget =
        target || (targetAudience ? (targetAudience === "My College" ? "own_college" : "others") : existing.target);

    const newStatus = status ? mapLabelToStatus(status) : existing.status;

    let cleanTags = existing.tags;
    if (tags !== undefined) {
        cleanTags = Array.isArray(tags)
            ? tags.map((t) => String(t).trim()).filter(Boolean)
            : String(tags)
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean);
    }

    const newEndDate = end_date !== undefined ? end_date : (deliveryDate ? new Date(deliveryDate) : existing.end_date);

    if (newEndDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selected = new Date(newEndDate);
        selected.setHours(0, 0, 0, 0);
        if (selected <= today) {
            return NextResponse.json(
                { error: "Delivery date must be at least tomorrow. You cannot select today or a past date." },
                { status: 400 }
            );
        }
    }

    try {
        const { rows } = await query(
            `UPDATE tasks SET
                title = COALESCE($1, title),
                description = COALESCE($2, description),
                category = COALESCE($3, category),
                max_budget = COALESCE($4, max_budget),
                end_date = $5,
                role_type = COALESCE($6, role_type),
                status = COALESCE($7, status),
                target = COALESCE($8, target),
                tags = COALESCE($9, tags)
             WHERE task_id = $10 AND user_id = $11
             RETURNING task_id, user_id, title, description, category, max_budget, end_date, role_type, status, target, tags, created_at`,
            [
                title ? title.trim() : null,
                description !== undefined ? description.trim() : null,
                category ? category.trim() : null,
                rawBudget > 0 ? rawBudget : null,
                newEndDate,
                role_type || null,
                newStatus,
                newTarget,
                cleanTags,
                task_id,
                auth.user_id,
            ]
        );

        const updatedListing = mapTaskRow(rows[0]);

        return NextResponse.json(
            {
                success: true,
                message: "Listing updated successfully",
                listing: updatedListing,
            },
            { status: 200 }
        );
    } catch (err) {
        console.error("PUT /api/my_listings error:", err);
        return NextResponse.json({ error: "Failed to update listing" }, { status: 500 });
    }
}

// ─── DELETE /api/my_listings ──────────────────────────────────────────
// Delete a task listing
export async function DELETE(request) {
    const auth = getAuthUser(request);
    if (!auth) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let taskId = searchParams.get("id") || searchParams.get("taskId") || searchParams.get("task_id");

    if (!taskId) {
        try {
            const body = await request.json();
            taskId = body.id || body.taskId || body.task_id;
        } catch {
            // body parse optional
        }
    }

    if (!taskId) {
        return NextResponse.json({ error: "Listing id is required" }, { status: 400 });
    }

    try {
        const { rowCount } = await query(
            `DELETE FROM tasks WHERE task_id = $1 AND user_id = $2`,
            [taskId, auth.user_id]
        );

        if (rowCount === 0) {
            return NextResponse.json({ error: "Listing not found or already deleted" }, { status: 404 });
        }

        // Decrement user's total_gigs_posted count
        await query(
            `UPDATE users SET total_gigs_posted = GREATEST(0, COALESCE(total_gigs_posted, 1) - 1) WHERE user_id = $1`,
            [auth.user_id]
        );

        return NextResponse.json(
            { success: true, message: "Listing deleted successfully", taskId },
            { status: 200 }
        );
    } catch (err) {
        console.error("DELETE /api/my_listings error:", err);
        return NextResponse.json({ error: "Failed to delete listing" }, { status: 500 });
    }
}