"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import OrdersModal from "@/components/OrdersModal";

export default function MessagesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  // Topbar state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);

  // Modals & dialogues
  const [showDeliverModal, setShowDeliverModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [deliveryNote, setDeliveryNote] = useState("");
  const [deliveryFile, setDeliveryFile] = useState("");

  // Toast
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  // Search & Filters: "all" (Active ongoing chats) | "delivered" (Completed task chats)
  const [searchQuery, setSearchQuery] = useState("");
  const [chatFilter, setChatFilter] = useState("all");

  // 3-Dots dropdown state
  const [activeMenuChatId, setActiveMenuChatId] = useState(null);

  // Message input
  const [inputText, setInputText] = useState("");

  // Report Fraud state
  const [reportCategory, setReportCategory] = useState("Fraud");
  const [reportMessage, setReportMessage] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);

  // Reference for message scroll container (strictly bounded to chat box)
  const chatScrollRef = useRef(null);

  // Chats are loaded from the API (see fetchChats below). Nothing is mocked anymore.
  const [chats, setChats] = useState([]);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [chatsError, setChatsError] = useState("");

  // Pin state has no DB column yet, so it's kept client-side only, persisted per-browser.
  const [pinnedIds, setPinnedIds] = useState([]);


  // Selected chat ID (set once real chats load)
  const [selectedChatId, setSelectedChatId] = useState(null);

  // Auth setup
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
        setUser(null);
      }
    }
  }, [router]);

  // Small fetch wrapper: attaches the bearer token and throws on non-2xx so
  // callers can just try/catch.
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

  // Load the pinned-chat ids saved locally for this browser.
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("pinnedChatIds") || "[]");
      if (Array.isArray(stored)) setPinnedIds(stored);
    } catch {
      // ignore malformed local storage
    }
  }, []);

  const fetchChats = async () => {
    setIsLoadingChats(true);
    setChatsError("");
    try {
      const data = await apiFetch("/api/messages");
      const loaded = (data.chats || []).map((c) => ({
        id: c.id,
        conversationId: c.conversationId,
        myRole: c.myRole,
        isSeller: Boolean(c.isSeller ?? (c.myRole === "seller")),
        isBuyer: Boolean(c.isBuyer ?? (c.myRole === "buyer")),
        sellerUserId: c.sellerUserId,
        buyerUserId: c.buyerUserId,
        clientName: c.clientName,
        clientCollege: c.clientCollege,
        clientRole: c.clientRole,
        clientAvatar: getInitials(c.clientName),
        clientOnline: false,
        lastSeen: "Offline",
        orderTitle: c.orderTitle,
        amount: c.amount,
        status: c.status,
        progress: c.progress,
        deadline: c.deadline ? new Date(c.deadline).toLocaleDateString() : "",
        escrowStatus: c.escrowStatus,
        isPinned: pinnedIds.includes(c.id),
        rating: c.rating,
        reviewsCount: c.reviewsCount,
        totalTasks: c.totalTasks,
        reputation: c.reputation,
        unreadCount: c.unreadCount,
        lastMessageTime: c.lastMessageTime
          ? new Date(c.lastMessageTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "",
        messages: [],
        newThreadMessages: [],
        _messagesLoaded: false,
      }));
      setChats(loaded);
      if (loaded.length > 0) {
        setSelectedChatId((prev) => prev || loaded[0].id);
      }
    } catch (err) {
      setChatsError(err.message || "Could not load conversations.");
    } finally {
      setIsLoadingChats(false);
    }
  };

  // Kick off the initial chat list load once we know we're authenticated.
  useEffect(() => {
    if (user) fetchChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Fetch the message history for whichever chat is selected (once per chat).
  useEffect(() => {
    if (!selectedChatId) return;
    const target = chats.find((c) => c.id === selectedChatId);
    if (!target || target._messagesLoaded) return;

    let cancelled = false;
    setIsLoadingMessages(true);
    apiFetch(`/api/messages?order_id=${encodeURIComponent(selectedChatId)}`)
      .then((data) => {
        if (cancelled) return;
        setChats((prev) =>
          prev.map((c) =>
            c.id === selectedChatId
              ? {
                ...c,
                messages: (data.messages || []).map((m) => ({ ...m, time: formatMsgTime(m.time) })),
                _messagesLoaded: true,
              }
              : c
          )
        );
      })
      .catch((err) => triggerToast(`⚠️ ${err.message}`))
      .finally(() => !cancelled && setIsLoadingMessages(false));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChatId]);

  // Close 3-dots menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuChatId(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  // Scroll ONLY the inner chat messages box to bottom without moving the page window
  const scrollToBottom = () => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedChatId, chats]);

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

  const formatMsgTime = (iso) => {
    if (!iso) return "Just now";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleLogoutConfirm = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setShowLogoutModal(false);
    router.replace("/auth");
  };

  // Selected chat object
  const selectedChat = chats.find((c) => c.id === selectedChatId) || chats[0];

  // Filtered chats based on toggle:
  // "all" -> Only currently ongoing/active chats (In Progress or Pending, excludes Delivered/Cancelled)
  // "delivered" -> Only delivered/completed task users
  const visibleChats = chats
    .filter((c) => {
      if (chatFilter === "all") {
        if (c.status === "Delivered" || c.status === "Cancelled") return false;
      } else if (chatFilter === "delivered") {
        if (c.status !== "Delivered") return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.clientName.toLowerCase().includes(q) ||
          c.clientCollege.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });

  // Switch selection if current selection is not visible in current tab
  useEffect(() => {
    if (visibleChats.length > 0 && !visibleChats.some((c) => c.id === selectedChatId)) {
      setSelectedChatId(visibleChats[0].id);
    }
  }, [chatFilter]);

  // Toggle Pin (Max 3)
  const handleTogglePin = (e, chatId) => {
    e.stopPropagation();
    setActiveMenuChatId(null);

    const target = chats.find((c) => c.id === chatId);
    if (!target) return;

    // Pinning has no DB column yet, so it's stored per-browser in localStorage.
    if (!target.isPinned) {
      const currentPinned = chats.filter((c) => c.isPinned).length;
      if (currentPinned >= 3) {
        triggerToast("⚠️ Maximum 3 pinned chats allowed. Unpin one first.");
        return;
      }
      const nextPinned = [...pinnedIds, chatId];
      setPinnedIds(nextPinned);
      localStorage.setItem("pinnedChatIds", JSON.stringify(nextPinned));
      setChats((prev) =>
        prev.map((c) => (c.id === chatId ? { ...c, isPinned: true } : c))
      );
      triggerToast(`📌 Pinned chat with ${target.clientName}`);
    } else {
      const nextPinned = pinnedIds.filter((id) => id !== chatId);
      setPinnedIds(nextPinned);
      localStorage.setItem("pinnedChatIds", JSON.stringify(nextPinned));
      setChats((prev) =>
        prev.map((c) => (c.id === chatId ? { ...c, isPinned: false } : c))
      );
      triggerToast(`Unpinned chat with ${target.clientName}`);
    }
  };

  // Delete Chat — hides the conversation from this browser's list only.
  // There's no delete-conversation endpoint (messages persist for the other party too).
  const handleDeleteChat = (e, chatId) => {
    e.stopPropagation();
    setActiveMenuChatId(null);

    const target = chats.find((c) => c.id === chatId);
    const remaining = chats.filter((c) => c.id !== chatId);
    setChats(remaining);

    if (selectedChatId === chatId && remaining.length > 0) {
      setSelectedChatId(remaining[0].id);
    }
    triggerToast(`🗑️ Chat with ${target?.clientName || "user"} hidden from your list.`);
  };

  // Accept New Order Action (Inside Chat)
  const handleAcceptOrder = async (chatId) => {
    try {
      const data = await apiFetch("/api/messages", {
        method: "PATCH",
        body: JSON.stringify({ order_id: chatId, action: "accept" }),
      });
      setChats((prev) =>
        prev.map((c) => (c.id === chatId ? { ...c, status: data.status, progress: 50 } : c))
      );
      triggerToast(`✅ Order ${chatId} accepted! Workspace opened.`);
    } catch (err) {
      triggerToast(`⚠️ ${err.message}`);
    }
  };

  // Cancel Order Action
  const handleConfirmCancelOrder = async () => {
    if (!selectedChat) return;
    try {
      const data = await apiFetch("/api/messages", {
        method: "PATCH",
        body: JSON.stringify({ order_id: selectedChat.id, action: "cancel" }),
      });
      setChats((prev) =>
        prev.map((c) => (c.id === selectedChat.id ? { ...c, status: data.status } : c))
      );
      triggerToast(`❌ Order ${selectedChat.id} has been cancelled.`);
    } catch (err) {
      triggerToast(`⚠️ ${err.message}`);
    } finally {
      setShowCancelModal(false);
    }
  };

  // Send Message
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || !selectedChat) return;

    setInputText("");
    try {
      const sentMessage = await apiFetch("/api/messages", {
        method: "POST",
        body: JSON.stringify({ order_id: selectedChat.id, content: text }),
      });
      setChats((prev) =>
        prev.map((c) =>
          c.id === selectedChat.id
            ? {
              ...c,
              lastMessageTime: "Just now",
              messages: [...c.messages, { ...sentMessage, time: formatMsgTime(sentMessage.time) }],
            }
            : c
        )
      );
    } catch (err) {
      setInputText(text); // put the draft back so nothing is lost
      triggerToast(`⚠️ ${err.message}`);
    }
  };

  // Deliver Work Modal Submission
  const handleDeliverSubmit = async (e) => {
    e.preventDefault();
    if (!deliveryNote) {
      alert("Please enter delivery notes or GitHub repository link.");
      return;
    }

    try {
      const data = await apiFetch("/api/messages", {
        method: "PATCH",
        body: JSON.stringify({
          order_id: selectedChat.id,
          action: "deliver",
          delivery_note: deliveryNote,
          delivery_link: deliveryFile,
        }),
      });

      setChats((prev) =>
        prev.map((c) =>
          c.id === selectedChat.id
            ? {
              ...c,
              status: data.status,
              progress: 100,
              messages: data.message
                ? [...c.messages, { ...data.message, time: formatMsgTime(data.message.time) }]
                : c.messages,
            }
            : c
        )
      );

      setShowDeliverModal(false);
      setDeliveryNote("");
      setDeliveryFile("");
      triggerToast(`🎉 Order ${selectedChat.id} completed & submitted for inspection!`);
    } catch (err) {
      triggerToast(`⚠️ ${err.message}`);
    }
  };

  // Report Fraud Submit
  const handleReportSubmit = (e) => {
    e.preventDefault();
    if (reportMessage.length < 40) {
      triggerToast("⚠️ Report description must be at least 40 characters.");
      return;
    }
    if (reportMessage.length > 500) {
      triggerToast("⚠️ Report description cannot exceed 500 characters.");
      return;
    }

    setReportSubmitting(true);
    setTimeout(() => {
      setReportSubmitting(false);
      setShowReportModal(false);
      setReportMessage("");
      setReportCategory("Fraud");
      triggerToast(`🚨 Report for ${selectedChat?.clientName} (#REP-${Math.floor(1000 + Math.random() * 9000)}) sent to Admin.`);
    }, 800);
  };

  // Helper to get last message text for chat card snippet.
  // Uses the full history once it's been fetched (selected chat), otherwise
  // falls back to the lightweight preview the list endpoint already sent.
  const getLastMessageText = (chat) => {
    if (chat.messages?.length > 0) {
      const msg = chat.messages[chat.messages.length - 1];
      return (msg.sender === "me" ? "You: " : "") + msg.text;
    }
    return chat.lastMessagePreview || "No messages yet";
  };

  return (
    <div className="sh-app">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        *, *::before, *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        :root {
          --bg-root: #09090c;
          --bg-surface: #0e0e13;
          --bg-card: #14141a;
          --bg-card-hover: #191922;
          --bg-sidebar: #0b0b0f;
          --bg-input: #121218;
          --bg-muted: #1a1a24;
          --border-subtle: #1e1e28;
          --border-default: #282836;
          --border-active: #3c3c4f;

          --text-primary: #f4f4f7;
          --text-secondary: #9aa0b0;
          --text-muted: #626575;

          --accent-green: #10b981;
          --accent-blue: #38bdf8;
          --accent-amber: #f59e0b;
          --accent-red: #ef4444;

          --radius-sm: 6px;
          --radius-md: 8px;
          --radius-lg: 12px;
          --radius-xl: 14px;
        }

        html, body {
          height: 100vh;
          width: 100vw;
          overflow: hidden;
          background-color: var(--bg-root);
          color: var(--text-primary);
        }

        .sh-app {
          display: flex;
          flex-direction: column;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
        }

        /* TOPBAR */
        .sh-topbar {
          height: 54px;
          min-height: 54px;
          max-height: 54px;
          background: #0b0b0f;
          border-bottom: 1px solid var(--border-subtle);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 18px;
          flex-shrink: 0;
          z-index: 50;
        }

        .sh-logo {
          display: flex;
          align-items: center;
          gap: 9px;
          cursor: pointer;
          text-decoration: none;
        }

        .sh-logo-badge {
          width: 28px;
          height: 28px;
          background: #ffffff;
          color: #09090b;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-md);
          font-weight: 800;
          font-size: 14px;
        }

        .sh-logo-title {
          font-size: 14px;
          font-weight: 700;
          color: #ffffff;
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
          padding: 6px 12px;
          font-size: 12.5px;
          font-weight: 500;
          color: var(--text-secondary);
          background: transparent;
          border: 1px solid transparent;
          border-radius: var(--radius-md);
          cursor: pointer;
          text-decoration: none;
          transition: all 0.15s ease;
        }

        .sh-nav-btn:hover {
          color: #ffffff;
          background: var(--bg-muted);
        }

        .sh-nav-btn.active {
          color: #ffffff;
          background: var(--bg-card);
          border-color: var(--border-default);
        }

        .sh-profile-trigger {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 10px 4px 5px;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .sh-avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #27272a;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
          color: #ffffff;
        }

        .sh-profile-name {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-primary);
          max-width: 100px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .sh-dropdown {
          position: absolute;
          top: 50px;
          right: 18px;
          width: 200px;
          background: var(--bg-sidebar);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.8);
          padding: 5px;
          z-index: 70;
        }

        .sh-dropdown-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 7px 10px;
          font-size: 12px;
          color: var(--text-secondary);
          border-radius: var(--radius-sm);
          cursor: pointer;
          text-decoration: none;
        }

        .sh-dropdown-item:hover {
          background: var(--bg-muted);
          color: #ffffff;
        }

        /* 3-COLUMN COMPACT WORKSPACE (FITS 100% SCREEN) */
        .sh-workspace {
          display: grid;
          grid-template-columns: 260px 1fr 270px;
          height: calc(100vh - 54px);
          width: 100vw;
          max-width: 100%;
          overflow: hidden;
          background: var(--bg-root);
        }

        /* LHS COLUMN: CLEAN CHAT LIST */
        .sh-lhs {
          background: var(--bg-surface);
          border-right: 1px solid var(--border-subtle);
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
        }

        .sh-lhs-header {
          padding: 12px 14px 10px 14px;
          border-bottom: 1px solid var(--border-subtle);
          background: var(--bg-sidebar);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .sh-search-box {
          position: relative;
          width: 100%;
        }

        .sh-search-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          pointer-events: none;
        }

        .sh-search-input {
          width: 100%;
          background: var(--bg-input);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 6px 10px 6px 30px;
          font-size: 12px;
          color: var(--text-primary);
          outline: none;
        }

        .sh-search-input:focus {
          border-color: var(--accent-blue);
        }

        /* TWO TOGGLES: All() and Delivered */
        .sh-two-toggles {
          display: flex;
          gap: 6px;
          padding: 8px 14px;
          background: var(--bg-sidebar);
          border-bottom: 1px solid var(--border-subtle);
        }

        .sh-toggle-btn {
          flex: 1;
          padding: 6px 0;
          font-size: 12px;
          font-weight: 600;
          text-align: center;
          color: var(--text-muted);
          background: transparent;
          border: 1px solid transparent;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .sh-toggle-btn:hover {
          color: var(--text-secondary);
        }

        .sh-toggle-btn.active {
          color: #ffffff;
          background: var(--bg-muted);
          border-color: var(--border-default);
        }

        .sh-chat-list {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }

        .sh-chat-list::-webkit-scrollbar {
          width: 4px;
        }
        .sh-chat-list::-webkit-scrollbar-thumb {
          background: var(--border-subtle);
          border-radius: 4px;
        }

        /* CLEAN MINIMAL CHAT ITEM (JUST NAME & LAST MESSAGE SNIPPET) */
        .sh-chat-item {
          position: relative;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          cursor: pointer;
          border-bottom: 1px solid rgba(32, 32, 42, 0.4);
          transition: all 0.12s ease;
          background: transparent;
        }

        .sh-chat-item:hover {
          background: var(--bg-card-hover);
        }

        .sh-chat-item.active {
          background: rgba(56, 189, 248, 0.08);
          border-left: 3px solid var(--accent-blue);
        }

        .sh-avatar-wrapper {
          position: relative;
          flex-shrink: 0;
        }

        .sh-client-avatar-lhs {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #181822;
          border: 1px solid var(--border-default);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          color: #ffffff;
        }

        .sh-online-dot {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: var(--accent-green);
          border: 2px solid var(--bg-surface);
        }

        .sh-chat-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .sh-chat-top-line {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 4px;
        }

        .sh-chat-name {
          font-size: 13px;
          font-weight: 600;
          color: #ffffff;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .sh-pin-icon-badge {
          color: var(--accent-amber);
          display: inline-flex;
        }

        .sh-chat-time {
          font-size: 10.5px;
          color: var(--text-muted);
          flex-shrink: 0;
        }

        .sh-chat-msg-preview {
          font-size: 11.5px;
          color: var(--text-secondary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* 3-DOTS HOVER BUTTON */
        .sh-chat-actions-btn {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          color: var(--text-secondary);
          width: 24px;
          height: 24px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          opacity: 0;
          transition: all 0.15s ease;
          z-index: 10;
        }

        .sh-chat-item:hover .sh-chat-actions-btn {
          opacity: 1;
        }

        .sh-chat-actions-btn:hover {
          color: #ffffff;
          background: var(--bg-muted);
        }

        .sh-chat-menu {
          position: absolute;
          top: 36px;
          right: 8px;
          width: 160px;
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.8);
          padding: 4px;
          z-index: 50;
        }

        .sh-chat-menu-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 7px 10px;
          font-size: 11.5px;
          font-weight: 500;
          color: var(--text-secondary);
          border-radius: var(--radius-sm);
          cursor: pointer;
          border: none;
          background: transparent;
          width: 100%;
          text-align: left;
        }

        .sh-chat-menu-item:hover {
          background: var(--bg-muted);
          color: #ffffff;
        }

        .sh-chat-menu-item.danger {
          color: #f87171;
        }

        /* CENTER CHAT COLUMN */
        .sh-center-chat {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #090a0e;
          position: relative;
          overflow: hidden;
          min-width: 0;
        }

        .sh-chat-header {
          height: 52px;
          padding: 0 16px;
          border-bottom: 1px solid var(--border-subtle);
          background: #0d0d12;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
          z-index: 10;
        }

        .sh-chat-header-user {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .sh-chat-header-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #1e3a8a;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          color: #ffffff;
          flex-shrink: 0;
        }

        .sh-chat-header-meta h2 {
          font-size: 13.5px;
          font-weight: 700;
          color: #ffffff;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .sh-chat-header-college {
          font-size: 11px;
          color: var(--text-secondary);
        }

        .sh-chat-header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .sh-btn-cancel-order {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 10px;
          font-size: 11.5px;
          font-weight: 600;
          color: #f87171;
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.25);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .sh-btn-cancel-order:hover {
          background: rgba(239, 68, 68, 0.18);
          border-color: #ef4444;
        }

        .sh-btn-complete-order {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 12px;
          font-size: 11.5px;
          font-weight: 700;
          color: #09090b;
          background: #ffffff;
          border: 1px solid #ffffff;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .sh-btn-complete-order:hover {
          background: #e4e4e7;
        }

        /* CHAT MESSAGES SCROLL REGION (ONLY THIS BOX SCROLLS!) */
        .sh-chat-messages-area {
          flex: 1;
          height: 100%;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .sh-chat-messages-area::-webkit-scrollbar {
          width: 5px;
        }
        .sh-chat-messages-area::-webkit-scrollbar-thumb {
          background: var(--border-subtle);
          border-radius: 4px;
        }

        /* ACCEPT ORDER PROMPT INSIDE CHAT */
        .sh-accept-order-prompt {
          background: #13141e;
          border: 1px solid rgba(56, 189, 248, 0.35);
          border-radius: var(--radius-lg);
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
        }

        .sh-accept-prompt-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .sh-accept-prompt-title {
          font-size: 13px;
          font-weight: 700;
          color: #ffffff;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .sh-accept-prompt-price {
          font-size: 14px;
          font-weight: 800;
          color: var(--accent-green);
        }

        .sh-accept-prompt-desc {
          font-size: 12px;
          color: var(--text-secondary);
        }

        .sh-accept-prompt-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .sh-btn-accept-order {
          padding: 7px 14px;
          font-size: 12px;
          font-weight: 700;
          color: #09090b;
          background: var(--accent-green);
          border: 1px solid var(--accent-green);
          border-radius: var(--radius-md);
          cursor: pointer;
        }

        .sh-btn-accept-order:hover {
          background: #34d399;
        }

        /* COMPLETE ORDER PROMPT INSIDE CHAT (FOR IN-PROGRESS) */
        .sh-complete-order-prompt {
          background: rgba(16, 185, 129, 0.06);
          border: 1px solid rgba(16, 185, 129, 0.25);
          border-radius: var(--radius-md);
          padding: 10px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .sh-complete-prompt-text {
          font-size: 12px;
          color: var(--text-primary);
          font-weight: 600;
        }

        .sh-complete-prompt-sub {
          font-size: 11px;
          color: var(--text-muted);
        }

        /* DIVIDER FOR DELIVERED PERSON RECOMMUNICATION */
        .sh-thread-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 12px 0;
          color: var(--text-muted);
          font-size: 11px;
          font-weight: 600;
        }

        .sh-thread-divider::before,
        .sh-thread-divider::after {
          content: "";
          flex: 1;
          height: 1px;
          background: var(--border-default);
        }

        .sh-thread-badge {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          padding: 3px 10px;
          border-radius: 999px;
          color: var(--accent-blue);
        }

        /* MESSAGE BUBBLES */
        .sh-message-row {
          display: flex;
          width: 100%;
        }

        .sh-message-row.me {
          justify-content: flex-end;
        }

        .sh-message-row.them {
          justify-content: flex-start;
        }

        .sh-message-row.system {
          justify-content: center;
        }

        .sh-message-bubble {
          max-width: 70%;
          padding: 9px 13px;
          border-radius: var(--radius-lg);
          display: flex;
          flex-direction: column;
          gap: 3px;
          font-size: 12.5px;
          line-height: 1.4;
        }

        .sh-message-row.me .sh-message-bubble {
          background: #1e3a8a;
          color: #ffffff;
          border-bottom-right-radius: 3px;
        }

        .sh-message-row.them .sh-message-bubble {
          background: var(--bg-card);
          color: var(--text-primary);
          border: 1px solid var(--border-default);
          border-bottom-left-radius: 3px;
        }

        .sh-message-row.system .sh-message-bubble {
          background: rgba(16, 185, 129, 0.08);
          border: 1px dashed rgba(16, 185, 129, 0.3);
          color: var(--accent-green);
          font-size: 11.5px;
          max-width: 90%;
          text-align: center;
        }

        .sh-message-meta {
          align-self: flex-end;
          font-size: 10px;
          color: rgba(255, 255, 255, 0.6);
        }

        .sh-message-row.them .sh-message-meta {
          color: var(--text-muted);
        }

        /* CHAT INPUT BAR */
        .sh-chat-input-bar {
          padding: 10px 16px;
          background: #0d0d12;
          border-top: 1px solid var(--border-subtle);
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .sh-chat-input-form {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--bg-input);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          padding: 4px 6px 4px 12px;
        }

        .sh-chat-input-form:focus-within {
          border-color: var(--accent-blue);
        }

        .sh-chat-text-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: var(--text-primary);
          font-size: 12.5px;
          padding: 4px 0;
        }

        .sh-chat-send-btn {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-md);
          background: var(--accent-blue);
          border: none;
          color: #09090b;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .sh-chat-send-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        /* RHS COLUMN: USER PROFILE & ACTIONS (COMPACT & FITTING) */
        .sh-rhs {
          background: var(--bg-surface);
          border-left: 1px solid var(--border-subtle);
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow-y: auto;
          overflow-x: hidden;
        }

        .sh-rhs::-webkit-scrollbar {
          width: 4px;
        }
        .sh-rhs::-webkit-scrollbar-thumb {
          background: var(--border-subtle);
        }

        .sh-rhs-header {
          padding: 12px 14px;
          border-bottom: 1px solid var(--border-subtle);
          font-size: 12.5px;
          font-weight: 700;
          color: #ffffff;
          background: var(--bg-sidebar);
        }

        .sh-rhs-body {
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .sh-user-profile-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 6px;
          padding: 12px 8px;
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
        }

        .sh-user-profile-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #1e293b;
          border: 2px solid var(--accent-blue);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 800;
          color: #ffffff;
        }

        .sh-user-profile-name {
          font-size: 14px;
          font-weight: 700;
          color: #ffffff;
        }

        .sh-college-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 8px;
          background: rgba(56, 189, 248, 0.1);
          border: 1px solid rgba(56, 189, 248, 0.2);
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
          color: var(--accent-blue);
        }

        /* METRICS 2x2 */
        .sh-metrics-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .sh-metric-box {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 8px 10px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .sh-metric-label {
          font-size: 10px;
          color: var(--text-muted);
          font-weight: 500;
        }

        .sh-metric-value {
          font-size: 12.5px;
          font-weight: 700;
          color: #ffffff;
        }

        .sh-rhs-separator {
          height: 1px;
          background: var(--border-subtle);
          width: 100%;
        }

        /* REPORT FRAUD BUTTON */
        .sh-btn-report-fraud {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          width: 100%;
          padding: 8px 10px;
          font-size: 12px;
          font-weight: 600;
          color: #f87171;
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.25);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .sh-btn-report-fraud:hover {
          background: rgba(239, 68, 68, 0.16);
          border-color: #ef4444;
        }

        /* MODALS */
        .sh-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: 16px;
        }

        .sh-modal-content {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-xl);
          width: 100%;
          max-width: 480px;
          overflow: hidden;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.8);
        }

        .sh-modal-header {
          padding: 14px 18px;
          border-bottom: 1px solid var(--border-subtle);
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--bg-sidebar);
        }

        .sh-modal-title {
          font-size: 14px;
          font-weight: 700;
          color: #ffffff;
        }

        .sh-modal-close {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
        }

        .sh-modal-body {
          padding: 16px 18px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .sh-category-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .sh-cat-btn {
          padding: 5px 10px;
          font-size: 11.5px;
          font-weight: 600;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          cursor: pointer;
        }

        .sh-cat-btn.selected {
          background: rgba(239, 68, 68, 0.15);
          border-color: var(--accent-red);
          color: #ffffff;
        }

        .sh-textarea {
          background: var(--bg-input);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 8px 12px;
          font-size: 12.5px;
          color: var(--text-primary);
          outline: none;
          width: 100%;
          resize: vertical;
          min-height: 90px;
        }

        .sh-modal-footer {
          padding: 12px 18px;
          border-top: 1px solid var(--border-subtle);
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          background: var(--bg-sidebar);
        }

        .sh-btn-modal-cancel {
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
          background: transparent;
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          cursor: pointer;
        }

        .sh-btn-modal-submit {
          padding: 6px 14px;
          font-size: 12px;
          font-weight: 700;
          color: #ffffff;
          background: #dc2626;
          border: 1px solid #dc2626;
          border-radius: var(--radius-md);
          cursor: pointer;
        }

        .sh-btn-modal-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .sh-toast {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: #18181f;
          border: 1px solid var(--border-default);
          color: #ffffff;
          padding: 10px 16px;
          border-radius: var(--radius-md);
          font-size: 12.5px;
          font-weight: 600;
          z-index: 150;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.7);
        }
      `}</style>

      {/* TOPBAR */}
      <header className="sh-topbar">
        <div className="sh-logo" onClick={() => router.push("/dashboard")}>
          <div className="sh-logo-badge">S</div>
          <span className="sh-logo-title">Skills Hive</span>
        </div>

        <div className="sh-nav-links">
          <Link href="/dashboard" className="sh-nav-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="7" height="7" x="3" y="3" rx="1" />
              <rect width="7" height="7" x="14" y="3" rx="1" />
              <rect width="7" height="7" x="14" y="14" rx="1" />
              <rect width="7" height="7" x="3" y="14" rx="1" />
            </svg>
            <span>Dashboard</span>
          </Link>

          <Link href="/messages" className="sh-nav-btn active">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>Messages</span>
          </Link>

          <button type="button" onClick={() => setIsOrdersOpen(true)} className="sh-nav-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <span>Orders</span>
          </button>

          <Link href="/my_listings" className="sh-nav-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            </svg>
            <span>My Listings</span>
          </Link>

          <Link href="/guides" className="sh-nav-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <path d="M12 17h.01" />
            </svg>
            <span>Guide</span>
          </Link>

          <Link href="/wallet" className="sh-nav-btn" style={{ color: "var(--accent-green)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
            <span>Wallet</span>
          </Link>

          <div style={{ position: "relative" }}>
            <div className="sh-profile-trigger" onClick={() => setIsProfileOpen(!isProfileOpen)}>
              <div className="sh-avatar">{getInitials(user?.full_name)}</div>
              <span className="sh-profile-name">{user?.full_name || "Profile"}</span>
            </div>

            {isProfileOpen && (
              <div className="sh-dropdown">
                <div className="sh-dropdown-item" onClick={() => router.push("/profile")}>
                  <span>View Profile</span>
                </div>
                <div className="sh-dropdown-item" onClick={() => router.push("/wallet")}>
                  <span>My Wallet</span>
                </div>
                <div className="sh-dropdown-item" style={{ color: "#f87171" }} onClick={() => setShowLogoutModal(true)}>
                  <span>Log Out</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 3-COLUMN WORKSPACE */}
      <div className="sh-workspace">
        {/* LHS: CHAT LIST WITH TWO TOGGLES */}
        <aside className="sh-lhs">
          <div className="sh-lhs-header">
            <div className="sh-search-box">
              <svg className="sh-search-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                className="sh-search-input"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* TWO TOGGLES: All() and Delivered */}
          <div className="sh-two-toggles">
            <button
              className={`sh-toggle-btn ${chatFilter === "all" ? "active" : ""}`}
              onClick={() => setChatFilter("all")}
            >
              All ({chats.filter((c) => c.status !== "Delivered" && c.status !== "Cancelled").length})
            </button>
            <button
              className={`sh-toggle-btn ${chatFilter === "delivered" ? "active" : ""}`}
              onClick={() => setChatFilter("delivered")}
            >
              Delivered ({chats.filter((c) => c.status === "Delivered").length})
            </button>
          </div>

          {/* CHAT ITEMS LIST */}
          <div className="sh-chat-list">
            {visibleChats.map((chat) => {
              const isSelected = chat.id === selectedChatId;
              const lastSnippet = getLastMessageText(chat);

              return (
                <div
                  key={chat.id}
                  className={`sh-chat-item ${isSelected ? "active" : ""}`}
                  onClick={() => setSelectedChatId(chat.id)}
                >
                  <div className="sh-avatar-wrapper">
                    <div className="sh-client-avatar-lhs">{chat.clientAvatar}</div>
                    {chat.clientOnline && <span className="sh-online-dot" />}
                  </div>

                  <div className="sh-chat-info">
                    <div className="sh-chat-top-line">
                      <div className="sh-chat-name">
                        <span>{chat.clientName}</span>
                        {chat.isPinned && (
                          <span className="sh-pin-icon-badge">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M16 3a1 1 0 0 1 1 1v2.586l1.707 1.707A1 1 0 0 1 19 9v1a1 1 0 0 1-1 1h-5v8l-1 2-1-2v-8H6a1 1 0 0 1-1-1V9a1 1 0 0 1 .293-.707L7 6.586V4a1 1 0 0 1 1-1h8z" />
                            </svg>
                          </span>
                        )}
                      </div>
                      <span className="sh-chat-time">{chat.lastMessageTime}</span>
                    </div>

                    {/* ONLY FIRST TEXT OF LAST MESSAGE */}
                    <div className="sh-chat-msg-preview">{lastSnippet}</div>
                  </div>

                  {/* 3-DOTS HOVER BUTTON */}
                  <button
                    className="sh-chat-actions-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuChatId(activeMenuChatId === chat.id ? null : chat.id);
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="12" r="2" />
                      <circle cx="12" cy="5" r="2" />
                      <circle cx="12" cy="19" r="2" />
                    </svg>
                  </button>

                  {/* 3-DOTS MENU */}
                  {activeMenuChatId === chat.id && (
                    <div className="sh-chat-menu" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="sh-chat-menu-item"
                        onClick={(e) => handleTogglePin(e, chat.id)}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="17" x2="12" y2="22" />
                          <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.89A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.89A2 2 0 0 0 5 15.24Z" />
                        </svg>
                        <span>{chat.isPinned ? "Unpin Chat" : "Pin (Max 3)"}</span>
                      </button>
                      <button
                        className="sh-chat-menu-item danger"
                        onClick={(e) => handleDeleteChat(e, chat.id)}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        </svg>
                        <span>Delete Chat</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {isLoadingChats && (
              <div style={{ padding: "24px 14px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>
                Loading conversations...
              </div>
            )}

            {!isLoadingChats && chatsError && (
              <div style={{ padding: "24px 14px", textAlign: "center", color: "#f87171", fontSize: "12px" }}>
                {chatsError}
              </div>
            )}

            {!isLoadingChats && !chatsError && visibleChats.length === 0 && (
              <div style={{ padding: "24px 14px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>
                No chats in this tab.
              </div>
            )}
          </div>
        </aside>

        {/* CENTER: WHATSAPP CHAT WORKSPACE */}
        <main className="sh-center-chat">
          {selectedChat ? (
            <>
              {/* CHAT HEADER */}
              <div className="sh-chat-header">
                <div className="sh-chat-header-user">
                  <div className="sh-chat-header-avatar">{selectedChat.clientAvatar}</div>
                  <div className="sh-chat-header-meta">
                    <h2>
                      <span>{selectedChat.clientName}</span>
                      <span style={{ fontSize: "10.5px", fontWeight: "600", color: selectedChat.clientOnline ? "var(--accent-green)" : "var(--text-muted)" }}>
                        ● {selectedChat.lastSeen}
                      </span>
                    </h2>
                    <div className="sh-chat-header-college">
                      {selectedChat.clientCollege} • {selectedChat.id}
                    </div>
                  </div>
                </div>

                {/* RHS OF NAME ACTION BUTTONS (CANCEL & COMPLETE) - ONLY VISIBLE TO SELLER */}
                <div className="sh-chat-header-actions">
                  {selectedChat.status === "In Progress" && selectedChat.isSeller && (
                    <>
                      <button
                        className="sh-btn-cancel-order"
                        onClick={() => setShowCancelModal(true)}
                        title="Cancel this order"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                        <span>Cancel Order</span>
                      </button>

                      <button
                        className="sh-btn-complete-order"
                        onClick={() => setShowDeliverModal(true)}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>Complete Order</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* ONLY THIS REGION IS SCROLLABLE */}
              <div className="sh-chat-messages-area" ref={chatScrollRef}>
                {/* 1. IF NEW PENDING ORDER: MUST ACCEPT BEFORE STARTING CHAT */}
                {selectedChat.status === "Pending" && (
                  <div className="sh-accept-order-prompt">
                    <div className="sh-accept-prompt-top">
                      <div className="sh-accept-prompt-title">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                        <span>New Order Request: {selectedChat.orderTitle}</span>
                      </div>
                      <span className="sh-accept-prompt-price">{selectedChat.amount}</span>
                    </div>

                    <div className="sh-accept-prompt-desc">
                      Client <strong>{selectedChat.clientName}</strong> ({selectedChat.clientCollege}) has placed this order. Please accept to initiate contract and unlock active chat.
                    </div>

                    <div className="sh-accept-prompt-actions">
                      <button
                        className="sh-btn-accept-order"
                        onClick={() => handleAcceptOrder(selectedChat.id)}
                      >
                        ✓ Accept New Order
                      </button>
                      <button
                        className="sh-btn-cancel-order"
                        onClick={() => setShowCancelModal(true)}
                      >
                        Decline Order
                      </button>
                    </div>
                  </div>
                )}

                {/* CHAT MESSAGES HISTORY */}
                {selectedChat.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`sh-message-row ${msg.sender === "system" ? "system" : msg.sender === "me" ? "me" : "them"
                      }`}
                  >
                    <div className="sh-message-bubble">
                      <div>{msg.text}</div>
                      {msg.sender !== "system" && (
                        <div className="sh-message-meta">{msg.time}</div>
                      )}
                    </div>
                  </div>
                ))}

                {/* IF DELIVERED: SHOW DIVIDER AND NEW CONVERSATION MESSAGES */}
                {selectedChat.status === "Delivered" && (
                  <>
                    <div className="sh-thread-divider">
                      <span className="sh-thread-badge">
                        Previous Order Completed ({selectedChat.id}) • New Conversation Started
                      </span>
                    </div>

                    {selectedChat.newThreadMessages?.map((msg) => (
                      <div
                        key={msg.id}
                        className={`sh-message-row ${msg.sender === "me" ? "me" : "them"}`}
                      >
                        <div className="sh-message-bubble">
                          <div>{msg.text}</div>
                          <div className="sh-message-meta">{msg.time}</div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* CHAT INPUT BAR */}
              <div className="sh-chat-input-bar">
                <form className="sh-chat-input-form" onSubmit={handleSendMessage}>
                  <input
                    type="text"
                    className="sh-chat-text-input"
                    placeholder={`Message ${selectedChat.clientName}...`}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="sh-chat-send-btn"
                    disabled={!inputText.trim()}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)" }}>
              No chat selected.
            </div>
          )}
        </main>

        {/* RHS: USER FEATURES & REPORT FRAUD */}
        {selectedChat && (
          <aside className="sh-rhs">
            <div className="sh-rhs-header">User Details</div>

            <div className="sh-rhs-body">
              {/* PROFILE CARD */}
              <div className="sh-user-profile-card">
                <div className="sh-user-profile-avatar">{selectedChat.clientAvatar}</div>
                <div className="sh-user-profile-name">{selectedChat.clientName}</div>
                <div className="sh-college-badge">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c3 3 9 3 12 0v-5" />
                  </svg>
                  <span>{selectedChat.clientCollege}</span>
                </div>
              </div>

              {/* FEATURES 2x2 */}
              <div className="sh-metrics-grid">
                <div className="sh-metric-box">
                  <span className="sh-metric-label">Rating</span>
                  <span className="sh-metric-value">★ {selectedChat.rating}</span>
                </div>
                <div className="sh-metric-box">
                  <span className="sh-metric-label">Reviews</span>
                  <span className="sh-metric-value">{selectedChat.reviewsCount}</span>
                </div>
                <div className="sh-metric-box">
                  <span className="sh-metric-label">Total Tasks</span>
                  <span className="sh-metric-value">{selectedChat.totalTasks}</span>
                </div>
                <div className="sh-metric-box">
                  <span className="sh-metric-label">Reputation</span>
                  <span className="sh-metric-value" style={{ color: "var(--accent-blue)", fontSize: "11px" }}>
                    {selectedChat.reputation}
                  </span>
                </div>
              </div>

              <div className="sh-rhs-separator" />

              {/* REPORT FRAUD BUTTON */}
              <button
                className="sh-btn-report-fraud"
                onClick={() => setShowReportModal(true)}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>Report Fraud</span>
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* REPORT FRAUD DIALOG */}
      {showReportModal && (
        <div className="sh-modal-overlay">
          <div className="sh-modal-content">
            <div className="sh-modal-header">
              <h3 className="sh-modal-title">Report User / Fraud</h3>
              <button className="sh-modal-close" onClick={() => setShowReportModal(false)}>✕</button>
            </div>
            <form onSubmit={handleReportSubmit}>
              <div className="sh-modal-body">
                <div>
                  <label style={{ fontSize: "11.5px", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "6px", display: "block" }}>
                    Select Category *
                  </label>
                  <div className="sh-category-pills">
                    {["Fraud", "Harassment", "Fake", "Scam"].map((cat) => (
                      <button
                        type="button"
                        key={cat}
                        className={`sh-cat-btn ${reportCategory === cat ? "selected" : ""}`}
                        onClick={() => setReportCategory(cat)}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "11.5px", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "6px", display: "block" }}>
                    Explanation (Min 40, Max 500 chars) *
                  </label>
                  <textarea
                    className="sh-textarea"
                    placeholder="Describe what occurred with this user in detail..."
                    value={reportMessage}
                    onChange={(e) => setReportMessage(e.target.value)}
                    maxLength={500}
                    required
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginTop: "4px" }}>
                    <span style={{ color: reportMessage.length < 40 ? "#f87171" : "var(--accent-green)" }}>
                      {reportMessage.length < 40 ? `Need ${40 - reportMessage.length} more characters` : "✓ Valid"}
                    </span>
                    <span style={{ color: "var(--text-muted)" }}>{reportMessage.length} / 500</span>
                  </div>
                </div>
              </div>

              <div className="sh-modal-footer">
                <button type="button" className="sh-btn-modal-cancel" onClick={() => setShowReportModal(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="sh-btn-modal-submit"
                  disabled={reportMessage.length < 40 || reportMessage.length > 500 || reportSubmitting}
                >
                  {reportSubmitting ? "Submitting..." : "Send Report to Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELIVER WORK MODAL */}
      {showDeliverModal && (
        <div className="sh-modal-overlay">
          <div className="sh-modal-content">
            <div className="sh-modal-header">
              <h3 className="sh-modal-title">Complete & Deliver Order: {selectedChat?.id}</h3>
              <button className="sh-modal-close" onClick={() => setShowDeliverModal(false)}>✕</button>
            </div>
            <form onSubmit={handleDeliverSubmit}>
              <div className="sh-modal-body">
                <div>
                  <label style={{ fontSize: "11.5px", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "6px", display: "block" }}>
                    Deliverable Repository / Drive Link *
                  </label>
                  <input
                    type="text"
                    className="sh-search-input"
                    placeholder="https://github.com/username/project"
                    value={deliveryFile}
                    onChange={(e) => setDeliveryFile(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: "11.5px", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "6px", display: "block" }}>
                    Delivery Notes *
                  </label>
                  <textarea
                    className="sh-textarea"
                    placeholder="Project notes and instructions for the client..."
                    value={deliveryNote}
                    onChange={(e) => setDeliveryNote(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="sh-modal-footer">
                <button type="button" className="sh-btn-modal-cancel" onClick={() => setShowDeliverModal(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="sh-btn-modal-submit"
                  style={{ background: "#ffffff", color: "#09090b", borderColor: "#ffffff" }}
                >
                  Submit Final Delivery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANCEL ORDER CONFIRM MODAL */}
      {showCancelModal && (
        <div className="sh-modal-overlay">
          <div className="sh-modal-content" style={{ maxWidth: "400px" }}>
            <div className="sh-modal-header">
              <h3 className="sh-modal-title">Cancel Order #{selectedChat?.id}?</h3>
              <button className="sh-modal-close" onClick={() => setShowCancelModal(false)}>✕</button>
            </div>
            <div className="sh-modal-body">
              <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                Are you sure you want to cancel this order? Escrow funds will be returned to <strong>{selectedChat?.clientName}</strong>.
              </p>
            </div>
            <div className="sh-modal-footer">
              <button type="button" className="sh-btn-modal-cancel" onClick={() => setShowCancelModal(false)}>
                Keep Order
              </button>
              <button
                type="button"
                className="sh-btn-modal-submit"
                onClick={handleConfirmCancelOrder}
              >
                Yes, Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOGOUT MODAL */}
      {showLogoutModal && (
        <div className="sh-modal-overlay">
          <div className="sh-modal-content" style={{ maxWidth: "380px" }}>
            <div className="sh-modal-header">
              <h3 className="sh-modal-title">Confirm Logout</h3>
              <button className="sh-modal-close" onClick={() => setShowLogoutModal(false)}>✕</button>
            </div>
            <div className="sh-modal-body">
              <p style={{ fontSize: "12.5px", color: "var(--text-secondary)" }}>
                Are you sure you want to log out?
              </p>
            </div>
            <div className="sh-modal-footer">
              <button type="button" className="sh-btn-modal-cancel" onClick={() => setShowLogoutModal(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="sh-btn-modal-submit"
                onClick={handleLogoutConfirm}
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {showToast && <div className="sh-toast">{toastMessage}</div>}

      {/* ORDERS MODAL BOX */}
      <OrdersModal isOpen={isOrdersOpen} onClose={() => setIsOrdersOpen(false)} />
    </div>
  );
}