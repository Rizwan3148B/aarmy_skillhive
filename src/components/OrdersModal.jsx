"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Grabs the bearer token however your app stores it after login.
// Adjust this if your auth stores the JWT somewhere else (cookie, context, etc).
function getAuthToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export default function OrdersModal({ isOpen, onClose }) {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("all"); // "all" | "pending" | "in_progress" | "rejected"
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actingOn, setActingOn] = useState(null); // order_id currently being accepted/rejected

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch("/api/orders", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load orders");
      setOrders(data.orders || []);
    } catch (err) {
      console.error(err);
      showToastMsg(err.message || "Could not load orders", "error");
    } finally {
      setLoading(false);
    }
  };

  // Load orders from the API whenever the modal opens
  useEffect(() => {
    if (isOpen) fetchOrders();
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const showToastMsg = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const patchOrder = async (orderId, action, uiStatus, successMsg, toastType) => {
    setActingOn(orderId);
    // optimistic update
    const prevOrders = orders;
    setOrders((os) => os.map((o) => (o.id === orderId ? { ...o, status: uiStatus } : o)));
    try {
      const token = getAuthToken();
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ order_id: orderId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${action} order`);
      showToastMsg(successMsg, toastType);
    } catch (err) {
      console.error(err);
      setOrders(prevOrders); // roll back on failure
      showToastMsg(err.message || `Could not ${action} order`, "error");
    } finally {
      setActingOn(null);
    }
  };

  const handleAccept = (orderId) =>
    patchOrder(orderId, "accept", "In Progress", `Order ${orderId} Accepted! Funds locked in Escrow.`, "success");

  const handleReject = (orderId) =>
    patchOrder(orderId, "reject", "Rejected", `Order ${orderId} Rejected.`, "error");

  if (!isOpen) return null;

  const filteredOrders = orders.filter((o) => {
    const matchesFilter =
      filter === "all"
        ? true
        : filter === "pending"
          ? o.status === "Pending"
          : filter === "in_progress"
            ? o.status === "In Progress"
            : o.status === "Rejected";

    const matchesSearch =
      o.title.toLowerCase().includes(search.toLowerCase()) ||
      o.clientName.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.category.toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const pendingCount = orders.filter((o) => o.status === "Pending").length;
  const inProgressCount = orders.filter((o) => o.status === "In Progress").length;

  return (
    <div className="sh-orders-overlay" onClick={onClose}>
      <div
        className="sh-orders-modal-box"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="sh-modal-head">
          <div className="sh-modal-title-area">
            <div className="sh-modal-icon-badge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
            <div>
              <div className="sh-modal-head-row">
                <h2 className="sh-modal-title">Client Orders & Contracts</h2>
                {pendingCount > 0 && (
                  <span className="sh-pending-pill">{pendingCount} Action Required</span>
                )}
              </div>
              <p className="sh-modal-subtitle">Review incoming project orders, verify escrow budgets, and accept or reject requests.</p>
            </div>
          </div>

          <button className="sh-modal-close-btn" onClick={onClose} aria-label="Close orders modal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Action / Search Bar & Tabs */}
        <div className="sh-modal-toolbar">
          <div className="sh-tabs-row">
            <button
              className={`sh-tab-pill ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >
              All Orders ({orders.length})
            </button>
            <button
              className={`sh-tab-pill ${filter === "pending" ? "active" : ""}`}
              onClick={() => setFilter("pending")}
            >
              Pending ({pendingCount})
            </button>
            <button
              className={`sh-tab-pill ${filter === "in_progress" ? "active" : ""}`}
              onClick={() => setFilter("in_progress")}
            >
              In Progress ({inProgressCount})
            </button>
            <button
              className={`sh-tab-pill ${filter === "rejected" ? "active" : ""}`}
              onClick={() => setFilter("rejected")}
            >
              Rejected ({orders.filter((o) => o.status === "Rejected").length})
            </button>
          </div>

          <div className="sh-orders-search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Search by order ID, title, or client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sh-orders-search-input"
            />
          </div>
        </div>

        {/* Orders List Container */}
        <div className="sh-orders-list-content">
          {loading ? (
            <div className="sh-empty-orders">
              <div className="sh-empty-text">Loading orders…</div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="sh-empty-orders">
              <div className="sh-empty-icon">📭</div>
              <div className="sh-empty-text">No orders found in this category</div>
              <p className="sh-empty-sub">When buyers place orders on your services, they will appear here for review.</p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const isPending = order.status === "Pending";
              const isInProgress = order.status === "In Progress";
              const isRejected = order.status === "Rejected";

              return (
                <div key={order.id} className={`sh-order-card ${order.status.toLowerCase().replace(" ", "-")}`}>
                  {/* Top line: ID, Tag, Budget, Status */}
                  <div className="sh-card-header">
                    <div className="sh-card-id-row">
                      <span className="sh-order-id">{order.id}</span>
                      <span className="sh-category-tag">{order.category}</span>
                      <span className="sh-order-time">{order.createdAt}</span>
                    </div>

                    <div className="sh-card-status-row">
                      <div className="sh-price-badge">
                        <span className="sh-amount">{order.amount}</span>
                        <span className="sh-escrow-dot" title="Escrow Verified"></span>
                      </div>
                      <span className={`sh-status-tag ${order.status.toLowerCase().replace(" ", "-")}`}>
                        {order.status === "Pending" && "Pending Approval"}
                        {order.status === "In Progress" && "In Progress"}
                        {order.status === "Rejected" && "Rejected"}
                      </span>
                    </div>
                  </div>

                  {/* Main Title & Description */}
                  <h3 className="sh-order-item-title">{order.title}</h3>
                  <p className="sh-order-desc">{order.requirements}</p>

                  {/* Client & Deadline meta info */}
                  <div className="sh-order-footer">
                    <div className="sh-client-info">
                      <div className="sh-client-avatar">{order.clientAvatar}</div>
                      <div>
                        <div className="sh-client-name">{order.clientName}</div>
                        <div className="sh-client-college">{order.clientCollege}</div>
                      </div>
                    </div>

                    <div className="sh-deadline-info">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span>Deadline: {order.deadline}</span>
                    </div>

                    {/* Action Buttons: Accept / Reject */}
                    <div className="sh-actions-container">
                      {isPending ? (
                        <>
                          <button
                            type="button"
                            className="sh-btn-reject"
                            onClick={() => handleReject(order.id)}
                            disabled={actingOn === order.id}
                            title="Reject this order"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                            <span>Reject</span>
                          </button>

                          <button
                            type="button"
                            className="sh-btn-accept"
                            onClick={() => handleAccept(order.id)}
                            disabled={actingOn === order.id}
                            title="Accept this order"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span>{actingOn === order.id ? "Accepting…" : "Accept Order"}</span>
                          </button>
                        </>
                      ) : isInProgress ? (
                        <div className="sh-btn-group-accepted">
                          <button
                            type="button"
                            className="sh-btn-msg"
                            onClick={() => {
                              onClose();
                              router.push(`/messages?order_id=${order.id}`);
                            }}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                            <span>Message</span>
                          </button>
                          <span className="sh-badge-running">Active Work</span>
                        </div>
                      ) : (
                        <div className="sh-btn-group-rejected">
                          <button
                            type="button"
                            className="sh-btn-reopen"
                            onClick={() => handleAccept(order.id)}
                          >
                            Reconsider & Accept
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Summary */}
        <div className="sh-modal-bottom-bar">
          <div className="sh-escrow-notice">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>All accepted client payments are safely locked in Escrow until you deliver.</span>
          </div>

          <button className="sh-btn-done" onClick={onClose}>
            Close
          </button>
        </div>

        {/* Floating Toast Notification */}
        {toast && (
          <div className={`sh-modal-toast ${toast.type}`}>
            {toast.type === "success" ? "✓ " : "✕ "}
            {toast.msg}
          </div>
        )}
      </div>

      <style jsx>{`
        .sh-orders-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.78);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
          animation: fadeIn 0.18s ease-out forwards;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .sh-orders-modal-box {
          background: #111115;
          border: 1px solid #27272a;
          border-radius: 16px;
          width: 100%;
          max-width: 860px;
          max-height: 88vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05);
          animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          color: #f4f4f5;
          font-family: inherit;
          overflow: hidden;
          position: relative;
        }

        .sh-modal-head {
          padding: 22px 24px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          border-bottom: 1px solid #1f1f23;
          background: #141418;
        }

        .sh-modal-title-area {
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }

        .sh-modal-icon-badge {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .sh-modal-head-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .sh-modal-title {
          font-size: 19px;
          font-weight: 700;
          color: #fafafa;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .sh-pending-pill {
          background: rgba(234, 179, 8, 0.15);
          color: #facc15;
          border: 1px solid rgba(234, 179, 8, 0.3);
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 9999px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .sh-modal-subtitle {
          font-size: 13px;
          color: #a1a1aa;
          margin: 4px 0 0 0;
          line-height: 1.4;
        }

        .sh-modal-close-btn {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid #27272a;
          color: #a1a1aa;
          width: 34px;
          height: 34px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }

        .sh-modal-close-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
          border-color: #3f3f46;
        }

        .sh-modal-toolbar {
          padding: 14px 24px;
          background: #111114;
          border-bottom: 1px solid #1f1f23;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .sh-tabs-row {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #18181c;
          padding: 3px;
          border-radius: 9px;
          border: 1px solid #27272a;
        }

        .sh-tab-pill {
          background: transparent;
          border: none;
          color: #a1a1aa;
          font-size: 12.5px;
          font-weight: 500;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .sh-tab-pill:hover {
          color: #e4e4e7;
        }

        .sh-tab-pill.active {
          background: #27272a;
          color: #ffffff;
          font-weight: 600;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
        }

        .sh-orders-search {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #18181c;
          border: 1px solid #27272a;
          border-radius: 8px;
          padding: 6px 12px;
          min-width: 250px;
          flex: 1;
          max-width: 320px;
        }

        .sh-orders-search-input {
          background: transparent;
          border: none;
          outline: none;
          color: #f4f4f5;
          font-size: 12.5px;
          width: 100%;
        }

        .sh-orders-search-input::placeholder {
          color: #71717a;
        }

        .sh-orders-list-content {
          padding: 18px 24px;
          overflow-y: auto;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 14px;
          max-height: calc(88vh - 200px);
        }

        .sh-orders-list-content::-webkit-scrollbar {
          width: 6px;
        }
        .sh-orders-list-content::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 4px;
        }

        .sh-order-card {
          background: #15151a;
          border: 1px solid #24242a;
          border-radius: 12px;
          padding: 16px 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          transition: border-color 0.15s ease, transform 0.15s ease;
        }

        .sh-order-card:hover {
          border-color: #383842;
        }

        .sh-order-card.pending {
          border-left: 3px solid #eab308;
          background: linear-gradient(90deg, rgba(234, 179, 8, 0.03) 0%, #15151a 15%);
        }

        .sh-order-card.in-progress {
          border-left: 3px solid #22c55e;
          background: linear-gradient(90deg, rgba(34, 197, 94, 0.03) 0%, #15151a 15%);
        }

        .sh-order-card.rejected {
          border-left: 3px solid #ef4444;
          opacity: 0.7;
        }

        .sh-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
        }

        .sh-card-id-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .sh-order-id {
          font-family: monospace;
          font-size: 12px;
          font-weight: 700;
          color: #a1a1aa;
          background: #1f1f26;
          padding: 3px 7px;
          border-radius: 5px;
          border: 1px solid #2e2e38;
        }

        .sh-category-tag {
          font-size: 11.5px;
          font-weight: 600;
          color: #38bdf8;
          background: rgba(56, 189, 248, 0.08);
          border: 1px solid rgba(56, 189, 248, 0.2);
          padding: 2px 7px;
          border-radius: 4px;
        }

        .sh-order-time {
          font-size: 11px;
          color: #71717a;
        }

        .sh-card-status-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .sh-price-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14.5px;
          font-weight: 700;
          color: #22c55e;
          background: rgba(34, 197, 94, 0.08);
          border: 1px solid rgba(34, 197, 94, 0.2);
          padding: 3px 10px;
          border-radius: 6px;
        }

        .sh-escrow-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 6px rgba(34, 197, 94, 0.6);
        }

        .sh-status-tag {
          font-size: 11.5px;
          font-weight: 600;
          padding: 3px 9px;
          border-radius: 9999px;
        }

        .sh-status-tag.pending {
          background: rgba(234, 179, 8, 0.12);
          color: #facc15;
          border: 1px solid rgba(234, 179, 8, 0.3);
        }

        .sh-status-tag.in-progress {
          background: rgba(34, 197, 94, 0.12);
          color: #4ade80;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }

        .sh-status-tag.rejected {
          background: rgba(239, 68, 68, 0.12);
          color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .sh-order-item-title {
          font-size: 15px;
          font-weight: 600;
          color: #f4f4f5;
          margin: 0;
          line-height: 1.35;
        }

        .sh-order-desc {
          font-size: 13px;
          color: #a1a1aa;
          margin: 0;
          line-height: 1.45;
        }

        .sh-order-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-top: 4px;
          padding-top: 12px;
          border-top: 1px solid #1f1f26;
          flex-wrap: wrap;
        }

        .sh-client-info {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .sh-client-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #6366f1);
          color: #ffffff;
          font-size: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .sh-client-name {
          font-size: 13px;
          font-weight: 600;
          color: #e4e4e7;
        }

        .sh-client-college {
          font-size: 11px;
          color: #71717a;
        }

        .sh-deadline-info {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          color: #a1a1aa;
        }

        .sh-actions-container {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-left: auto;
        }

        .sh-btn-reject {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.25);
          color: #f87171;
          font-size: 12.5px;
          font-weight: 600;
          padding: 6px 14px;
          border-radius: 7px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .sh-btn-reject:hover {
          background: rgba(239, 68, 68, 0.2);
          border-color: #ef4444;
          color: #ffffff;
        }

        .sh-btn-accept {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #22c55e;
          border: 1px solid #16a34a;
          color: #052e16;
          font-size: 12.5px;
          font-weight: 700;
          padding: 6px 16px;
          border-radius: 7px;
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: 0 2px 10px rgba(34, 197, 94, 0.25);
        }

        .sh-btn-accept:hover {
          background: #16a34a;
          color: #ffffff;
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(34, 197, 94, 0.4);
        }

        .sh-btn-group-accepted {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .sh-btn-msg {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: #1f1f26;
          border: 1px solid #33333d;
          color: #e4e4e7;
          font-size: 12px;
          font-weight: 600;
          padding: 5px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .sh-btn-msg:hover {
          background: #2b2b35;
          color: #ffffff;
          border-color: #4b4b58;
        }

        .sh-badge-running {
          font-size: 11px;
          font-weight: 600;
          color: #22c55e;
          background: rgba(34, 197, 94, 0.1);
          padding: 3px 8px;
          border-radius: 5px;
        }

        .sh-btn-reopen {
          background: transparent;
          border: 1px dashed #52525b;
          color: #a1a1aa;
          font-size: 11.5px;
          padding: 5px 10px;
          border-radius: 6px;
          cursor: pointer;
        }

        .sh-btn-reopen:hover {
          color: #ffffff;
          border-color: #22c55e;
        }

        .sh-empty-orders {
          text-align: center;
          padding: 48px 16px;
        }

        .sh-empty-icon {
          font-size: 36px;
          margin-bottom: 8px;
        }

        .sh-empty-text {
          font-size: 15px;
          font-weight: 600;
          color: #e4e4e7;
        }

        .sh-empty-sub {
          font-size: 13px;
          color: #71717a;
          margin-top: 4px;
        }

        .sh-modal-bottom-bar {
          padding: 14px 24px;
          background: #141418;
          border-top: 1px solid #1f1f23;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .sh-escrow-notice {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 12px;
          color: #a1a1aa;
        }

        .sh-btn-done {
          background: #27272a;
          border: 1px solid #3f3f46;
          color: #f4f4f5;
          font-size: 13px;
          font-weight: 600;
          padding: 7px 18px;
          border-radius: 7px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .sh-btn-done:hover {
          background: #3f3f46;
          color: #ffffff;
        }

        .sh-modal-toast {
          position: absolute;
          bottom: 70px;
          left: 50%;
          transform: translateX(-50%);
          padding: 9px 18px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          z-index: 100;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
          animation: fadeIn 0.15s ease-out;
        }

        .sh-modal-toast.success {
          background: #15803d;
          color: #ffffff;
          border: 1px solid #22c55e;
        }

        .sh-modal-toast.error {
          background: #991b1b;
          color: #ffffff;
          border: 1px solid #ef4444;
        }

        @media (max-width: 640px) {
          .sh-modal-toolbar {
            flex-direction: column;
            align-items: stretch;
          }
          .sh-orders-search {
            max-width: none;
          }
          .sh-actions-container {
            width: 100%;
            justify-content: flex-end;
          }
        }
      `}</style>
    </div>
  );
}