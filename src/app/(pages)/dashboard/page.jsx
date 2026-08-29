"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const style = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    font-family: 'JetBrains Mono', Monaco, 'Courier New', monospace !important;
    letter-spacing: -0.015em;
  }

  :root {
    --bg-base: #09090b;
    --bg-surface: #121215;
    --bg-card: #18181b;
    --bg-elevated: #202024;
    --border-subtle: #27272a;
    --border-medium: #3f3f46;
    --border-strong: #52525b;
    --text-primary: #f4f4f5;
    --text-secondary: #a1a1aa;
    --text-muted: #71717a;
    --accent-green: #10b981;
    --accent-amber: #f59e0b;
    --accent-blue: #38bdf8;
    --accent-purple: #a855f7;
    --accent-red: #ef4444;
  }

  body {
    background-color: var(--bg-base);
    color: var(--text-primary);
    line-height: 1.5;
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
  }

  .dashboard-layout {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .container {
    max-width: 1320px;
    margin: 0 auto;
    padding: 0 24px;
    width: 100%;
  }

  /* TOP NAVBAR */
  .dash-nav {
    position: sticky;
    top: 0;
    z-index: 50;
    background: rgba(9, 9, 11, 0.95);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border-subtle);
  }

  .dash-nav-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 68px;
  }

  .nav-left {
    display: flex;
    align-items: center;
    gap: 32px;
  }

  .brand-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    color: #ffffff;
    font-weight: 700;
    font-size: 15px;
    cursor: pointer;
  }

  .logo-box {
    width: 30px;
    height: 30px;
    background: #ffffff;
    color: #000000;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    font-weight: 800;
    font-size: 14px;
  }

  /* TAB SWITCHER */
  .tab-nav {
    display: flex;
    align-items: center;
    gap: 4px;
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: 6px;
    padding: 3px;
  }

  .tab-btn {
    padding: 7px 16px;
    font-size: 12px;
    font-weight: 600;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.15s;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .tab-btn.active {
    background: var(--bg-card);
    color: #ffffff;
    border: 1px solid var(--border-subtle);
    box-shadow: 0 1px 4px rgba(0,0,0,0.3);
  }

  .tab-badge {
    font-size: 10px;
    padding: 1px 6px;
    background: var(--bg-base);
    border: 1px solid var(--border-subtle);
    border-radius: 10px;
    color: var(--accent-green);
  }

  /* NAV RIGHT PROFILE & ACTIONS */
  .nav-right {
    display: flex;
    align-items: center;
    gap: 16px;
    position: relative;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 12px;
    font-weight: 600;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.15s;
    text-decoration: none;
    outline: none;
    border: 1px solid transparent;
  }

  .btn-primary {
    background: #ffffff;
    color: #000000;
    border-color: #ffffff;
  }

  .btn-primary:hover {
    background: #e4e4e7;
  }

  .btn-secondary {
    background: var(--bg-card);
    color: var(--text-primary);
    border: 1px solid var(--border-medium);
  }

  .btn-secondary:hover {
    background: var(--bg-elevated);
    border-color: var(--text-secondary);
  }

  .btn-outline {
    background: transparent;
    color: var(--text-secondary);
    border: 1px solid var(--border-subtle);
  }

  .btn-outline:hover {
    background: var(--bg-surface);
    color: #ffffff;
  }

  .btn-danger {
    background: #7f1d1d;
    color: #fecaca;
    border: 1px solid #991b1b;
  }

  .btn-danger:hover {
    background: #991b1b;
    color: #ffffff;
  }

  /* PROFILE MENU DROPDOWN */
  .profile-trigger {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 12px;
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s;
    user-select: none;
  }

  .profile-trigger:hover {
    border-color: var(--border-medium);
    background: var(--bg-card);
  }

  .avatar-box {
    width: 28px;
    height: 28px;
    background: #27272a;
    border: 1px solid var(--border-medium);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    color: #ffffff;
  }

  .profile-name {
    font-size: 13px;
    font-weight: 600;
    color: #ffffff;
  }

  .dropdown-chevron {
    font-size: 10px;
    color: var(--text-muted);
  }

  .profile-dropdown {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    width: 240px;
    background: var(--bg-surface);
    border: 1px solid var(--border-medium);
    border-radius: 6px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.7);
    padding: 6px;
    z-index: 60;
  }

  .dropdown-header {
    padding: 10px 12px;
    border-bottom: 1px solid var(--border-subtle);
    margin-bottom: 4px;
  }

  .dropdown-user-name {
    font-size: 13px;
    font-weight: 600;
    color: #ffffff;
  }

  .dropdown-user-email {
    font-size: 11px;
    color: var(--text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-top: 2px;
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    font-size: 12px;
    color: var(--text-secondary);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.15s;
    text-decoration: none;
  }

  .dropdown-item:hover {
    background: var(--bg-card);
    color: #ffffff;
  }

  .dropdown-item.danger {
    color: #f87171;
  }

  .dropdown-item.danger:hover {
    background: rgba(239, 68, 68, 0.15);
    color: #fca5a5;
  }

  /* SEARCH BANNER (FIVERR VIBE "I'm looking for...") */
  .dash-hero {
    padding: 40px 0 28px 0;
    border-bottom: 1px solid var(--border-subtle);
    background: #0b0b0e;
  }

  .search-container {
    max-width: 860px;
    margin: 0 auto;
    text-align: center;
  }

  .hero-heading {
    font-size: 24px;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 8px;
  }

  .hero-sub {
    font-size: 13px;
    color: var(--text-secondary);
    margin-bottom: 24px;
  }

  .middle-search-box {
    display: flex;
    align-items: center;
    background: var(--bg-surface);
    border: 1px solid var(--border-medium);
    border-radius: 6px;
    padding: 6px 8px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.5);
  }

  .search-prefix {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-muted);
    padding: 0 12px;
    border-right: 1px solid var(--border-subtle);
    white-space: nowrap;
  }

  .dash-search-input {
    flex: 1;
    background: transparent;
    border: none;
    padding: 10px 14px;
    font-size: 13px;
    color: #ffffff;
    outline: none;
  }

  .dash-search-input::placeholder {
    color: var(--text-muted);
  }

  .filter-pills {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 16px;
  }

  .filter-pill-btn {
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    color: var(--text-secondary);
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 11px;
    cursor: pointer;
    transition: all 0.15s;
  }

  .filter-pill-btn:hover, .filter-pill-btn.active {
    border-color: var(--border-strong);
    color: #ffffff;
    background: var(--bg-card);
  }

  /* METRICS STRIP */
  .metrics-strip {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin: 32px 0;
  }

  .metric-card {
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: 6px;
    padding: 16px 20px;
  }

  .metric-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .metric-title {
    font-size: 11px;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .metric-tag {
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 3px;
    background: rgba(16, 185, 129, 0.1);
    color: var(--accent-green);
    border: 1px solid rgba(16, 185, 129, 0.3);
  }

  .metric-value {
    font-size: 20px;
    font-weight: 700;
    color: #ffffff;
  }

  /* CONTENT GRIDS */
  .section-headline {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
  }

  .section-headline h3 {
    font-size: 16px;
    font-weight: 700;
    color: #ffffff;
  }

  .cards-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    margin-bottom: 48px;
  }

  .item-card {
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: 6px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: all 0.2s;
  }

  .item-card:hover {
    border-color: var(--border-strong);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.5);
  }

  .card-top {
    padding: 16px 18px;
    border-bottom: 1px solid var(--border-subtle);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    border-radius: 3px;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border: 1px solid var(--border-subtle);
    background: var(--bg-card);
  }

  .badge.green {
    border-color: rgba(16, 185, 129, 0.4);
    background: rgba(16, 185, 129, 0.1);
    color: var(--accent-green);
  }

  .badge.blue {
    border-color: rgba(56, 189, 248, 0.4);
    background: rgba(56, 189, 248, 0.1);
    color: var(--accent-blue);
  }

  .badge.purple {
    border-color: rgba(168, 85, 247, 0.4);
    background: rgba(168, 85, 247, 0.1);
    color: var(--accent-purple);
  }

  .card-body {
    padding: 18px;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .card-title {
    font-size: 14px;
    font-weight: 600;
    color: #ffffff;
    margin-bottom: 8px;
    line-height: 1.4;
  }

  .card-desc {
    font-size: 12px;
    color: var(--text-secondary);
    line-height: 1.6;
    margin-bottom: 16px;
    flex: 1;
  }

  .card-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 16px;
  }

  .skill-pill {
    font-size: 10px;
    padding: 2px 6px;
    background: var(--bg-card);
    border: 1px solid var(--border-subtle);
    border-radius: 3px;
    color: var(--text-secondary);
  }

  .card-footer {
    padding: 12px 18px;
    background: var(--bg-card);
    border-top: 1px solid var(--border-subtle);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .card-stat {
    font-size: 11px;
    color: var(--text-muted);
  }

  .card-stat strong {
    color: #ffffff;
  }

  /* MODAL (SHADCN CONFIRMATION DIALOG) */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
  }

  .modal-box {
    background: var(--bg-surface);
    border: 1px solid var(--border-medium);
    border-radius: 8px;
    width: 100%;
    max-width: 440px;
    padding: 24px;
    box-shadow: 0 20px 50px rgba(0,0,0,0.8);
    animation: fadeIn 0.15s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.96); }
    to { opacity: 1; transform: scale(1); }
  }

  .modal-header {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    margin-bottom: 16px;
  }

  .modal-icon-box {
    width: 36px;
    height: 36px;
    border-radius: 6px;
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: var(--accent-red);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 16px;
    flex-shrink: 0;
  }

  .modal-title {
    font-size: 16px;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 4px;
  }

  .modal-desc {
    font-size: 13px;
    color: var(--text-secondary);
    line-height: 1.5;
  }

  .modal-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 24px;
  }

  @media (max-width: 1024px) {
    .cards-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    .metrics-strip {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 640px) {
    .cards-grid, .metrics-strip {
      grid-template-columns: 1fr;
    }
    .dash-nav-inner {
      flex-direction: column;
      height: auto;
      padding: 12px 0;
      gap: 12px;
    }
    .nav-left {
      width: 100%;
      justify-content: space-between;
    }
  }
`;

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("hackathons"); // "gigs" | "explore" | "hackathons"
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTag, setFilterTag] = useState("All");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Authenticate user check from localStorage
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token) {
      router.replace("/auth");
      return;
    }

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser({ full_name: "Collegiate Builder", email: "builder@skillshive.in" });
      }
    } else {
      setUser({ full_name: "Collegiate Builder", email: "builder@skillshive.in" });
    }
  }, [router]);

  const handleLogoutConfirm = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setShowLogoutModal(false);
    router.replace("/auth");
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  const hackathonsData = [
    {
      id: 1,
      title: "Smart India Collegiate AI Sprint 2026",
      organizer: "IIT Bombay × Skills Hive",
      tag: "Hackathon",
      badgeColor: "green",
      prize: "₹7,50,000",
      deadline: "3 Days Left",
      desc: "Build autonomous multi-agent systems and on-device reasoning pipelines for rural logistics and precision agri-tech.",
      tags: ["Agentic AI", "PyTorch", "FastAPI", "Rust"],
      teamsCount: "42 Teams Registered",
    },
    {
      id: 2,
      title: "ETHIndia Collegiate Track '26",
      organizer: "BITS Pilani Web3 Guild",
      tag: "Web3 Hackathon",
      badgeColor: "blue",
      prize: "$15,000 USD",
      deadline: "6 Days Left",
      desc: "Architect zero-knowledge zk-Rollups, restaking protocols, and hardened EVM contracts on Ethereum L2s.",
      tags: ["Solidity", "Foundry", "zk-SNARKs", "TypeScript"],
      teamsCount: "68 Teams Registered",
    },
    {
      id: 3,
      title: "FinTech Quant & Algorithmic Challenge",
      organizer: "IIM Ahmedabad & IIT-Delhi",
      tag: "Quant Bounty",
      badgeColor: "purple",
      prize: "₹5,00,000",
      deadline: "5 Days Left",
      desc: "Formulate ultra-low latency statistical arbitrage strategies, portfolio risk engines, and orderbook simulators.",
      tags: ["Python", "C++", "NumPy", "Time-Series"],
      teamsCount: "29 Teams Registered",
    },
  ];

  const gigsData = [
    {
      id: 101,
      title: "I will build full-stack Next.js 15 apps with Postgres & Shadcn",
      seller: "Rohan Verma (IIT Delhi '24)",
      tag: "Full-Stack Gig",
      badgeColor: "green",
      rating: "5.0 ★ (49)",
      price: "₹3,200/hr",
      desc: "Pixel-perfect minimalist SaaS layouts, high-conversion auth flows, and edge API architectures.",
      tags: ["Next.js", "React 19", "PostgreSQL", "Tailwind"],
      turnaround: "2 Days Delivery",
    },
    {
      id: 102,
      title: "I will design complete Figma design systems and SaaS dashboards",
      seller: "Ananya Iyer (BITS Pilani '25)",
      tag: "UI/UX Gig",
      badgeColor: "purple",
      rating: "4.9 ★ (64)",
      price: "₹2,800/hr",
      desc: "Enterprise-grade design tokens, component variants, wireframes, and interactive dark-mode interfaces.",
      tags: ["Figma", "Design Tokens", "Wireframing", "Prototypes"],
      turnaround: "3 Days Delivery",
    },
    {
      id: 103,
      title: "I will audit Solidity smart contracts and fix reentrancy vulnerabilities",
      seller: "Devendra K. (IIT Roorkee '24)",
      tag: "Security Gig",
      badgeColor: "blue",
      rating: "5.0 ★ (41)",
      price: "₹4,200/hr",
      desc: "Comprehensive manual bytecode audits, invariant unit testing, and Slither/Mythril verification reports.",
      tags: ["Solidity", "Foundry", "Security", "EVM"],
      turnaround: "4 Days Delivery",
    },
  ];

  const exploreData = [
    {
      id: 201,
      title: "LLM Fine-Tuning & Quantization Guild",
      organizer: "IIT Madras Research Lab",
      tag: "Research Sprint",
      badgeColor: "purple",
      prize: "₹4,00,000",
      deadline: "Open Guild",
      desc: "Collaborative fine-tuning of open-weight models for Indic languages and technical domain code generation.",
      tags: ["Unsloth", "Llama-3", "LoRA", "HuggingFace"],
      teamsCount: "110 Researchers",
    },
    {
      id: 202,
      title: "Autonomous Robotics & Embedded Edge Guild",
      organizer: "IIIT Hyderabad Robotics",
      tag: "Hardware Hack",
      badgeColor: "blue",
      prize: "₹6,00,000",
      deadline: "12 Days Left",
      desc: "Real-time edge computer vision using ROS2 and NVIDIA Jetson modules for drone navigation.",
      tags: ["ROS2", "C++", "YOLOv10", "Embedded"],
      teamsCount: "35 Teams Active",
    },
    {
      id: 203,
      title: "Distributed Databases & Storage Engine Bounty",
      organizer: "IIT Kanpur Systems Lab",
      tag: "Systems Bounty",
      badgeColor: "green",
      prize: "₹3,50,000",
      deadline: "8 Days Left",
      desc: "Implement a LSM-tree based persistent key-value store with Raft consensus in Rust.",
      tags: ["Rust", "Raft", "Distributed Systems", "Storage"],
      teamsCount: "54 Engineers",
    },
  ];

  const currentItems = 
    activeTab === "hackathons" ? hackathonsData :
    activeTab === "gigs" ? gigsData : exploreData;

  const filteredItems = currentItems.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (filterTag === "All") return matchesSearch;
    return matchesSearch && item.tags.some(t => t.toLowerCase() === filterTag.toLowerCase());
  });

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <>
      <style>{style}</style>

      <div className="dashboard-layout">
        {/* TOP NAVBAR */}
        <header className="dash-nav">
          <div className="container">
            <div className="dash-nav-inner">
              <div className="nav-left">
                <div className="brand-logo" onClick={() => router.push("/")}>
                  <div className="logo-box">S</div>
                  <span>Skills Hive</span>
                </div>

                {/* TABS: Gigs || Explore || Hackathons */}
                <div className="tab-nav">
                  <button
                    className={`tab-btn ${activeTab === "gigs" ? "active" : ""}`}
                    onClick={() => setActiveTab("gigs")}
                  >
                    <span>Gigs</span>
                    <span className="tab-badge">PRO</span>
                  </button>
                  <button
                    className={`tab-btn ${activeTab === "explore" ? "active" : ""}`}
                    onClick={() => setActiveTab("explore")}
                  >
                    <span>Explore</span>
                  </button>
                  <button
                    className={`tab-btn ${activeTab === "hackathons" ? "active" : ""}`}
                    onClick={() => setActiveTab("hackathons")}
                  >
                    <span>Hackathons</span>
                    <span className="tab-badge" style={{ color: "var(--accent-amber)" }}>LIVE</span>
                  </button>
                </div>
              </div>

              {/* NAV RIGHT: PROFILE NAME & DROPDOWN */}
              <div className="nav-right">
                <button 
                  className="btn btn-secondary"
                  onClick={() => alert("Demo Mode: Create Hackathon / Post Gig opened.")}
                >
                  + Post Listing
                </button>

                <div 
                  className="profile-trigger"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                >
                  <div className="avatar-box">
                    {getInitials(user?.full_name)}
                  </div>
                  <span className="profile-name">
                    {user?.full_name || "Collegiate User"}
                  </span>
                  <span className="dropdown-chevron">{isProfileOpen ? "▲" : "▼"}</span>
                </div>

                {/* PROFILE DROPDOWN */}
                {isProfileOpen && (
                  <div className="profile-dropdown">
                    <div className="dropdown-header">
                      <div className="dropdown-user-name">{user?.full_name || "User Profile"}</div>
                      <div className="dropdown-user-email">{user?.email || "user@skillshive.in"}</div>
                    </div>

                    <div 
                      className="dropdown-item"
                      onClick={() => {
                        setIsProfileOpen(false);
                        router.push("/profile");
                      }}
                    >
                      <span>👤 View Profile</span>
                      <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>/profile</span>
                    </div>

                    <div 
                      className="dropdown-item"
                      onClick={() => {
                        setIsProfileOpen(false);
                        router.push("/");
                      }}
                    >
                      <span>🏠 Marketplace Home</span>
                    </div>

                    <div 
                      className="dropdown-item danger"
                      onClick={() => {
                        setIsProfileOpen(false);
                        setShowLogoutModal(true);
                      }}
                    >
                      <span>⎋ Log out</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* MIDDLE SEARCH HERO ("I am looking for...") */}
        <section className="dash-hero">
          <div className="container">
            <div className="search-container">
              <h1 className="hero-heading">
                {activeTab === "hackathons" && "Collegiate Hackathons & Tech Sprints"}
                {activeTab === "gigs" && "Verified Gigs From Top Institution Talents"}
                {activeTab === "explore" && "Explore Research Guilds & Active Bounties"}
              </h1>
              <p className="hero-sub">
                Connect with collegiate builders from IIT Bombay, IIT Delhi, BITS Pilani & IIMs.
              </p>

              {/* MIDDLE SEARCH BAR */}
              <div className="middle-search-box">
                <div className="search-prefix">I am looking for</div>
                <input
                  type="text"
                  className="dash-search-input"
                  placeholder="e.g. Smart Contract Auditor, AI Agent Hackathon, Full-Stack Dev..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button 
                  className="btn btn-primary"
                  onClick={() => {}}
                >
                  Search
                </button>
              </div>

              {/* QUICK FILTER PILLS */}
              <div className="filter-pills">
                {["All", "Agentic AI", "Next.js", "Solidity", "Python", "Rust", "Figma"].map((tag) => (
                  <button
                    key={tag}
                    className={`filter-pill-btn ${filterTag === tag ? "active" : ""}`}
                    onClick={() => setFilterTag(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* MAIN DASHBOARD CONTENT */}
        <main className="container" style={{ flex: 1, paddingBottom: "60px" }}>
          {/* STATS STRIP */}
          <div className="metrics-strip">
            <div className="metric-card">
              <div className="metric-top">
                <span className="metric-title">Active Hackathons</span>
                <span className="metric-tag">LIVE</span>
              </div>
              <div className="metric-value">18 Sprints</div>
            </div>

            <div className="metric-card">
              <div className="metric-top">
                <span className="metric-title">Prize Pool Escrow</span>
                <span className="metric-tag" style={{ color: "var(--accent-amber)" }}>SECURE</span>
              </div>
              <div className="metric-value">₹48,50,000</div>
            </div>

            <div className="metric-card">
              <div className="metric-top">
                <span className="metric-title">Verified Talents</span>
                <span className="metric-tag">IIT / BITS</span>
              </div>
              <div className="metric-value">1,420+ PROS</div>
            </div>

            <div className="metric-card">
              <div className="metric-top">
                <span className="metric-title">Avg Team Match</span>
                <span className="metric-tag">&lt; 15 MIN</span>
              </div>
              <div className="metric-value">99.4% Match</div>
            </div>
          </div>

          {/* SECTION HEADER */}
          <div className="section-headline">
            <h3>
              {activeTab === "hackathons" && "🔥 Featured Hackathons & Sprints"}
              {activeTab === "gigs" && "⚡ Verified Instant Gigs"}
              {activeTab === "explore" && "🌐 Exploration Guilds & Bounties"}
              <span style={{ fontSize: "12px", color: "var(--text-muted)", marginLeft: "8px" }}>
                ({filteredItems.length} available)
              </span>
            </h3>

            <div style={{ display: "flex", gap: "8px" }}>
              <button 
                className="btn btn-outline" 
                style={{ fontSize: "11px", padding: "6px 12px" }}
                onClick={() => { setSearchQuery(""); setFilterTag("All"); }}
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* CARDS GRID */}
          <div className="cards-grid">
            {filteredItems.map((item) => (
              <div key={item.id} className="item-card">
                <div className="card-top">
                  <span className={`badge ${item.badgeColor}`}>
                    {item.tag}
                  </span>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    {item.deadline || item.turnaround || item.rating}
                  </span>
                </div>

                <div className="card-body">
                  <div className="card-title">{item.title}</div>
                  <div style={{ fontSize: "11px", color: "var(--accent-blue)", marginBottom: "8px" }}>
                    {item.organizer || item.seller}
                  </div>
                  <div className="card-desc">{item.desc}</div>

                  <div className="card-tags">
                    {item.tags.map((t, idx) => (
                      <span key={idx} className="skill-pill">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="card-footer">
                  <div>
                    <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                      {item.prize ? "PRIZE POOL" : "STARTING PRICE"}
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff" }}>
                      {item.prize || item.price}
                    </div>
                  </div>

                  <button 
                    className="btn btn-primary"
                    style={{ fontSize: "11px", padding: "6px 14px" }}
                    onClick={() => alert(`Applied / Selected: ${item.title}`)}
                  >
                    {activeTab === "hackathons" ? "Join Sprint →" : activeTab === "gigs" ? "Order Gig →" : "View Bounty →"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* LOGOUT CONFIRMATION MODAL (SHADCN STYLE) */}
      {showLogoutModal && (
        <div className="modal-overlay" onClick={handleLogoutCancel}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-icon-box">!</div>
              <div>
                <div className="modal-title">Confirm Logout</div>
                <div className="modal-desc">
                  Are you sure you want to log out of Skills Hive? You will need to log back in to access your dashboard.
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={handleLogoutCancel}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger"
                onClick={handleLogoutConfirm}
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
