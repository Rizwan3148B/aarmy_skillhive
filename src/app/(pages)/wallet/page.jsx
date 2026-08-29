"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import OrdersModal from "@/components/OrdersModal";

export default function WalletPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // States
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [activeTxTab, setActiveTxTab] = useState("all"); // "all" | "payout" | "escrow" | "deposit"

  // Balances
  const [availableBalance, setAvailableBalance] = useState(0);
  const [escrowBalance, setEscrowBalance] = useState(0);
  const [totalLifetime, setTotalLifetime] = useState(0);
  const [completedGigsCount, setCompletedGigsCount] = useState(0);

  // Withdraw / Redeem form
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [upiId, setUpiId] = useState("user@okhdfcbank");
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);

  // Deposit form
  const [depositAmount, setDepositAmount] = useState("");
  const [isSubmittingDeposit, setIsSubmittingDeposit] = useState(false);

  // Toast state
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  // Transactions list
  const [transactions, setTransactions] = useState([]);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
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

  // Auth fetch helper
  const apiFetch = async (url, options = {}) => {
    const token = localStorage.getItem("token");
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  };

  // Load wallet data from API
  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/api/wallet");
      if (data.success) {
        if (data.user) {
          setUser(data.user);
        }
        if (data.balances) {
          setAvailableBalance(Number(data.balances.availableBalance) || 0);
          setEscrowBalance(Number(data.balances.escrowBalance) || 0);
          setTotalLifetime(Number(data.balances.lifetimeEarnings) || 0);
          setCompletedGigsCount(Number(data.balances.completedGigsCount) || 0);
        }
        if (Array.isArray(data.transactions)) {
          setTransactions(data.transactions);
        }
      }
    } catch (err) {
      console.error("Failed to fetch wallet:", err);
    } finally {
      setLoading(false);
    }
  };

  // Auth check & data load
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
        setUser({ full_name: "Collegiate User", email: "user@skillshive.in", college: "Campus" });
      }
    }

    fetchWalletData();
  }, [router]);

  const handleLogoutConfirm = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setShowLogoutModal(false);
    router.replace("/auth");
  };

  // Withdraw / Redeem Handler
  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) {
      alert("Please enter a valid redeem amount.");
      return;
    }
    if (amt > availableBalance) {
      alert("Redeem amount cannot exceed available balance.");
      return;
    }
    if (!upiId.trim()) {
      alert("Please provide a valid UPI ID.");
      return;
    }

    setIsSubmittingWithdraw(true);
    try {
      const res = await apiFetch("/api/wallet", {
        method: "POST",
        body: JSON.stringify({
          action: "redeem",
          amount: amt,
          upi_id: upiId.trim(),
        }),
      });

      const newTx = {
        id: res.transaction_id || `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
        type: "Payout",
        title: `UPI Redemption to ${upiId}`,
        description: "Instant UPI payout processed to your registered VPA",
        amount: -amt,
        date: "Today",
        time: "Just now",
        status: "Completed",
        badgeClass: "completed",
      };

      setAvailableBalance((prev) => Math.max(0, prev - amt));
      setTransactions([newTx, ...transactions]);
      setShowWithdrawModal(false);
      setWithdrawAmount("");
      triggerToast(res.message || `₹${amt.toLocaleString("en-IN")} redeemed successfully to ${upiId}`);
    } catch (err) {
      alert(err.message || "Failed to process withdrawal");
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

  // Deposit Handler
  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) {
      alert("Please enter a valid deposit amount.");
      return;
    }

    setIsSubmittingDeposit(true);
    try {
      const res = await apiFetch("/api/wallet", {
        method: "POST",
        body: JSON.stringify({
          action: "deposit",
          amount: amt,
        }),
      });

      const newTx = {
        id: res.transaction_id || `DEP-${Math.floor(1000 + Math.random() * 9000)}`,
        type: "Deposit",
        title: "Wallet Balance Added via UPI / Netbanking",
        description: "Pre-funded wallet balance for hiring campus talent",
        amount: amt,
        date: "Today",
        time: "Just now",
        status: "Completed",
        badgeClass: "completed",
      };

      setAvailableBalance((prev) => prev + amt);
      setTransactions([newTx, ...transactions]);
      setShowDepositModal(false);
      setDepositAmount("");
      triggerToast(res.message || `₹${amt.toLocaleString("en-IN")} added to wallet balance!`);
    } catch (err) {
      alert(err.message || "Failed to process deposit");
    } finally {
      setIsSubmittingDeposit(false);
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (activeTxTab === "payout") return tx.type === "Payout" || tx.type === "Escrow Release";
    if (activeTxTab === "escrow") return tx.type === "In Escrow" || tx.type === "Escrow Deposit" || tx.type === "Escrow Release" || tx.type === "Escrow Settled";
    if (activeTxTab === "deposit") return tx.type === "Deposit" || tx.type === "Escrow Refunded";
    return true;
  });

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

        .sh-earnings-pill.active {
          background: var(--accent-green);
          border-color: var(--accent-green);
        }

        .sh-earnings-pill.active span, .sh-earnings-pill.active svg {
          color: #09090b !important;
          font-weight: 700;
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
          max-width: 1300px;
          margin: 0 auto;
          padding: 28px 24px 60px 24px;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        /* WALLET HEADER CARD */
        .sh-wallet-hero {
          background: linear-gradient(135deg, rgba(18, 18, 21, 0.95) 0%, rgba(14, 28, 22, 0.6) 100%);
          border: 1px solid rgba(16, 185, 129, 0.22);
          border-radius: var(--radius-xl);
          padding: 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 20px;
          position: relative;
          overflow: hidden;
        }

        .sh-hero-title-col h1 {
          font-size: 24px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.02em;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .sh-hero-title-col p {
          font-size: 13.5px;
          color: var(--text-secondary);
          margin-top: 6px;
          max-width: 620px;
          line-height: 1.5;
        }

        .sh-hero-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .sh-btn-redeem {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          font-size: 14px;
          font-weight: 700;
          color: #09090b;
          background: var(--accent-green);
          border: 1px solid var(--accent-green);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.25);
        }

        .sh-btn-redeem:hover:not(:disabled) {
          background: #059669;
          border-color: #059669;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.35);
        }

        .sh-btn-redeem:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .sh-btn-deposit {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          font-size: 13.5px;
          font-weight: 600;
          color: var(--text-primary);
          background: var(--bg-muted);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .sh-btn-deposit:hover {
          background: #27272a;
          color: #ffffff;
        }

        /* BALANCES GRID */
        .sh-balance-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 18px;
        }

        .sh-balance-card {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          position: relative;
        }

        .sh-balance-card.highlight {
          border-color: rgba(16, 185, 129, 0.38);
          background: radial-gradient(circle at top right, rgba(16, 185, 129, 0.08), transparent 60%), var(--bg-card);
        }

        .sh-balance-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .sh-balance-label {
          font-size: 12.5px;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .sh-balance-amount {
          font-size: 32px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.03em;
        }

        .sh-balance-sub {
          font-size: 12px;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 4px;
          border-top: 1px solid var(--border-subtle);
        }

        /* QUICK REDEEM PILL ON CARD */
        .sh-card-redeem-btn {
          background: rgba(16, 185, 129, 0.15);
          color: var(--accent-green);
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: 4px;
          padding: 3px 8px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .sh-card-redeem-btn:hover {
          background: var(--accent-green);
          color: #09090b;
        }

        /* PAYMENT METHODS & ESCROW INFO */
        .sh-mid-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .sh-info-card {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 22px 24px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .sh-info-card h3 {
          font-size: 15px;
          font-weight: 600;
          color: #ffffff;
        }

        .sh-method-box {
          background: var(--bg-sidebar);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 14px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .sh-method-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .sh-method-icon {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-md);
          background: rgba(56, 189, 248, 0.12);
          border: 1px solid rgba(56, 189, 248, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 12px;
          color: var(--accent-blue);
        }

        .sh-method-title {
          font-size: 13px;
          font-weight: 600;
          color: #ffffff;
        }

        .sh-method-sub {
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 2px;
        }

        .sh-badge-verified {
          font-size: 10.5px;
          font-weight: 600;
          color: var(--accent-green);
          background: rgba(16, 185, 129, 0.1);
          padding: 2px 8px;
          border-radius: var(--radius-sm);
          border: 1px solid rgba(16, 185, 129, 0.25);
        }

        /* TRANSACTIONS TABLE / LIST */
        .sh-tx-section {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-xl);
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .sh-tx-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
        }

        .sh-tx-header h3 {
          font-size: 16px;
          font-weight: 600;
          color: #ffffff;
        }

        .sh-tx-tabs {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--bg-sidebar);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 3px;
        }

        .sh-tx-tab-btn {
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 500;
          color: var(--text-secondary);
          background: transparent;
          border: none;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .sh-tx-tab-btn:hover {
          color: #ffffff;
        }

        .sh-tx-tab-btn.active {
          background: var(--bg-muted);
          color: #ffffff;
          font-weight: 600;
        }

        .sh-tx-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .sh-tx-row {
          background: var(--bg-sidebar);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 16px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          transition: all 0.15s ease;
        }

        .sh-tx-row:hover {
          border-color: var(--border-default);
          background: var(--bg-card-hover);
        }

        .sh-tx-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .sh-tx-icon-box {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 700;
        }

        .sh-tx-icon-box.green {
          background: rgba(16, 185, 129, 0.12);
          color: var(--accent-green);
          border: 1px solid rgba(16, 185, 129, 0.25);
        }

        .sh-tx-icon-box.amber {
          background: rgba(245, 158, 11, 0.12);
          color: var(--accent-amber);
          border: 1px solid rgba(245, 158, 11, 0.25);
        }

        .sh-tx-icon-box.gray {
          background: var(--bg-muted);
          color: var(--text-primary);
          border: 1px solid var(--border-default);
        }

        .sh-tx-info h4 {
          font-size: 13.5px;
          font-weight: 600;
          color: #ffffff;
        }

        .sh-tx-info p {
          font-size: 11.5px;
          color: var(--text-muted);
          margin-top: 3px;
        }

        .sh-tx-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }

        .sh-tx-amt {
          font-size: 15px;
          font-weight: 700;
        }

        .sh-tx-amt.plus {
          color: var(--accent-green);
        }

        .sh-tx-amt.minus {
          color: var(--text-primary);
        }

        .sh-tx-amt.zero {
          color: var(--text-muted);
        }

        .sh-tx-date {
          font-size: 11px;
          color: var(--text-muted);
        }

        .sh-empty-orders {
          padding: 48px 24px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          color: var(--text-muted);
        }

        /* MODALS */
        .sh-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.78);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: 20px;
        }

        .sh-modal-content {
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-xl);
          width: 100%;
          max-width: 480px;
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8);
        }

        .sh-modal-header {
          padding: 18px 24px;
          border-bottom: 1px solid var(--border-subtle);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .sh-modal-title {
          font-size: 16px;
          font-weight: 600;
          color: #ffffff;
        }

        .sh-modal-close {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 16px;
        }

        .sh-modal-body {
          padding: 22px 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .sh-form-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .sh-label {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .sh-input {
          background: var(--bg-input);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 10px 12px;
          font-size: 13.5px;
          color: var(--text-primary);
          outline: none;
          width: 100%;
        }

        .sh-input:focus {
          border-color: var(--accent-green);
        }

        .sh-modal-footer {
          padding: 16px 24px;
          border-top: 1px solid var(--border-subtle);
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          background: var(--bg-sidebar);
        }

        .sh-toast {
          position: fixed;
          bottom: 24px;
          right: 24px;
          background: #18181b;
          border: 1px solid var(--border-default);
          color: #ffffff;
          padding: 12px 18px;
          border-radius: var(--radius-md);
          font-size: 13px;
          font-weight: 500;
          z-index: 120;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }

        @media (max-width: 768px) {
          .sh-mid-grid {
            grid-template-columns: 1fr;
          }
          .sh-container {
            padding: 16px 16px 40px 16px;
          }
          .sh-wallet-hero {
            padding: 20px;
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

            <Link href="/guides" className="sh-nav-btn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <path d="M12 17h.01" />
              </svg>
              <span>Guide</span>
            </Link>

            {/* MY EARNINGS / WALLET PILL (ACTIVE) */}
            <Link href="/wallet" className="sh-earnings-pill active" title="View My Earnings & Wallet">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#09090b" }}>
                <rect width="20" height="14" x="2" y="5" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
              <span className="sh-earnings-val" style={{ color: "#09090b" }}>Wallet</span>
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
                    className="sh-dropdown-item danger"
                    onClick={() => {
                      setIsProfileOpen(false);
                      setShowLogoutModal(true);
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="12" y2="12" />
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
        {/* WALLET HERO HEADER */}
        <section className="sh-wallet-hero">
          <div className="sh-hero-title-col">
            <h1>
              <span>My Earnings & Wallet</span>
            </h1>
            <p>
              Money earned from all your completed orders and previous gigs. Redeem funds directly to your verified UPI ID with zero platform settlement fees.
            </p>
          </div>

          <div className="sh-hero-actions">
            <button
              className="sh-btn-redeem"
              onClick={() => setShowWithdrawModal(true)}
              disabled={availableBalance <= 0}
              title={availableBalance <= 0 ? "Complete work orders to earn and redeem money" : "Redeem your earned money now"}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="19" x2="12" y2="5" />
                <polyline points="5 12 12 5 19 12" />
              </svg>
              <span>Redeem Money (₹{availableBalance.toLocaleString("en-IN")})</span>
            </button>

            <button className="sh-btn-deposit" onClick={() => setShowDepositModal(true)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <polyline points="19 12 12 19 5 12" />
              </svg>
              <span>Add Balance</span>
            </button>
          </div>
        </section>

        {/* BALANCES GRID */}
        <section className="sh-balance-grid">
          <div className="sh-balance-card highlight">
            <div className="sh-balance-top">
              <span className="sh-balance-label">Available for Redemption</span>
              <span style={{ color: "var(--accent-green)", fontSize: "12px", fontWeight: 600 }}>● Ready to Withdraw</span>
            </div>
            <div className="sh-balance-amount" style={{ color: "var(--accent-green)" }}>
              ₹{loading ? "..." : availableBalance.toLocaleString("en-IN")}
            </div>
            <div className="sh-balance-sub">
              <span>Earnings from completed tasks</span>
              {availableBalance > 0 && (
                <button
                  type="button"
                  className="sh-card-redeem-btn"
                  onClick={() => setShowWithdrawModal(true)}
                >
                  Redeem Now &rarr;
                </button>
              )}
            </div>
          </div>

          <div className="sh-balance-card">
            <div className="sh-balance-top">
              <span className="sh-balance-label">Secured in Escrow</span>
              <span style={{ color: "var(--accent-amber)", fontSize: "12px", fontWeight: 600 }}>🔒 Active Contracts</span>
            </div>
            <div className="sh-balance-amount" style={{ color: "var(--accent-amber)" }}>
              ₹{loading ? "..." : escrowBalance.toLocaleString("en-IN")}
            </div>
            <div className="sh-balance-sub">
              <span>Unlocks immediately when work is marked delivered</span>
            </div>
          </div>

          <div className="sh-balance-card">
            <div className="sh-balance-top">
              <span className="sh-balance-label">Lifetime Campus Earnings</span>
              <span style={{ color: "var(--accent-blue)", fontSize: "12px", fontWeight: 600 }}>★ Verified</span>
            </div>
            <div className="sh-balance-amount" style={{ color: "var(--accent-blue)" }}>
              ₹{loading ? "..." : totalLifetime.toLocaleString("en-IN")}
            </div>
            <div className="sh-balance-sub">
              <span>Across {completedGigsCount} completed collegiate order{completedGigsCount === 1 ? "" : "s"}</span>
            </div>
          </div>
        </section>

        {/* MID SECTION: PAYMENT METHODS & ESCROW TRUST */}
        <section className="sh-mid-grid">
          <div className="sh-info-card">
            <h3>Linked Payout / UPI Account</h3>
            <div className="sh-method-box">
              <div className="sh-method-left">
                <div className="sh-method-icon">UPI</div>
                <div>
                  <div className="sh-method-title">{upiId}</div>
                  <div className="sh-method-sub">Verified VPA &bull; Instant Bank Settlement</div>
                </div>
              </div>
              <span className="sh-badge-verified">Verified</span>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: "1.5" }}>
              Redemptions are transferred 24/7 directly to your registered UPI ID once work is accepted by clients.
            </p>
          </div>

          <div className="sh-info-card">
            <h3>Skills Hive Escrow Vault</h3>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
              Every client deposit is held securely in encrypted escrow. When you submit proof of work and complete your gig, funds are released immediately to your Available Balance.
            </p>
            <div style={{ display: "flex", gap: "8px", marginTop: "auto" }}>
              <button
                type="button"
                onClick={() => setIsOrdersOpen(true)}
                style={{ background: "transparent", border: "none", fontSize: "12px", color: "var(--accent-blue)", cursor: "pointer", fontWeight: 600 }}
              >
                View Your Active Orders &rarr;
              </button>
            </div>
          </div>
        </section>

        {/* TRANSACTION & ORDER WORK HISTORY */}
        <section className="sh-tx-section">
          <div className="sh-tx-header">
            <h3>Money Collected & Order Transactions</h3>
            <div className="sh-tx-tabs">
              <button
                className={`sh-tx-tab-btn ${activeTxTab === "all" ? "active" : ""}`}
                onClick={() => setActiveTxTab("all")}
              >
                All Orders ({transactions.length})
              </button>
              <button
                className={`sh-tx-tab-btn ${activeTxTab === "payout" ? "active" : ""}`}
                onClick={() => setActiveTxTab("payout")}
              >
                Earnings & Payouts
              </button>
              <button
                className={`sh-tx-tab-btn ${activeTxTab === "escrow" ? "active" : ""}`}
                onClick={() => setActiveTxTab("escrow")}
              >
                In Escrow
              </button>
              <button
                className={`sh-tx-tab-btn ${activeTxTab === "deposit" ? "active" : ""}`}
                onClick={() => setActiveTxTab("deposit")}
              >
                Deposits
              </button>
            </div>
          </div>

          <div className="sh-tx-list">
            {loading ? (
              <div className="sh-empty-orders">Loading transactions from database...</div>
            ) : filteredTransactions.length === 0 ? (
              <div className="sh-empty-orders">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
                  <rect width="20" height="14" x="2" y="5" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
                <span>No transactions found under this tab.</span>
                <button
                  type="button"
                  onClick={() => setIsOrdersOpen(true)}
                  style={{
                    background: "var(--bg-muted)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-default)",
                    borderRadius: "6px",
                    padding: "6px 14px",
                    fontSize: "12px",
                    cursor: "pointer",
                    marginTop: "6px",
                  }}
                >
                  Check Orders
                </button>
              </div>
            ) : (
              filteredTransactions.map((tx) => (
                <div className="sh-tx-row" key={tx.id}>
                  <div className="sh-tx-left">
                    <div className={`sh-tx-icon-box ${tx.amount > 0 ? "green" : tx.type === "In Escrow" || tx.type === "Escrow Deposit" ? "amber" : "gray"}`}>
                      {tx.amount > 0 ? "↓" : tx.amount < 0 ? "↑" : "•"}
                    </div>
                    <div className="sh-tx-info">
                      <h4>{tx.title}</h4>
                      <p>
                        {tx.description} &bull; Ref: <span style={{ fontFamily: "monospace" }}>{tx.id}</span>
                        {tx.status && (
                          <span style={{ marginLeft: "8px", color: tx.status === "Completed" ? "var(--accent-green)" : tx.status === "Secured" ? "var(--accent-amber)" : "var(--text-muted)" }}>
                            [{tx.status}]
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="sh-tx-right">
                    <span className={`sh-tx-amt ${tx.amount > 0 ? "plus" : tx.amount < 0 ? "minus" : "zero"}`}>
                      {tx.amount > 0 ? `+₹${tx.amount.toLocaleString("en-IN")}` : tx.amount < 0 ? `-₹${Math.abs(tx.amount).toLocaleString("en-IN")}` : `₹0`}
                    </span>
                    <span className="sh-tx-date">{tx.date} {tx.time ? `• ${tx.time}` : ""}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* WITHDRAW / REDEEM MODAL */}
      {showWithdrawModal && (
        <div className="sh-modal-overlay">
          <div className="sh-modal-content">
            <div className="sh-modal-header">
              <h3 className="sh-modal-title">Redeem Earnings to UPI</h3>
              <button className="sh-modal-close" onClick={() => setShowWithdrawModal(false)}>✕</button>
            </div>

            <form onSubmit={handleWithdrawSubmit}>
              <div className="sh-modal-body">
                <div className="sh-form-field">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label className="sh-label">Redeem Amount (₹) *</label>
                    <button
                      type="button"
                      onClick={() => setWithdrawAmount(String(availableBalance))}
                      style={{ background: "none", border: "none", color: "var(--accent-green)", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}
                    >
                      Redeem All (₹{availableBalance.toLocaleString("en-IN")})
                    </button>
                  </div>
                  <input
                    type="number"
                    className="sh-input"
                    placeholder={`Available: ₹${availableBalance}`}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    max={availableBalance}
                    min={1}
                    required
                  />
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    Available balance from completed orders: ₹{availableBalance.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="sh-form-field">
                  <label className="sh-label">Destination UPI VPA ID *</label>
                  <input
                    type="text"
                    className="sh-input"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. yourname@okhdfcbank"
                    required
                  />
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    Funds will be instantly transferred to this UPI address.
                  </span>
                </div>
              </div>

              <div className="sh-modal-footer">
                <button type="button" className="sh-btn-deposit" onClick={() => setShowWithdrawModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="sh-btn-redeem" disabled={isSubmittingWithdraw}>
                  {isSubmittingWithdraw ? "Processing..." : "Confirm Instant Redeem"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEPOSIT MODAL */}
      {showDepositModal && (
        <div className="sh-modal-overlay">
          <div className="sh-modal-content">
            <div className="sh-modal-header">
              <h3 className="sh-modal-title">Add Wallet Balance</h3>
              <button className="sh-modal-close" onClick={() => setShowDepositModal(false)}>✕</button>
            </div>

            <form onSubmit={handleDepositSubmit}>
              <div className="sh-modal-body">
                <div className="sh-form-field">
                  <label className="sh-label">Amount to Add (₹) *</label>
                  <input
                    type="number"
                    className="sh-input"
                    placeholder="e.g. 5000"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    min={1}
                    required
                  />
                </div>
                <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Pre-funded balance can be used to instantly create orders and hire campus peers without paying on every task.
                </p>
              </div>

              <div className="sh-modal-footer">
                <button type="button" className="sh-btn-deposit" onClick={() => setShowDepositModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="sh-btn-redeem" disabled={isSubmittingDeposit}>
                  {isSubmittingDeposit ? "Processing..." : "Proceed to Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutModal && (
        <div className="sh-modal-overlay" style={{ maxWidth: "400px", margin: "auto" }}>
          <div className="sh-modal-content">
            <div className="sh-modal-header">
              <h3 className="sh-modal-title">Confirm Log Out</h3>
              <button className="sh-modal-close" onClick={() => setShowLogoutModal(false)}>✕</button>
            </div>
            <div className="sh-modal-body">
              <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                Are you sure you want to log out of Skills Hive?
              </p>
            </div>
            <div className="sh-modal-footer">
              <button className="sh-btn-deposit" onClick={() => setShowLogoutModal(false)}>Cancel</button>
              <button style={{ padding: "8px 16px", background: "#dc2626", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "13px" }} onClick={handleLogoutConfirm}>Log Out</button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {showToast && (
        <div className="sh-toast">
          {toastMessage}
        </div>
      )}

      {/* ORDERS MODAL BOX */}
      <OrdersModal isOpen={isOrdersOpen} onClose={() => setIsOrdersOpen(false)} />
    </div>
  );
}
