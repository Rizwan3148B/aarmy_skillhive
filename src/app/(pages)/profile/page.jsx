// src/app/(pages)/profile/page.jsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const CURRENT_YEAR = 2026;
const PASSOUT_YEARS = Array.from({ length: 7 }, (_, i) => CURRENT_YEAR + i); // 2026..2032

const BRANCHES = [
    "Computer Science",
    "Information Technology",
    "Electronics & Communication",
    "Electrical Engineering",
    "Mechanical Engineering",
    "Civil Engineering",
    "Chemical Engineering",
    "Biotechnology",
    "Aerospace Engineering",
    "Other",
];

const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa",
    "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
    "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
    "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
    "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir",
    "Ladakh", "Chandigarh", "Puducherry",
];

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    letter-spacing: -0.01em;
  }

  :root {
    --bg-base: #09090b;
    --bg-surface: #121215;
    --bg-card: #161619;
    --bg-input: #18181b;
    --border-subtle: #27272a;
    --border-medium: #3f3f46;
    --border-focus: #71717a;
    --text-primary: #f4f4f5;
    --text-secondary: #a1a1aa;
    --text-muted: #71717a;
    --text-inverse: #09090b;
    --btn-primary-bg: #ffffff;
    --btn-primary-text: #09090b;
    --btn-primary-hover: #e4e4e7;
  }

  .profile-page {
    min-height: 100vh;
    background-color: var(--bg-base);
    color: var(--text-primary);
    padding: 0 0 60px 0;
    -webkit-font-smoothing: antialiased;
  }

  .topbar-wrapper {
    position: sticky;
    top: 0;
    z-index: 50;
    background: rgba(9, 9, 11, 0.85);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-bottom: 1px solid var(--border-subtle);
    margin-bottom: 32px;
  }

  .topbar {
    max-width: 800px;
    margin: 0 auto;
    padding: 14px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .topbar-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .back-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--text-secondary);
    font-size: 13px;
    font-weight: 500;
    text-decoration: none;
    padding: 6px 10px;
    border-radius: 6px;
    border: 1px solid var(--border-subtle);
    background: var(--bg-surface);
    transition: all 0.15s ease;
    cursor: pointer;
  }

  .back-btn:hover {
    color: var(--text-primary);
    border-color: var(--border-medium);
    background: var(--bg-card);
  }

  .topbar-brand {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
    font-size: 14px;
    color: var(--text-primary);
    text-decoration: none;
  }

  .brand-icon {
    width: 24px;
    height: 24px;
    background: #ffffff;
    color: #09090b;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 5px;
    font-weight: 800;
    font-size: 11px;
  }

  .wrap {
    max-width: 800px;
    margin: 0 auto;
    padding: 0 20px;
  }

  .page-header {
    margin-bottom: 24px;
  }

  .page-title {
    font-size: 24px;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--text-primary);
    margin-bottom: 4px;
  }

  .page-subtitle {
    font-size: 14px;
    color: var(--text-secondary);
    line-height: 1.4;
  }

  /* User hero summary box */
  .hero-card {
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 20px;
  }

  .hero-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    margin-bottom: 20px;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--border-subtle);
  }

  .hero-user {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .hero-avatar {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: #27272a;
    border: 1px solid var(--border-medium);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: 700;
    color: var(--text-primary);
    text-transform: uppercase;
    flex-shrink: 0;
  }

  .hero-meta h1 {
    font-size: 18px;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: -0.01em;
    margin-bottom: 3px;
  }

  .hero-meta p {
    font-size: 13px;
    color: var(--text-secondary);
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 600;
    text-transform: capitalize;
    letter-spacing: 0.01em;
    border: 1px solid var(--border-subtle);
    background: var(--bg-card);
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }

  .status-active .status-dot { background: #22c55e; box-shadow: 0 0 8px rgba(34, 197, 94, 0.4); }
  .status-active { color: #f4f4f5; border-color: rgba(34, 197, 94, 0.3); }

  .status-suspended .status-dot { background: #f59e0b; }
  .status-suspended { color: #f59e0b; border-color: rgba(245, 158, 11, 0.3); }

  .status-banned .status-dot { background: #ef4444; }
  .status-banned { color: #ef4444; border-color: rgba(239, 68, 68, 0.3); }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }

  @media (max-width: 640px) {
    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .stat-box {
    background: var(--bg-card);
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .stat-box .label {
    font-size: 11px;
    color: var(--text-muted);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 6px;
  }

  .stat-box .value {
    font-size: 18px;
    font-weight: 700;
    color: var(--text-primary);
  }

  /* Regular Section Cards */
  .card {
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 20px;
  }

  .card-header {
    margin-bottom: 20px;
    padding-bottom: 14px;
    border-bottom: 1px solid var(--border-subtle);
  }

  .card-header h2 {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 3px;
  }

  .card-header p {
    font-size: 13px;
    color: var(--text-secondary);
  }

  .field {
    margin-bottom: 18px;
  }

  .field:last-child {
    margin-bottom: 0;
  }

  .field label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary);
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .field input,
  .field select,
  .field textarea {
    width: 100%;
    padding: 10px 14px;
    background: var(--bg-input);
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    font-size: 14px;
    color: var(--text-primary);
    outline: none;
    transition: all 0.15s ease;
  }

  .field input::placeholder,
  .field textarea::placeholder {
    color: var(--text-muted);
  }

  .field input:focus,
  .field select:focus,
  .field textarea:focus {
    border-color: var(--border-focus);
    background: #1c1c20;
  }

  .field input:disabled,
  .field select:disabled,
  .field textarea:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    background: #121214;
    border-color: #202023;
  }

  .char-count {
    font-size: 12px;
    color: var(--text-muted);
    text-align: right;
    margin-top: 6px;
  }

  .row-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  @media (max-width: 540px) {
    .row-2 {
      grid-template-columns: 1fr;
    }
  }

  .search-wrap {
    position: relative;
  }

  .search-results {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    right: 0;
    background: var(--bg-surface);
    border: 1px solid var(--border-medium);
    border-radius: 8px;
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.6);
    max-height: 220px;
    overflow-y: auto;
    z-index: 20;
  }

  .search-result-item {
    padding: 10px 14px;
    font-size: 13px;
    color: var(--text-primary);
    cursor: pointer;
    border-bottom: 1px solid var(--border-subtle);
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: background 0.12s ease;
  }

  .search-result-item:last-child {
    border-bottom: none;
  }

  .search-result-item:hover {
    background: var(--bg-card);
  }

  .selected-chip {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--bg-card);
    border: 1px solid var(--border-medium);
    border-radius: 8px;
    padding: 10px 14px;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
  }

  .selected-chip button {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    padding: 4px 8px;
    border-radius: 4px;
    border: 1px solid var(--border-subtle);
    transition: all 0.12s ease;
  }

  .selected-chip button:hover {
    color: var(--text-primary);
    border-color: var(--border-medium);
    background: var(--bg-input);
  }

  .skills-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
  }

  .skill-chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: var(--bg-card);
    border: 1px solid var(--border-medium);
    color: var(--text-primary);
    border-radius: 6px;
    padding: 5px 10px 5px 12px;
    font-size: 12px;
    font-weight: 500;
  }

  .skill-chip button {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 14px;
    line-height: 1;
    display: flex;
    align-items: center;
    transition: color 0.12s ease;
  }

  .skill-chip button:hover {
    color: var(--text-primary);
  }

  .save-btn {
    width: 100%;
    padding: 11px 16px;
    background: var(--btn-primary-bg);
    color: var(--btn-primary-text);
    border: 1px solid var(--btn-primary-bg);
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .save-btn:hover:not(:disabled) {
    background: var(--btn-primary-hover);
    border-color: var(--btn-primary-hover);
  }

  .save-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .msg {
    font-size: 13px;
    margin-top: 14px;
    padding: 10px 14px;
    border-radius: 8px;
    font-weight: 500;
    text-align: left;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .msg.error {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.25);
    color: #fca5a5;
  }

  .msg.success {
    background: rgba(34, 197, 94, 0.1);
    border: 1px solid rgba(34, 197, 94, 0.25);
    color: #86efac;
  }

  .footer-actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    margin-top: 28px;
  }

  .logout-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 9px 18px;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-secondary);
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .logout-btn:hover {
    color: #ef4444;
    border-color: rgba(239, 68, 68, 0.3);
    background: rgba(239, 68, 68, 0.05);
  }

  .loading-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-base);
    color: var(--text-secondary);
    font-size: 14px;
    font-weight: 500;
  }

  .spinner {
    width: 20px;
    height: 20px;
    border: 2px solid var(--border-medium);
    border-top-color: var(--text-primary);
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
    margin-right: 10px;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

function getAuthHeaders() {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

export default function ProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState(null);

    // profile fields
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [bio, setBio] = useState("");
    const [role, setRole] = useState("freelancer");
    const [passoutYear, setPassoutYear] = useState(PASSOUT_YEARS[0]);
    const [branch, setBranch] = useState(BRANCHES[0]);
    const [availability, setAvailability] = useState("available");
    const [location, setLocation] = useState(INDIAN_STATES[0]);
    const [accountStatus, setAccountStatus] = useState("active");

    // stats (read-only)
    const [stats, setStats] = useState({
        reputation_score: 0,
        total_gigs_completed: 0,
        total_gigs_posted: 0,
        total_earnings: 0,
    });

    // college
    const [collegeQuery, setCollegeQuery] = useState("");
    const [collegeResults, setCollegeResults] = useState([]);
    const [selectedCollege, setSelectedCollege] = useState(null); // {college_id, college_name}
    const collegeDebounce = useRef(null);

    // skills
    const [skillQuery, setSkillQuery] = useState("");
    const [skillResults, setSkillResults] = useState([]);
    const [selectedSkills, setSelectedSkills] = useState([]); // [{skill_id, skill_name}]
    const skillDebounce = useRef(null);

    // password
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [pwSaving, setPwSaving] = useState(false);
    const [pwMsg, setPwMsg] = useState(null);

    // ── Load profile ──
    const fetchProfile = useCallback(async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.replace("/auth");
            return;
        }

        try {
            const res = await fetch("/api/profile", {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify({ action: "getProfile" }),
            });
            const data = await res.json();

            if (!res.ok) {
                router.replace("/auth");
                return;
            }

            const u = data.user;
            setFullName(u.full_name || "");
            setEmail(u.email || "");
            setBio(u.bio || "");
            setRole(u.role || "freelancer");
            setBranch(u.branch || BRANCHES[0]);
            setAvailability(u.availability_status || "available");
            setLocation(u.location || INDIAN_STATES[0]);
            setAccountStatus(u.account_status || "active");

            if (u.passout_year) {
                setPassoutYear(new Date(u.passout_year).getFullYear());
            }

            if (u.college_id && u.college_name) {
                setSelectedCollege({ college_id: u.college_id, college_name: u.college_name });
            }

            setSelectedSkills(u.skills || []);

            setStats({
                reputation_score: u.reputation_score || 0,
                total_gigs_completed: u.total_gigs_completed || 0,
                total_gigs_posted: u.total_gigs_posted || 0,
                total_earnings: u.total_earnings || 0,
            });
        } catch {
            setMsg({ type: "error", text: "Network error loading profile" });
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    // ── College search (debounced) ──
    useEffect(() => {
        if (!collegeQuery.trim()) {
            setCollegeResults([]);
            return;
        }
        clearTimeout(collegeDebounce.current);
        collegeDebounce.current = setTimeout(async () => {
            try {
                const res = await fetch("/api/profile", {
                    method: "POST",
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ action: "searchColleges", q: collegeQuery }),
                });
                const data = await res.json();
                if (res.ok) setCollegeResults(data.colleges);
            } catch { }
        }, 300);
        return () => clearTimeout(collegeDebounce.current);
    }, [collegeQuery]);

    // ── Skills search (debounced) ──
    useEffect(() => {
        if (!skillQuery.trim()) {
            setSkillResults([]);
            return;
        }
        clearTimeout(skillDebounce.current);
        skillDebounce.current = setTimeout(async () => {
            try {
                const res = await fetch("/api/profile", {
                    method: "POST",
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ action: "searchSkills", q: skillQuery }),
                });
                const data = await res.json();
                if (res.ok) setSkillResults(data.skills);
            } catch { }
        }, 300);
        return () => clearTimeout(skillDebounce.current);
    }, [skillQuery]);

    function addSkill(skill) {
        if (selectedSkills.some((s) => s.skill_id === skill.skill_id)) return;
        setSelectedSkills((prev) => [...prev, skill]);
        setSkillQuery("");
        setSkillResults([]);
    }

    function removeSkill(skillId) {
        setSelectedSkills((prev) => prev.filter((s) => s.skill_id !== skillId));
    }

    // ── Save profile ──
    async function handleSave() {
        setMsg(null);

        if (!fullName.trim() || fullName.trim().length < 2) {
            setMsg({ type: "error", text: "Full name must be at least 2 characters" });
            return;
        }
        if (bio.length > 400) {
            setMsg({ type: "error", text: "Bio must be under 400 characters" });
            return;
        }
        if (!selectedCollege) {
            setMsg({ type: "error", text: "Please select a college" });
            return;
        }

        setSaving(true);
        try {
            const res = await fetch("/api/profile", {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    action: "updateProfile",
                    full_name: fullName.trim(),
                    bio,
                    college_id: selectedCollege.college_id,
                    skill_ids: selectedSkills.map((s) => s.skill_id),
                    role,
                    passout_year: passoutYear,
                    branch,
                    availability_status: availability,
                    location,
                }),
            });
            const data = await res.json();

            if (!res.ok) {
                setMsg({ type: "error", text: data.error || "Failed to update profile" });
                return;
            }
            setMsg({ type: "success", text: "Profile updated successfully" });
        } catch {
            setMsg({ type: "error", text: "Network error. Try again." });
        } finally {
            setSaving(false);
        }
    }

    // ── Change password ──
    async function handlePasswordSave() {
        setPwMsg(null);

        if (!currentPassword || !newPassword || !confirmPassword) {
            setPwMsg({ type: "error", text: "All password fields are required" });
            return;
        }
        if (newPassword.length < 6) {
            setPwMsg({ type: "error", text: "New password must be at least 6 characters" });
            return;
        }
        if (newPassword !== confirmPassword) {
            setPwMsg({ type: "error", text: "New password and confirm password do not match" });
            return;
        }
        if (newPassword === currentPassword) {
            setPwMsg({ type: "error", text: "New password must be different from current password" });
            return;
        }

        setPwSaving(true);
        try {
            const res = await fetch("/api/profile", {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    action: "updatePassword",
                    current_password: currentPassword,
                    new_password: newPassword,
                }),
            });
            const data = await res.json();

            if (!res.ok) {
                setPwMsg({ type: "error", text: data.error || "Failed to update password" });
                return;
            }

            setPwMsg({ type: "success", text: "Password updated successfully" });
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch {
            setPwMsg({ type: "error", text: "Network error. Try again." });
        } finally {
            setPwSaving(false);
        }
    }

    function handleLogout() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.replace("/auth");
    }

    const userInitial = fullName ? fullName.trim().charAt(0).toUpperCase() : "U";

    if (loading) {
        return (
            <div className="profile-page">
                <style>{styles}</style>
                <div className="loading-container">
                    <div className="spinner" />
                    <span>Loading profile...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-page">
            <style>{styles}</style>

            {/* Top Navigation */}
            <div className="topbar-wrapper">
                <div className="topbar">
                    <div className="topbar-left">
                        <Link href="/dashboard" className="back-btn">
                            ← Dashboard
                        </Link>
                        <Link href="/dashboard" className="topbar-brand">
                            <span className="brand-icon">SH</span>
                            <span>SkillHive</span>
                        </Link>
                    </div>
                    <div>
                        <div className={`status-badge status-${accountStatus}`}>
                            <span className="status-dot" />
                            {accountStatus}
                        </div>
                    </div>
                </div>
            </div>

            <div className="wrap">
                <div className="page-header">
                    <h1 className="page-title">Profile Settings</h1>
                    <p className="page-subtitle">Manage your personal information, public credentials, and security preferences.</p>
                </div>

                {/* Hero Card with identity + stats */}
                <div className="hero-card">
                    <div className="hero-top">
                        <div className="hero-user">
                            <div className="hero-avatar">{userInitial}</div>
                            <div className="hero-meta">
                                <h1>{fullName || "User Profile"}</h1>
                                <p>{email || "No email provided"}</p>
                            </div>
                        </div>
                        <div className={`status-badge status-${accountStatus}`}>
                            <span className="status-dot" />
                            Status: {accountStatus}
                        </div>
                    </div>

                    <div className="stats-grid">
                        <div className="stat-box">
                            <div className="label">Reputation</div>
                            <div className="value">{stats.reputation_score}</div>
                        </div>
                        <div className="stat-box">
                            <div className="label">Gigs Completed</div>
                            <div className="value">{stats.total_gigs_completed}</div>
                        </div>
                        <div className="stat-box">
                            <div className="label">Gigs Posted</div>
                            <div className="value">{stats.total_gigs_posted}</div>
                        </div>
                        <div className="stat-box">
                            <div className="label">Total Earnings</div>
                            <div className="value">₹{stats.total_earnings}</div>
                        </div>
                    </div>
                </div>

                {/* Basic info */}
                <div className="card">
                    <div className="card-header">
                        <h2>Personal Information</h2>
                        <p>Provide your identity details and a brief introduction for clients and collaborators.</p>
                    </div>

                    <div className="field">
                        <label>Full Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Alex Johnson"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            disabled={saving}
                        />
                    </div>

                    <div className="field">
                        <label>Email Address (read-only)</label>
                        <input
                            type="email"
                            value={email}
                            disabled
                        />
                    </div>

                    <div className="field">
                        <label>Bio</label>
                        <textarea
                            rows={4}
                            maxLength={400}
                            placeholder="Write a concise overview of your skills, background, and what you build..."
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            disabled={saving}
                        />
                        <div className="char-count">{bio.length} / 400</div>
                    </div>

                    <div className="row-2">
                        <div className="field">
                            <label>Primary Role</label>
                            <select value={role} onChange={(e) => setRole(e.target.value)} disabled={saving}>
                                <option value="freelancer">Freelancer</option>
                                <option value="recruiter">Recruiter</option>
                            </select>
                        </div>
                        <div className="field">
                            <label>Availability</label>
                            <select value={availability} onChange={(e) => setAvailability(e.target.value)} disabled={saving}>
                                <option value="available">Available</option>
                                <option value="busy">Busy</option>
                                <option value="unavailable">Unavailable</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Education & Location */}
                <div className="card">
                    <div className="card-header">
                        <h2>Education & Location</h2>
                        <p>Your academic background and geographical location.</p>
                    </div>

                    <div className="field">
                        <label>College / University</label>
                        {selectedCollege ? (
                            <div className="selected-chip">
                                <span>{selectedCollege.college_name}</span>
                                <button type="button" onClick={() => setSelectedCollege(null)} disabled={saving}>
                                    Change
                                </button>
                            </div>
                        ) : (
                            <div className="search-wrap">
                                <input
                                    type="text"
                                    placeholder="Search your college or university..."
                                    value={collegeQuery}
                                    onChange={(e) => setCollegeQuery(e.target.value)}
                                    disabled={saving}
                                />
                                {collegeResults.length > 0 && (
                                    <div className="search-results">
                                        {collegeResults.map((c) => (
                                            <div
                                                key={c.college_id}
                                                className="search-result-item"
                                                onClick={() => {
                                                    setSelectedCollege(c);
                                                    setCollegeQuery("");
                                                    setCollegeResults([]);
                                                }}
                                            >
                                                <span>{c.college_name}</span>
                                                {c.city && <span style={{ color: "#71717a", fontSize: "12px" }}>{c.city}</span>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="row-2">
                        <div className="field">
                            <label>Branch / Major</label>
                            <select value={branch} onChange={(e) => setBranch(e.target.value)} disabled={saving}>
                                {BRANCHES.map((b) => (
                                    <option key={b} value={b}>{b}</option>
                                ))}
                            </select>
                        </div>
                        <div className="field">
                            <label>Graduation Year</label>
                            <select value={passoutYear} onChange={(e) => setPassoutYear(Number(e.target.value))} disabled={saving}>
                                {PASSOUT_YEARS.map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="field">
                        <label>Location (State)</label>
                        <select value={location} onChange={(e) => setLocation(e.target.value)} disabled={saving}>
                            {INDIAN_STATES.map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Skills */}
                <div className="card">
                    <div className="card-header">
                        <h2>Skills & Expertise</h2>
                        <p>Highlight your technical proficiencies and core specializations.</p>
                    </div>

                    {selectedSkills.length > 0 && (
                        <div className="skills-chips">
                            {selectedSkills.map((s) => (
                                <span key={s.skill_id} className="skill-chip">
                                    {s.skill_name}
                                    <button
                                        type="button"
                                        aria-label="Remove skill"
                                        onClick={() => removeSkill(s.skill_id)}
                                        disabled={saving}
                                    >
                                        ✕
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="search-wrap">
                        <input
                            type="text"
                            placeholder="Type to search and add skills (e.g. React, Python, UI Design)..."
                            value={skillQuery}
                            onChange={(e) => setSkillQuery(e.target.value)}
                            disabled={saving}
                        />
                        {skillResults.length > 0 && (
                            <div className="search-results">
                                {skillResults.map((s) => (
                                    <div
                                        key={s.skill_id}
                                        className="search-result-item"
                                        onClick={() => addSkill(s)}
                                    >
                                        <span>{s.skill_name}</span>
                                        {s.category && (
                                            <span style={{ color: "#71717a", fontSize: "12px" }}>{s.category}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Save profile */}
                <div className="card">
                    <button className="save-btn" onClick={handleSave} disabled={saving}>
                        {saving ? "Saving Changes..." : "Save Profile Details"}
                    </button>
                    {msg && <div className={`msg ${msg.type}`}>{msg.text}</div>}
                </div>

                {/* Password & Security */}
                <div className="card">
                    <div className="card-header">
                        <h2>Security & Password</h2>
                        <p>Keep your account secure by using a strong, unique password.</p>
                    </div>

                    <div className="field">
                        <label>Current Password</label>
                        <input
                            type="password"
                            placeholder="Enter current password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            disabled={pwSaving}
                        />
                    </div>
                    <div className="field">
                        <label>New Password</label>
                        <input
                            type="password"
                            placeholder="Enter new password (min. 6 characters)"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            disabled={pwSaving}
                        />
                    </div>
                    <div className="field">
                        <label>Confirm New Password</label>
                        <input
                            type="password"
                            placeholder="Repeat new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={pwSaving}
                        />
                    </div>

                    <button className="save-btn" onClick={handlePasswordSave} disabled={pwSaving}>
                        {pwSaving ? "Updating Password..." : "Update Password"}
                    </button>
                    {pwMsg && <div className={`msg ${pwMsg.type}`}>{pwMsg.text}</div>}
                </div>

                {/* Footer / Logout */}
                <div className="footer-actions">
                    <button className="logout-btn" onClick={handleLogout}>
                        Sign Out of Account
                    </button>
                </div>
            </div>
        </div>
    );
}