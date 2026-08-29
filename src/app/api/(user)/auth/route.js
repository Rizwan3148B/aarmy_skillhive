// src/app/api/(user)/auth/route.js
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "@/lib/postgres";

export async function POST(request) {
    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { action } = body;

    if (action === "login") return login(body);
    if (action === "signup") return signup(body);

    return NextResponse.json({ error: "action must be 'login' or 'signup'" }, { status: 400 });
}

// Generates a random 10-digit numeric user_id
function generateUserId() {
    let id = "";
    for (let i = 0; i < 10; i++) {
        id += Math.floor(Math.random() * 10);
    }
    return id;
}

async function login(body) {
    const { email, password } = body;

    if (!email || !password) {
        return NextResponse.json({ error: "email and password are required" }, { status: 400 });
    }

    try {
        const { rows } = await query(
            `SELECT user_id, full_name, email, password FROM users WHERE email = $1`,
            [email]
        );

        if (rows.length === 0) {
            return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
        }

        const token = jwt.sign(
            { user_id: user.user_id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        return NextResponse.json(
            {
                message: "Login successful",
                token,
                user: { user_id: user.user_id, full_name: user.full_name, email: user.email },
            },
            { status: 200 }
        );
    } catch (err) {
        console.error("Login error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

async function signup(body) {
    const { full_name, email, password, confirm_password } = body;

    if (!full_name || !email || !password || !confirm_password) {
        return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (password.length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    if (password !== confirm_password) {
        return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
    }

    try {
        const { rows: existing } = await query(`SELECT user_id FROM users WHERE email = $1`, [email]);

        if (existing.length > 0) {
            return NextResponse.json({ error: "Email already registered" }, { status: 409 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user_id = generateUserId();

        const { rows } = await query(
            `INSERT INTO users (user_id, full_name, email, password)
       VALUES ($1, $2, $3, $4)
       RETURNING user_id, full_name, email`,
            [user_id, full_name, email, hashedPassword]
        );

        const token = jwt.sign(
            { user_id: rows[0].user_id, email: rows[0].email },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        return NextResponse.json(
            { message: "Signup successful", token, user: rows[0] },
            { status: 201 }
        );
    } catch (err) {
        console.error("Signup error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}