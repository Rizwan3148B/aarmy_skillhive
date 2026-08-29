// src/app/(pages)/auth/page.jsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const style = `
  .auth-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: #f3f4f6;
  }
  .auth-box {
    background: #fff;
    padding: 32px;
    border-radius: 8px;
    width: 320px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  }
  .toggle-row {
    display: flex;
    margin-bottom: 20px;
  }
  .toggle-btn {
    flex: 1;
    padding: 10px;
    border: none;
    cursor: pointer;
    background: #e5e7eb;
    font-weight: bold;
  }
  .toggle-btn.active {
    background: #2563eb;
    color: #fff;
  }
  .toggle-btn:first-child {
    border-radius: 6px 0 0 6px;
  }
  .toggle-btn:last-child {
    border-radius: 0 6px 6px 0;
  }
  input {
    width: 100%;
    padding: 10px;
    margin-bottom: 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    box-sizing: border-box;
  }
  .submit-btn {
    width: 100%;
    padding: 10px;
    background: #2563eb;
    color: #fff;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: bold;
  }
  .submit-btn:disabled {
    background: #93c5fd;
    cursor: not-allowed;
  }
  .error-text {
    color: #dc2626;
    font-size: 14px;
    margin-bottom: 12px;
  }
`;

export default function AuthPage() {
    const router = useRouter();
    const [mode, setMode] = useState("login"); // "login" | "signup"
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        full_name: "",
        email: "",
        password: "",
        confirm_password: "",
    });

    // If token already exists, skip auth page
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            router.replace("/home");
        }
    }, [router]);

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");

        if (mode === "signup" && form.password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        if (mode === "signup" && form.password !== form.confirm_password) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);

        try {
            const payload =
                mode === "login"
                    ? { action: "login", email: form.email, password: form.password }
                    : {
                        action: "signup",
                        full_name: form.full_name,
                        email: form.email,
                        password: form.password,
                        confirm_password: form.confirm_password,
                    };

            const res = await fetch("/api/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Something went wrong");
                setLoading(false);
                return;
            }

            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            router.replace("/home");
        } catch (err) {
            console.error(err);
            setError("Network error. Try again.");
            setLoading(false);
        }
    }

    return (
        <>
            <style>{style}</style>
            <div className="auth-wrapper">
                <div className="auth-box">
                    <div className="toggle-row">
                        <button
                            type="button"
                            className={`toggle-btn ${mode === "login" ? "active" : ""}`}
                            onClick={() => { setMode("login"); setError(""); }}
                        >
                            Login
                        </button>
                        <button
                            type="button"
                            className={`toggle-btn ${mode === "signup" ? "active" : ""}`}
                            onClick={() => { setMode("signup"); setError(""); }}
                        >
                            Signup
                        </button>
                    </div>

                    {error && <div className="error-text">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        {mode === "signup" && (
                            <input
                                type="text"
                                name="full_name"
                                placeholder="Full Name"
                                value={form.full_name}
                                onChange={handleChange}
                                required
                            />
                        )}

                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            value={form.email}
                            onChange={handleChange}
                            required
                        />

                        <input
                            type="password"
                            name="password"
                            placeholder="Password"
                            value={form.password}
                            onChange={handleChange}
                            required
                        />

                        {mode === "signup" && (
                            <input
                                type="password"
                                name="confirm_password"
                                placeholder="Confirm Password (min 6 chars)"
                                value={form.confirm_password}
                                onChange={handleChange}
                                required
                            />
                        )}

                        <button type="submit" className="submit-btn" disabled={loading}>
                            {loading ? "Please wait..." : mode === "login" ? "Login" : "Signup"}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}