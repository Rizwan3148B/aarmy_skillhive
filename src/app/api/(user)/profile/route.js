// src/app/api/(user)/profile/route.js
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { query } from "@/lib/postgres";

// ─── Router ─────────────────────────────────────────────
export async function POST(request) {
    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { action } = body;

    if (action === "getProfile") return getProfile(request);
    if (action === "updateProfile") return updateProfile(request, body);
    if (action === "updatePassword") return updatePassword(request, body);
    if (action === "searchColleges") return searchColleges(request, body);
    if (action === "searchSkills") return searchSkills(request, body);

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

// ─── Auth helper ────────────────────────────────────────
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

const ROLES = ["freelancer", "recruiter"];
const AVAILABILITY = ["available", "busy", "unavailable"];

// ─── GET PROFILE ────────────────────────────────────────
async function getProfile(request) {
    const authUser = getAuthUser(request);
    if (!authUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { rows } = await query(
            `SELECT u.user_id, u.full_name, u.email, u.bio, u.role, u.passout_year,
                    u.branch, u.account_status, u.availability_status, u.location,
                    u.reputation_score, u.total_gigs_completed, u.total_gigs_posted,
                    u.total_earnings, u.skills, u.college_id, u.created_at,
                    c.college_name
             FROM users u
             LEFT JOIN colleges c ON c.college_id = u.college_id
             WHERE u.user_id = $1`,
            [authUser.user_id]
        );

        if (rows.length === 0) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const user = rows[0];

        // Resolve skill_ids -> {skill_id, skill_name}
        let skillDetails = [];
        if (user.skills && user.skills.length > 0) {
            const { rows: skillRows } = await query(
                `SELECT skill_id, skill_name, category FROM skills WHERE skill_id = ANY($1)`,
                [user.skills]
            );
            skillDetails = skillRows;
        }

        return NextResponse.json(
            { success: true, user: { ...user, skills: skillDetails } },
            { status: 200 }
        );
    } catch (err) {
        console.error("getProfile error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// ─── UPDATE PROFILE (everything except email/password) ─
async function updateProfile(request, body) {
    const authUser = getAuthUser(request);
    if (!authUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
        full_name,
        bio,
        college_id,
        skill_ids,       // array of ints
        role,
        passout_year,    // just a year, e.g. 2027
        branch,
        availability_status,
        location,
    } = body;

    // ── Validation ──
    if (!full_name || full_name.trim().length < 2) {
        return NextResponse.json({ error: "Full name must be at least 2 characters" }, { status: 400 });
    }

    if (bio && bio.length > 400) {
        return NextResponse.json({ error: "Bio must be under 400 characters" }, { status: 400 });
    }

    if (role && !ROLES.includes(role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    if (availability_status && !AVAILABILITY.includes(availability_status)) {
        return NextResponse.json({ error: "Invalid availability status" }, { status: 400 });
    }

    const currentYear = 2026;
    let passoutDate = null;
    if (passout_year) {
        const yearNum = Number(passout_year);
        if (!Number.isInteger(yearNum) || yearNum < currentYear || yearNum > currentYear + 6) {
            return NextResponse.json({ error: "Invalid passout year" }, { status: 400 });
        }
        passoutDate = `${yearNum}-01-01`;
    }

    let skillIdsClean = [];
    if (Array.isArray(skill_ids)) {
        skillIdsClean = skill_ids.filter((id) => Number.isInteger(id));
    }

    let collegeIdClean = null;
    if (college_id) {
        const idNum = Number(college_id);
        if (!Number.isInteger(idNum)) {
            return NextResponse.json({ error: "Invalid college" }, { status: 400 });
        }
        collegeIdClean = idNum;
    }

    try {
        // Validate college exists (if provided)
        if (collegeIdClean) {
            const { rows } = await query(`SELECT college_id FROM colleges WHERE college_id = $1`, [collegeIdClean]);
            if (rows.length === 0) {
                return NextResponse.json({ error: "Selected college does not exist" }, { status: 400 });
            }
        }

        // Validate skills exist (if provided)
        if (skillIdsClean.length > 0) {
            const { rows } = await query(`SELECT skill_id FROM skills WHERE skill_id = ANY($1)`, [skillIdsClean]);
            if (rows.length !== skillIdsClean.length) {
                return NextResponse.json({ error: "One or more selected skills are invalid" }, { status: 400 });
            }
        }

        await query(
            `UPDATE users SET
                full_name = $1,
                bio = $2,
                college_id = $3,
                skills = $4,
                role = COALESCE($5, role),
                passout_year = COALESCE($6, passout_year),
                branch = $7,
                availability_status = COALESCE($8, availability_status),
                location = $9
             WHERE user_id = $10`,
            [
                full_name.trim(),
                bio || "",
                collegeIdClean,
                skillIdsClean,
                role || null,
                passoutDate,
                branch || null,
                availability_status || null,
                location || null,
                authUser.user_id,
            ]
        );

        return NextResponse.json({ success: true, message: "Profile updated successfully" }, { status: 200 });
    } catch (err) {
        console.error("updateProfile error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// ─── UPDATE PASSWORD ────────────────────────────────────
async function updatePassword(request, body) {
    const authUser = getAuthUser(request);
    if (!authUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { current_password, new_password } = body;

    if (!current_password || !new_password) {
        return NextResponse.json({ error: "Current and new password are required" }, { status: 400 });
    }

    if (new_password.length < 6) {
        return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
    }

    if (current_password === new_password) {
        return NextResponse.json({ error: "New password must be different from current password" }, { status: 400 });
    }

    try {
        const { rows } = await query(`SELECT password FROM users WHERE user_id = $1`, [authUser.user_id]);
        if (rows.length === 0) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const isMatch = await bcrypt.compare(current_password, rows[0].password);
        if (!isMatch) {
            return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
        }

        const hashed = await bcrypt.hash(new_password, 10);
        await query(`UPDATE users SET password = $1 WHERE user_id = $2`, [hashed, authUser.user_id]);

        return NextResponse.json({ success: true, message: "Password updated successfully" }, { status: 200 });
    } catch (err) {
        console.error("updatePassword error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// ─── SEARCH COLLEGES ────────────────────────────────────
async function searchColleges(request, body) {
    const authUser = getAuthUser(request);
    if (!authUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const q = (body.q || "").trim();

    try {
        const { rows } = await query(
            `SELECT college_id, college_name, city, state
             FROM colleges
             WHERE college_name ILIKE $1
             ORDER BY college_name ASC
             LIMIT 15`,
            [`%${q}%`]
        );
        return NextResponse.json({ success: true, colleges: rows }, { status: 200 });
    } catch (err) {
        console.error("searchColleges error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// ─── SEARCH SKILLS ──────────────────────────────────────
async function searchSkills(request, body) {
    const authUser = getAuthUser(request);
    if (!authUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const q = (body.q || "").trim();

    try {
        const { rows } = await query(
            `SELECT skill_id, skill_name, category
             FROM skills
             WHERE skill_name ILIKE $1
             ORDER BY skill_name ASC
             LIMIT 15`,
            [`%${q}%`]
        );
        return NextResponse.json({ success: true, skills: rows }, { status: 200 });
    } catch (err) {
        console.error("searchSkills error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}