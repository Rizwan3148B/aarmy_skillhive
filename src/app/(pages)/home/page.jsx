// src/app/(pages)/home/page.jsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const style = `
  .home-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: #f3f4f6;
    text-align: center;
  }
  .home-box {
    background: #fff;
    padding: 32px 40px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  }
  .home-box h1 {
    margin-bottom: 8px;
  }
  .home-box p {
    color: #6b7280;
    margin-bottom: 20px;
  }
  .logout-btn {
    padding: 10px 20px;
    background: #dc2626;
    color: #fff;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: bold;
  }
`;

export default function HomePage() {
    const router = useRouter();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (!token) {
            router.replace("/auth");
            return;
        }

        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, [router]);

    function handleLogout() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.replace("/auth");
    }

    if (!user) return null; // avoid flashing content before redirect check

    return (
        <>
            <style>{style}</style>
            <div className="home-wrapper">
                <div className="home-box">
                    <h1>Welcome, {user.full_name}</h1>
                    <p>{user.email}</p>
                    <button className="logout-btn" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </div>
        </>
    );
}