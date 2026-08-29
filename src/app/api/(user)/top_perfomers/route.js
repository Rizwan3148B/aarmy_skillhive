// src/app/api/(user)/top_perfomers/route.js
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

// ─── GET /api/top_perfomers ───────────────────────────────────────────
// Fetches all real users from users table sorted by reputation_score DESC
export async function GET(request) {
    const auth = getAuthUser(request);
    if (!auth) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const collegeFilter = searchParams.get("college") || "all";
    const searchQuery = (searchParams.get("search") || "").trim().toLowerCase();

    try {
        // Fetch viewer's college_id
        const { rows: viewerRows } = await query(
            `SELECT user_id, college_id FROM users WHERE user_id = $1`,
            [auth.user_id]
        );
        const viewer = viewerRows[0] || {};
        const viewerCollegeId = viewer.college_id;

        // Fetch all users with their college name from PostgreSQL users table
        let sql = `
            SELECT u.user_id, u.full_name, u.email, u.bio, u.role, u.branch,
                   u.account_status, u.availability_status, u.location,
                   u.reputation_score, u.total_gigs_completed, u.total_gigs_posted,
                   u.total_earnings, u.skills, u.college_id, u.created_at,
                   c.college_name
            FROM users u
            LEFT JOIN colleges c ON c.college_id = u.college_id
        `;

        const queryParams = [];
        const whereClauses = [];

        if (collegeFilter === "my_college") {
            if (viewerCollegeId != null) {
                queryParams.push(viewerCollegeId);
                whereClauses.push(`u.college_id = $${queryParams.length}`);
            } else {
                whereClauses.push(`u.college_id IS NULL`);
            }
        }

        if (whereClauses.length > 0) {
            sql += ` WHERE ` + whereClauses.join(" AND ");
        }

        // Sort strictly on reputation_score DESC from DB
        sql += ` ORDER BY COALESCE(u.reputation_score, 0) DESC, COALESCE(u.total_gigs_completed, 0) DESC, COALESCE(u.total_earnings, 0) DESC, u.created_at ASC LIMIT 100`;

        const { rows: userRows } = await query(sql, queryParams);

        // Collect all distinct skill IDs
        const allSkillIds = new Set();
        userRows.forEach((u) => {
            if (Array.isArray(u.skills)) {
                u.skills.forEach((id) => {
                    const num = Number(id);
                    if (Number.isInteger(num)) allSkillIds.add(num);
                });
            }
        });

        // Lookup skill names from DB
        const skillNameMap = {};
        if (allSkillIds.size > 0) {
            try {
                const { rows: skillRows } = await query(
                    `SELECT skill_id, skill_name FROM skills WHERE skill_id = ANY($1)`,
                    [Array.from(allSkillIds)]
                );
                skillRows.forEach((s) => {
                    skillNameMap[s.skill_id] = s.skill_name;
                });
            } catch (skillErr) {
                console.warn("Could not lookup skill names:", skillErr);
            }
        }

        const performers = userRows
            .filter((u) => {
                if (!searchQuery) return true;
                const matchName = (u.full_name || "").toLowerCase().includes(searchQuery);
                const matchCollege = (u.college_name || "").toLowerCase().includes(searchQuery);
                const matchBranch = (u.branch || "").toLowerCase().includes(searchQuery);
                const matchBio = (u.bio || "").toLowerCase().includes(searchQuery);
                const matchLoc = (u.location || "").toLowerCase().includes(searchQuery);
                return matchName || matchCollege || matchBranch || matchBio || matchLoc;
            })
            .map((u, idx) => {
                const resolvedSkills = Array.isArray(u.skills)
                    ? u.skills.map((id) => skillNameMap[id]).filter(Boolean)
                    : [];

                return {
                    id: u.user_id,
                    user_id: u.user_id,
                    name: u.full_name || "User",
                    email: u.email || "",
                    initials: getInitials(u.full_name),
                    college: u.college_name || "Unaffiliated",
                    college_id: u.college_id,
                    isMyCollege: viewerCollegeId != null && u.college_id === viewerCollegeId,
                    isMe: u.user_id === auth.user_id,
                    rank: `#${idx + 1} Ranked`,
                    rankNumber: idx + 1,
                    domain: u.branch || "General Freelancer",
                    bio: u.bio || "",
                    role: u.role || "freelancer",
                    location: u.location || "",
                    reputation_score: Number(u.reputation_score) || 0,
                    total_gigs_completed: Number(u.total_gigs_completed) || 0,
                    total_gigs_posted: Number(u.total_gigs_posted) || 0,
                    total_earnings: Number(u.total_earnings) || 0,
                    totalEarned: formatBudget(u.total_earnings || 0),
                    availability_status: u.availability_status || "available",
                    skills: resolvedSkills,
                };
            });

        return NextResponse.json(
            {
                success: true,
                performers,
                total: performers.length,
                viewerCollegeId,
            },
            { status: 200 }
        );
    } catch (err) {
        console.error("GET /api/top_perfomers error:", err);
        return NextResponse.json({ error: "Failed to fetch top performers" }, { status: 500 });
    }
}
