// src/app/(pages)/profile/page.jsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

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
  .profile-page {
    min-height: 100vh;
    background: #F48120;
    padding: 40px 16px 24px;
    position: relative;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .dot-wave {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 140px;
    background-image: radial-gradient(rgba(255,255,255,0.35) 2px, transparent 2px);
    background-size: 22px 22px;
    -webkit-mask-image: linear-gradient(to top, black 0%, transparent 100%);
    mask-image: linear-gradient(to top, black 0%, transparent 100%);
    pointer-events: none;
  }

  .wrap {
    position: relative;
    z-index: 1;
    max-width: 640px;
    margin: 0 auto;
  }

  .card {
    background: #fff;
    border-radius: 12px;
    padding: 28px;
    margin-bottom: 16px;
    box-shadow: 0 8px 30px rgba(0,0,0,0.12);
  }

  .card h2 {
    font-size: 15px;
    font-weight: 700;
    color: #1a1a1a;
    margin: 0 0 18px 0;
  }

  .status-banner {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    margin-bottom: 16px;
  }

  .status-active { background: #dcfce7; color: #16a34a; }
  .status-suspended { background: #fef9c3; color: #ca8a04; }
  .status-banned { background: #fee2e2; color: #dc2626; }

  .status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: currentColor;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .stat-box {
    background: #fafafa;
    border: 1px solid #eee;
    border-radius: 10px;
    padding: 14px;
  }

  .stat-box .label {
    font-size: 11px;
    color: #999;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    margin-bottom: 4px;
  }

  .stat-box .value {
    font-size: 20px;
    font-weight: 700;
    color: #1a1a1a;
  }

  .field { margin-bottom: 16px; }
  .field:last-child { margin-bottom: 0; }

  .field label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: #555;
    margin-bottom: 6px;
  }

  .field input,
  .field select,
  .field textarea {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 14px;
    box-sizing: border-box;
    outline: none;
    font-family: inherit;
    background: #fff;
  }

  .field input:focus,
  .field select:focus,
  .field textarea:focus {
    border-color: #F48120;
  }

  .field input:disabled {
    background: #f5f5f5;
    color: #999;
  }

  .char-count {
    font-size: 11px;
    color: #aaa;
    text-align: right;
    margin-top: 4px;
  }

  .row-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .search-wrap { position: relative; }

  .search-results {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    background: #fff;
    border: 1px solid #eee;
    border-radius: 8px;
    box-shadow: 0 6px 20px rgba(0,0,0,0.12);
    max-height: 220px;
    overflow-y: auto;
    z-index: 10;
  }

  .search-result-item {
    padding: 10px 12px;
    font-size: 13px;
    cursor: pointer;
  }

  .search-result-item:hover { background: #FFF3E8; }

  .selected-chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: #FFF3E8;
    border: 1px solid #F48120;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 13px;
    font-weight: 600;
    color: #1a1a1a;
  }

  .selected-chip button {
    background: none;
    border: none;
    color: #F48120;
    cursor: pointer;
    font-size: 13px;
    font-weight: 700;
  }

  .skills-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 10px;
  }

  .skill-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #FFF3E8;
    border: 1px solid #F48120;
    color: #1a1a1a;
    border-radius: 20px;
    padding: 5px 10px 5px 12px;
    font-size: 12px;
    font-weight: 600;
  }

  .skill-chip button {
    background: none;
    border: none;
    color: #F48120;
    cursor: pointer;
    font-size: 13px;
    line-height: 1;
  }

  .save-btn {
    width: 100%;
    padding: 12px;
    background: #F48120;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
  }

  .save-btn:disabled { background: #f5b979; cursor: not-allowed; }

  .msg { font-size: 13px; margin-top: 10px; text-align: center; }
  .msg.error { color: #dc2626; }
  .msg.success { color: #16a34a; }

  .logout {
    display: block;
    width: 100%;
    text-align: center;
    margin-top: 4px;
    padding: 10px;
    font-size: 13px;
    color: #888;
    cursor: pointer;
    background: none;
    border: none;
  }

  .loading { color: #fff; text-align: center; padding: 60px 0; }
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

    if (loading) {
        return (
            <div className="profile-page">
                <style>{styles}</style>
                <div className="loading">Loading profile...</div>
            </div>
        );
    }

    return (
        <div className="profile-page">
            <style>{styles}</style>
            <div className="dot-wave" />

            <div className="wrap">
                {/* Account status + stats */}
                <div className="card">
                    <div className={`status-banner status-${accountStatus}`}>
                        <span className="status-dot" />
                        {accountStatus}
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
                    <h2>Basic Information</h2>

                    <div className="field">
                        <label>Full Name</label>
                        <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={saving} />
                    </div>

                    <div className="field">
                        <label>Email (cannot be changed)</label>
                        <input type="email" value={email} disabled />
                    </div>

                    <div className="field">
                        <label>Bio</label>
                        <textarea
                            rows={3}
                            maxLength={400}
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            disabled={saving}
                        />
                        <div className="char-count">{bio.length}/400</div>
                    </div>

                    <div className="row-2">
                        <div className="field">
                            <label>Role</label>
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

                {/* Education */}
                <div className="card">
                    <h2>Education</h2>

                    <div className="field">
                        <label>College</label>
                        {selectedCollege ? (
                            <span className="selected-chip">
                                {selectedCollege.college_name}
                                <button onClick={() => setSelectedCollege(null)} disabled={saving}>✕ Change</button>
                            </span>
                        ) : (
                            <div className="search-wrap">
                                <input
                                    type="text"
                                    placeholder="Search your college..."
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
                                                {c.college_name} {c.city ? `— ${c.city}` : ""}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="row-2">
                        <div className="field">
                            <label>Branch</label>
                            <select value={branch} onChange={(e) => setBranch(e.target.value)} disabled={saving}>
                                {BRANCHES.map((b) => (
                                    <option key={b} value={b}>{b}</option>
                                ))}
                            </select>
                        </div>
                        <div className="field">
                            <label>Passout Year</label>
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
                    <h2>Skills</h2>

                    {selectedSkills.length > 0 && (
                        <div className="skills-chips">
                            {selectedSkills.map((s) => (
                                <span key={s.skill_id} className="skill-chip">
                                    {s.skill_name}
                                    <button onClick={() => removeSkill(s.skill_id)} disabled={saving}>✕</button>
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="search-wrap">
                        <input
                            type="text"
                            placeholder="Search and add skills..."
                            value={skillQuery}
                            onChange={(e) => setSkillQuery(e.target.value)}
                            disabled={saving}
                        />
                        {skillResults.length > 0 && (
                            <div className="search-results">
                                {skillResults.map((s) => (
                                    <div key={s.skill_id} className="search-result-item" onClick={() => addSkill(s)}>
                                        {s.skill_name} <span style={{ color: "#aaa" }}>· {s.category}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Save profile */}
                <div className="card">
                    <button className="save-btn" onClick={handleSave} disabled={saving}>
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                    {msg && <div className={`msg ${msg.type}`}>{msg.text}</div>}
                </div>

                {/* Password */}
                <div className="card">
                    <h2>Reset Password</h2>

                    <div className="field">
                        <label>Current Password</label>
                        <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} disabled={pwSaving} />
                    </div>
                    <div className="field">
                        <label>New Password</label>
                        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} disabled={pwSaving} />
                    </div>
                    <div className="field">
                        <label>Confirm New Password</label>
                        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={pwSaving} />
                    </div>

                    <button className="save-btn" onClick={handlePasswordSave} disabled={pwSaving}>
                        {pwSaving ? "Updating..." : "Update Password"}
                    </button>
                    {pwMsg && <div className={`msg ${pwMsg.type}`}>{pwMsg.text}</div>}
                </div>

                <button className="logout" onClick={handleLogout}>Log out</button>
            </div>
        </div>
    );
}