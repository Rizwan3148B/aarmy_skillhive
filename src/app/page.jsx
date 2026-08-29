"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const style = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap');

  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    font-family: 'JetBrains Mono', 'Space Mono', 'SF Mono', Monaco, 'Courier New', monospace !important;
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
    --accent-emerald-dark: #064e3b;
    --accent-amber: #f59e0b;
    --accent-blue: #38bdf8;
    --accent-white: #ffffff;
  }

  body {
    background-color: var(--bg-base);
    color: var(--text-primary);
    overflow-x: hidden;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }

  /* UTILITIES & BASE */
  .container {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 24px;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border: 1px solid var(--border-subtle);
    background: var(--bg-surface);
    color: var(--text-secondary);
  }

  .badge.verified {
    border-color: rgba(16, 185, 129, 0.4);
    background: rgba(16, 185, 129, 0.1);
    color: var(--accent-green);
  }

  .badge.tier-1 {
    border-color: rgba(56, 189, 248, 0.4);
    background: rgba(56, 189, 248, 0.1);
    color: var(--accent-blue);
  }

  /* BUTTONS */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.15s ease-in-out;
    text-decoration: none;
    outline: none;
    border: 1px solid transparent;
    user-select: none;
  }

  .btn-primary {
    background: #ffffff;
    color: #000000;
    border-color: #ffffff;
  }

  .btn-primary:hover {
    background: #e4e4e7;
    border-color: #e4e4e7;
    transform: translateY(-1px);
  }

  .btn-secondary {
    background: var(--bg-card);
    color: var(--text-primary);
    border: 1px solid var(--border-medium);
  }

  .btn-secondary:hover {
    background: var(--bg-elevated);
    border-color: var(--text-secondary);
    color: #ffffff;
  }

  .btn-outline {
    background: transparent;
    color: var(--text-secondary);
    border: 1px solid var(--border-subtle);
  }

  .btn-outline:hover {
    background: var(--bg-surface);
    color: var(--text-primary);
    border-color: var(--border-medium);
  }

  .btn-success {
    background: var(--accent-green);
    color: #000000;
    border-color: var(--accent-green);
    font-weight: 700;
  }

  .btn-success:hover {
    background: #059669;
    border-color: #059669;
  }

  /* NAVBAR */
  .navbar {
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(9, 9, 11, 0.95);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border-subtle);
  }

  .navbar-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 72px;
  }

  .brand-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    color: var(--text-primary);
    font-weight: 700;
    font-size: 16px;
    letter-spacing: -0.02em;
    cursor: pointer;
  }

  .logo-box {
    width: 32px;
    height: 32px;
    background: #ffffff;
    color: #000000;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    font-weight: 800;
    font-size: 15px;
  }

  .nav-links {
    display: flex;
    align-items: center;
    gap: 32px;
    list-style: none;
  }

  .nav-link {
    color: var(--text-secondary);
    text-decoration: none;
    font-size: 13px;
    font-weight: 500;
    transition: color 0.15s ease;
    cursor: pointer;
  }

  .nav-link:hover {
    color: #ffffff;
  }

  .nav-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  /* HERO SECTION */
  .hero-section {
    padding: 80px 0 60px 0;
    position: relative;
    border-bottom: 1px solid var(--border-subtle);
  }

  .hero-grid {
    display: grid;
    grid-template-columns: 1.15fr 0.85fr;
    gap: 48px;
    align-items: center;
  }

  .hero-tag {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: 4px;
    margin-bottom: 24px;
    font-size: 12px;
    color: var(--text-secondary);
  }

  .hero-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--accent-green);
    box-shadow: 0 0 8px var(--accent-green);
  }

  .hero-title {
    font-size: 46px;
    line-height: 1.15;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 20px;
    letter-spacing: -0.03em;
  }

  .hero-desc {
    font-size: 15px;
    line-height: 1.7;
    color: var(--text-secondary);
    margin-bottom: 32px;
    max-width: 580px;
  }

  /* SEARCH BAR (FIVERR VIBE) */
  .search-wrapper {
    background: var(--bg-surface);
    border: 1px solid var(--border-medium);
    border-radius: 6px;
    padding: 6px;
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 20px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  }

  .search-input {
    flex: 1;
    background: transparent;
    border: none;
    color: #ffffff;
    font-size: 13px;
    padding: 10px 14px;
    outline: none;
  }

  .search-input::placeholder {
    color: var(--text-muted);
  }

  .search-tags {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 32px;
  }

  .search-tag-label {
    font-size: 12px;
    color: var(--text-muted);
  }

  .search-tag-btn {
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    color: var(--text-secondary);
    padding: 4px 10px;
    border-radius: 3px;
    font-size: 11px;
    cursor: pointer;
    transition: all 0.15s;
  }

  .search-tag-btn:hover {
    border-color: var(--border-strong);
    color: #ffffff;
    background: var(--bg-card);
  }

  .hero-actions {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  /* HERO RIGHT: CANVAS & INTERACTIVE TERMINAL */
  .canvas-wrapper {
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    overflow: hidden;
    position: relative;
    box-shadow: 0 8px 30px rgba(0,0,0,0.5);
  }

  .terminal-header {
    background: var(--bg-card);
    border-bottom: 1px solid var(--border-subtle);
    padding: 10px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 11px;
    color: var(--text-muted);
  }

  .terminal-dots {
    display: flex;
    gap: 6px;
  }

  .terminal-dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--border-strong);
  }

  .terminal-dot:nth-child(1) { background: #ef4444; }
  .terminal-dot:nth-child(2) { background: #eab308; }
  .terminal-dot:nth-child(3) { background: #22c55e; }

  .hero-canvas {
    display: block;
    width: 100%;
    height: 380px;
    background: #09090b;
  }

  .canvas-footer-metrics {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    border-top: 1px solid var(--border-subtle);
    background: var(--bg-surface);
  }

  .metric-box {
    padding: 14px 16px;
    border-right: 1px solid var(--border-subtle);
  }

  .metric-box:last-child {
    border-right: none;
  }

  .metric-val {
    font-size: 16px;
    font-weight: 700;
    color: #ffffff;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .metric-lbl {
    font-size: 10px;
    color: var(--text-muted);
    text-transform: uppercase;
    margin-top: 2px;
  }

  /* INSTITUTION MARQUEE */
  .marquee-section {
    padding: 28px 0;
    background: var(--bg-surface);
    border-bottom: 1px solid var(--border-subtle);
    overflow: hidden;
  }

  .marquee-inner {
    display: flex;
    align-items: center;
    gap: 40px;
    width: max-content;
    animation: scrollMarquee 30s linear infinite;
  }

  @keyframes scrollMarquee {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }

  .marquee-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-muted);
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .marquee-item span {
    color: var(--text-secondary);
  }

  .marquee-separator {
    color: var(--border-strong);
  }

  /* SECTION COMMON */
  .section-header {
    margin-bottom: 40px;
  }

  .section-subtitle {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--accent-green);
    margin-bottom: 8px;
    font-weight: 700;
  }

  .section-title {
    font-size: 28px;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: -0.02em;
  }

  .section-desc {
    font-size: 13px;
    color: var(--text-secondary);
    margin-top: 8px;
    max-width: 600px;
  }

  /* CATEGORIES (FIVERR VIBE) */
  .categories-section {
    padding: 72px 0;
    border-bottom: 1px solid var(--border-subtle);
  }

  .cat-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }

  .cat-card {
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: 6px;
    padding: 20px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-decoration: none;
    color: inherit;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 150px;
  }

  .cat-card:hover {
    background: var(--bg-card);
    border-color: var(--border-strong);
    transform: translateY(-2px);
  }

  .cat-icon {
    width: 36px;
    height: 36px;
    background: var(--bg-base);
    border: 1px solid var(--border-subtle);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    color: #ffffff;
    margin-bottom: 14px;
  }

  .cat-name {
    font-size: 14px;
    font-weight: 600;
    color: #ffffff;
    margin-bottom: 4px;
  }

  .cat-count {
    font-size: 11px;
    color: var(--text-muted);
  }

  /* TALENT CARDS (FIVERR GIGS FROM TOP INSTITUTIONS) */
  .talent-section {
    padding: 72px 0;
    border-bottom: 1px solid var(--border-subtle);
    background: #0b0b0e;
  }

  .talent-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }

  .talent-card {
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: 6px;
    overflow: hidden;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
  }

  .talent-card:hover {
    border-color: var(--border-strong);
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
  }

  .talent-card-header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-subtle);
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .talent-avatar {
    width: 42px;
    height: 42px;
    border-radius: 4px;
    background: var(--bg-card);
    border: 1px solid var(--border-medium);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 14px;
    color: #ffffff;
  }

  .talent-meta {
    flex: 1;
  }

  .talent-name-row {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 2px;
  }

  .talent-name {
    font-size: 14px;
    font-weight: 600;
    color: #ffffff;
  }

  .talent-college {
    font-size: 11px;
    color: var(--accent-blue);
    font-weight: 500;
  }

  .talent-card-body {
    padding: 20px;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .gig-title {
    font-size: 14px;
    line-height: 1.5;
    font-weight: 600;
    color: #ffffff;
    margin-bottom: 12px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .talent-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 16px;
  }

  .skill-pill {
    font-size: 10px;
    padding: 3px 8px;
    background: var(--bg-card);
    border: 1px solid var(--border-subtle);
    border-radius: 3px;
    color: var(--text-secondary);
  }

  .talent-stats {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 14px;
    border-top: 1px solid var(--border-subtle);
    margin-top: auto;
  }

  .rating-box {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 600;
    color: #ffffff;
  }

  .star-icon {
    color: var(--accent-amber);
  }

  .reviews-count {
    color: var(--text-muted);
    font-weight: 400;
  }

  .price-box {
    text-align: right;
  }

  .price-label {
    font-size: 10px;
    color: var(--text-muted);
    text-transform: uppercase;
  }

  .price-val {
    font-size: 15px;
    font-weight: 700;
    color: #ffffff;
  }

  .talent-card-footer {
    padding: 12px 20px;
    background: var(--bg-card);
    border-top: 1px solid var(--border-subtle);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  /* WHY SKILLS HIVE (PRO ARCHITECTURE) */
  .why-section {
    padding: 80px 0;
    border-bottom: 1px solid var(--border-subtle);
  }

  .features-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }

  .feature-box {
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: 6px;
    padding: 24px;
  }

  .feature-num {
    font-size: 12px;
    font-weight: 700;
    color: var(--accent-green);
    margin-bottom: 16px;
    display: inline-block;
  }

  .feature-title {
    font-size: 16px;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 10px;
  }

  .feature-desc {
    font-size: 13px;
    color: var(--text-secondary);
    line-height: 1.6;
  }

  /* CTA BANNER */
  .cta-section {
    padding: 80px 0;
    background: var(--bg-surface);
    border-bottom: 1px solid var(--border-subtle);
  }

  .cta-box {
    border: 1px solid var(--border-medium);
    border-radius: 8px;
    padding: 48px;
    background: #09090b;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 32px;
  }

  .cta-title {
    font-size: 30px;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 10px;
    letter-spacing: -0.02em;
  }

  .cta-desc {
    font-size: 14px;
    color: var(--text-secondary);
    max-width: 540px;
  }

  .cta-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
  }

  /* FOOTER */
  .footer {
    padding: 60px 0 30px 0;
    background: #060608;
  }

  .footer-grid {
    display: grid;
    grid-template-columns: 2fr repeat(3, 1fr);
    gap: 40px;
    margin-bottom: 48px;
  }

  .footer-brand p {
    font-size: 13px;
    color: var(--text-muted);
    margin-top: 14px;
    line-height: 1.6;
    max-width: 320px;
  }

  .footer-col-title {
    font-size: 12px;
    font-weight: 700;
    color: #ffffff;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 16px;
  }

  .footer-col-links {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .footer-link {
    font-size: 12px;
    color: var(--text-muted);
    text-decoration: none;
    transition: color 0.15s;
    cursor: pointer;
  }

  .footer-link:hover {
    color: var(--text-primary);
  }

  .footer-bottom {
    padding-top: 24px;
    border-top: 1px solid var(--border-subtle);
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
    color: var(--text-muted);
  }

  .system-status {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  /* RESPONSIVE */
  @media (max-width: 1024px) {
    .hero-grid {
      grid-template-columns: 1fr;
    }
    .talent-grid, .features-grid, .cat-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    .footer-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 640px) {
    .talent-grid, .features-grid, .cat-grid {
      grid-template-columns: 1fr;
    }
    .cta-box {
      flex-direction: column;
      align-items: flex-start;
      padding: 24px;
    }
    .nav-links {
      display: none;
    }
    .hero-title {
      font-size: 32px;
    }
    .footer-grid {
      grid-template-columns: 1fr;
    }
    .footer-bottom {
      flex-direction: column;
      gap: 12px;
      align-items: flex-start;
    }
  }
`;

export default function Home() {
  const router = useRouter();
  const canvasRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = [
    { name: "Full-Stack Dev", icon: "</>", count: "340+ Engineers" },
    { name: "AI & LLM Agents", icon: "λ", count: "210+ Researchers" },
    { name: "UI/UX & Systems", icon: "◫", count: "180+ Designers" },
    { name: "Quant & Algorithms", icon: "∑", count: "95+ Analysts" },
    { name: "Cloud & DevOps", icon: "☁", count: "160+ Architects" },
    { name: "Cybersecurity", icon: "⚿", count: "80+ Specialists" },
    { name: "Web3 & Smart Contracts", icon: "◈", count: "115+ Developers" },
    { name: "Data Engineering", icon: "⌗", count: "190+ Specialists" },
  ];

  const featuredTalents = [
    {
      id: 1,
      name: "Aarav Sharma",
      initials: "AS",
      college: "IIT Bombay '24 (CSE)",
      title: "I will build autonomous AI agent workflows and production RAG pipelines",
      rating: "5.0",
      reviews: "38",
      price: "₹3,500/hr",
      category: "AI & LLM Agents",
      skills: ["PyTorch", "LangChain", "FastAPI", "Next.js"],
      tier: "Top 0.5%",
    },
    {
      id: 2,
      name: "Ananya Iyer",
      initials: "AI",
      college: "BITS Pilani '25 (CS)",
      title: "I will architect ultra-fast full-stack web applications with Next.js 15 and PostgreSQL",
      rating: "4.9",
      reviews: "64",
      price: "₹2,800/hr",
      category: "Full-Stack Dev",
      skills: ["React", "TypeScript", "Node.js", "Docker"],
      tier: "Top 1%",
    },
    {
      id: 3,
      name: "Rohan Verma",
      initials: "RV",
      college: "IIT Delhi '24 (EE)",
      title: "I will design pixel-perfect minimalist SaaS design systems and Figma prototypes",
      rating: "5.0",
      reviews: "49",
      price: "₹3,200/hr",
      category: "UI/UX & Systems",
      skills: ["Figma", "Design Systems", "Tailwind", "Motion"],
      tier: "Top 1%",
    },
    {
      id: 4,
      name: "Tanvi Gupta",
      initials: "TG",
      college: "IIT Madras '25 (Data Science)",
      title: "I will optimize high-frequency data pipelines, ETL clusters, and BigQuery analytics",
      rating: "5.0",
      reviews: "27",
      price: "₹3,000/hr",
      category: "Data Engineering",
      skills: ["Spark", "Python", "GCP", "PostgreSQL"],
      tier: "Top 0.5%",
    },
    {
      id: 5,
      name: "Devendra K.",
      initials: "DK",
      college: "IIT Roorkee '24 (CSE)",
      title: "I will audit Solidity smart contracts and build hardened EVM protocol backends",
      rating: "4.9",
      reviews: "41",
      price: "₹4,200/hr",
      category: "Web3 & Smart Contracts",
      skills: ["Solidity", "Rust", "Foundry", "EVM"],
      tier: "Top 1%",
    },
    {
      id: 6,
      name: "Meera Nair",
      initials: "MN",
      college: "IIM Ahmedabad / IIT-K",
      title: "I will develop quantitative financial backtesting models and algorithmic risk engines",
      rating: "5.0",
      reviews: "33",
      price: "₹4,500/hr",
      category: "Quant & Algorithms",
      skills: ["Python", "C++", "NumPy", "Time-Series"],
      tier: "Top 0.5%",
    },
  ];

  const filteredTalents = selectedCategory === "All" 
    ? featuredTalents 
    : featuredTalents.filter(t => t.category === selectedCategory);

  // High-Tech Interactive Canvas Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = canvas.parentElement.clientWidth || 500;
      canvas.height = 380;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Node graph simulation representing institutional talent network
    const nodes = [
      { x: 80, y: 70, label: "IIT BOMBAY", count: "340 PROS", pulse: 0 },
      { x: 260, y: 60, label: "IIT DELHI", count: "290 PROS", pulse: 1.5 },
      { x: 380, y: 120, label: "BITS PILANI", count: "215 PROS", pulse: 3.0 },
      { x: 120, y: 220, label: "IIT MADRAS", count: "185 PROS", pulse: 4.2 },
      { x: 280, y: 200, label: "IIIT HYDERABAD", count: "170 PROS", pulse: 2.1 },
      { x: 390, y: 280, label: "IIT ROORKEE", count: "140 PROS", pulse: 0.8 },
      { x: 160, y: 320, label: "IIM AHMEDABAD", count: "95 PROS", pulse: 3.7 },
    ];

    const connections = [
      [0, 1], [1, 2], [0, 3], [1, 4], [2, 4], [3, 4], [4, 5], [3, 6], [4, 6], [5, 6]
    ];

    let time = 0;

    const render = () => {
      time += 0.02;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background grid
      ctx.strokeStyle = "rgba(39, 39, 42, 0.4)";
      ctx.lineWidth = 1;
      const gridSize = 32;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw connection lines
      connections.forEach(([i, j]) => {
        const n1 = nodes[i];
        const n2 = nodes[j];
        if (!n1 || !n2) return;

        ctx.beginPath();
        ctx.strokeStyle = "rgba(82, 82, 91, 0.45)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.moveTo(n1.x, n1.y);
        ctx.lineTo(n2.x, n2.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Animated signal packet moving along wire
        const progress = (Math.sin(time * 1.5 + i + j) + 1) / 2;
        const px = n1.x + (n2.x - n1.x) * progress;
        const py = n1.y + (n2.y - n1.y) * progress;

        ctx.fillStyle = "#10b981";
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw nodes
      nodes.forEach((node) => {
        const pulseFactor = Math.sin(time * 2 + node.pulse) * 4;

        // Outer pulse circle
        ctx.strokeStyle = "rgba(16, 185, 129, 0.25)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 14 + pulseFactor, 0, Math.PI * 2);
        ctx.stroke();

        // Node circle
        ctx.fillStyle = "#18181b";
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Center dot
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(node.x, node.y, 2, 0, Math.PI * 2);
        ctx.fill();

        // Node Label
        ctx.fillStyle = "#f4f4f5";
        ctx.font = "10px 'JetBrains Mono', monospace";
        ctx.fillText(node.label, node.x + 12, node.y - 2);

        ctx.fillStyle = "#10b981";
        ctx.font = "9px 'JetBrains Mono', monospace";
        ctx.fillText(node.count, node.x + 12, node.y + 10);
      });

      // Radar scanning line
      const scanY = ((Math.sin(time * 0.8) + 1) / 2) * canvas.height;
      ctx.strokeStyle = "rgba(16, 185, 129, 0.15)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, scanY);
      ctx.lineTo(canvas.width, scanY);
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const navigateToAuth = () => {
    router.push("/auth");
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    router.push("/auth");
  };

  return (
    <>
      <style>{style}</style>

      {/* NAVBAR */}
      <nav className="navbar">
        <div className="container">
          <div className="navbar-inner">
            <div className="brand-logo" onClick={() => router.push("/")}>
              <div className="logo-box">S</div>
              <span>Skills Hive</span>
            </div>

            <ul className="nav-links">
              <li>
                <a href="#home" className="nav-link">Home</a>
              </li>
              <li>
                <a href="#about" className="nav-link">About</a>
              </li>
              <li>
                <a href="#guide" className="nav-link">Guide</a>
              </li>
              <li>
                <a href="#categories" className="nav-link">Categories</a>
              </li>
            </ul>

            <div className="nav-actions">
              <button 
                id="nav-login-btn"
                className="btn btn-outline" 
                onClick={navigateToAuth}
              >
                Login
              </button>
              <button 
                id="nav-signup-btn"
                className="btn btn-primary" 
                onClick={navigateToAuth}
              >
                Signup
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section id="home" className="hero-section">
        <div className="container">
          <div className="hero-grid">
            <div className="hero-content">
              <div className="hero-tag">
                <span className="hero-dot"></span>
                <span>INDIA'S PREMIER TALENT EXCHANGE</span>
              </div>

              <h1 className="hero-title">
                Hire Talents From Top Institutions in India
              </h1>

              <p className="hero-desc">
                Directly hire pre-vetted engineers, researchers, designers, and quantitative minds from IIT Bombay, IIT Delhi, BITS Pilani, and IIMs. Escrow protected. Zero recruiter bloat.
              </p>

              {/* FIVERR STYLE SEARCH BAR */}
              <form onSubmit={handleSearchSubmit} className="search-wrapper">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Try 'AI Agents', 'Next.js 15', 'Solidity Audit', 'Quant'..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" className="btn btn-primary" style={{ padding: "8px 16px" }}>
                  Search
                </button>
              </form>

              {/* POPULAR SEARCH TAGS */}
              <div className="search-tags">
                <span className="search-tag-label">Popular:</span>
                {["Next.js", "PyTorch", "Figma", "Rust", "PostgreSQL", "Quant"].map((tag) => (
                  <button
                    key={tag}
                    className="search-tag-btn"
                    onClick={() => {
                      setSearchQuery(tag);
                      navigateToAuth();
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              <div className="hero-actions">
                <button 
                  id="hero-hire-talent-btn"
                  className="btn btn-primary" 
                  style={{ padding: "12px 28px", fontSize: "14px" }}
                  onClick={navigateToAuth}
                >
                  Hire A Talent →
                </button>
                <button 
                  className="btn btn-secondary"
                  style={{ padding: "12px 24px", fontSize: "14px" }}
                  onClick={navigateToAuth}
                >
                  Post A Project
                </button>
              </div>
            </div>

            {/* HERO RIGHT: INTERACTIVE CANVAS VISUAL */}
            <div className="canvas-wrapper">
              <div className="terminal-header">
                <div className="terminal-dots">
                  <div className="terminal-dot"></div>
                  <div className="terminal-dot"></div>
                  <div className="terminal-dot"></div>
                </div>
                <span>NODE_RADAR :: INSTITUTION_GRID_V2</span>
                <span style={{ color: "#10b981" }}>LIVE</span>
              </div>

              <canvas ref={canvasRef} className="hero-canvas" />

              <div className="canvas-footer-metrics">
                <div className="metric-box">
                  <div className="metric-val">1,420+</div>
                  <div className="metric-lbl">Vetted Talents</div>
                </div>
                <div className="metric-box">
                  <div className="metric-val">99.4%</div>
                  <div className="metric-lbl">Success Rate</div>
                </div>
                <div className="metric-box">
                  <div className="metric-val">&lt; 12m</div>
                  <div className="metric-lbl">Avg Response</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INSTITUTION TICKER / MARQUEE */}
      <div className="marquee-section">
        <div className="marquee-inner">
          <div className="marquee-item"><span>IIT BOMBAY</span></div>
          <div className="marquee-separator">/</div>
          <div className="marquee-item"><span>IIT DELHI</span></div>
          <div className="marquee-separator">/</div>
          <div className="marquee-item"><span>BITS PILANI</span></div>
          <div className="marquee-separator">/</div>
          <div className="marquee-item"><span>IIT MADRAS</span></div>
          <div className="marquee-separator">/</div>
          <div className="marquee-item"><span>IIIT HYDERABAD</span></div>
          <div className="marquee-separator">/</div>
          <div className="marquee-item"><span>IIM AHMEDABAD</span></div>
          <div className="marquee-separator">/</div>
          <div className="marquee-item"><span>IIT KANPUR</span></div>
          <div className="marquee-separator">/</div>
          <div className="marquee-item"><span>IIT ROORKEE</span></div>
          <div className="marquee-separator">/</div>
          <div className="marquee-item"><span>IIT KHARAGPUR</span></div>
          <div className="marquee-separator">/</div>
          {/* Repeat for seamless loop */}
          <div className="marquee-item"><span>IIT BOMBAY</span></div>
          <div className="marquee-separator">/</div>
          <div className="marquee-item"><span>IIT DELHI</span></div>
          <div className="marquee-separator">/</div>
          <div className="marquee-item"><span>BITS PILANI</span></div>
          <div className="marquee-separator">/</div>
          <div className="marquee-item"><span>IIT MADRAS</span></div>
          <div className="marquee-separator">/</div>
          <div className="marquee-item"><span>IIIT HYDERABAD</span></div>
          <div className="marquee-separator">/</div>
          <div className="marquee-item"><span>IIM AHMEDABAD</span></div>
          <div className="marquee-separator">/</div>
          <div className="marquee-item"><span>IIT KANPUR</span></div>
          <div className="marquee-separator">/</div>
          <div className="marquee-item"><span>IIT ROORKEE</span></div>
        </div>
      </div>

      {/* CATEGORIES SECTION */}
      <section id="categories" className="categories-section">
        <div className="container">
          <div className="section-header">
            <div className="section-subtitle">[ EXPLORE DOMAINS ]</div>
            <h2 className="section-title">Specialized Engineering & Research Guilds</h2>
            <p className="section-desc">
              Browse top tier collegiate talent across foundational engineering, generative AI, systems design, and quantitative computation.
            </p>
          </div>

          <div className="cat-grid">
            {categories.map((cat, idx) => (
              <div 
                key={idx} 
                className="cat-card"
                onClick={() => {
                  setSelectedCategory(selectedCategory === cat.name ? "All" : cat.name);
                }}
              >
                <div>
                  <div className="cat-icon">{cat.icon}</div>
                  <div className="cat-name">{cat.name}</div>
                </div>
                <div className="cat-count">{cat.count} →</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED TALENTS / GIGS (FIVERR VIBE) */}
      <section className="talent-section">
        <div className="container">
          <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <div className="section-subtitle">[ VERIFIED GIGS & TALENTS ]</div>
              <h2 className="section-title">Top Rated Institutional Freelancers</h2>
              <p className="section-desc">
                Contract elite developers directly with verifiable proof of work and institutional authenticity.
              </p>
            </div>
            <div>
              <button className="btn btn-outline" onClick={navigateToAuth}>
                View All 1,400+ Gigs →
              </button>
            </div>
          </div>

          <div className="talent-grid">
            {filteredTalents.map((talent) => (
              <div key={talent.id} className="talent-card">
                <div className="talent-card-header">
                  <div className="talent-avatar">{talent.initials}</div>
                  <div className="talent-meta">
                    <div className="talent-name-row">
                      <span className="talent-name">{talent.name}</span>
                      <span className="badge verified">VERIFIED</span>
                    </div>
                    <div className="talent-college">{talent.college}</div>
                  </div>
                </div>

                <div className="talent-card-body">
                  <div className="gig-title">{talent.title}</div>
                  
                  <div className="talent-tags">
                    {talent.skills.map((skill, sIdx) => (
                      <span key={sIdx} className="skill-pill">
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="talent-stats">
                    <div className="rating-box">
                      <span className="star-icon">★</span>
                      <span>{talent.rating}</span>
                      <span className="reviews-count">({talent.reviews})</span>
                    </div>
                    <div className="price-box">
                      <div className="price-label">Starting at</div>
                      <div className="price-val">{talent.price}</div>
                    </div>
                  </div>
                </div>

                <div className="talent-card-footer">
                  <span className="badge tier-1">{talent.tier}</span>
                  <button className="btn btn-primary" style={{ padding: "6px 14px", fontSize: "11px" }} onClick={navigateToAuth}>
                    Hire Talent
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT & WHY SECTION */}
      <section id="about" className="why-section">
        <div className="container">
          <div className="section-header">
            <div className="section-subtitle">[ ARCHITECTURE & PROTOCOL ]</div>
            <h2 className="section-title">Why Global Tech Companies Choose Skills Hive</h2>
            <p className="section-desc">
              Engineered for precision, speed, and elite meritocracy without intermediary recruiting fees.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-box">
              <span className="feature-num">01 // VERIFICATION</span>
              <h3 className="feature-title">Top 1% Institutional Pedigree</h3>
              <p className="feature-desc">
                Every freelancer undergoes academic identity verification (IIT/BITS/IIM .ac.in credentials) and a rigorous 3-stage coding assessment.
              </p>
            </div>

            <div className="feature-box">
              <span className="feature-num">02 // ESCROW ESCORT</span>
              <h3 className="feature-title">Milestone Escrow Guarantee</h3>
              <p className="feature-desc">
                Funds are held in secure escrow. Payments are released strictly upon code review, branch merge, or verifiable milestone signoff.
              </p>
            </div>

            <div className="feature-box">
              <span className="feature-num">03 // IMMEDIATE DEPLOYMENT</span>
              <h3 className="feature-title">Zero Friction Onboarding</h3>
              <p className="feature-desc">
                Direct NDAs, intellectual property assignment, and automated contract workflows ready in seconds. Start building on day one.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* GUIDE SECTION */}
      <section id="guide" className="why-section" style={{ background: "#060608" }}>
        <div className="container">
          <div className="section-header">
            <div className="section-subtitle">[ WORKFLOW GUIDE ]</div>
            <h2 className="section-title">How To Hire In 3 Systematic Steps</h2>
            <p className="section-desc">
              Streamlined procurement process designed for tech leads, founders, and research labs.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-box">
              <span className="feature-num">STEP 01</span>
              <h3 className="feature-title">Specify Requirements</h3>
              <p className="feature-desc">
                Search verified gigs or post your exact tech stack, deliverables, and timeline in under 2 minutes.
              </p>
            </div>

            <div className="feature-box">
              <span className="feature-num">STEP 02</span>
              <h3 className="feature-title">Review Proof of Work</h3>
              <p className="feature-desc">
                Inspect GitHub repositories, competitive programming ranks, and collegiate research papers directly on candidate profiles.
              </p>
            </div>

            <div className="feature-box">
              <span className="feature-num">STEP 03</span>
              <h3 className="feature-title">Collaborate & Deliver</h3>
              <p className="feature-desc">
                Utilize integrated workspace milestones, automated invoices, and guaranteed dispute resolution mechanisms.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-box">
            <div>
              <div className="badge verified" style={{ marginBottom: "12px" }}>READY FOR SCALE</div>
              <h2 className="cta-title">Hire Elite Indian Collegiate Talent Today</h2>
              <p className="cta-desc">
                Join forward-thinking startups and global enterprises building high-performance engineering teams with Skills Hive.
              </p>
            </div>
            <div className="cta-actions">
              <button className="btn btn-primary" style={{ padding: "12px 28px" }} onClick={navigateToAuth}>
                Hire A Talent →
              </button>
              <button className="btn btn-secondary" style={{ padding: "12px 24px" }} onClick={navigateToAuth}>
                Sign Up as Freelancer
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="brand-logo" onClick={() => router.push("/")}>
                <div className="logo-box">S</div>
                <span>Skills Hive</span>
              </div>
              <p>
                The decentralized marketplace connecting ambitious organizations with pre-screened technical and research talent from premier Indian universities.
              </p>
            </div>

            <div>
              <div className="footer-col-title">Categories</div>
              <ul className="footer-col-links">
                <li><a className="footer-link" onClick={navigateToAuth}>Full-Stack Web</a></li>
                <li><a className="footer-link" onClick={navigateToAuth}>AI & Machine Learning</a></li>
                <li><a className="footer-link" onClick={navigateToAuth}>UI/UX Systems</a></li>
                <li><a className="footer-link" onClick={navigateToAuth}>Smart Contracts</a></li>
                <li><a className="footer-link" onClick={navigateToAuth}>Quant Analysis</a></li>
              </ul>
            </div>

            <div>
              <div className="footer-col-title">Institutions</div>
              <ul className="footer-col-links">
                <li><a className="footer-link" onClick={navigateToAuth}>IIT Bombay Guild</a></li>
                <li><a className="footer-link" onClick={navigateToAuth}>IIT Delhi Guild</a></li>
                <li><a className="footer-link" onClick={navigateToAuth}>BITS Pilani Guild</a></li>
                <li><a className="footer-link" onClick={navigateToAuth}>IIT Madras Guild</a></li>
                <li><a className="footer-link" onClick={navigateToAuth}>IIIT Hyderabad Guild</a></li>
              </ul>
            </div>

            <div>
              <div className="footer-col-title">Platform</div>
              <ul className="footer-col-links">
                <li><a className="footer-link" onClick={navigateToAuth}>Escrow Security</a></li>
                <li><a className="footer-link" onClick={navigateToAuth}>Identity Verification</a></li>
                <li><a className="footer-link" onClick={navigateToAuth}>Enterprise SLA</a></li>
                <li><a className="footer-link" onClick={navigateToAuth}>Terms of Service</a></li>
                <li><a className="footer-link" onClick={navigateToAuth}>Privacy Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <div>
              © 2026 Skills Hive, Inc. All rights reserved. Monospace Architecture.
            </div>
            <div className="system-status">
              <span className="hero-dot"></span>
              <span>SYSTEM OPERATIONAL [ALL NODES LIVE]</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}