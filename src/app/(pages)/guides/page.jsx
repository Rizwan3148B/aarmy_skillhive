"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import OrdersModal from "@/components/OrdersModal";

export default function GuidesPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [activeRole, setActiveRole] = useState("seller"); // "seller" | "buyer" | "escrow"
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isOrdersOpen, setIsOrdersOpen] = useState(false);
    const [expandedFaq, setExpandedFaq] = useState(null);

    // Auth check
    useEffect(() => {
        const token = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (!token) {
            router.replace("/auth");
            return;
        }

        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser);
                setUser(parsed);
            } catch {
                setUser({ full_name: "Collegiate User", email: "user@skillshive.in", college: "IIT Bombay" });
            }
        } else {
            setUser({ full_name: "Collegiate User", email: "user@skillshive.in", college: "IIT Bombay" });
        }
    }, [router]);

    const handleLogoutConfirm = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setShowLogoutModal(false);
        router.replace("/auth");
    };

    const getInitials = (name) => {
        if (!name) return "U";
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
    };

    const toggleFaq = (index) => {
        setExpandedFaq(expandedFaq === index ? null : index);
    };

    const sellerSteps = [
        {
            step: 1,
            tag: "Verification",
            title: "Set Up Your Verified Campus Profile",
            desc: "Authenticate with your official college email ID or campus registration. Add your technical competencies, GitHub repo links, Figma showcase, and academic branch to earn the Verified Campus Talent badge.",
            badgeColor: "var(--accent-blue)",
            icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <polyline points="16 11 18 13 22 9" />
                </svg>
            ),
            tips: [
                "Include links to live demo URLs or active GitHub repositories.",
                "Highlight your specific domain expertise (e.g., PyTorch, Next.js, Solidity).",
            ],
        },
        {
            step: 2,
            tag: "Publishing",
            title: "Create Service Listings or Bid on Campus Tasks",
            desc: "Post your custom skill packages with transparent pricing and turnaround times. Alternatively, browse live open tasks posted by peers and faculty across IITs, BITS, and IIITs to submit tailored bids.",
            badgeColor: "var(--accent-green)",
            icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                    <line x1="12" y1="11" x2="12" y2="17" />
                    <line x1="9" y1="14" x2="15" y2="14" />
                </svg>
            ),
            tips: [
                "Set realistic delivery deadlines that accommodate your exam schedules.",
                "Mention clear deliverables (e.g. source code, documentation, test suite).",
            ],
        },
        {
            step: 3,
            tag: "Security",
            title: "Receive Orders Backed by Escrow",
            desc: "When a peer accepts your bid or purchases your listing, 100% of the funds are deposited into Skills Hive Escrow vault before you write a single line of code. You are always guaranteed payment for completed deliverables.",
            badgeColor: "var(--accent-amber)",
            icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
            ),
            tips: [
                "Communicate directly in the order thread to keep all milestone logs clear.",
                "Never accept direct off-platform payments to maintain escrow protection.",
            ],
        },
        {
            step: 4,
            tag: "Execution",
            title: "Deliver High-Quality Work & Revisions",
            desc: "Submit your final artifacts (code repository, Figma file, datasets, or reports) through the order portal. Buyers get a 48-hour inspection window to review deliverables and request minor adjustments if needed.",
            badgeColor: "var(--accent-purple)",
            icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
                    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
                </svg>
            ),
            tips: [
                "Provide a clear README and setup instructions for software projects.",
                "Include video walkthroughs for UI/UX prototypes to speed up approvals.",
            ],
        },
        {
            step: 5,
            tag: "Payout & Growth",
            title: "Instant UPI Payout & Campus Leaderboard Boost",
            desc: "Once the buyer approves the delivery, funds are instantly released to your linked UPI ID / Bank account. Positive ratings boost your campus reputation, elevating you into the Top Performers Leaderboard.",
            badgeColor: "var(--accent-green)",
            icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
            ),
            tips: [
                "Maintain a 5.0 star average to unlock exclusive high-budget enterprise tasks.",
                "Add completed projects directly to your resume with verified client feedback.",
            ],
        },
    ];

    const buyerSteps = [
        {
            step: 1,
            tag: "Discovery",
            title: "Post a Problem Statement or Explore Talent",
            desc: "Have a hackathon prototype, deep learning fine-tuning task, or full-stack web app requirement? Create an open task listing with your budget, deadline, and target college pool, or browse top rated student creators.",
            badgeColor: "var(--accent-blue)",
            icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
            ),
            tips: [
                "Clearly define acceptance criteria and technical requirements.",
                "Specify if the project is exclusive to your college or open to all campuses.",
            ],
        },
        {
            step: 2,
            tag: "Selection",
            title: "Review Verified Portfolios & Shortlist",
            desc: "Receive competitive proposals from collegiate developers and designers. Inspect verified peer ratings, past task completion counts, and verified student IDs before confirming.",
            badgeColor: "var(--accent-green)",
            icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
            ),
            tips: [
                "Chat with candidates via real-time messaging to confirm technical alignment.",
                "Check Top Performer rankings to identify subject matter specialists.",
            ],
        },
        {
            step: 3,
            tag: "Escrow Deposit",
            title: "Fund Escrow Safely with Zero Financial Risk",
            desc: "Lock the task amount into Skills Hive Escrow. The developer starts working immediately knowing funds are secure, while you retain full control until you inspect and approve the completed output.",
            badgeColor: "var(--accent-amber)",
            icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
            ),
            tips: [
                "Zero hidden fees. The amount you agree upon is the exact amount held.",
                "Automated refund guarantees if a creator fails to meet agreed deadlines.",
            ],
        },
        {
            step: 4,
            tag: "Review & Quality",
            title: "Inspect Deliverables & Test Code",
            desc: "Receive the deliverables directly in your order dashboard. Review code repositories, test functional APIs, or review UI mockups. If anything is amiss, request revisions with 1 click.",
            badgeColor: "var(--accent-purple)",
            icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                </svg>
            ),
            tips: [
                "Run unit tests and check against requirements before finalizing.",
                "You have a 48-hour window to approve or request refinement.",
            ],
        },
        {
            step: 5,
            tag: "Completion",
            title: "Release Payment & Endorse Collegiate Peer",
            desc: "When satisfied, approve the order to release funds to the student creator. Leave an authentic rating to help them climb the campus leaderboard and build their professional career track record.",
            badgeColor: "var(--accent-green)",
            icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
            ),
            tips: [
                "Detailed reviews help student creators build verified campus credentials.",
                "Rehire top performers easily for recurring project needs.",
            ],
        },
    ];

    const escrowSteps = [
        {
            step: 1,
            tag: "Agreement",
            title: "Milestone Agreement & Order Initiation",
            desc: "Both parties agree upon project deliverables, turnaround timeline, and exact financial compensation. No ambiguities or surprise scope additions.",
            badgeColor: "var(--accent-blue)",
            icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
            ),
            tips: ["All commitments are time-stamped on the immutable order log."],
        },
        {
            step: 2,
            tag: "Vault Protection",
            title: "Secure Escrow Deposit",
            desc: "The buyer deposits funds into the dedicated Skills Hive escrow smart vault. Funds are isolated and cannot be accessed by anyone until conditions are fulfilled.",
            badgeColor: "var(--accent-amber)",
            icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
            ),
            tips: ["Eliminates payment defaults and student ghosting."],
        },
        {
            step: 3,
            tag: "Arbitration & Resolution",
            title: "Campus Moderator Dispute Safety Net",
            desc: "If any disagreement arises regarding deliverables or timelines, certified campus arbitration moderators step in to review submission git diffs and enforce a fair outcome.",
            badgeColor: "var(--accent-green)",
            icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
            ),
            tips: ["100% money-back guarantee for incomplete or non-functional work."],
        },
    ];

    const currentSteps =
        activeRole === "seller"
            ? sellerSteps
            : activeRole === "buyer"
                ? buyerSteps
                : escrowSteps;

    const faqs = [
        {
            q: "How does college verification work?",
            a: "Students verify their profile by authenticating with their active .edu or college-issued domain email, or submitting their official university student ID card. Verified students receive a badge and higher listing visibility.",
        },
        {
            q: "Is my payment safe when hiring someone?",
            a: "Yes! Your payment is held securely in the Skills Hive Escrow vault. The developer only receives funds after you inspect the deliverables and click 'Approve & Release Payment'.",
        },
        {
            q: "How do student creators get paid?",
            a: "Upon project approval, funds are immediately credited to your linked UPI ID (Google Pay, PhonePe, Paytm) or direct NEFT/IMPS bank account with zero delay.",
        },
        {
            q: "What if the delivered code or project has bugs?",
            a: "You can request free revisions directly within the 48-hour inspection window. If the student fails to meet the specified scope, you are entitled to a full refund through our Dispute Resolution panel.",
        },
        {
            q: "Can I collaborate with students from other colleges?",
            a: "Yes! While you can filter tasks exclusively for your own campus, Skills Hive also connects elite developers and designers across IIT Bombay, IIT Delhi, BITS Pilani, IIIT Hyderabad, and top institutions nationwide.",
        },
    ];

    return (
        <div className="sh-app">
            <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        *, *::before, *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        :root {
          --bg-root: #09090b;
          --bg-card: #121215;
          --bg-card-hover: #18181c;
          --bg-sidebar: #0e0e11;
          --bg-input: #141418;
          --bg-muted: #1c1c22;
          --border-subtle: #232328;
          --border-default: #2e2e36;
          --border-active: #4a4a55;

          --text-primary: #f4f4f5;
          --text-secondary: #a1a1aa;
          --text-muted: #71717a;
          --text-inverse: #09090b;

          --accent-green: #10b981;
          --accent-amber: #f59e0b;
          --accent-blue: #38bdf8;
          --accent-purple: #a855f7;
          --accent-red: #ef4444;

          --radius-sm: 6px;
          --radius-md: 8px;
          --radius-lg: 12px;
          --radius-xl: 16px;
        }

        body {
          background-color: var(--bg-root);
          color: var(--text-primary);
          min-height: 100vh;
          overflow-x: hidden;
        }

        .sh-app {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }

        /* TOP NAVIGATION BAR */
        .sh-topbar {
          position: sticky;
          top: 0;
          z-index: 60;
          background: rgba(9, 9, 11, 0.85);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border-bottom: 1px solid var(--border-subtle);
          height: 60px;
        }

        .sh-topbar-inner {
          max-width: 1300px;
          margin: 0 auto;
          padding: 0 24px;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .sh-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          text-decoration: none;
        }

        .sh-logo-badge {
          width: 30px;
          height: 30px;
          background: #ffffff;
          color: #09090b;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-md);
          font-weight: 800;
          font-size: 14px;
          letter-spacing: -0.04em;
        }

        .sh-logo-title {
          font-size: 15px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: -0.02em;
        }

        .sh-nav-links {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .sh-nav-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
          background: transparent;
          border: 1px solid transparent;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.15s ease;
          text-decoration: none;
        }

        .sh-nav-btn:hover {
          color: #ffffff;
          background: var(--bg-muted);
        }

        .sh-nav-btn.active {
          color: #ffffff;
          background: var(--bg-card);
          border-color: var(--border-subtle);
        }

        /* MY EARNINGS PILL */
        .sh-earnings-pill {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 6px 12px;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.28);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.15s ease;
          text-decoration: none;
        }

        .sh-earnings-pill:hover {
          background: rgba(16, 185, 129, 0.16);
          border-color: var(--accent-green);
          transform: translateY(-1px);
        }

        .sh-earnings-val {
          font-size: 13px;
          font-weight: 700;
          color: var(--accent-green);
        }

        /* PROFILE */
        .sh-profile-container {
          position: relative;
        }

        .sh-profile-trigger {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 5px 12px 5px 6px;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .sh-profile-trigger:hover {
          border-color: var(--border-default);
          background: var(--bg-card-hover);
        }

        .sh-avatar {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: #27272a;
          border: 1px solid var(--border-default);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 600;
          color: #ffffff;
        }

        .sh-profile-name {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary);
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .sh-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 220px;
          background: var(--bg-sidebar);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.6);
          padding: 6px;
          z-index: 70;
        }

        .sh-dropdown-header {
          padding: 8px 10px 10px 10px;
          border-bottom: 1px solid var(--border-subtle);
          margin-bottom: 4px;
        }

        .sh-dropdown-name {
          font-size: 13px;
          font-weight: 600;
          color: #ffffff;
        }

        .sh-dropdown-email {
          font-size: 11px;
          color: var(--text-muted);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          margin-top: 2px;
        }

        .sh-dropdown-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          font-size: 13px;
          color: var(--text-secondary);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.15s ease;
          text-decoration: none;
        }

        .sh-dropdown-item:hover {
          background: var(--bg-muted);
          color: #ffffff;
        }

        .sh-dropdown-item.danger {
          color: #f87171;
        }

        .sh-dropdown-item.danger:hover {
          background: rgba(239, 68, 68, 0.12);
          color: #fca5a5;
        }

        /* MAIN CONTAINER */
        .sh-container {
          max-width: 1100px;
          margin: 0 auto;
          padding: 36px 24px 80px 24px;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 40px;
        }

        /* HERO HEADER */
        .sh-guide-hero {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
        }

        .sh-pill-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 999px;
          background: rgba(56, 189, 248, 0.1);
          border: 1px solid rgba(56, 189, 248, 0.25);
          color: var(--accent-blue);
          font-size: 12px;
          font-weight: 600;
        }

        .sh-hero-title {
          font-size: 32px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.03em;
          line-height: 1.25;
        }

        .sh-hero-subtitle {
          font-size: 15px;
          color: var(--text-secondary);
          max-width: 640px;
          line-height: 1.6;
        }

        /* ROLE SWITCHER TABS */
        .sh-role-nav {
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-xl);
          padding: 6px;
          max-width: 680px;
          margin: 0 auto;
          width: 100%;
          gap: 6px;
        }

        .sh-role-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 16px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
          background: transparent;
          border: 1px solid transparent;
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: center;
        }

        .sh-role-btn:hover {
          color: #ffffff;
          background: var(--bg-muted);
        }

        .sh-role-btn.active {
          background: #ffffff;
          color: #09090b;
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
        }

        /* STEPS TIMELINE CONTAINER */
        .sh-steps-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
          position: relative;
        }

        /* STEP CARD */
        .sh-step-card {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-xl);
          padding: 26px 28px;
          display: grid;
          grid-template-columns: 56px 1fr;
          gap: 24px;
          align-items: start;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }

        .sh-step-card:hover {
          border-color: var(--border-default);
          background: var(--bg-card-hover);
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
        }

        .sh-step-number-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .sh-step-badge {
          width: 50px;
          height: 50px;
          border-radius: var(--radius-lg);
          background: var(--bg-muted);
          border: 1px solid var(--border-default);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 800;
          color: #ffffff;
        }

        .sh-step-content {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .sh-step-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
        }

        .sh-step-tag {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          padding: 3px 8px;
          border-radius: var(--radius-sm);
          background: var(--bg-muted);
          border: 1px solid var(--border-subtle);
        }

        .sh-step-title {
          font-size: 17px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: -0.01em;
        }

        .sh-step-desc {
          font-size: 13.5px;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .sh-step-tips-box {
          margin-top: 6px;
          background: var(--bg-sidebar);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 12px 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .sh-tip-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: var(--text-muted);
        }

        .sh-tip-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--accent-green);
          flex-shrink: 0;
        }

        /* FAQ SECTION */
        .sh-faq-section {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-xl);
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .sh-faq-header {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .sh-faq-header h2 {
          font-size: 20px;
          font-weight: 700;
          color: #ffffff;
        }

        .sh-faq-header p {
          font-size: 13px;
          color: var(--text-secondary);
        }

        .sh-faq-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .sh-faq-item {
          background: var(--bg-sidebar);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          overflow: hidden;
          transition: border-color 0.15s ease;
        }

        .sh-faq-item:hover {
          border-color: var(--border-default);
        }

        .sh-faq-question {
          padding: 16px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          color: #ffffff;
          user-select: none;
        }

        .sh-faq-answer {
          padding: 0 18px 16px 18px;
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        /* CTA BANNER */
        .sh-cta-banner {
          background: linear-gradient(135deg, #18181b 0%, #121215 100%);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-xl);
          padding: 36px 32px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .sh-cta-title {
          font-size: 22px;
          font-weight: 700;
          color: #ffffff;
        }

        .sh-cta-desc {
          font-size: 13.5px;
          color: var(--text-secondary);
          max-width: 500px;
        }

        .sh-cta-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 6px;
        }

        .sh-btn-primary-cta {
          padding: 10px 20px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-inverse);
          background: #ffffff;
          border: 1px solid #ffffff;
          border-radius: var(--radius-md);
          text-decoration: none;
          transition: all 0.15s ease;
        }

        .sh-btn-primary-cta:hover {
          background: #e4e4e7;
          transform: translateY(-1px);
        }

        .sh-btn-secondary-cta {
          padding: 10px 20px;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
          background: var(--bg-muted);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          text-decoration: none;
          transition: all 0.15s ease;
        }

        .sh-btn-secondary-cta:hover {
          color: #ffffff;
          background: #27272a;
        }

        @media (max-width: 640px) {
          .sh-step-card {
            grid-template-columns: 1fr;
            gap: 14px;
            padding: 20px;
          }

          .sh-role-nav {
            flex-direction: column;
          }

          .sh-role-btn {
            width: 100%;
          }

          .sh-container {
            padding: 24px 16px 60px 16px;
          }
        }
      `}</style>

            {/* TOP NAVIGATION BAR */}
            <header className="sh-topbar">
                <div className="sh-topbar-inner">
                    <div className="sh-logo" onClick={() => router.push("/dashboard")}>
                        <div className="sh-logo-badge">S</div>
                        <span className="sh-logo-title">Skills Hive</span>
                    </div>

                    <div className="sh-nav-links">
                        <Link href="/dashboard" className="sh-nav-btn">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="7" height="7" x="3" y="3" rx="1" />
                                <rect width="7" height="7" x="14" y="3" rx="1" />
                                <rect width="7" height="7" x="14" y="14" rx="1" />
                                <rect width="7" height="7" x="3" y="14" rx="1" />
                            </svg>
                            <span>Dashboard</span>
                        </Link>

                        <Link href="/messages" className="sh-nav-btn">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                            <span>Messages</span>
                        </Link>

                        <button type="button" onClick={() => setIsOrdersOpen(true)} className="sh-nav-btn">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                                <path d="M3 6h18" />
                                <path d="M16 10a4 4 0 0 1-8 0" />
                            </svg>
                            <span>Orders</span>
                        </button>

                        <Link href="/my_listings" className="sh-nav-btn">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
                                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                                <path d="M12 11h4" />
                                <path d="M12 16h4" />
                                <path d="M8 11h.01" />
                                <path d="M8 16h.01" />
                            </svg>
                            <span>My Listings</span>
                        </Link>

                        <Link href="/guides" className="sh-nav-btn active">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                                <path d="M12 17h.01" />
                            </svg>
                            <span>Guide</span>
                        </Link>

                        {/* MY EARNINGS / WALLET PILL */}
                        <Link href="/wallet" className="sh-earnings-pill" title="View My Earnings & Wallet">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--accent-green)" }}>
                                <rect width="20" height="14" x="2" y="5" rx="2" />
                                <line x1="2" y1="10" x2="22" y2="10" />
                            </svg>
                            <span className="sh-earnings-val">Wallet</span>
                        </Link>

                        {/* Profile Dropdown */}
                        <div className="sh-profile-container">
                            <div
                                className="sh-profile-trigger"
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                            >
                                <div className="sh-avatar">{getInitials(user?.full_name)}</div>
                                <span className="sh-profile-name">{user?.full_name || "Profile"}</span>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-muted)" }}>
                                    <path d="m6 9 6 6 6-6" />
                                </svg>
                            </div>

                            {isProfileOpen && (
                                <div className="sh-dropdown">
                                    <div className="sh-dropdown-header">
                                        <div className="sh-dropdown-name">{user?.full_name || "User Profile"}</div>
                                        <div className="sh-dropdown-email">{user?.email || "user@skillshive.in"}</div>
                                    </div>

                                    <div
                                        className="sh-dropdown-item"
                                        onClick={() => {
                                            setIsProfileOpen(false);
                                            router.push("/profile");
                                        }}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                        <span>View Profile</span>
                                    </div>

                                    <div
                                        className="sh-dropdown-item"
                                        onClick={() => {
                                            setIsProfileOpen(false);
                                            router.push("/wallet");
                                        }}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect width="20" height="14" x="2" y="5" rx="2" />
                                            <line x1="2" y1="10" x2="22" y2="10" />
                                        </svg>
                                        <span>My Earnings / Wallet</span>
                                    </div>

                                    <div
                                        className="sh-dropdown-item danger"
                                        onClick={() => {
                                            setIsProfileOpen(false);
                                            setShowLogoutModal(true);
                                        }}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                            <polyline points="16 17 21 12 16 7" />
                                            <line x1="21" x2="12" y1="12" y2="12" />
                                        </svg>
                                        <span>Log Out</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* MAIN CONTAINER */}
            <main className="sh-container">
                {/* HERO SECTION */}
                <section className="sh-guide-hero">
                    <div className="sh-pill-badge">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        <span>Platform Workflow Guide</span>
                    </div>

                    <h1 className="sh-hero-title">How Skills Hive Works</h1>
                    <p className="sh-hero-subtitle">
                        A step-by-step masterclass on navigating verified collegiate freelancing, protected escrow payments, and campus leaderboards.
                    </p>
                </section>

                {/* ROLE SWITCHER TABS */}
                <div className="sh-role-nav">
                    <button
                        className={`sh-role-btn ${activeRole === "seller" ? "active" : ""}`}
                        onClick={() => setActiveRole("seller")}
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <polyline points="16 11 18 13 22 9" />
                        </svg>
                        <span>For Student Creators (Sellers)</span>
                    </button>

                    <button
                        className={`sh-role-btn ${activeRole === "buyer" ? "active" : ""}`}
                        onClick={() => setActiveRole("buyer")}
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <span>For Campus Clients (Buyers)</span>
                    </button>

                    <button
                        className={`sh-role-btn ${activeRole === "escrow" ? "active" : ""}`}
                        onClick={() => setActiveRole("escrow")}
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        <span>Escrow & Safety System</span>
                    </button>
                </div>

                {/* STEP BY STEP JOURNEY */}
                <section className="sh-steps-container">
                    {currentSteps.map((stepItem) => (
                        <div className="sh-step-card" key={stepItem.step}>
                            <div className="sh-step-number-col">
                                <div className="sh-step-badge" style={{ color: stepItem.badgeColor }}>
                                    {stepItem.step}
                                </div>
                            </div>

                            <div className="sh-step-content">
                                <div className="sh-step-header">
                                    <span className="sh-step-tag" style={{ color: stepItem.badgeColor, borderColor: stepItem.badgeColor }}>
                                        {stepItem.tag}
                                    </span>
                                    <div style={{ color: stepItem.badgeColor }}>{stepItem.icon}</div>
                                </div>

                                <h2 className="sh-step-title">{stepItem.title}</h2>
                                <p className="sh-step-desc">{stepItem.desc}</p>

                                <div className="sh-step-tips-box">
                                    {stepItem.tips.map((tip, idx) => (
                                        <div className="sh-tip-item" key={idx}>
                                            <span className="sh-tip-dot"></span>
                                            <span>{tip}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </section>

                {/* FAQ ACCORDION SECTION */}
                <section className="sh-faq-section">
                    <div className="sh-faq-header">
                        <h2>Frequently Asked Questions</h2>
                        <p>Everything you need to know about safety, verification, and payments.</p>
                    </div>

                    <div className="sh-faq-list">
                        {faqs.map((faq, idx) => (
                            <div className="sh-faq-item" key={idx}>
                                <div className="sh-faq-question" onClick={() => toggleFaq(idx)}>
                                    <span>{faq.q}</span>
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        style={{
                                            transform: expandedFaq === idx ? "rotate(180deg)" : "rotate(0deg)",
                                            transition: "transform 0.2s ease",
                                        }}
                                    >
                                        <path d="m6 9 6 6 6-6" />
                                    </svg>
                                </div>
                                {expandedFaq === idx && (
                                    <div className="sh-faq-answer">
                                        <p>{faq.a}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* CTA BANNER */}
                <section className="sh-cta-banner">
                    <h2 className="sh-cta-title">Ready to Start Your Campus Journey?</h2>
                    <p className="sh-cta-desc">
                        Join thousands of verified student developers, designers, and campus innovators monetizing their talent.
                    </p>
                    <div className="sh-cta-actions">
                        <Link href="/dashboard" className="sh-btn-primary-cta">
                            Explore Dashboard
                        </Link>
                        <Link href="/my_listings" className="sh-btn-secondary-cta">
                            Manage My Listings
                        </Link>
                    </div>
                </section>
            </main>

            {/* LOGOUT CONFIRMATION MODAL */}
            {showLogoutModal && (
                <div className="sh-modal-overlay" style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(0, 0, 0, 0.75)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 100,
                    padding: "20px"
                }}>
                    <div style={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border-default)",
                        borderRadius: "var(--radius-xl)",
                        width: "100%",
                        maxWidth: "400px",
                        padding: "24px"
                    }}>
                        <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#ffffff", marginBottom: "10px" }}>Confirm Log Out</h3>
                        <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "20px" }}>
                            Are you sure you want to log out of Skills Hive?
                        </p>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                            <button
                                style={{
                                    padding: "8px 16px",
                                    fontSize: "13px",
                                    fontWeight: 500,
                                    color: "var(--text-secondary)",
                                    background: "var(--bg-muted)",
                                    border: "1px solid var(--border-subtle)",
                                    borderRadius: "var(--radius-md)",
                                    cursor: "pointer"
                                }}
                                onClick={() => setShowLogoutModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                style={{
                                    padding: "8px 18px",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    color: "#ffffff",
                                    background: "#dc2626",
                                    border: "1px solid #dc2626",
                                    borderRadius: "var(--radius-md)",
                                    cursor: "pointer"
                                }}
                                onClick={handleLogoutConfirm}
                            >
                                Log Out
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ORDERS MODAL BOX */}
            <OrdersModal isOpen={isOrdersOpen} onClose={() => setIsOrdersOpen(false)} />
        </div>
    );
}