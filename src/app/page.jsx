"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const style = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
  }

  :root {
    --bg-base: #06090e;
    --bg-space: #070c14;
    --bg-surface: #0e1626;
    --bg-card: #131c2e;
    --bg-card-hover: #18233a;
    --bg-input: #121c2b;
    --border-subtle: rgba(255, 255, 255, 0.08);
    --border-medium: rgba(255, 255, 255, 0.14);
    --border-bright: rgba(0, 245, 160, 0.3);
    --text-primary: #f8fafc;
    --text-secondary: #94a3b8;
    --text-muted: #64748b;
    --accent-emerald: #10b981;
    --accent-mint: #00f5a0;
    --accent-teal: #14b8a6;
    --accent-amber: #f59e0b;
    --accent-gold: #fbbf24;
    --accent-blue: #38bdf8;
    --accent-purple: #a855f7;
    --accent-rose: #f43f5e;
  }

  body {
    background-color: var(--bg-base);
    background-image: 
      radial-gradient(1px 1px at 20px 30px, rgba(255,255,255,0.25), rgba(0,0,0,0)),
      radial-gradient(1.5px 1.5px at 140px 90px, rgba(255,255,255,0.35), rgba(0,0,0,0)),
      radial-gradient(1px 1px at 280px 210px, rgba(255,255,255,0.2), rgba(0,0,0,0)),
      radial-gradient(1.5px 1.5px at 450px 120px, rgba(0, 245, 160, 0.35), rgba(0,0,0,0)),
      radial-gradient(1px 1px at 680px 310px, rgba(255,255,255,0.25), rgba(0,0,0,0)),
      radial-gradient(2px 2px at 900px 180px, rgba(56, 189, 248, 0.3), rgba(0,0,0,0)),
      radial-gradient(1px 1px at 1120px 80px, rgba(255,255,255,0.2), rgba(0,0,0,0)),
      radial-gradient(1.5px 1.5px at 1280px 350px, rgba(168, 85, 247, 0.3), rgba(0,0,0,0));
    background-repeat: repeat;
    background-size: 1400px 700px;
    color: var(--text-primary);
    overflow-x: hidden;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }

  .container {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 24px;
  }

  /* NAVBAR */
  .navbar {
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(6, 9, 14, 0.85);
    backdrop-filter: blur(16px);
    border-bottom: 1px solid var(--border-subtle);
  }

  .navbar-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 76px;
  }

  .brand-logo {
    display: flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
    cursor: pointer;
    user-select: none;
  }

  .logo-icon-hexagon {
    width: 38px;
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba(0, 245, 160, 0.2), rgba(16, 185, 129, 0.05));
    border: 1.5px solid var(--accent-mint);
    border-radius: 10px;
    box-shadow: 0 0 16px rgba(0, 245, 160, 0.25);
    color: var(--accent-mint);
    font-size: 20px;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .brand-logo:hover .logo-icon-hexagon {
    transform: rotate(10deg) scale(1.05);
    box-shadow: 0 0 24px rgba(0, 245, 160, 0.45);
  }

  .brand-title {
    font-size: 19px;
    font-weight: 800;
    letter-spacing: 0.04em;
    color: #ffffff;
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
    font-size: 14px;
    font-weight: 500;
    transition: color 0.15s ease;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .nav-link:hover, .nav-link.active {
    color: #ffffff;
  }

  .nav-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  /* BUTTONS */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
    padding: 10px 18px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-decoration: none;
    outline: none;
    border: 1px solid transparent;
    user-select: none;
  }

  .btn-gig {
    background: #0f766e;
    background: linear-gradient(135deg, #14b8a6, #0d9488);
    color: #ffffff;
    border-radius: 8px;
    font-weight: 600;
    box-shadow: 0 4px 14px rgba(20, 184, 166, 0.25);
  }

  .btn-gig:hover {
    background: linear-gradient(135deg, #2dd4bf, #14b8a6);
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(20, 184, 166, 0.35);
  }

  .btn-login {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--border-medium);
    color: #ffffff;
    border-radius: 8px;
  }

  .btn-login:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.25);
    transform: translateY(-1px);
  }

  .btn-signup {
    background: #10b981;
    background: linear-gradient(135deg, #00f5a0, #10b981);
    color: #042417;
    font-weight: 700;
    border-radius: 8px;
    box-shadow: 0 4px 14px rgba(0, 245, 160, 0.25);
  }

  .btn-signup:hover {
    background: linear-gradient(135deg, #4ef8b8, #10b981);
    transform: translateY(-1px);
    box-shadow: 0 6px 22px rgba(0, 245, 160, 0.45);
  }

  /* HERO BANNER SECTION */
  .hero-section {
    padding: 32px 0 40px 0;
  }

  .hero-banner-card {
    position: relative;
    width: 100%;
    min-height: 480px;
    border-radius: 24px;
    overflow: hidden;
    border: 1px solid var(--border-subtle);
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background-color: #0d1424;
  }

  .hero-bg-img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    filter: brightness(0.72) contrast(1.1);
    z-index: 1;
  }

  .hero-overlay-gradient {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      180deg,
      rgba(6, 9, 14, 0.4) 0%,
      rgba(7, 12, 20, 0.65) 50%,
      rgba(6, 9, 14, 0.95) 100%
    );
    z-index: 2;
  }

  .hero-center-content {
    position: relative;
    z-index: 3;
    text-align: center;
    padding: 90px 24px 40px 24px;
    max-width: 960px;
    margin: 0 auto;
  }

  .hero-quote-title {
    font-size: 38px;
    line-height: 1.25;
    font-weight: 800;
    color: #ffffff;
    text-transform: uppercase;
    letter-spacing: -0.01em;
    text-shadow: 0 4px 24px rgba(0, 0, 0, 0.85);
  }

  .hero-quote-title span {
    display: block;
    margin-top: 4px;
  }

  /* FLOATING POST ACTION BAR */
  .hero-post-bar-wrapper {
    position: relative;
    z-index: 4;
    max-width: 680px;
    width: calc(100% - 48px);
    margin: 0 auto 28px auto;
    background: rgba(14, 22, 38, 0.92);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 18px;
    padding: 14px 18px;
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.6), 0 0 20px rgba(0, 245, 160, 0.08);
  }

  .post-input-row {
    display: flex;
    align-items: center;
    background: rgba(8, 13, 22, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 6px 14px;
    margin-bottom: 12px;
    transition: border-color 0.2s;
  }

  .post-input-row:focus-within {
    border-color: var(--accent-mint);
  }

  .post-input-field {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: #ffffff;
    font-size: 14px;
    font-weight: 400;
    padding: 8px 0;
  }

  .post-input-field::placeholder {
    color: #64748b;
  }

  .post-plus-btn {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: rgba(0, 245, 160, 0.15);
    border: 1px solid var(--accent-mint);
    color: var(--accent-mint);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .post-plus-btn:hover {
    background: var(--accent-mint);
    color: #042417;
    transform: scale(1.1);
  }

  .post-actions-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
  }

  .post-chip {
    flex: 1;
    min-width: 110px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 8px;
    padding: 9px 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: var(--text-secondary);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .post-chip:hover {
    background: rgba(255, 255, 255, 0.09);
    border-color: rgba(255, 255, 255, 0.16);
    color: #ffffff;
    transform: translateY(-1px);
  }

  .chip-icon-video { color: #10b981; }
  .chip-icon-photo { color: #38bdf8; }
  .chip-icon-designs { color: #f43f5e; }
  .chip-icon-article { color: #fbbf24; }

  /* TOP 5 SERVICE SUGGESTIONS */
  .suggestions-section {
    padding: 44px 0 24px 0;
  }

  .section-eyebrow-centered {
    text-align: center;
    font-size: 14px;
    font-weight: 800;
    letter-spacing: 0.14em;
    color: #ffffff;
    text-transform: uppercase;
    margin-bottom: 24px;
  }

  .suggestions-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 16px;
  }

  .suggestion-card {
    background: var(--bg-surface);
    border-radius: 12px;
    padding: 16px 18px;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    display: flex;
    flex-direction: column;
    gap: 10px;
    position: relative;
    border: 1px solid var(--border-subtle);
  }

  .suggestion-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.4);
  }

  /* Specific card tinting from reference */
  .sug-card-logo {
    background: linear-gradient(145deg, rgba(16, 185, 129, 0.14), rgba(14, 22, 38, 0.95));
    border-color: rgba(16, 185, 129, 0.35);
  }
  .sug-card-tutoring {
    background: linear-gradient(145deg, rgba(245, 158, 11, 0.14), rgba(14, 22, 38, 0.95));
    border-color: rgba(245, 158, 11, 0.35);
  }
  .sug-card-photo {
    background: linear-gradient(145deg, rgba(56, 189, 248, 0.14), rgba(14, 22, 38, 0.95));
    border-color: rgba(56, 189, 248, 0.35);
  }
  .sug-card-writing {
    background: linear-gradient(145deg, rgba(217, 119, 6, 0.14), rgba(14, 22, 38, 0.95));
    border-color: rgba(217, 119, 6, 0.35);
  }
  .sug-card-trends {
    background: linear-gradient(145deg, rgba(168, 85, 247, 0.14), rgba(14, 22, 38, 0.95));
    border-color: rgba(168, 85, 247, 0.35);
  }

  .sug-card-active {
    outline: 2px solid #ffffff;
    box-shadow: 0 0 20px rgba(255, 255, 255, 0.2);
  }

  .sug-icon-box {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
  }

  .sug-title {
    font-size: 15px;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 2px;
  }

  .sug-subtitle {
    font-size: 12px;
    color: var(--text-secondary);
    font-weight: 400;
  }

  /* POPULAR CAMPUS SERVICES */
  .explore-section {
    padding: 56px 0 72px 0;
  }

  .explore-header-row {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: 32px;
    flex-wrap: wrap;
    gap: 16px;
  }

  .explore-title {
    font-size: 22px;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    margin-bottom: 6px;
  }

  .explore-desc {
    font-size: 14px;
    color: var(--text-secondary);
  }

  .explore-counter {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-muted);
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid var(--border-subtle);
    padding: 6px 14px;
    border-radius: 20px;
  }

  /* GIGS GRID */
  .gigs-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
  }

  .gig-card {
    background: #0d1422;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  }

  .gig-card:hover {
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-4px);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.6);
  }

  .gig-media-wrapper {
    position: relative;
    width: 100%;
    height: 180px;
    background: #111827;
    overflow: hidden;
  }

  .gig-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.35s ease;
  }

  .gig-card:hover .gig-image {
    transform: scale(1.04);
  }

  .gig-fav-btn {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    font-size: 15px;
    cursor: pointer;
    transition: all 0.2s;
    z-index: 2;
  }

  .gig-fav-btn:hover {
    background: rgba(244, 63, 94, 0.85);
    color: #ffffff;
    transform: scale(1.1);
  }

  .gig-fav-active {
    background: rgba(244, 63, 94, 0.95);
    color: #ffffff;
  }

  .gig-video-badge {
    position: absolute;
    bottom: 10px;
    left: 12px;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(6px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    font-size: 11px;
    z-index: 2;
  }

  .gig-body {
    padding: 16px;
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  .gig-author-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .author-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .author-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, #1e293b, #0f172a);
    border: 1px solid rgba(255, 255, 255, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    color: #ffffff;
  }

  .author-name {
    font-size: 13px;
    font-weight: 600;
    color: #ffffff;
  }

  .author-badge {
    font-size: 10px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 4px;
    letter-spacing: 0.02em;
  }

  .badge-top-rated {
    background: rgba(245, 158, 11, 0.15);
    border: 1px solid rgba(245, 158, 11, 0.4);
    color: #fbbf24;
  }

  .badge-level-2 {
    background: rgba(245, 158, 11, 0.12);
    border: 1px solid rgba(245, 158, 11, 0.3);
    color: #f59e0b;
  }

  .gig-title-text {
    font-size: 14px;
    font-weight: 500;
    line-height: 1.45;
    color: #e2e8f0;
    margin-bottom: 14px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    min-height: 40px;
  }

  .gig-rating-row {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 16px;
  }

  .star-gold {
    color: #fbbf24;
  }

  .rating-count {
    color: var(--text-muted);
    font-weight: 400;
    font-size: 12px;
  }

  .gig-footer-row {
    margin-top: auto;
    padding-top: 14px;
    border-top: 1px solid rgba(255, 255, 255, 0.07);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .price-starting {
    display: flex;
    flex-direction: column;
  }

  .price-label-small {
    font-size: 11px;
    color: var(--text-muted);
    line-height: 1;
  }

  .price-amount {
    font-size: 16px;
    font-weight: 800;
    color: #ffffff;
    margin-top: 2px;
  }

  .btn-view-details {
    background: rgba(16, 185, 129, 0.12);
    border: 1px solid rgba(16, 185, 129, 0.4);
    color: #10b981;
    font-size: 12px;
    font-weight: 600;
    padding: 6px 14px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .btn-view-details:hover {
    background: #10b981;
    color: #042417;
    border-color: #10b981;
  }

  /* CAMPUS MARQUEE TICKER */
  .campus-ticker-wrap {
    padding: 24px 0;
    background: rgba(14, 22, 38, 0.4);
    border-top: 1px solid var(--border-subtle);
    border-bottom: 1px solid var(--border-subtle);
    overflow: hidden;
  }

  .campus-ticker-inner {
    display: flex;
    align-items: center;
    gap: 36px;
    width: max-content;
    animation: tickerMove 35s linear infinite;
  }

  @keyframes tickerMove {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }

  .ticker-item {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--text-muted);
    text-transform: uppercase;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .ticker-item span {
    color: var(--text-secondary);
  }

  .ticker-slash {
    color: rgba(255, 255, 255, 0.15);
  }

  /* TRUST & VERIFICATION VALUE PROPS */
  .trust-section {
    padding: 80px 0;
    border-bottom: 1px solid var(--border-subtle);
  }

  .trust-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }

  .trust-box {
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: 16px;
    padding: 28px;
    position: relative;
    overflow: hidden;
  }

  .trust-box::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 3px;
    background: linear-gradient(90deg, var(--accent-mint), transparent);
  }

  .trust-num {
    font-size: 13px;
    font-weight: 800;
    color: var(--accent-mint);
    margin-bottom: 14px;
    display: inline-block;
  }

  .trust-title {
    font-size: 18px;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 10px;
  }

  .trust-desc {
    font-size: 14px;
    color: var(--text-secondary);
    line-height: 1.6;
  }

  /* MODAL */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(8px);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .modal-box {
    background: #0e1626;
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 20px;
    width: 100%;
    max-width: 540px;
    padding: 32px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
    position: relative;
  }

  .modal-close-btn {
    position: absolute;
    top: 20px;
    right: 20px;
    background: rgba(255, 255, 255, 0.08);
    border: none;
    color: #ffffff;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    font-size: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .modal-title {
    font-size: 20px;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 8px;
  }

  .modal-desc {
    font-size: 13px;
    color: var(--text-secondary);
    margin-bottom: 20px;
  }

  /* FOOTER */
  .footer {
    padding: 64px 0 32px 0;
    background: #04060a;
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
    margin-top: 16px;
    line-height: 1.6;
    max-width: 320px;
  }

  .footer-col-title {
    font-size: 13px;
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
    gap: 12px;
  }

  .footer-link {
    font-size: 13px;
    color: var(--text-muted);
    text-decoration: none;
    transition: color 0.15s;
    cursor: pointer;
  }

  .footer-link:hover {
    color: #ffffff;
  }

  .footer-bottom {
    padding-top: 24px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
    color: var(--text-muted);
    flex-wrap: wrap;
    gap: 12px;
  }

  .status-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
    color: var(--accent-mint);
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--accent-mint);
    box-shadow: 0 0 8px var(--accent-mint);
  }

  /* RESPONSIVE */
  @media (max-width: 1100px) {
    .suggestions-grid {
      grid-template-columns: repeat(3, 1fr);
    }
    .gigs-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    .trust-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    .footer-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 768px) {
    .hero-quote-title {
      font-size: 26px;
    }
    .hero-center-content {
      padding: 60px 16px 30px 16px;
    }
    .suggestions-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    .gigs-grid {
      grid-template-columns: 1fr;
    }
    .trust-grid {
      grid-template-columns: 1fr;
    }
    .nav-links {
      display: none;
    }
    .post-actions-row {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
    }
  }
`;

export default function Home() {
  const router = useRouter();
  const [postPrompt, setPostPrompt] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [favorites, setFavorites] = useState({});
  const [activeModal, setActiveModal] = useState(null);
  const [selectedGig, setSelectedGig] = useState(null);

  const topSuggestions = [
    {
      id: "logo-design",
      name: "Logo Design",
      sub: "Stored",
      icon: "🎨",
      className: "sug-card-logo",
      filterKey: "Design",
    },
    {
      id: "academic-tutoring",
      name: "Academic Tutoring",
      sub: "Studentze",
      icon: "🎓",
      className: "sug-card-tutoring",
      filterKey: "Tutoring",
    },
    {
      id: "photo-sessions",
      name: "Photography Sessions",
      sub: "Campus Media",
      icon: "📷",
      className: "sug-card-photo",
      filterKey: "Media",
    },
    {
      id: "designs-articles",
      name: "Designs articles",
      sub: "Editorial Copy",
      icon: "📄",
      className: "sug-card-writing",
      filterKey: "Writing",
    },
    {
      id: "demanding-trends",
      name: "Demanding Trends",
      sub: "High Growth",
      icon: "📈",
      className: "sug-card-trends",
      filterKey: "Trends",
    },
  ];

  const campusGigs = [
    {
      id: 1,
      name: "Laura Corn",
      initials: "LC",
      badge: "Top Rated ✦✦✦",
      badgeClass: "badge-top-rated",
      title: "I will make an authentic ugc video ad for your service or product",
      rating: "4.9",
      reviews: "1k+",
      price: "₹2,505",
      hasVideo: true,
      category: "Media",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=700&q=80",
      description: "College campus creator producing high-converting TikTok/Reels UGC, unboxings, and product review reels with professional 4K Sony audio gear.",
      skills: ["UGC Video", "Reels", "Scripting", "Color Grading"],
      college: "IIT Bombay '25",
    },
    {
      id: 2,
      name: "Aarav Sharma",
      initials: "AS",
      badge: "Level 2 ✦✦",
      badgeClass: "badge-level-2",
      title: "I will design a modern minimalist 3D vector logo and brand identity",
      rating: "5.0",
      reviews: "740+",
      price: "₹1,850",
      hasVideo: false,
      category: "Design",
      image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=700&q=80",
      description: "Pixel-perfect minimalist branding, vector iconography, and complete visual guidelines in Figma and Illustrator for modern tech startups.",
      skills: ["3D Vector", "Figma", "Brand Kit", "Typography"],
      college: "BITS Pilani '24",
    },
    {
      id: 3,
      name: "Ananya Iyer",
      initials: "AI",
      badge: "Top Rated ✦✦✦",
      badgeClass: "badge-top-rated",
      title: "I will tutor college calculus, physics, and algorithm coding assignments",
      rating: "4.9",
      reviews: "520+",
      price: "₹1,200",
      hasVideo: false,
      category: "Tutoring",
      image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=700&q=80",
      description: "One-on-one live tutoring sessions for multivariable calculus, linear algebra, data structures & algorithms (C++/Python), and physics exam prep.",
      skills: ["Calculus", "Algorithms", "Physics", "Python"],
      college: "IIT Delhi '24",
    },
    {
      id: 4,
      name: "Rohan Verma",
      initials: "RV",
      badge: "Top Rated ✦✦✦",
      badgeClass: "badge-top-rated",
      title: "I will shoot professional campus portraits, reels, and creative...",
      rating: "4.9",
      reviews: "890+",
      price: "₹2,800",
      hasVideo: true,
      category: "Media",
      image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=700&q=80",
      description: "On-campus headshots, graduation reels, event coverage, and creative lifestyle photography with prime lenses and same-day RAW delivery.",
      skills: ["DSLR Photography", "Lightroom", "Campus Reels", "Headshots"],
      college: "IIT Madras '25",
    },
    {
      id: 5,
      name: "Tanvi Gupta",
      initials: "TG",
      badge: "Top Rated ✦✦✦",
      badgeClass: "badge-top-rated",
      title: "I will build full-stack Next.js and Supabase web apps with authentication",
      rating: "5.0",
      reviews: "430+",
      price: "₹3,400",
      hasVideo: false,
      category: "Trends",
      image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=700&q=80",
      description: "Production-ready web development with modern React, Tailwind CSS, PostgreSQL, and edge deployment.",
      skills: ["Next.js 15", "PostgreSQL", "Tailwind", "REST APIs"],
      college: "IIIT Hyderabad '25",
    },
    {
      id: 6,
      name: "Devendra K.",
      initials: "DK",
      badge: "Level 2 ✦✦",
      badgeClass: "badge-level-2",
      title: "I will write technical articles, research whitepapers, and SEO essays",
      rating: "4.9",
      reviews: "310+",
      price: "₹1,500",
      hasVideo: false,
      category: "Writing",
      image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=700&q=80",
      description: "In-depth engineering blog posts, technical documentation, academic literature reviews, and research summaries.",
      skills: ["Technical Writing", "Whitepapers", "SEO", "Copywriting"],
      college: "IIM Ahmedabad '24",
    },
  ];

  const filteredGigs = selectedCategory === "All"
    ? campusGigs
    : campusGigs.filter(g => g.category === selectedCategory || selectedCategory === "Trends");

  const toggleFavorite = (id, e) => {
    e.stopPropagation();
    setFavorites(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePostAction = (type) => {
    setActiveModal({
      title: `Create ${type} Post`,
      desc: `Post your campus gig requirement, request a freelancer, or showcase ${type.toLowerCase()} work to students across universities.`,
    });
  };

  const handleQuickPostSubmit = (e) => {
    e.preventDefault();
    if (!postPrompt.trim()) {
      router.push("/auth");
      return;
    }
    setActiveModal({
      title: "Start a Campus Project",
      desc: `Looking for: "${postPrompt}" — Sign up or login to immediately connect with verified campus freelancers.`,
    });
  };

  return (
    <>
      <style>{style}</style>

      {/* NAVBAR */}
      <nav className="navbar">
        <div className="container">
          <div className="navbar-inner">
            <div className="brand-logo" onClick={() => router.push("/")}>
              <div className="logo-icon-hexagon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l8 4.5v9L12 20l-8-4.5v-9L12 2z" />
                  <circle cx="12" cy="12" r="3" fill="#00f5a0" />
                </svg>
              </div>
              <span className="brand-title">SKILLHIVE</span>
            </div>

            <ul className="nav-links">
              <li>
                <a href="#home" className="nav-link active">Home</a>
              </li>
              <li>
                <a href="#categories" className="nav-link">Categories</a>
              </li>
              <li>
                <a href="#marketplace" className="nav-link">Marketplace</a>
              </li>
              <li>
                <a href="#guide" className="nav-link">Guide</a>
              </li>
              <li>
                <a 
                  href="#resources" 
                  className="nav-link"
                  onClick={(e) => {
                    e.preventDefault();
                    router.push("/guides");
                  }}
                >
                  Resources <span style={{ fontSize: "10px" }}>▼</span>
                </a>
              </li>
            </ul>

            <div className="nav-actions">
              <button 
                id="nav-post-gig-btn"
                className="btn btn-gig"
                onClick={() => router.push("/my_listings")}
              >
                Post a Service/Gig
              </button>
              <button 
                id="nav-login-btn"
                className="btn btn-login"
                onClick={() => router.push("/auth")}
              >
                Login
              </button>
              <button 
                id="nav-signup-btn"
                className="btn btn-signup"
                onClick={() => router.push("/auth")}
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO SECTION WITH STUDENTS BANNER & FLOATING POST CREATOR */}
      <section id="home" className="hero-section">
        <div className="container">
          <div className="hero-banner-card">
            {/* Cinematic Campus Collaborators Background Image */}
            <img 
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=80" 
              alt="Campus Creators and Hustlers Collaborating"
              className="hero-bg-img"
              width="1600"
              height="480"
            />
            <div className="hero-overlay-gradient"></div>

            {/* Center Hero Slogan Quote */}
            <div className="hero-center-content">
              <h1 className="hero-quote-title">
                &ldquo;UNEARTH YOUR CAMPUS HUSTLE.
                <span>CONNECT WITH OPPORTUNITY.&rdquo;</span>
              </h1>
            </div>

            {/* Bottom Docked / Floating Action Post Creator Bar */}
            <div className="hero-post-bar-wrapper">
              <form onSubmit={handleQuickPostSubmit} className="post-input-row">
                <input 
                  type="text"
                  className="post-input-field"
                  placeholder="Start a post..."
                  value={postPrompt}
                  onChange={(e) => setPostPrompt(e.target.value)}
                />
                <button type="submit" className="post-plus-btn" title="Create Post">
                  +
                </button>
              </form>

              <div className="post-actions-row">
                <button 
                  type="button" 
                  className="post-chip"
                  onClick={() => handlePostAction("Video")}
                >
                  <span className="chip-icon-video">▶</span>
                  <span>Video</span>
                </button>

                <button 
                  type="button" 
                  className="post-chip"
                  onClick={() => handlePostAction("Photo")}
                >
                  <span className="chip-icon-photo">🖼</span>
                  <span>Photo</span>
                </button>

                <button 
                  type="button" 
                  className="post-chip"
                  onClick={() => handlePostAction("Designs")}
                >
                  <span className="chip-icon-designs">🎨</span>
                  <span>Designs</span>
                </button>

                <button 
                  type="button" 
                  className="post-chip"
                  onClick={() => handlePostAction("Write article")}
                >
                  <span className="chip-icon-article">📄</span>
                  <span>Write article</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TOP 5 SERVICE SUGGESTIONS */}
      <section id="categories" className="suggestions-section">
        <div className="container">
          <h2 className="section-eyebrow-centered">TOP 5 SERVICE SUGGESTIONS</h2>

          <div className="suggestions-grid">
            {topSuggestions.map((item) => (
              <div 
                key={item.id}
                className={`suggestion-card ${item.className} ${selectedCategory === item.filterKey ? "sug-card-active" : ""}`}
                onClick={() => {
                  setSelectedCategory(selectedCategory === item.filterKey ? "All" : item.filterKey);
                }}
              >
                <div className="sug-icon-box">{item.icon}</div>
                <div>
                  <div className="sug-title">{item.name}</div>
                  <div className="sug-subtitle">{item.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EXPLORE POPULAR CAMPUS SERVICES */}
      <section id="marketplace" className="explore-section">
        <div className="container">
          <div className="explore-header-row">
            <div>
              <h2 className="explore-title">EXPLORE POPULAR CAMPUS SERVICES</h2>
              <p className="explore-desc">
                Verified student freelancers available for hire with milestone escrow.
              </p>
            </div>
            <div className="explore-counter">
              {filteredGigs.length} Gigs Available
            </div>
          </div>

          <div className="gigs-grid">
            {filteredGigs.map((gig) => (
              <div key={gig.id} className="gig-card">
                <div className="gig-media-wrapper">
                  <img 
                    src={gig.image} 
                    alt={gig.title} 
                    className="gig-image"
                    width="600"
                    height="360"
                  />
                  <button 
                    className={`gig-fav-btn ${favorites[gig.id] ? "gig-fav-active" : ""}`}
                    onClick={(e) => toggleFavorite(gig.id, e)}
                    title="Save to favorites"
                  >
                    ♥
                  </button>
                  {gig.hasVideo && (
                    <div className="gig-video-badge" title="Video Portfolio Included">
                      ▶
                    </div>
                  )}
                </div>

                <div className="gig-body">
                  <div className="gig-author-row">
                    <div className="author-left">
                      <div className="author-avatar">{gig.initials}</div>
                      <span className="author-name">{gig.name}</span>
                    </div>
                    <span className={`author-badge ${gig.badgeClass}`}>
                      {gig.badge}
                    </span>
                  </div>

                  <div className="gig-title-text" title={gig.title}>
                    {gig.title}
                  </div>

                  <div className="gig-rating-row">
                    <span className="star-gold">★</span>
                    <span>{gig.rating}</span>
                    <span className="rating-count">({gig.reviews})</span>
                  </div>

                  <div className="gig-footer-row">
                    <div className="price-starting">
                      <span className="price-label-small">From</span>
                      <span className="price-amount">{gig.price}</span>
                    </div>
                    <button 
                      className="btn-view-details"
                      onClick={() => {
                        setSelectedGig(gig);
                        setActiveModal({
                          title: gig.title,
                          desc: gig.description,
                          gig: gig,
                        });
                      }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CAMPUS NETWORK MARQUEE TICKER */}
      <div className="campus-ticker-wrap">
        <div className="campus-ticker-inner">
          <div className="ticker-item"><span>IIT BOMBAY</span></div>
          <div className="ticker-slash">/</div>
          <div className="ticker-item"><span>IIT DELHI</span></div>
          <div className="ticker-slash">/</div>
          <div className="ticker-item"><span>BITS PILANI</span></div>
          <div className="ticker-slash">/</div>
          <div className="ticker-item"><span>IIT MADRAS</span></div>
          <div className="ticker-slash">/</div>
          <div className="ticker-item"><span>IIIT HYDERABAD</span></div>
          <div className="ticker-slash">/</div>
          <div className="ticker-item"><span>IIM AHMEDABAD</span></div>
          <div className="ticker-slash">/</div>
          <div className="ticker-item"><span>IIT ROORKEE</span></div>
          <div className="ticker-slash">/</div>
          <div className="ticker-item"><span>IIT KHARAGPUR</span></div>
          <div className="ticker-slash">/</div>
          {/* Repeating items for infinite scroll */}
          <div className="ticker-item"><span>IIT BOMBAY</span></div>
          <div className="ticker-slash">/</div>
          <div className="ticker-item"><span>IIT DELHI</span></div>
          <div className="ticker-slash">/</div>
          <div className="ticker-item"><span>BITS PILANI</span></div>
          <div className="ticker-slash">/</div>
          <div className="ticker-item"><span>IIT MADRAS</span></div>
          <div className="ticker-slash">/</div>
          <div className="ticker-item"><span>IIIT HYDERABAD</span></div>
        </div>
      </div>

      {/* TRUST & VERIFICATION ARCHITECTURE */}
      <section id="guide" className="trust-section">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "#00f5a0", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              CAMPUS MERITOCRACY & PROTOCOL
            </span>
            <h2 style={{ fontSize: "28px", fontWeight: "800", color: "#ffffff", marginTop: "8px" }}>
              Why Students & Companies Choose SkillHive
            </h2>
          </div>

          <div className="trust-grid">
            <div className="trust-box">
              <span className="trust-num">01 // VERIFIED STUDENTS</span>
              <h3 className="trust-title">Authentic Collegiate Pedigree</h3>
              <p className="trust-desc">
                Every freelancer is verified through official university credentials (.ac.in emails & ID checks). Work with real peer talents from top institutes.
              </p>
            </div>

            <div className="trust-box">
              <span className="trust-num">02 // ESCROW PROTECTION</span>
              <h3 className="trust-title">Milestone Payment Security</h3>
              <p className="trust-desc">
                Funds are held in secure escrow throughout the gig lifecycle. Payments are released strictly upon satisfactory deliverable approvals.
              </p>
            </div>

            <div className="trust-box">
              <span className="trust-num">03 // DIRECT COLLABORATION</span>
              <h3 className="trust-title">Zero Agency Middleware</h3>
              <p className="trust-desc">
                Direct messaging, transparent reviews, and fast execution. Hire developers, editors, designers, and tutors without middleman bloat.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK INTERACTIVE MODAL */}
      {activeModal && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
              ✕
            </button>
            <h3 className="modal-title">{activeModal.title}</h3>
            <p className="modal-desc">{activeModal.desc}</p>

            {activeModal.gig && (
              <div style={{ background: "rgba(255,255,255,0.03)", padding: "16px", borderRadius: "12px", marginBottom: "20px", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ color: "#94a3b8", fontSize: "12px" }}>College Institution:</span>
                  <span style={{ color: "#00f5a0", fontSize: "12px", fontWeight: "600" }}>{activeModal.gig.college}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ color: "#94a3b8", fontSize: "12px" }}>Rate / Price:</span>
                  <span style={{ color: "#ffffff", fontSize: "14px", fontWeight: "700" }}>{activeModal.gig.price}</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "12px" }}>
                  {activeModal.gig.skills.map((s, idx) => (
                    <span key={idx} style={{ background: "rgba(0,245,160,0.1)", border: "1px solid rgba(0,245,160,0.25)", color: "#00f5a0", fontSize: "11px", padding: "3px 8px", borderRadius: "4px" }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: "12px" }}>
              <button 
                className="btn btn-signup" 
                style={{ flex: 1, padding: "12px" }}
                onClick={() => router.push("/auth")}
              >
                Continue with Account →
              </button>
              <button 
                className="btn btn-login" 
                style={{ padding: "12px 20px" }}
                onClick={() => setActiveModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="brand-logo" onClick={() => router.push("/")}>
                <div className="logo-icon-hexagon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2l8 4.5v9L12 20l-8-4.5v-9L12 2z" />
                    <circle cx="12" cy="12" r="3" fill="#00f5a0" />
                  </svg>
                </div>
                <span className="brand-title">SKILLHIVE</span>
              </div>
              <p>
                The collegiate hustle & freelance network connecting student creators, developers, designers, and tutors across premier universities with milestone escrow protection.
              </p>
            </div>

            <div>
              <div className="footer-col-title">Categories</div>
              <ul className="footer-col-links">
                <li><a className="footer-link" onClick={() => setSelectedCategory("Design")}>Logo & 3D Design</a></li>
                <li><a className="footer-link" onClick={() => setSelectedCategory("Tutoring")}>Academic STEM Tutoring</a></li>
                <li><a className="footer-link" onClick={() => setSelectedCategory("Media")}>Photography & UGC Video</a></li>
                <li><a className="footer-link" onClick={() => setSelectedCategory("Writing")}>Editorial & Whitepapers</a></li>
                <li><a className="footer-link" onClick={() => setSelectedCategory("Trends")}>Next.js & AI Apps</a></li>
              </ul>
            </div>

            <div>
              <div className="footer-col-title">Institutions</div>
              <ul className="footer-col-links">
                <li><a className="footer-link" onClick={() => router.push("/auth")}>IIT Bombay Chapter</a></li>
                <li><a className="footer-link" onClick={() => router.push("/auth")}>BITS Pilani Chapter</a></li>
                <li><a className="footer-link" onClick={() => router.push("/auth")}>IIT Delhi Chapter</a></li>
                <li><a className="footer-link" onClick={() => router.push("/auth")}>IIT Madras Chapter</a></li>
                <li><a className="footer-link" onClick={() => router.push("/auth")}>IIIT Hyderabad Chapter</a></li>
              </ul>
            </div>

            <div>
              <div className="footer-col-title">Platform</div>
              <ul className="footer-col-links">
                <li><a className="footer-link" onClick={() => router.push("/guides")}>Student Guide</a></li>
                <li><a className="footer-link" onClick={() => router.push("/my_listings")}>Post a Service</a></li>
                <li><a className="footer-link" onClick={() => router.push("/wallet")}>Escrow & Wallet</a></li>
                <li><a className="footer-link" onClick={() => router.push("/auth")}>Terms of Service</a></li>
                <li><a className="footer-link" onClick={() => router.push("/auth")}>Privacy Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <div>
              © 2026 SkillHive Network. All rights reserved. Inter Interface.
            </div>
            <div className="status-pill">
              <span className="status-dot"></span>
              <span>SYSTEM OPERATIONAL • ALL CAMPUS HUBS LIVE</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}