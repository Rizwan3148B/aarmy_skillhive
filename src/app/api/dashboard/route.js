// src/app/api/dashboard/route.js
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { query } from "@/lib/postgres";

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

// Pulls the user out of the Authorization: Bearer <token> header.
// Returns the decoded JWT payload ({ user_id, email }) or null.
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

// Generates a random 14-char task_id: "TSK" + 11 digits
function generateTaskId() {
    let id = "TSK";
    for (let i = 0; i < 11; i++) {
        id += Math.floor(Math.random() * 10);
    }
    return id;
}

function getInitials(name) {
    if (!name) return "U";
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
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

// Derives an "urgency" label from how close the end_date is
function deriveUrgency(endDate) {
    if (!endDate) return "Normal";
    const days = (new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (days < 0) return "Normal";
    if (days <= 2) return "Urgent";
    if (days <= 5) return "High Priority";
    return "Normal";
}

// Shapes a raw DB task row into the object shape the dashboard UI expects
function mapTaskRow(row, viewerUserId, viewerCollegeId, viewerEmail) {
    const isOwner =
        (viewerUserId != null && String(row.user_id) === String(viewerUserId)) ||
        (viewerEmail && row.email && String(viewerEmail).trim().toLowerCase() === String(row.email).trim().toLowerCase());

    return {
        id: row.task_id,
        title: row.title,
        author: row.full_name,
        authorEmail: row.email || "",
        initials: getInitials(row.full_name),
        college: row.college_name || "Unknown College",
        isMyCollege: viewerCollegeId != null && row.college_id === viewerCollegeId,
        category: row.category,
        budget: formatBudget(row.max_budget),
        deliveryDate: formatDate(row.end_date),
        tags: row.tags || [],
        applicants: 0,
        urgency: deriveUrgency(row.end_date),
        isOwner: Boolean(isOwner),
        userId: row.user_id,
        image: DEFAULT_IMAGES[Math.floor(Math.random() * DEFAULT_IMAGES.length)],
        description: row.description || "",
        requirements: [],
        target: row.target,
        status: row.status,
    };
}

const DEFAULT_IMAGES = [
    "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=900&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=900&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900&auto=format&fit=crop&q=80",
];

// ------------------------------------------------------------------
// GET /api/dashboard
// Returns: current user, my-college listings, other-college listings,
// and top performers from the viewer's own college.
// ------------------------------------------------------------------
export async function GET(request) {
    const auth = getAuthUser(request);
    if (!auth) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    // Fast-path: if client requests only categories or skills (e.g., when clicking Category in Post Listing)
    if (action === "categories" || action === "skills") {
        try {
            const { rows: skillRows } = await query(
                `SELECT skill_id, skill_name, category
                 FROM skills
                 ORDER BY category ASC, skill_name ASC`
            );
            const categories = [...new Set(skillRows.map((s) => s.category).filter(Boolean))];
            return NextResponse.json({ categories, skills: skillRows }, { status: 200 });
        } catch (err) {
            console.error("Skills fetch error:", err);
            return NextResponse.json({ error: "Failed to fetch skills" }, { status: 500 });
        }
    }

    try {
        // 1. Current user + college name
        const { rows: userRows } = await query(
            `SELECT u.user_id, u.full_name, u.email, u.college_id, u.bio, u.role,
                    u.branch, u.location, u.reputation_score, u.total_gigs_completed,
                    u.total_gigs_posted, u.total_earnings, u.availability_status,
                    c.college_name
             FROM users u
             LEFT JOIN colleges c ON c.college_id = u.college_id
             WHERE u.user_id = $1`,
            [auth.user_id]
        );

        if (userRows.length === 0) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const me = userRows[0];

        // 2. Listings visible to this user:
        //    - anything posted by someone from the SAME college (any target)
        //    - OR posted by someone from a DIFFERENT college but target = 'others'
        const { rows: taskRows } = await query(
            `SELECT t.task_id, t.user_id, t.title, t.description, t.category,
                    t.max_budget, t.end_date, t.role_type, t.status, t.target,
                    t.tags, t.created_at,
                    u.full_name, u.email, u.college_id,
                    c.college_name
             FROM tasks t
             JOIN users u ON u.user_id = t.user_id
             LEFT JOIN colleges c ON c.college_id = u.college_id
             WHERE t.status = 'open'
               AND (
                     u.college_id IS NOT DISTINCT FROM $1
                     OR t.target = 'others'
                   )
             ORDER BY t.created_at DESC
             LIMIT 100`,
            [me.college_id]
        );

        const listings = taskRows.map((row) => mapTaskRow(row, me.user_id, me.college_id, me.email));

        // 3. Top performers — from the viewer's own college only
        const { rows: performerRows } = await query(
            `SELECT u.user_id, u.full_name, u.branch, u.bio, u.reputation_score,
                    u.total_gigs_completed, u.total_earnings, u.availability_status,
                    c.college_name
             FROM users u
             LEFT JOIN colleges c ON c.college_id = u.college_id
             WHERE u.college_id IS NOT DISTINCT FROM $1
               AND u.role = 'freelancer'
               AND u.user_id != $2
             ORDER BY u.reputation_score DESC, u.total_gigs_completed DESC
             LIMIT 10`,
            [me.college_id, me.user_id]
        );

        const topPerformers = performerRows.map((p, idx) => ({
            id: p.user_id,
            name: p.full_name,
            initials: getInitials(p.full_name),
            college: p.college_name || "Unknown College",
            rank: `#${idx + 1} Ranked`,
            domain: p.branch || p.bio || "General Freelancing",
            tasksCompleted: p.total_gigs_completed || 0,
            // reputation_score assumed to be 0-100; scale to a 5-star rating
            rating: Math.min(5, Math.round(((p.reputation_score || 0) / 20) * 10) / 10),
            reviewsCount: p.total_gigs_completed || 0,
            totalEarned: formatBudget(p.total_earnings || 0),
            avgDelivery: p.availability_status === "available" ? "Available Now" : "Busy",
            verified: (p.reputation_score || 0) > 0,
            skills: [],
        }));

        // 4. Categories and Skills from skills table
        let categories = [];
        let skills = [];
        try {
            const { rows: skillRows } = await query(
                `SELECT skill_id, skill_name, category
                 FROM skills
                 ORDER BY category ASC, skill_name ASC`
            );
            skills = skillRows;
            categories = [...new Set(skillRows.map((s) => s.category).filter(Boolean))];
        } catch (skillErr) {
            console.warn("Could not load skills in dashboard GET:", skillErr);
        }

        return NextResponse.json(
            {
                user: {
                    user_id: me.user_id,
                    full_name: me.full_name,
                    email: me.email,
                    college: me.college_name || "Unaffiliated",
                    college_id: me.college_id,
                    role: me.role,
                    reputation_score: me.reputation_score,
                    total_gigs_completed: me.total_gigs_completed,
                    total_gigs_posted: me.total_gigs_posted,
                    total_earnings: me.total_earnings,
                },
                listings,
                topPerformers,
                categories,
                skills,
            },
            { status: 200 }
        );
    } catch (err) {
        console.error("Dashboard GET error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// ------------------------------------------------------------------
// POST /api/dashboard
// Creates a new task listing. task_id is generated here, then saved.
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
        title,
        description = "",
        category,
        max_budget,
        end_date = null,
        role_type = "remote",
        target = "others",
        tags = [],
    } = body;

    if (!title || !category || !max_budget) {
        return NextResponse.json(
            { error: "title, category, and max_budget are required" },
            { status: 400 }
        );
    }

    if (!["hybrid", "remote"].includes(role_type)) {
        return NextResponse.json({ error: "role_type must be 'hybrid' or 'remote'" }, { status: 400 });
    }

    if (!["own_college", "others"].includes(target)) {
        return NextResponse.json({ error: "target must be 'own_college' or 'others'" }, { status: 400 });
    }

    if (end_date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selected = new Date(end_date);
        selected.setHours(0, 0, 0, 0);
        if (selected <= today) {
            return NextResponse.json(
                { error: "Delivery date must be at least tomorrow. You cannot select today or a past date." },
                { status: 400 }
            );
        }
    }

    try {
        const task_id = generateTaskId();
        const cleanTags = Array.isArray(tags)
            ? tags.map((t) => String(t).trim()).filter(Boolean)
            : String(tags).split(",").map((t) => t.trim()).filter(Boolean);

        const { rows } = await query(
            `INSERT INTO tasks
                (task_id, user_id, title, description, category, max_budget, end_date, role_type, target, tags)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING task_id, user_id, title, description, category, max_budget, end_date, role_type, status, target, tags, created_at`,
            [
                task_id,
                auth.user_id,
                title,
                description,
                category,
                Number(max_budget),
                end_date,
                role_type,
                target,
                cleanTags,
            ]
        );

        // Bump the poster's total_gigs_posted counter
        await query(`UPDATE users SET total_gigs_posted = total_gigs_posted + 1 WHERE user_id = $1`, [
            auth.user_id,
        ]);

        // Re-fetch the author's name/college so we can return a fully-shaped card
        const { rows: userRows } = await query(
            `SELECT u.full_name, u.email, u.college_id, c.college_name
             FROM users u
             LEFT JOIN colleges c ON c.college_id = u.college_id
             WHERE u.user_id = $1`,
            [auth.user_id]
        );
        const author = userRows[0] || {};

        const newTask = mapTaskRow(
            { ...rows[0], full_name: author.full_name, email: author.email, college_id: author.college_id, college_name: author.college_name },
            auth.user_id,
            author.college_id,
            author.email || auth.email
        );

        return NextResponse.json({ message: "Listing published successfully", task: newTask }, { status: 201 });
    } catch (err) {
        console.error("Dashboard POST error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}