"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import OrdersModal from "@/components/OrdersModal";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  // Active Sidebar / Nav Tab: "my_colleges" | "others" | "top_performers" | "college_insights" | "my_listings"
  const [activeTab, setActiveTab] = useState("my_colleges");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Dropdown & Modal States
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // View Details & Offer Modal States
  const [selectedDetailListing, setSelectedDetailListing] = useState(null);
  const [isMakingOffer, setIsMakingOffer] = useState(false);
  const [offerPrice, setOfferPrice] = useState("");
  const [offerNote, setOfferNote] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [sentOffers, setSentOffers] = useState({}); // { [gigId]: { price: string, time: string, note: string } }

  // Post Listing Form State
  const [postForm, setPostForm] = useState({
    title: "",
    category: "Programming & Tech",
    targetAudience: "My College",
    budget: "",
    deliveryDate: "",
    description: "",
    tags: "",
  });

  // Dynamic Categories & Skills from DB `skills` table
  const [categories, setCategories] = useState([]);
  const [skillsList, setSkillsList] = useState([]);
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);

  // Top Performers State & Filters
  const [performerCollegeFilter, setPerformerCollegeFilter] = useState("all"); // "all" | "my_college"
  const [performerSearchQuery, setPerformerSearchQuery] = useState("");
  const [isLoadingPerformers, setIsLoadingPerformers] = useState(false);

  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [dashboardError, setDashboardError] = useState(null);

  // Fetches user details, task listings, and top performers from the API
  const fetchDashboard = async (token) => {
    try {
      setIsLoadingDashboard(true);
      const res = await fetch("/api/dashboard", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.replace("/auth");
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load dashboard");
      }

      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
      setListings(data.listings || []);
      setTopPerformers(data.topPerformers || []);
      if (data.categories && data.categories.length > 0) {
        setCategories(data.categories);
        setSkillsList(data.skills || []);
        setPostForm((prev) => ({
          ...prev,
          category: prev.category || data.categories[0],
        }));
      }
      setDashboardError(null);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setDashboardError("Could not load dashboard data. Please refresh.");
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  // Explicitly fetch skills and categories on demand (e.g. clicking Category / Post Listing)
  const fetchSkillsCategories = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      setIsLoadingSkills(true);
      const res = await fetch("/api/dashboard?action=skills", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.categories && data.categories.length > 0) {
          setCategories(data.categories);
          setSkillsList(data.skills || []);
          setPostForm((prev) => ({
            ...prev,
            category: prev.category || data.categories[0],
          }));
        }
      }
    } catch (err) {
      console.error("Failed to fetch skills/categories:", err);
    } finally {
      setIsLoadingSkills(false);
    }
  };

  // Fetches all users ranked by reputation from /api/top_perfomers
  const fetchTopPerformers = async (college = performerCollegeFilter, search = performerSearchQuery) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      setIsLoadingPerformers(true);
      const res = await fetch(
        `/api/top_perfomers?college=${college}&search=${encodeURIComponent(search)}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setTopPerformers(data.performers || []);
      }
    } catch (err) {
      console.error("Failed to fetch top performers:", err);
    } finally {
      setIsLoadingPerformers(false);
    }
  };

  // Check auth, then load real dashboard data
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/auth");
      return;
    }

    fetchDashboard(token);
    fetchTopPerformers("all", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    if (activeTab === "top_performers") {
      fetchTopPerformers(performerCollegeFilter, performerSearchQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, performerCollegeFilter]);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3500);
  };

  const handleLogoutConfirm = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setShowLogoutModal(false);
    router.replace("/auth");
  };

  // Task Listings — fetched from /api/dashboard (my-college + others, combined)
  const [listings, setListings] = useState([]);

  // Top Performers — fetched from /api/dashboard (own college only)
  const [topPerformers, setTopPerformers] = useState([]);

  // College Insights Data — left as placeholder mock data (out of scope for now)
  const collegeStats = [
    {
      college: "IIT Bombay",
      activeTasks: 38,
      avgBudget: "₹19,400",
      topDomain: "AI Agents & Fullstack",
      totalEarned: "₹18.4L",
      talentIndex: "98/100",
    },
    {
      college: "BITS Pilani",
      activeTasks: 31,
      avgBudget: "₹17,800",
      topDomain: "Web3 & Cloud DevOps",
      totalEarned: "₹15.2L",
      talentIndex: "95/100",
    },
    {
      college: "IIT Delhi",
      activeTasks: 27,
      avgBudget: "₹21,500",
      topDomain: "Smart Contracts & Security",
      totalEarned: "₹16.8L",
      talentIndex: "96/100",
    },
    {
      college: "IIT Madras",
      activeTasks: 24,
      avgBudget: "₹18,100",
      topDomain: "Rust & Core Systems",
      totalEarned: "₹13.9L",
      talentIndex: "94/100",
    },
    {
      college: "IIIT Hyderabad",
      activeTasks: 22,
      avgBudget: "₹20,200",
      topDomain: "Computer Vision & ML",
      totalEarned: "₹14.1L",
      talentIndex: "93/100",
    },
  ];

  // Details Modal Handlers
  const handleOpenDetails = (gig) => {
    setSelectedDetailListing(gig);
    setIsMakingOffer(false);
    const num = gig.budget.replace(/[^0-9]/g, "");
    setOfferPrice(num || "15000");
    setOfferNote("");
  };

  const handleCloseDetails = () => {
    setSelectedDetailListing(null);
    setIsMakingOffer(false);
    setShowConfirmModal(false);
  };

  // Checks if the given listing belongs to the currently logged in user (by isOwner, userId, or email)
  const isOwnerListing = (gig) => {
    if (!gig) return false;
    if (gig.isOwner) return true;
    if (user?.user_id && gig.userId && String(gig.userId) === String(user.user_id)) return true;
    if (user?.email && gig.authorEmail && String(gig.authorEmail).trim().toLowerCase() === String(user.email).trim().toLowerCase()) return true;
    return false;
  };

  const handleOpenMakeOfferForm = () => {
    if (isOwnerListing(selectedDetailListing)) {
      return;
    }
    setIsMakingOffer(true);
  };

  const handlePromptConfirm = (e) => {
    if (e) e.preventDefault();
    if (!offerPrice || isNaN(Number(offerPrice)) || Number(offerPrice) <= 0) {
      alert("Please enter a valid offer price in INR.");
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmSendOffer = async () => {
    if (!selectedDetailListing) return;
    const gigId = selectedDetailListing.id;
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/auth");
      return;
    }

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          task_id: selectedDetailListing.id,
          amount: Number(offerPrice),
          note: offerNote,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit offer");
      }

      setSentOffers((prev) => ({
        ...prev,
        [gigId]: {
          price: offerPrice,
          time: "Just now",
          note: offerNote,
          orderId: data.order?.order_id,
        },
      }));
      setShowConfirmModal(false);
      setIsMakingOffer(false);
      triggerToast(`🎉 Offer of ₹${Number(offerPrice).toLocaleString("en-IN")} sent to ${selectedDetailListing.author}!`);
    } catch (err) {
      console.error("Offer send error:", err);
      triggerToast(`⚠️ ${err.message || "Could not submit offer"}`);
      setShowConfirmModal(false);
    }
  };

  const getMinDeliveryDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const dd = String(tomorrow.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!postForm.title || !postForm.budget) {
      alert("Please fill in the required fields");
      return;
    }

    if (postForm.deliveryDate) {
      const minDate = getMinDeliveryDate();
      if (postForm.deliveryDate < minDate) {
        alert("Delivery date must be at least tomorrow. You cannot select today or past dates.");
        return;
      }
    }

    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/auth");
      return;
    }

    const rawBudget = String(postForm.budget).replace(/[^0-9.]/g, "");

    try {
      const res = await fetch("/api/dashboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: postForm.title,
          description:
            postForm.description ||
            `Comprehensive task assignment in ${postForm.category}. Looking for motivated collegiate engineers to fulfill deliverables on schedule.`,
          category: postForm.category,
          max_budget: Number(rawBudget) || 0,
          end_date: postForm.deliveryDate || null,
          role_type: "remote",
          target: postForm.targetAudience === "My College" ? "own_college" : "others",
          tags: postForm.tags
            ? postForm.tags.split(",").map((t) => t.trim()).filter(Boolean)
            : ["Custom Task", postForm.category],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to publish listing");
        return;
      }

      setListings([data.task, ...listings]);
      setShowPostModal(false);
      setPostForm({
        title: "",
        category: categories[0] || "Programming & Tech",
        targetAudience: "My College",
        budget: "",
        deliveryDate: "",
        description: "",
        tags: "",
      });
      triggerToast("Listing published successfully!");
    } catch (err) {
      console.error("Post listing error:", err);
      alert("Something went wrong while publishing your listing.");
    }
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

  // Filter listings based on tab, category, search
  const filteredListings = listings.filter((item) => {
    if (activeTab === "my_colleges" && !item.isMyCollege) return false;
    if (activeTab === "others" && item.isMyCollege) return false;
    if (activeTab === "my_listings" && !item.isOwner) return false;

    if (selectedCategory !== "All" && item.category !== selectedCategory) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchAuthor = item.author.toLowerCase().includes(q);
      const matchCollege = item.college.toLowerCase().includes(q);
      const matchTags = item.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchAuthor && !matchCollege && !matchTags) return false;
    }

    return true;
  });

  return (
    <div className="sh-app">
      {/* SHADCN-INSPIRED DESIGN SYSTEM INLINE CSS */}
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
          user-select: none;
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

        /* PROFILE BUTTON & DROPDOWN */
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
          user-select: none;
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
          width: 230px;
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

        /* MAIN LAYOUT WRAPPER */
        .sh-layout {
          max-width: 1400px;
          margin: 0 auto;
          padding: 24px;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 24px;
          flex: 1;
        }

        /* HERO WELCOME SECTION */
        .sh-hero {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-xl);
          padding: 22px 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }

        .sh-hero-text h1 {
          font-size: 20px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: -0.02em;
        }

        .sh-hero-text p {
          font-size: 13px;
          color: var(--text-secondary);
          margin-top: 4px;
        }

        .sh-hero-badges {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .sh-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 500;
          border-radius: var(--radius-md);
          background: var(--bg-muted);
          border: 1px solid var(--border-subtle);
          color: var(--text-secondary);
        }

        .sh-chip-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--accent-green);
        }

        /* TWO COLUMN MAIN AREA */
        .sh-main-grid {
          display: grid;
          grid-template-columns: 260px minmax(0, 1fr);
          gap: 24px;
          align-items: start;
          width: 100%;
        }

        /* LEFT SIDEBAR FILTERS */
        .sh-sidebar {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-xl);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          position: sticky;
          top: 84px;
        }

        /* PRIMARY ACTION BUTTON */
        .sh-btn-post {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 16px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-inverse);
          background: #ffffff;
          border: 1px solid #ffffff;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .sh-btn-post:hover {
          background: #e4e4e7;
          border-color: #e4e4e7;
          transform: translateY(-1px);
        }

        .sh-btn-post:active {
          transform: translateY(0);
        }

        /* SIDEBAR GROUPS */
        .sh-nav-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .sh-group-title {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--text-muted);
          padding: 4px 10px;
          margin-bottom: 2px;
        }

        .sh-sidebar-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 9px 12px;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
          background: transparent;
          border: 1px solid transparent;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: left;
          width: 100%;
        }

        .sh-sidebar-item:hover {
          color: #ffffff;
          background: var(--bg-muted);
        }

        .sh-sidebar-item.active {
          color: #ffffff;
          background: #27272a;
          border-color: var(--border-default);
          font-weight: 600;
        }

        .sh-item-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .sh-item-count {
          font-size: 11px;
          font-weight: 600;
          padding: 2px 7px;
          border-radius: 999px;
          background: var(--bg-muted);
          color: var(--text-muted);
          border: 1px solid var(--border-subtle);
        }

        .sh-sidebar-item.active .sh-item-count {
          background: var(--bg-card);
          color: #ffffff;
          border-color: var(--border-active);
        }

        /* CONTENT HEADER & CONTROLS */
        .sh-content-area {
          display: flex;
          flex-direction: column;
          gap: 20px;
          min-width: 0;
          width: 100%;
        }

        .sh-content-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
          width: 100%;
        }

        .sh-search-box {
          position: relative;
          flex: 1;
          min-width: 240px;
          max-width: 420px;
        }

        .sh-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          pointer-events: none;
        }

        .sh-search-input {
          width: 100%;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 8px 12px 8px 36px;
          font-size: 13px;
          color: var(--text-primary);
          outline: none;
          transition: border-color 0.15s ease;
        }

        .sh-search-input:focus {
          border-color: var(--border-active);
        }

        .sh-search-input::placeholder {
          color: var(--text-muted);
        }

        .sh-category-pills {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          width: 100%;
        }

        .sh-cat-btn {
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 500;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          color: var(--text-secondary);
          border-radius: var(--radius-md);
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s ease;
        }

        .sh-cat-btn:hover {
          color: #ffffff;
          border-color: var(--border-default);
        }

        .sh-cat-btn.active {
          background: #ffffff;
          color: #09090b;
          border-color: #ffffff;
          font-weight: 600;
        }

        /* CARDS GRID FOR LISTINGS */
        .sh-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 16px;
          width: 100%;
        }

        .sh-card {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 16px;
          transition: all 0.18s ease;
          min-width: 0;
          width: 100%;
          box-sizing: border-box;
        }

        .sh-card:hover {
          background: var(--bg-card-hover);
          border-color: var(--border-default);
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.4);
        }

        /* CARD USER ROW */
        .sh-card-user {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .sh-user-left {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .sh-card-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #27272a;
          border: 1px solid var(--border-default);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          color: #ffffff;
          flex-shrink: 0;
        }

        .sh-user-info {
          min-width: 0;
        }

        .sh-user-name {
          font-size: 13px;
          font-weight: 600;
          color: #ffffff;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .sh-user-college {
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 1px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* CLEAN FONT CATEGORY DISPLAY (REMOVED BOXED TAG PILL) */
        .sh-card-category-font {
          font-size: 12px;
          font-weight: 500;
          color: var(--accent-blue);
          letter-spacing: -0.01em;
          white-space: nowrap;
          flex-shrink: 0;
        }

        /* CARD MAIN CONTENT */
        .sh-card-body {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .sh-task-title {
          font-size: 14px;
          font-weight: 600;
          color: #ffffff;
          line-height: 1.45;
        }

        .sh-tags-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .sh-tag {
          font-size: 11px;
          padding: 2px 7px;
          border-radius: var(--radius-sm);
          background: var(--bg-muted);
          color: var(--text-secondary);
          border: 1px solid var(--border-subtle);
        }

        /* CARD FOOTER */
        .sh-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 12px;
          border-top: 1px solid var(--border-subtle);
          gap: 10px;
        }

        .sh-footer-meta {
          display: flex;
          flex-direction: column;
        }

        .sh-meta-label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--text-muted);
          font-weight: 600;
        }

        .sh-meta-value {
          font-size: 14px;
          font-weight: 700;
          color: var(--accent-green);
          margin-top: 2px;
        }

        .sh-meta-delivery {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-secondary);
          margin-top: 2px;
        }

        /* VIEW DETAILS BUTTON ON CARD */
        .sh-view-details-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          font-size: 12px;
          font-weight: 600;
          color: #ffffff;
          background: var(--bg-muted);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
        }

        .sh-view-details-btn:hover {
          background: #ffffff;
          color: #09090b;
          border-color: #ffffff;
        }

        .sh-view-details-btn.offer-sent {
          background: rgba(16, 185, 129, 0.12);
          border-color: rgba(16, 185, 129, 0.35);
          color: var(--accent-green);
        }

        .sh-view-details-btn.offer-sent:hover {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
          border-color: var(--accent-green);
        }

        /* TOP PERFORMERS VIEW */
        .sh-performer-card {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 16px;
          transition: all 0.18s ease;
        }

        .sh-performer-card:hover {
          background: var(--bg-card-hover);
          border-color: var(--border-default);
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.4);
        }

        .sh-rank-pill {
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: var(--radius-sm);
          background: rgba(245, 158, 11, 0.12);
          color: var(--accent-amber);
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .sh-stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          background: var(--bg-muted);
          padding: 12px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-subtle);
        }

        .sh-stat-box {
          display: flex;
          flex-direction: column;
        }

        .sh-stat-title {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--text-muted);
          font-weight: 600;
        }

        .sh-stat-num {
          font-size: 13px;
          font-weight: 700;
          color: #ffffff;
          margin-top: 2px;
        }

        /* COLLEGE INSIGHTS VIEW */
        .sh-insights-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .sh-insights-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .sh-insight-metric {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .sh-metric-title {
          font-size: 12px;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .sh-metric-val {
          font-size: 22px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: -0.02em;
        }

        .sh-metric-sub {
          font-size: 11px;
          color: var(--accent-green);
          font-weight: 500;
        }

        .sh-table-card {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }

        .sh-table-header {
          padding: 16px 20px;
          border-bottom: 1px solid var(--border-subtle);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .sh-table-title {
          font-size: 14px;
          font-weight: 600;
          color: #ffffff;
        }

        .sh-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .sh-table th {
          padding: 12px 20px;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          font-weight: 600;
          background: var(--bg-sidebar);
          border-bottom: 1px solid var(--border-subtle);
        }

        .sh-table td {
          padding: 14px 20px;
          font-size: 13px;
          color: var(--text-primary);
          border-bottom: 1px solid var(--border-subtle);
        }

        .sh-table tr:last-child td {
          border-bottom: none;
        }

        .sh-table tr:hover td {
          background: var(--bg-card-hover);
        }

        /* MODALS */
        .sh-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.78);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
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
          max-width: 520px;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.8);
          overflow: hidden;
          animation: modalFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
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
          padding: 4px 8px;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-sm);
          transition: all 0.15s ease;
        }

        .sh-modal-close:hover {
          color: #ffffff;
          background: var(--bg-muted);
        }

        .sh-modal-body {
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-height: 75vh;
          overflow-y: auto;
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

        .sh-input, .sh-select, .sh-textarea {
          background: var(--bg-input);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 9px 12px;
          font-size: 13px;
          color: var(--text-primary);
          outline: none;
          transition: border-color 0.15s ease;
          width: 100%;
        }

        .sh-input:focus, .sh-select:focus, .sh-textarea:focus {
          border-color: var(--border-active);
        }

        .sh-textarea {
          resize: vertical;
          min-height: 80px;
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

        .sh-btn-secondary {
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
          background: var(--bg-muted);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .sh-btn-secondary:hover {
          color: #ffffff;
          background: #27272a;
        }

        .sh-btn-danger {
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 600;
          color: #ffffff;
          background: #dc2626;
          border: 1px solid #dc2626;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .sh-btn-danger:hover {
          background: #b91c1c;
        }

        .sh-btn-submit {
          padding: 9px 20px;
          font-size: 13px;
          font-weight: 600;
          color: #09090b;
          background: #ffffff;
          border: 1px solid #ffffff;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .sh-btn-submit:hover {
          background: #e4e4e7;
          transform: translateY(-1px);
        }

        .sh-btn-submit:active {
          transform: translateY(0);
        }

        /* DYNAMIC SKILL CHIP TAGS */
        .sh-skill-chip-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: var(--radius-sm);
          padding: 3px 8px;
          font-size: 11px;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.15s ease;
          font-family: inherit;
        }

        .sh-skill-chip-tag:hover {
          background: rgba(16, 185, 129, 0.15);
          border-color: rgba(16, 185, 129, 0.4);
          color: var(--accent-green);
        }

        .sh-skill-chip-tag.selected {
          background: rgba(16, 185, 129, 0.2);
          border-color: var(--accent-green);
          color: var(--accent-green);
          font-weight: 500;
        }

        /* VIEW DETAILS MODAL SPECIFIC STYLES */
        .sh-details-modal-content {
          max-width: 680px;
        }

        .sh-detail-image-box {
          position: relative;
          width: 100%;
          height: 230px;
          border-radius: var(--radius-lg);
          overflow: hidden;
          border: 1px solid var(--border-subtle);
          background: #18181c;
        }

        .sh-detail-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .sh-detail-img-badge {
          position: absolute;
          bottom: 12px;
          left: 12px;
          background: rgba(9, 9, 11, 0.85);
          backdrop-filter: blur(8px);
          padding: 4px 10px;
          border-radius: var(--radius-sm);
          font-size: 11px;
          font-weight: 600;
          color: var(--accent-blue);
          border: 1px solid rgba(56, 189, 248, 0.3);
        }

        .sh-detail-user-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: var(--bg-muted);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-subtle);
          flex-wrap: wrap;
          gap: 10px;
        }

        .sh-detail-user-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .sh-detail-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #27272a;
          border: 1px solid var(--border-default);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 700;
          color: #ffffff;
        }

        .sh-detail-stats-bar {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .sh-detail-stat-card {
          background: var(--bg-input);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 10px 14px;
        }

        .sh-detail-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .sh-detail-section-title {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .sh-detail-desc-text {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.65;
          background: var(--bg-input);
          border: 1px solid var(--border-subtle);
          padding: 14px 16px;
          border-radius: var(--radius-md);
        }

        .sh-req-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 13px;
          color: var(--text-primary);
          line-height: 1.5;
        }

        .sh-req-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--accent-blue);
          margin-top: 7px;
          flex-shrink: 0;
        }

        /* MAKE OFFER EXPANDABLE PANEL */
        .sh-offer-panel {
          background: #16161b;
          border: 1px solid rgba(16, 185, 129, 0.35);
          border-radius: var(--radius-lg);
          padding: 16px 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          animation: modalFadeIn 0.2s ease-out;
        }

        .sh-offer-price-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .sh-price-input-wrapper {
          flex: 1;
          display: flex;
          align-items: center;
          background: var(--bg-input);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          padding: 0 12px;
          transition: border-color 0.15s ease;
        }

        .sh-price-input-wrapper:focus-within {
          border-color: var(--accent-green);
          box-shadow: 0 0 0 1px rgba(16, 185, 129, 0.4);
        }

        .sh-currency-symbol {
          font-size: 16px;
          font-weight: 700;
          color: var(--accent-green);
          margin-right: 6px;
        }

        .sh-custom-price-input {
          width: 100%;
          background: transparent;
          border: none;
          color: #ffffff;
          font-size: 16px;
          font-weight: 700;
          padding: 10px 0;
          outline: none;
        }

        .sh-price-quick-btns {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .sh-quick-btn {
          font-size: 11px;
          font-weight: 600;
          padding: 4px 8px;
          background: var(--bg-muted);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .sh-quick-btn:hover {
          color: #ffffff;
          border-color: var(--border-default);
          background: #27272a;
        }

        /* OFFER SENT BADGE BUTTON */
        .sh-btn-offer-sent-state {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 20px;
          font-size: 13px;
          font-weight: 600;
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.4);
          color: var(--accent-green);
          border-radius: var(--radius-md);
          cursor: default;
          box-shadow: 0 0 12px rgba(16, 185, 129, 0.15);
        }

        /* TOAST NOTIFICATION */
        .sh-toast {
          position: fixed;
          bottom: 24px;
          right: 24px;
          background: #18181b;
          border: 1px solid var(--border-default);
          color: #ffffff;
          padding: 12px 18px;
          border-radius: var(--radius-md);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          font-weight: 500;
          z-index: 120;
          animation: slideUp 0.2s ease-out;
        }

        @keyframes slideUp {
          from {
            transform: translateY(12px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        /* EMPTY STATE */
        .sh-empty-state {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 48px 24px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .sh-empty-title {
          font-size: 15px;
          font-weight: 600;
          color: #ffffff;
        }

        .sh-empty-desc {
          font-size: 13px;
          color: var(--text-secondary);
          max-width: 400px;
        }

        /* RESPONSIVE */
        @media (max-width: 960px) {
          .sh-main-grid {
            grid-template-columns: 1fr;
          }

          .sh-sidebar {
            position: relative;
            top: 0;
          }
        }

        @media (max-width: 640px) {
          .sh-topbar-inner {
            padding: 0 16px;
          }

          .sh-layout {
            padding: 16px;
          }

          .sh-grid {
            grid-template-columns: 1fr;
          }

          .sh-detail-stats-bar {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* TOP NAVIGATION BAR */}
      <header className="sh-topbar">
        <div className="sh-topbar-inner">
          {/* LOGO */}
          <div className="sh-logo" onClick={() => router.push("/")}>
            <div className="sh-logo-badge">S</div>
            <span className="sh-logo-title">Skills Hive</span>
          </div>

          {/* TOP NAV ITEMS: DASHBOARD | MESSAGES | ORDERS | MY LISTINGS | GUIDE | WALLET | PROFILE */}
          <div className="sh-nav-links">
            <Link href="/dashboard" className="sh-nav-btn active">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="7" height="7" x="3" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="14" rx="1" />
                <rect width="7" height="7" x="3" y="14" rx="1" />
              </svg>
              <span>Dashboard</span>
            </Link>

            {/* Messages Tab between Dashboard and Orders */}
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

            {/* MY EARNINGS / WALLET PILL */}
            <Link href="/wallet" className="sh-earnings-pill" title="View My Earnings & Wallet">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--accent-green)" }}>
                <rect width="20" height="14" x="2" y="5" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
              <span className="sh-earnings-val">Wallet</span>
            </Link>

            {/* PROFILE TRIGGER & POPUP */}
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
      <div className="sh-layout">
        {/* HERO SECTION */}
        <section className="sh-hero">
          <div className="sh-hero-text">
            <h1>Welcome, {user?.full_name ? user.full_name : ""}</h1>
            <p>Explore verified collegiate gigs, campus talent, and real-time skill insights.</p>
            {dashboardError && (
              <p style={{ color: "#f87171", fontSize: "13px", marginTop: "8px" }}>{dashboardError}</p>
            )}
          </div>

          <div className="sh-hero-badges">
            <div className="sh-chip">
              <span className="sh-chip-dot"></span>
              <span>Campus Live: {user?.college || "Unaffiliated"}</span>
            </div>
            <div className="sh-chip">
              <span>{listings.length} Active Gigs</span>
            </div>
          </div>
        </section>

        {/* 2-COLUMN DASHBOARD */}
        <div className="sh-main-grid">
          {/* LEFT SIDEBAR FILTERS */}
          <aside className="sh-sidebar">
            {/* PRIMARY ACTION BUTTON */}
            <button
              className="sh-btn-post"
              onClick={() => {
                setShowPostModal(true);
                fetchSkillsCategories();
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>Post Listing</span>
            </button>

            {/* SECTION: LISTINGS */}
            <div className="sh-nav-group">
              <div className="sh-group-title">Listings</div>

              {/* SELECTOR 1: MY COLLEGES */}
              <button
                className={`sh-sidebar-item ${activeTab === "my_colleges" ? "active" : ""}`}
                onClick={() => setActiveTab("my_colleges")}
              >
                <div className="sh-item-left">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  <span>My Colleges</span>
                </div>
                <span className="sh-item-count">
                  {listings.filter((g) => g.isMyCollege).length}
                </span>
              </button>

              {/* SELECTOR 2: OTHERS */}
              <button
                className={`sh-sidebar-item ${activeTab === "others" ? "active" : ""}`}
                onClick={() => setActiveTab("others")}
              >
                <div className="sh-item-left">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  <span>Others</span>
                </div>
                <span className="sh-item-count">
                  {listings.filter((g) => !g.isMyCollege).length}
                </span>
              </button>
            </div>

            {/* SECTION: INSIGHTS */}
            <div className="sh-nav-group">
              <div className="sh-group-title">Insights</div>

              {/* SELECTOR 1: TOP PERFORMERS */}
              <button
                className={`sh-sidebar-item ${activeTab === "top_performers" ? "active" : ""}`}
                onClick={() => setActiveTab("top_performers")}
              >
                <div className="sh-item-left">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                    <path d="M4 22h16" />
                    <path d="M10 14.66V17c0 .55-.45 1-1 1H7c-.55 0-1-.45-1-1v-2.34" />
                    <path d="M14 14.66V17c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-2.34" />
                    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                  </svg>
                  <span>Top Performers</span>
                </div>
                <span className="sh-item-count">{topPerformers.length}</span>
              </button>

              {/* SELECTOR 2: COLLEGE INSIGHTS */}
              <button
                className={`sh-sidebar-item ${activeTab === "college_insights" ? "active" : ""}`}
                onClick={() => setActiveTab("college_insights")}
              >
                <div className="sh-item-left">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                  <span>College Insights</span>
                </div>
              </button>
            </div>
          </aside>

          {/* MAIN CONTENT AREA */}
          <main className="sh-content-area">
            {/* VIEW 1: MY COLLEGES / OTHERS / MY LISTINGS */}
            {(activeTab === "my_colleges" || activeTab === "others" || activeTab === "my_listings") && (
              <>
                {/* SEARCH & CATEGORY CONTROLS */}
                <div className="sh-content-header">
                  <div className="sh-search-box">
                    <svg className="sh-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                      type="text"
                      className="sh-search-input"
                      placeholder="Search tasks, skills, or colleges..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="sh-category-pills">
                    {["All", ...(categories.length > 0 ? categories : ["Programming & Tech", "AI Services", "Graphics & Design", "Data", "Digital Marketing", "Business"])].map((cat) => (
                      <button
                        key={cat}
                        className={`sh-cat-btn ${selectedCategory === cat ? "active" : ""}`}
                        onClick={() => setSelectedCategory(cat)}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* LISTINGS CARDS */}
                {filteredListings.length === 0 ? (
                  <div className="sh-empty-state">
                    <div className="sh-empty-title">No listings found</div>
                    <div className="sh-empty-desc">
                      {activeTab === "my_listings"
                        ? "You haven't posted any listings yet. Click 'Post Listing' in the sidebar to create one."
                        : "Try adjusting your search filters or check another category."}
                    </div>
                  </div>
                ) : (
                  <div className="sh-grid">
                    {filteredListings.map((gig) => {
                      const hasSentOffer = Boolean(sentOffers[gig.id]);
                      return (
                        <div key={gig.id} className="sh-card">
                          {/* USER ROW: Name, College Name, and Category slid in cleanly as text font */}
                          <div className="sh-card-user">
                            <div className="sh-user-left">
                              <div className="sh-card-avatar">{gig.initials}</div>
                              <div className="sh-user-info">
                                <div className="sh-user-name">{gig.author}</div>
                                <div className="sh-user-college">{gig.college}</div>
                              </div>
                            </div>
                            {/* Slide category in cleanly as smooth text font */}
                            <span className="sh-card-category-font">{gig.category}</span>
                          </div>

                          {/* BODY */}
                          <div className="sh-card-body">
                            <h3 className="sh-task-title">{gig.title}</h3>
                            <div className="sh-tags-list">
                              {gig.tags.map((t, idx) => (
                                <span key={idx} className="sh-tag">
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* FOOTER */}
                          <div className="sh-card-footer">
                            <div className="sh-footer-meta">
                              <span className="sh-meta-label">Budget</span>
                              <span className="sh-meta-value">{gig.budget}</span>
                            </div>

                            <div className="sh-footer-meta" style={{ textAlign: "right" }}>
                              <span className="sh-meta-label">Timeline</span>
                              <span className="sh-meta-delivery">{gig.deliveryDate}</span>
                            </div>

                            {/* VIEW DETAILS BUTTON */}
                            <button
                              className={`sh-view-details-btn ${hasSentOffer ? "offer-sent" : ""}`}
                              onClick={() => handleOpenDetails(gig)}
                            >
                              {hasSentOffer ? (
                                <>
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                  <span>Offer Sent</span>
                                </>
                              ) : (
                                <>
                                  <span>View Details</span>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m9 18 6-6-6-6" />
                                  </svg>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* VIEW 2: TOP PERFORMERS */}
            {activeTab === "top_performers" && (
              <>
                {/* TOP CONTROLS FOR TOP PERFORMERS */}
                <div className="sh-content-header">
                  <div className="sh-search-box">
                    <svg className="sh-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                      type="text"
                      className="sh-search-input"
                      placeholder="Search performers by name, branch, skills, or college..."
                      value={performerSearchQuery}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPerformerSearchQuery(val);
                        fetchTopPerformers(performerCollegeFilter, val);
                      }}
                    />
                  </div>

                  <div className="sh-category-pills">
                    <button
                      className={`sh-cat-btn ${performerCollegeFilter === "all" ? "active" : ""}`}
                      onClick={() => {
                        setPerformerCollegeFilter("all");
                        fetchTopPerformers("all", performerSearchQuery);
                      }}
                    >
                      All Colleges
                    </button>
                    <button
                      className={`sh-cat-btn ${performerCollegeFilter === "my_college" ? "active" : ""}`}
                      onClick={() => {
                        setPerformerCollegeFilter("my_college");
                        fetchTopPerformers("my_college", performerSearchQuery);
                      }}
                    >
                      From My College {user?.college ? `(${user.college})` : ""}
                    </button>
                  </div>
                </div>

                {isLoadingPerformers ? (
                  <div style={{ textAlign: "center", padding: "60px 24px", color: "var(--text-muted)" }}>
                    <div style={{ display: "inline-block", width: "26px", height: "26px", border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite", marginBottom: "12px" }}></div>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    <p style={{ fontSize: "14px", fontWeight: 500 }}>Loading campus performers...</p>
                  </div>
                ) : topPerformers.length === 0 ? (
                  <div className="sh-empty-state">
                    <div className="sh-empty-title">No performers found</div>
                    <div className="sh-empty-desc">
                      {performerCollegeFilter === "my_college"
                        ? "No users found from your college yet. Switch to 'All Colleges' to view talent across all universities."
                        : "Try adjusting your search query."}
                    </div>
                  </div>
                ) : (
                  <div className="sh-grid">
                    {topPerformers.map((performer) => (
                      <div key={performer.id} className="sh-performer-card">
                        {/* TOP ROW */}
                        <div className="sh-card-user">
                          <div className="sh-user-left">
                            <div
                              className="sh-card-avatar"
                              style={{
                                border:
                                  performer.rankNumber === 1
                                    ? "2px solid #f59e0b"
                                    : performer.rankNumber === 2
                                    ? "2px solid #94a3b8"
                                    : performer.rankNumber === 3
                                    ? "2px solid #d97706"
                                    : "1px solid var(--border-default)",
                              }}
                            >
                              {performer.initials}
                            </div>
                            <div className="sh-user-info">
                              <div className="sh-user-name" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span>{performer.name}</span>
                                {performer.isMe && (
                                  <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "4px", background: "rgba(56, 189, 248, 0.15)", color: "var(--accent-blue)", fontWeight: 600 }}>
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="sh-user-college">{performer.college}</div>
                            </div>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            {performer.isMyCollege && !performer.isMe && (
                              <span style={{ fontSize: "10px", fontWeight: 600, padding: "2px 6px", borderRadius: "4px", background: "rgba(16, 185, 129, 0.12)", color: "var(--accent-green)", border: "1px solid rgba(16, 185, 129, 0.25)" }}>
                                Campus Peer
                              </span>
                            )}
                            <span className="sh-rank-pill">{performer.rank}</span>
                          </div>
                        </div>

                        {/* AVAILABILITY & LOCATION META ROW */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", fontSize: "11px", color: "var(--text-muted)", padding: "0 2px" }}>
                          {/* Availability status badge */}
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                            <span style={{
                              width: "7px",
                              height: "7px",
                              borderRadius: "50%",
                              background:
                                performer.availability_status === "available"
                                  ? "var(--accent-green)"
                                  : performer.availability_status === "busy"
                                  ? "var(--accent-amber)"
                                  : "var(--text-muted)",
                              boxShadow: performer.availability_status === "available" ? "0 0 8px rgba(16, 185, 129, 0.6)" : "none"
                            }} />
                            <span style={{
                              fontWeight: 600,
                              color:
                                performer.availability_status === "available"
                                  ? "var(--accent-green)"
                                  : performer.availability_status === "busy"
                                  ? "var(--accent-amber)"
                                  : "var(--text-muted)"
                            }}>
                              {performer.availabilityLabel || (performer.availability_status === "available" ? "Available Now" : performer.availability_status === "busy" ? "Busy" : "Unavailable")}
                            </span>
                          </div>

                          {/* Location */}
                          {performer.location && (
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "var(--text-secondary)" }}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                                <circle cx="12" cy="10" r="3" />
                              </svg>
                              <span>{performer.location}</span>
                            </div>
                          )}
                        </div>

                        {/* BODY: Domain & Skills */}
                        <div className="sh-card-body">
                          <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
                            Specialization & Focus
                          </div>
                          <h3 className="sh-task-title" style={{ fontSize: "14px" }}>{performer.domain}</h3>

                          {performer.skills && performer.skills.length > 0 && (
                            <div className="sh-tags-list">
                              {performer.skills.map((s, idx) => (
                                <span key={idx} className="sh-tag">{s}</span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* STATS MATRIX: Reputation, Completed, Posted, Earnings */}
                        <div className="sh-stats-grid">
                          <div className="sh-stat-box">
                            <span className="sh-stat-title">Reputation Score</span>
                            <span className="sh-stat-num" style={{ color: "var(--accent-amber)" }}>
                              {performer.reputation_score} pts
                            </span>
                          </div>
                          <div className="sh-stat-box">
                            <span className="sh-stat-title">Completed Gigs</span>
                            <span className="sh-stat-num">{performer.total_gigs_completed} Completed</span>
                          </div>
                          <div className="sh-stat-box">
                            <span className="sh-stat-title">Total Earnings</span>
                            <span className="sh-stat-num" style={{ color: "var(--accent-green)" }}>{performer.totalEarned}</span>
                          </div>
                          <div className="sh-stat-box">
                            <span className="sh-stat-title">Tasks Posted</span>
                            <span className="sh-stat-num">{performer.total_gigs_posted} Posted</span>
                          </div>
                        </div>

                        {/* FOOTER */}
                        <div className="sh-card-footer">
                          {performer.isMe ? (
                            <div style={{
                              width: "100%",
                              textAlign: "center",
                              padding: "8px",
                              fontSize: "12px",
                              fontWeight: 600,
                              color: "var(--text-muted)",
                              background: "rgba(255, 255, 255, 0.04)",
                              borderRadius: "var(--radius-md)",
                              border: "1px solid var(--border-subtle)"
                            }}>
                              Your Profile Ranking
                            </div>
                          ) : (
                            <button
                              className="sh-view-details-btn"
                              style={{ width: "100%", justifyContent: "center" }}
                              onClick={() => triggerToast(`Contact request sent to ${performer.name}! They will reach out in messages.`)}
                            >
                              <span>Hire {performer.name.split(" ")[0]}</span>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 12h14" />
                                <path d="m12 5 7 7-7 7" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* VIEW 3: COLLEGE INSIGHTS */}
            {activeTab === "college_insights" && (
              <div className="sh-insights-container">
                {/* METRICS ROW */}
                <div className="sh-insights-stats">
                  <div className="sh-insight-metric">
                    <span className="sh-metric-title">Total Collegiate Volume</span>
                    <span className="sh-metric-val">₹68.4 Lakhs</span>
                    <span className="sh-metric-sub">+18.5% this month</span>
                  </div>
                  <div className="sh-insight-metric">
                    <span className="sh-metric-title">Active Campus Hubs</span>
                    <span className="sh-metric-val">24 Colleges</span>
                    <span className="sh-metric-sub">Top: IIT Bombay</span>
                  </div>
                  <div className="sh-insight-metric">
                    <span className="sh-metric-title">Median Gig Value</span>
                    <span className="sh-metric-val">₹18,500</span>
                    <span className="sh-metric-sub">Avg Delivery: 36 hrs</span>
                  </div>
                  <div className="sh-insight-metric">
                    <span className="sh-metric-title">Completed Collaborations</span>
                    <span className="sh-metric-val">340+ Projects</span>
                    <span className="sh-metric-sub">99.2% Satisfaction</span>
                  </div>
                </div>

                {/* COLLEGE RANKINGS TABLE */}
                <div className="sh-table-card">
                  <div className="sh-table-header">
                    <span className="sh-table-title">Top Performing Colleges Leaderboard</span>
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Updated Real-Time</span>
                  </div>

                  <table className="sh-table">
                    <thead>
                      <tr>
                        <th>College</th>
                        <th>Active Tasks</th>
                        <th>Avg. Task Budget</th>
                        <th>Leading Skill Domain</th>
                        <th>Total Volume</th>
                        <th>Talent Index</th>
                      </tr>
                    </thead>
                    <tbody>
                      {collegeStats.map((stat, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600, color: "#ffffff" }}>{stat.college}</td>
                          <td>{stat.activeTasks}</td>
                          <td style={{ color: "var(--accent-green)", fontWeight: 600 }}>{stat.avgBudget}</td>
                          <td>{stat.topDomain}</td>
                          <td>{stat.totalEarned}</td>
                          <td>
                            <span style={{
                              display: "inline-block",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              background: "rgba(16, 185, 129, 0.1)",
                              color: "var(--accent-green)",
                              fontSize: "11px",
                              fontWeight: 700
                            }}>
                              {stat.talentIndex}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* FULL OFFER VIEW DETAILS MODAL */}
      {selectedDetailListing && (
        <div className="sh-modal-overlay" onClick={handleCloseDetails}>
          <div className="sh-modal-content sh-details-modal-content" onClick={(e) => e.stopPropagation()}>
            {/* MODAL HEADER */}
            <div className="sh-modal-header">
              <div>
                <span className="sh-modal-title">Task Offer Details</span>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                  Posted by {selectedDetailListing.author} • {selectedDetailListing.college}
                </div>
              </div>
              <button className="sh-modal-close" onClick={handleCloseDetails}>✕</button>
            </div>

            {/* MODAL BODY */}
            <div className="sh-modal-body">
              {/* 1. ONE MAIN IMAGE */}
              <div className="sh-detail-image-box">
                <img
                  src={selectedDetailListing.image || "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=900&auto=format&fit=crop&q=80"}
                  alt={selectedDetailListing.title}
                  className="sh-detail-img"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=900&auto=format&fit=crop&q=80";
                  }}
                />
                <div className="sh-detail-img-badge">{selectedDetailListing.category}</div>
              </div>

              {/* TASK TITLE & STATS ROW */}
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#ffffff", lineHeight: 1.4 }}>
                  {selectedDetailListing.title}
                </h2>
              </div>

              {/* STATS INFO BAR */}
              <div className="sh-detail-stats-bar">
                <div className="sh-detail-stat-card">
                  <div className="sh-meta-label">Client Budget</div>
                  <div className="sh-meta-value" style={{ fontSize: "16px" }}>{selectedDetailListing.budget}</div>
                </div>
                <div className="sh-detail-stat-card">
                  <div className="sh-meta-label">Delivery Deadline</div>
                  <div className="sh-meta-delivery" style={{ fontSize: "14px", fontWeight: 600 }}>{selectedDetailListing.deliveryDate}</div>
                </div>
                <div className="sh-detail-stat-card">
                  <div className="sh-meta-label">Target Audience</div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--accent-blue)", marginTop: "2px" }}>
                    {selectedDetailListing.isMyCollege ? selectedDetailListing.college : "Open Campus"}
                  </div>
                </div>
              </div>

              {/* 2. FULL DESCRIPTION OF WHAT CLIENT WANTS */}
              <div className="sh-detail-section">
                <div className="sh-detail-section-title">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                  <span>Full Task Description & Client Expectations</span>
                </div>
                <p className="sh-detail-desc-text">
                  {selectedDetailListing.description}
                </p>
              </div>

              {/* KEY DELIVERABLES & REQUIREMENTS */}
              {selectedDetailListing.requirements && selectedDetailListing.requirements.length > 0 && (
                <div className="sh-detail-section">
                  <div className="sh-detail-section-title">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 11 12 14 22 4" />
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                    <span>Key Deliverables & Specifications</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {selectedDetailListing.requirements.map((req, i) => (
                      <div key={i} className="sh-req-item">
                        <span className="sh-req-dot"></span>
                        <span>{req}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TECH STACK TAGS */}
              <div className="sh-detail-section">
                <div className="sh-detail-section-title">Required Skills & Technologies</div>
                <div className="sh-tags-list">
                  {selectedDetailListing.tags.map((tag, idx) => (
                    <span key={idx} className="sh-tag" style={{ fontSize: "12px", padding: "4px 10px" }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* 3. MAKE OFFER SECTION / CUSTOM PRICE INPUT TAKER */}
              {isMakingOffer && !sentOffers[selectedDetailListing.id] && !isOwnerListing(selectedDetailListing) && (
                <div className="sh-offer-panel">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff" }}>
                      Propose Custom Offer Price
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      Budget: {selectedDetailListing.budget}
                    </span>
                  </div>

                  <div className="sh-offer-price-row">
                    <div className="sh-price-input-wrapper">
                      <span className="sh-currency-symbol">₹</span>
                      <input
                        type="number"
                        className="sh-custom-price-input"
                        placeholder="Enter offer price"
                        value={offerPrice}
                        onChange={(e) => setOfferPrice(e.target.value)}
                        autoFocus
                      />
                    </div>

                    <div className="sh-price-quick-btns">
                      <button
                        type="button"
                        className="sh-quick-btn"
                        onClick={() => {
                          const num = selectedDetailListing.budget.replace(/[^0-9]/g, "");
                          setOfferPrice(num || "15000");
                        }}
                      >
                        Exact Budget
                      </button>
                      <button
                        type="button"
                        className="sh-quick-btn"
                        onClick={() => setOfferPrice(String(Math.max(500, (Number(offerPrice) || 10000) - 1000)))}
                      >
                        -₹1,000
                      </button>
                      <button
                        type="button"
                        className="sh-quick-btn"
                        onClick={() => setOfferPrice(String((Number(offerPrice) || 10000) + 1000))}
                      >
                        +₹1,000
                      </button>
                    </div>
                  </div>

                  <div className="sh-form-field">
                    <label className="sh-label" style={{ fontSize: "11px" }}>Cover Message / Proposal Note (Optional)</label>
                    <textarea
                      className="sh-textarea"
                      style={{ minHeight: "65px", fontSize: "12px" }}
                      placeholder="Briefly state your relevant experience and how quickly you can complete this task..."
                      value={offerNote}
                      onChange={(e) => setOfferNote(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* MODAL FOOTER */}
            <div className="sh-modal-footer">
              <button type="button" className="sh-btn-secondary" onClick={handleCloseDetails}>
                Close
              </button>

              {/* IF CURRENT USER CREATED THIS LISTING: HIDE MAKE OFFER BUTTON */}
              {isOwnerListing(selectedDetailListing) ? (
                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "var(--text-muted)",
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)"
                }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span>Your Listing (Owner)</span>
                </div>
              ) : sentOffers[selectedDetailListing.id] ? (
                <div className="sh-btn-offer-sent-state">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Offer Sent (₹{Number(sentOffers[selectedDetailListing.id].price).toLocaleString("en-IN")})</span>
                </div>
              ) : isMakingOffer ? (
                <button
                  type="button"
                  className="sh-btn-submit"
                  onClick={handlePromptConfirm}
                >
                  <span>Send Offer (₹{Number(offerPrice || 0).toLocaleString("en-IN")})</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              ) : (
                <button
                  type="button"
                  className="sh-btn-submit"
                  onClick={handleOpenMakeOfferForm}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                  <span>Make Offer</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: "Are you sure want to make offer to complete this task on Rs {selected}" */}
      {showConfirmModal && (
        <div className="sh-modal-overlay" style={{ zIndex: 110 }} onClick={() => setShowConfirmModal(false)}>
          <div className="sh-modal-content" style={{ maxWidth: "420px" }} onClick={(e) => e.stopPropagation()}>
            <div className="sh-modal-header">
              <span className="sh-modal-title">Confirm Offer Submission</span>
              <button className="sh-modal-close" onClick={() => setShowConfirmModal(false)}>✕</button>
            </div>
            <div className="sh-modal-body">
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "50%",
                  background: "rgba(16, 185, 129, 0.15)",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <div>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "#ffffff", lineHeight: 1.45 }}>
                    Are you sure want to make offer to complete this task on Rs {Number(offerPrice).toLocaleString("en-IN")}?
                  </p>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                    The client ({selectedDetailListing?.author}) will receive your proposal instantly.
                  </p>
                </div>
              </div>
            </div>
            <div className="sh-modal-footer">
              <button type="button" className="sh-btn-secondary" onClick={() => setShowConfirmModal(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="sh-btn-submit"
                style={{ background: "var(--accent-green)", color: "#09090b", borderColor: "var(--accent-green)" }}
                onClick={handleConfirmSendOffer}
              >
                <span>OK, Send Offer</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POST LISTING MODAL */}
      {showPostModal && (
        <div className="sh-modal-overlay" onClick={() => setShowPostModal(false)}>
          <div className="sh-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="sh-modal-header">
              <span className="sh-modal-title">Post a New Task Listing</span>
              <button className="sh-modal-close" onClick={() => setShowPostModal(false)}>✕</button>
            </div>

            <form onSubmit={handlePostSubmit}>
              <div className="sh-modal-body">
                <div className="sh-form-field">
                  <label className="sh-label">Task Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Build Autonomous RAG Agent with FastAPI"
                    className="sh-input"
                    value={postForm.title}
                    onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="sh-form-field">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <label className="sh-label" style={{ marginBottom: 0 }}>Category *</label>
                      {isLoadingSkills && (
                        <span style={{ fontSize: "11px", color: "var(--accent-green)" }}>Loading from database...</span>
                      )}
                    </div>
                    <select
                      className="sh-select"
                      value={postForm.category}
                      onFocus={() => {
                        if (categories.length === 0) fetchSkillsCategories();
                      }}
                      onClick={() => {
                        if (categories.length === 0) fetchSkillsCategories();
                      }}
                      onChange={(e) => setPostForm({ ...postForm, category: e.target.value })}
                    >
                      {categories.length > 0 ? (
                        categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="Programming & Tech">Programming & Tech</option>
                          <option value="AI Services">AI Services</option>
                          <option value="Graphics & Design">Graphics & Design</option>
                          <option value="Digital Marketing">Digital Marketing</option>
                          <option value="Business">Business</option>
                          <option value="Video & Animation">Video & Animation</option>
                          <option value="Music & Audio">Music & Audio</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="sh-form-field">
                    <label className="sh-label">Target Audience</label>
                    <select
                      className="sh-select"
                      value={postForm.targetAudience}
                      onChange={(e) => setPostForm({ ...postForm, targetAudience: e.target.value })}
                    >
                      <option value="My College">My College Only</option>
                      <option value="All Colleges">All Colleges (Others)</option>
                    </select>
                  </div>
                </div>

                {/* SUGGESTED SKILL CHIPS FROM SELECTED CATEGORY */}
                {skillsList.filter((s) => s.category === postForm.category).length > 0 && (
                  <div style={{ marginTop: "-2px", marginBottom: "10px" }}>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "6px" }}>
                      Suggested skills for <span style={{ color: "var(--accent-green)", fontWeight: 600 }}>{postForm.category}</span> (click to add tag):
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", maxHeight: "72px", overflowY: "auto", padding: "2px 0" }}>
                      {skillsList
                        .filter((s) => s.category === postForm.category)
                        .map((skill) => {
                          const tagList = (postForm.tags || "")
                            .split(",")
                            .map((t) => t.trim())
                            .filter(Boolean);
                          const isSelected = tagList.some((t) => t.toLowerCase() === skill.skill_name.toLowerCase());
                          return (
                            <button
                              type="button"
                              key={skill.skill_id}
                              className={`sh-skill-chip-tag ${isSelected ? "selected" : ""}`}
                              onClick={() => {
                                if (isSelected) {
                                  setPostForm({
                                    ...postForm,
                                    tags: tagList.filter((t) => t.toLowerCase() !== skill.skill_name.toLowerCase()).join(", "),
                                  });
                                } else {
                                  setPostForm({
                                    ...postForm,
                                    tags: [...tagList, skill.skill_name].join(", "),
                                  });
                                }
                              }}
                            >
                              <span>{isSelected ? "✓" : "+"}</span>
                              <span>{skill.skill_name}</span>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="sh-form-field">
                    <label className="sh-label">Budget (INR) *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 18,000"
                      className="sh-input"
                      value={postForm.budget}
                      onChange={(e) => setPostForm({ ...postForm, budget: e.target.value })}
                    />
                  </div>

                  <div className="sh-form-field">
                    <label className="sh-label">Target Timeline</label>
                    <input
                      type="date"
                      className="sh-input"
                      min={getMinDeliveryDate()}
                      value={postForm.deliveryDate}
                      onChange={(e) => setPostForm({ ...postForm, deliveryDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="sh-form-field">
                  <label className="sh-label">Required Tags (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Python, LangChain, FastAPI"
                    className="sh-input"
                    value={postForm.tags}
                    onChange={(e) => setPostForm({ ...postForm, tags: e.target.value })}
                  />
                </div>

                <div className="sh-form-field">
                  <label className="sh-label">Task Brief & Requirements</label>
                  <textarea
                    placeholder="Describe deliverables, technical expectations, and repository links..."
                    className="sh-textarea"
                    value={postForm.description}
                    onChange={(e) => setPostForm({ ...postForm, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="sh-modal-footer">
                <button type="button" className="sh-btn-secondary" onClick={() => setShowPostModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="sh-btn-submit">
                  Publish Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutModal && (
        <div className="sh-modal-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="sh-modal-content" style={{ maxWidth: "400px" }} onClick={(e) => e.stopPropagation()}>
            <div className="sh-modal-header">
              <span className="sh-modal-title">Confirm Logout</span>
              <button className="sh-modal-close" onClick={() => setShowLogoutModal(false)}>✕</button>
            </div>
            <div className="sh-modal-body">
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                Are you sure you want to sign out of your Skills Hive session?
              </p>
            </div>
            <div className="sh-modal-footer">
              <button className="sh-btn-secondary" onClick={() => setShowLogoutModal(false)}>
                Cancel
              </button>
              <button className="sh-btn-danger" onClick={handleLogoutConfirm}>
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST POPUP */}
      {showSuccessToast && (
        <div className="sh-toast">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ORDERS MODAL BOX */}
      <OrdersModal isOpen={isOrdersOpen} onClose={() => setIsOrdersOpen(false)} />
    </div>
  );
}