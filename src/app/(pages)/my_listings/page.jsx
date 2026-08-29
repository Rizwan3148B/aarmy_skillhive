"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import OrdersModal from "@/components/OrdersModal";

export default function MyListingsPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);

    // Filter & Search states
    // "all" | "active" | "in_progress" | "completed" | "paused"
    const [activeFilter, setActiveFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("All");

    // Dynamic categories from database
    const [categories, setCategories] = useState([]);

    // Modal states
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isOrdersOpen, setIsOrdersOpen] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showManageModal, setShowManageModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showOffersModal, setShowOffersModal] = useState(false);
    const [offersListing, setOffersListing] = useState(null);
    const [selectedListing, setSelectedListing] = useState(null);

    // Loading & Error states
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Toast state
    const [toastMessage, setToastMessage] = useState("");
    const [showToast, setShowToast] = useState(false);

    const getMinDeliveryDate = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const yyyy = tomorrow.getFullYear();
        const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
        const dd = String(tomorrow.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    };

    const [createForm, setCreateForm] = useState({
        title: "",
        category: "Programming & Tech",
        targetAudience: "My College",
        budget: "",
        deliveryDate: "",
        roleType: "remote",
        description: "",
        tags: "",
    });

    const [manageForm, setManageForm] = useState({
        id: null,
        title: "",
        category: "Programming & Tech",
        targetAudience: "My College",
        budget: "",
        deliveryDate: "",
        roleType: "remote",
        description: "",
        tags: "",
        status: "Active",
    });

    // Real DB listings
    const [myListings, setMyListings] = useState([]);

    const triggerToast = (msg) => {
        setToastMessage(msg);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3500);
    };

    // Fetch user's listings from API
    const fetchListings = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.replace("/auth");
            return;
        }

        try {
            setIsLoading(true);
            const res = await fetch("/api/my_listings", {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (res.status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                router.replace("/auth");
                return;
            }

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to load listings");
            }

            if (data.user) {
                setUser(data.user);
                localStorage.setItem("user", JSON.stringify(data.user));
            }
            setMyListings(data.listings || []);
            if (data.categories && data.categories.length > 0) {
                setCategories(data.categories);
                setCreateForm((prev) => ({
                    ...prev,
                    category: prev.category || data.categories[0],
                }));
            }
        } catch (err) {
            console.error("fetchListings error:", err);
            triggerToast("Failed to fetch listings. Please refresh.");
        } finally {
            setIsLoading(false);
        }
    };

    // Auth check & load data
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
                // ignore
            }
        }

        fetchListings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router]);

    const handleLogoutConfirm = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setShowLogoutModal(false);
        router.replace("/auth");
    };

    // Open Manage Modal
    const handleOpenManage = (listing) => {
        setSelectedListing(listing);
        setManageForm({
            id: listing.id,
            title: listing.title,
            category: listing.category,
            targetAudience: listing.targetAudience || (listing.target === "own_college" ? "My College" : "All Campuses"),
            budget: String(listing.rawBudget || listing.budget.replace(/[^0-9]/g, "")),
            deliveryDate: listing.endDate || "",
            roleType: listing.roleType || "remote",
            description: listing.description || "",
            tags: listing.tags ? listing.tags.join(", ") : "",
            status: listing.status || "Active",
        });
        setShowManageModal(true);
    };

    // Save Managed Changes via PUT API
    const handleSaveManage = async (e) => {
        e.preventDefault();
        if (!manageForm.title || !manageForm.budget) {
            alert("Please fill in the required fields.");
            return;
        }

        if (manageForm.deliveryDate) {
            const minDate = getMinDeliveryDate();
            if (manageForm.deliveryDate < minDate) {
                alert("Delivery date must be at least tomorrow. You cannot select today or past dates.");
                return;
            }
        }

        const token = localStorage.getItem("token");
        if (!token) {
            router.replace("/auth");
            return;
        }

        try {
            setIsSubmitting(true);
            const res = await fetch("/api/my_listings", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    id: manageForm.id,
                    title: manageForm.title,
                    category: manageForm.category,
                    targetAudience: manageForm.targetAudience,
                    budget: manageForm.budget,
                    deliveryDate: manageForm.deliveryDate,
                    role_type: manageForm.roleType,
                    description: manageForm.description,
                    status: manageForm.status,
                    tags: manageForm.tags
                        ? manageForm.tags.split(",").map((t) => t.trim()).filter(Boolean)
                        : [],
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.error || "Failed to update listing");
                return;
            }

            setMyListings((prev) =>
                prev.map((item) => (item.id === manageForm.id ? data.listing : item))
            );

            setShowManageModal(false);
            triggerToast("Listing updated successfully!");
        } catch (err) {
            console.error("handleSaveManage error:", err);
            alert("Error updating listing.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Open Delete Modal
    const handleOpenDelete = (listing) => {
        setSelectedListing(listing);
        setShowDeleteModal(true);
    };

    // Confirm Delete via DELETE API
    const handleConfirmDelete = async () => {
        if (!selectedListing) return;

        const token = localStorage.getItem("token");
        if (!token) {
            router.replace("/auth");
            return;
        }

        try {
            setIsSubmitting(true);
            const res = await fetch(`/api/my_listings?id=${selectedListing.id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.error || "Failed to delete listing");
                return;
            }

            setMyListings((prev) => prev.filter((item) => item.id !== selectedListing.id));
            setShowDeleteModal(false);
            triggerToast(`Listing "${selectedListing.title.slice(0, 24)}..." deleted`);
            setSelectedListing(null);
        } catch (err) {
            console.error("handleConfirmDelete error:", err);
            alert("Error deleting listing.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Create New Listing via POST API
    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        if (!createForm.title || !createForm.budget) {
            alert("Please fill in required fields");
            return;
        }

        if (createForm.deliveryDate) {
            const minDate = getMinDeliveryDate();
            if (createForm.deliveryDate < minDate) {
                alert("Delivery date must be at least tomorrow. You cannot select today or past dates.");
                return;
            }
        }

        const token = localStorage.getItem("token");
        if (!token) {
            router.replace("/auth");
            return;
        }

        try {
            setIsSubmitting(true);
            const res = await fetch("/api/my_listings", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title: createForm.title,
                    category: createForm.category,
                    targetAudience: createForm.targetAudience,
                    budget: createForm.budget,
                    deliveryDate: createForm.deliveryDate || null,
                    role_type: createForm.roleType || "remote",
                    description:
                        createForm.description ||
                        `Comprehensive task assignment in ${createForm.category}. Open for motivated student engineers to fulfill deliverables on schedule.`,
                    tags: createForm.tags
                        ? createForm.tags.split(",").map((t) => t.trim()).filter(Boolean)
                        : ["Campus Gig", createForm.category],
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.error || "Failed to publish listing");
                return;
            }

            setMyListings([data.listing, ...myListings]);
            setShowCreateModal(false);
            setCreateForm({
                title: "",
                category: categories[0] || "Programming & Tech",
                targetAudience: "My College",
                budget: "",
                deliveryDate: "",
                roleType: "remote",
                description: "",
                tags: "",
            });
            triggerToast("Listing published successfully to campus!");
        } catch (err) {
            console.error("handleCreateSubmit error:", err);
            alert("Error creating listing.");
        } finally {
            setIsSubmitting(false);
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

    // Open Offers Modal
    const handleOpenOffers = (listing) => {
        setSelectedListing(listing);
        setOffersListing(listing);
        setShowOffersModal(true);
    };

    // Accept an offer
    const handleAcceptOffer = async (listingId, offer) => {
        setMyListings((prev) =>
            prev.map((item) => {
                if (item.id === listingId) {
                    return {
                        ...item,
                        status: "In Progress",
                        hiredOffer: offer,
                    };
                }
                return item;
            })
        );

        setOffersListing((prev) => {
            if (!prev || prev.id !== listingId) return prev;
            return {
                ...prev,
                status: "In Progress",
                hiredOffer: offer,
            };
        });

        triggerToast(`🎉 Offer accepted from @${offer.username} (${offer.price})! Listing marked as In Progress.`);
    };

    // Filter listings
    const filteredListings = myListings.filter((item) => {
        // Status filter
        if (activeFilter === "active" && item.status !== "Active") return false;
        if (activeFilter === "in_progress" && item.status !== "In Progress" && item.status !== "Hired") return false;
        if (activeFilter === "completed" && item.status !== "Completed") return false;
        if (activeFilter === "paused" && item.status !== "Paused" && item.status !== "Cancelled") return false;

        // Category filter
        if (categoryFilter !== "All" && item.category !== categoryFilter) return false;

        // Text search
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const matchTitle = item.title.toLowerCase().includes(q);
            const matchCat = (item.category || "").toLowerCase().includes(q);
            const matchDesc = (item.description || "").toLowerCase().includes(q);
            const matchTags = (item.tags || []).some((t) => t.toLowerCase().includes(q));
            if (!matchTitle && !matchCat && !matchDesc && !matchTags) return false;
        }
        return true;
    });

    const activeCount = myListings.filter((i) => i.status === "Active").length;
    const inProgressCount = myListings.filter((i) => i.status === "In Progress" || i.status === "Hired").length;
    const completedCount = myListings.filter((i) => i.status === "Completed").length;
    const pausedCount = myListings.filter((i) => i.status === "Paused" || i.status === "Cancelled").length;
    const totalApplicants = myListings.reduce(
        (sum, i) => sum + (i.offers ? i.offers.length : (i.applicants || 0)),
        0
    );

    const defaultCategories = [
        "Programming & Tech",
        "AI Services",
        "Graphics & Design",
        "Digital Marketing",
        "Business",
        "Video & Animation",
        "Music & Audio",
    ];
    const availableCategories = categories.length > 0 ? categories : defaultCategories;

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

        /* PROFILE TRIGGER */
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
          gap: 24px;
        }

        /* HEADER HERO */
        .sh-header-card {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-xl);
          padding: 24px 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 20px;
        }

        .sh-header-left h1 {
          font-size: 22px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: -0.02em;
        }

        .sh-header-left p {
          font-size: 13px;
          color: var(--text-secondary);
          margin-top: 4px;
        }

        .sh-btn-create {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-inverse);
          background: #ffffff;
          border: 1px solid #ffffff;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .sh-btn-create:hover {
          background: #e4e4e7;
          border-color: #e4e4e7;
          transform: translateY(-1px);
        }

        /* STATS STRIP */
        .sh-stats-strip {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
        }

        .sh-stat-card {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 18px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all 0.15s ease;
        }

        .sh-stat-card:hover {
          border-color: var(--border-default);
          background: var(--bg-card-hover);
        }

        .sh-stat-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .sh-stat-label {
          font-size: 12px;
          color: var(--text-muted);
          font-weight: 500;
        }

        .sh-stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: -0.02em;
        }

        .sh-stat-icon {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-md);
          background: var(--bg-muted);
          border: 1px solid var(--border-subtle);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
        }

        /* CONTROLS BAR: FILTER TABS & SEARCH */
        .sh-controls-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .sh-tabs {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--bg-card);
          padding: 4px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-subtle);
          overflow-x: auto;
          max-width: 100%;
        }

        .sh-tab-btn {
          padding: 6px 14px;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
          background: transparent;
          border: none;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
        }

        .sh-tab-btn:hover {
          color: #ffffff;
        }

        .sh-tab-btn.active {
          background: #27272a;
          color: #ffffff;
          font-weight: 600;
        }

        .sh-search-category-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .sh-search {
          position: relative;
          min-width: 240px;
        }

        .sh-search svg {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          pointer-events: none;
        }

        .sh-search input {
          width: 100%;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 8px 12px 8px 36px;
          font-size: 13px;
          color: #ffffff;
          outline: none;
          transition: all 0.15s ease;
        }

        .sh-search input:focus {
          border-color: var(--border-active);
          background: var(--bg-input);
        }

        .sh-cat-filter-select {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 8px 12px;
          font-size: 13px;
          color: var(--text-primary);
          outline: none;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .sh-cat-filter-select:focus {
          border-color: var(--border-active);
        }

        /* LISTINGS GRID */
        .sh-listings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
          gap: 20px;
        }

        .sh-listing-card {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-xl);
          padding: 22px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 18px;
          transition: all 0.2s ease;
        }

        .sh-listing-card:hover {
          border-color: var(--border-default);
          background: var(--bg-card-hover);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        }

        .sh-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .sh-badge-group {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .sh-cat-tag {
          font-size: 11px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: var(--radius-sm);
          background: rgba(56, 189, 248, 0.1);
          color: var(--accent-blue);
          border: 1px solid rgba(56, 189, 248, 0.2);
        }

        .sh-target-tag {
          font-size: 11px;
          font-weight: 500;
          padding: 3px 8px;
          border-radius: var(--radius-sm);
          background: var(--bg-muted);
          color: var(--text-secondary);
          border: 1px solid var(--border-subtle);
        }

        .sh-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 600;
          padding: 3px 9px;
          border-radius: 999px;
          text-transform: capitalize;
        }

        .sh-status-pill.active {
          background: rgba(16, 185, 129, 0.12);
          color: var(--accent-green);
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .sh-status-pill.in_progress,
        .sh-status-pill.in.progress,
        .sh-status-pill.hired {
          background: rgba(245, 158, 11, 0.12);
          color: var(--accent-amber);
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .sh-status-pill.completed {
          background: rgba(56, 189, 248, 0.12);
          color: var(--accent-blue);
          border: 1px solid rgba(56, 189, 248, 0.3);
        }

        .sh-status-pill.paused,
        .sh-status-pill.cancelled {
          background: rgba(113, 113, 122, 0.14);
          color: var(--text-muted);
          border: 1px solid var(--border-subtle);
        }

        .sh-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
        }

        .sh-card-title {
          font-size: 15px;
          font-weight: 600;
          color: #ffffff;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .sh-card-desc {
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .sh-card-tags {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .sh-tag {
          font-size: 11px;
          color: var(--text-muted);
          background: var(--bg-muted);
          padding: 2px 7px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-subtle);
        }

        .sh-card-metrics {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          padding: 12px;
          background: var(--bg-input);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
        }

        .sh-metric {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .sh-metric-title {
          font-size: 10px;
          text-transform: uppercase;
          font-weight: 600;
          color: var(--text-muted);
          letter-spacing: 0.04em;
        }

        .sh-metric-val {
          font-size: 13px;
          font-weight: 700;
          color: #ffffff;
        }

        .sh-metric-val.green {
          color: var(--accent-green);
        }

        .sh-card-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          padding-top: 14px;
          border-top: 1px solid var(--border-subtle);
        }

        .sh-btn-offers {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 12px;
          font-size: 12px;
          font-weight: 600;
          color: #ffffff;
          background: var(--bg-muted);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .sh-btn-offers:hover {
          background: #27272a;
          border-color: var(--border-active);
        }

        .sh-btn-offers.in-progress {
          border-color: rgba(245, 158, 11, 0.4);
          background: rgba(245, 158, 11, 0.08);
          color: var(--accent-amber);
        }

        .sh-btn-manage {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 8px 12px;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-primary);
          background: transparent;
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .sh-btn-manage:hover {
          background: var(--bg-muted);
          color: #ffffff;
        }

        .sh-btn-delete {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          padding: 0;
          color: var(--text-muted);
          background: transparent;
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .sh-btn-delete:hover {
          background: rgba(239, 68, 68, 0.12);
          border-color: rgba(239, 68, 68, 0.3);
          color: var(--accent-red);
        }

        /* EMPTY STATE */
        .sh-empty-state {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-xl);
          padding: 60px 24px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }

        .sh-empty-icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: var(--bg-muted);
          border: 1px solid var(--border-subtle);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
        }

        .sh-empty-title {
          font-size: 16px;
          font-weight: 600;
          color: #ffffff;
        }

        .sh-empty-desc {
          font-size: 13px;
          color: var(--text-secondary);
          max-width: 440px;
          line-height: 1.5;
        }

        /* MODAL STYLES */
        .sh-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .sh-modal-content {
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-xl);
          width: 100%;
          max-width: 540px;
          box-shadow: 0 24px 48px rgba(0, 0, 0, 0.8);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          animation: modalFadeIn 0.2s ease-out;
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
          font-weight: 700;
          color: #ffffff;
        }

        .sh-modal-close {
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 16px;
          cursor: pointer;
          padding: 4px;
          border-radius: var(--radius-sm);
          transition: all 0.15s ease;
        }

        .sh-modal-close:hover {
          color: #ffffff;
          background: var(--bg-muted);
        }

        .sh-modal-body {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-height: 72vh;
          overflow-y: auto;
        }

        .sh-modal-footer {
          padding: 16px 24px;
          border-top: 1px solid var(--border-subtle);
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          background: rgba(0, 0, 0, 0.2);
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

        .sh-input,
        .sh-select,
        .sh-textarea {
          width: 100%;
          background: var(--bg-input);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 10px 12px;
          font-size: 13px;
          color: #ffffff;
          outline: none;
          transition: all 0.15s ease;
        }

        .sh-input:focus,
        .sh-select:focus,
        .sh-textarea:focus {
          border-color: var(--border-active);
          background: #18181f;
        }

        .sh-textarea {
          min-height: 80px;
          resize: vertical;
        }

        .sh-btn-secondary {
          padding: 9px 16px;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
          background: transparent;
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .sh-btn-secondary:hover {
          color: #ffffff;
          background: var(--bg-muted);
        }

        .sh-btn-submit {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 9px 18px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-inverse);
          background: #ffffff;
          border: 1px solid #ffffff;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .sh-btn-submit:hover:not(:disabled) {
          background: #e4e4e7;
          border-color: #e4e4e7;
        }

        .sh-btn-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .sh-btn-danger-confirm {
          padding: 9px 18px;
          font-size: 13px;
          font-weight: 600;
          color: #ffffff;
          background: var(--accent-red);
          border: 1px solid var(--accent-red);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .sh-btn-danger-confirm:hover {
          background: #dc2626;
        }

        /* OFFERS SUMMARY BOX & LIST */
        .sh-offers-summary-box {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          padding: 16px;
          background: var(--bg-input);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
        }

        .sh-offers-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-top: 6px;
        }

        .sh-offer-card {
          background: var(--bg-input);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: all 0.15s ease;
        }

        .sh-offer-card:hover {
          border-color: var(--border-default);
          background: #18181f;
        }

        .sh-offer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .sh-offer-user-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .sh-offer-avatar {
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
        }

        .sh-offer-username {
          font-size: 13px;
          font-weight: 600;
          color: #ffffff;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .sh-offer-meta {
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 2px;
        }

        .sh-offer-price-tag {
          text-align: right;
        }

        .sh-offer-price {
          font-size: 15px;
          font-weight: 700;
          color: var(--accent-green);
          display: block;
        }

        .sh-offer-delivery {
          font-size: 11px;
          color: var(--text-secondary);
        }

        .sh-offer-message-box {
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 12px;
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .sh-offer-message-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 6px;
        }

        .sh-offer-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 10px;
          border-top: 1px solid var(--border-subtle);
        }

        .sh-btn-accept-offer {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          font-size: 12px;
          font-weight: 600;
          color: #09090b;
          background: var(--accent-green);
          border: 1px solid var(--accent-green);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .sh-btn-accept-offer:hover {
          background: #059669;
          border-color: #059669;
        }

        /* TOAST */
        .sh-toast {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 120;
          background: #18181b;
          border: 1px solid rgba(16, 185, 129, 0.4);
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.8);
          border-radius: var(--radius-md);
          padding: 12px 18px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          font-weight: 500;
          color: #ffffff;
          animation: toastSlideUp 0.25s ease-out;
        }

        @keyframes toastSlideUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

            {/* TOP BAR */}
            <header className="sh-topbar">
                <div className="sh-topbar-inner">
                    {/* LOGO */}
                    <Link href="/dashboard" className="sh-logo">
                        <div className="sh-logo-badge">S</div>
                        <span className="sh-logo-title">SkillHive</span>
                    </Link>

                    {/* CENTER NAVIGATION */}
                    <nav className="sh-nav-links">
                        <Link href="/dashboard" className="sh-nav-btn">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="7" height="9" x="3" y="3" rx="1" />
                                <rect width="7" height="5" x="14" y="3" rx="1" />
                                <rect width="7" height="9" x="14" y="12" rx="1" />
                                <rect width="7" height="5" x="3" y="16" rx="1" />
                            </svg>
                            <span>Dashboard</span>
                        </Link>

                        <Link href="/my_listings" className="sh-nav-btn active">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                                <polyline points="10 9 9 9 8 9" />
                            </svg>
                            <span>My Listings</span>
                        </Link>

                        <Link href="/messages" className="sh-nav-btn">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                            <span>Messages</span>
                        </Link>

                        <button className="sh-nav-btn" onClick={() => setIsOrdersOpen(true)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                                <path d="M3 6h18" />
                                <path d="M16 10a4 4 0 0 1-8 0" />
                            </svg>
                            <span>Orders</span>
                        </button>
                    </nav>

                    {/* RIGHT PROFILE & EARNINGS */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <Link href="/wallet" className="sh-earnings-pill" title="View Wallet & Transactions">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                                <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                                <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                            </svg>
                            <span className="sh-earnings-val">{user?.total_earnings || "₹0"}</span>
                        </Link>

                        <div className="sh-profile-container">
                            <div className="sh-profile-trigger" onClick={() => setIsProfileOpen(!isProfileOpen)}>
                                <div className="sh-avatar">{getInitials(user?.full_name)}</div>
                                <span className="sh-profile-name">{user?.full_name || "Account"}</span>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m6 9 6 6 6-6" />
                                </svg>
                            </div>

                            {isProfileOpen && (
                                <div className="sh-dropdown">
                                    <div className="sh-dropdown-header">
                                        <div className="sh-dropdown-name">{user?.full_name || "Collegiate User"}</div>
                                        <div className="sh-dropdown-email">{user?.email || "user@skillhive.in"}</div>
                                    </div>

                                    <Link href="/profile" className="sh-dropdown-item" onClick={() => setIsProfileOpen(false)}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                        <span>View Profile</span>
                                    </Link>

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

            {/* MAIN CONTENT */}
            <main className="sh-container">
                {/* HERO CARD */}
                <section className="sh-header-card">
                    <div className="sh-header-left">
                        <h1>My Listings & Task Postings</h1>
                        <p>Manage, track applications, and optimize all service listings posted from your campus account.</p>
                    </div>

                    <button className="sh-btn-create" onClick={() => setShowCreateModal(true)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        <span>Create New Listing</span>
                    </button>
                </section>

                {/* STATS STRIP */}
                <section className="sh-stats-strip">
                    <div className="sh-stat-card">
                        <div className="sh-stat-info">
                            <span className="sh-stat-label">Total Listings</span>
                            <span className="sh-stat-value">{myListings.length}</span>
                        </div>
                        <div className="sh-stat-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
                                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                            </svg>
                        </div>
                    </div>

                    <div className="sh-stat-card">
                        <div className="sh-stat-info">
                            <span className="sh-stat-label">Active / Open</span>
                            <span className="sh-stat-value" style={{ color: "var(--accent-green)" }}>{activeCount}</span>
                        </div>
                        <div className="sh-stat-icon" style={{ color: "var(--accent-green)" }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                        </div>
                    </div>

                    <div className="sh-stat-card">
                        <div className="sh-stat-info">
                            <span className="sh-stat-label">In Progress</span>
                            <span className="sh-stat-value" style={{ color: "var(--accent-amber)" }}>{inProgressCount}</span>
                        </div>
                        <div className="sh-stat-icon" style={{ color: "var(--accent-amber)" }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                        </div>
                    </div>

                    <div className="sh-stat-card">
                        <div className="sh-stat-info">
                            <span className="sh-stat-label">Completed / Paused</span>
                            <span className="sh-stat-value" style={{ color: "var(--accent-blue)" }}>{completedCount + pausedCount}</span>
                        </div>
                        <div className="sh-stat-icon" style={{ color: "var(--accent-blue)" }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                        </div>
                    </div>
                </section>

                {/* CONTROLS BAR: FILTER TABS & SEARCH & CATEGORY */}
                <div className="sh-controls-bar">
                    <div className="sh-tabs">
                        <button
                            className={`sh-tab-btn ${activeFilter === "all" ? "active" : ""}`}
                            onClick={() => setActiveFilter("all")}
                        >
                            All ({myListings.length})
                        </button>
                        <button
                            className={`sh-tab-btn ${activeFilter === "active" ? "active" : ""}`}
                            onClick={() => setActiveFilter("active")}
                        >
                            Active ({activeCount})
                        </button>
                        <button
                            className={`sh-tab-btn ${activeFilter === "in_progress" ? "active" : ""}`}
                            onClick={() => setActiveFilter("in_progress")}
                        >
                            In Progress ({inProgressCount})
                        </button>
                        <button
                            className={`sh-tab-btn ${activeFilter === "completed" ? "active" : ""}`}
                            onClick={() => setActiveFilter("completed")}
                        >
                            Completed ({completedCount})
                        </button>
                        <button
                            className={`sh-tab-btn ${activeFilter === "paused" ? "active" : ""}`}
                            onClick={() => setActiveFilter("paused")}
                        >
                            Paused ({pausedCount})
                        </button>
                    </div>

                    <div className="sh-search-category-row">
                        <div className="sh-search">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search tasks or tags..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <select
                            className="sh-cat-filter-select"
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                        >
                            <option value="All">All Categories</option>
                            {availableCategories.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* LISTINGS GRID */}
                {isLoading ? (
                    <div style={{ textAlign: "center", padding: "60px 24px", color: "var(--text-muted)" }}>
                        <div style={{ display: "inline-block", width: "28px", height: "28px", border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite", marginBottom: "12px" }}></div>
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                        <p style={{ fontSize: "14px", fontWeight: 500 }}>Loading your task listings...</p>
                    </div>
                ) : filteredListings.length === 0 ? (
                    <div className="sh-empty-state">
                        <div className="sh-empty-icon">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
                                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                            </svg>
                        </div>
                        <h3 className="sh-empty-title">No listings found</h3>
                        <p className="sh-empty-desc">
                            {searchQuery || categoryFilter !== "All"
                                ? "No listings match your filter or search keywords. Try adjusting your query."
                                : "You haven't posted any task listings yet. Create your first listing to start getting proposals from peers across campus!"}
                        </p>
                        <button className="sh-btn-create" onClick={() => setShowCreateModal(true)} style={{ marginTop: "8px" }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            <span>Post New Listing</span>
                        </button>
                    </div>
                ) : (
                    <div className="sh-listings-grid">
                        {filteredListings.map((item) => (
                            <div className="sh-listing-card" key={item.id}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                    {/* Top tags & status */}
                                    <div className="sh-card-header">
                                        <div className="sh-badge-group">
                                            <span className="sh-cat-tag">{item.category}</span>
                                            <span className="sh-target-tag">{item.targetAudience}</span>
                                        </div>

                                        <span className={`sh-status-pill ${(item.status || "active").toLowerCase().replace(" ", "_")}`}>
                                            <span className="sh-status-dot"></span>
                                            <span>{item.status}</span>
                                        </span>
                                    </div>

                                    {/* Title & Description */}
                                    <h2 className="sh-card-title">{item.title}</h2>
                                    <p className="sh-card-desc">{item.description}</p>

                                    {/* Tags */}
                                    {item.tags && item.tags.length > 0 && (
                                        <div className="sh-card-tags">
                                            {item.tags.map((tag, idx) => (
                                                <span className="sh-tag" key={idx}>
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Metrics Row */}
                                    <div className="sh-card-metrics">
                                        <div className="sh-metric">
                                            <span className="sh-metric-title">Budget</span>
                                            <span className="sh-metric-val green">{item.budget}</span>
                                        </div>
                                        <div className="sh-metric">
                                            <span className="sh-metric-title">Type</span>
                                            <span className="sh-metric-val" style={{ textTransform: "capitalize" }}>{item.roleType || "remote"}</span>
                                        </div>
                                        <div className="sh-metric">
                                            <span className="sh-metric-title">Deadline</span>
                                            <span className="sh-metric-val" style={{ fontSize: "11px", fontWeight: 600 }}>
                                                {item.deliveryDate}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Card Actions: View Offers, Manage & Delete Buttons */}
                                <div className="sh-card-actions">
                                    <button
                                        className={`sh-btn-offers ${item.status === "In Progress" || item.status === "Hired" ? "in-progress" : ""}`}
                                        onClick={() => handleOpenOffers(item)}
                                        title="View Candidate Proposals & Details"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                            <circle cx="9" cy="7" r="4" />
                                            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                        </svg>
                                        <span>
                                            {item.status === "In Progress" || item.status === "Hired"
                                                ? "In Progress"
                                                : `Offers (${item.offers ? item.offers.length : (item.applicants || 0)})`}
                                        </span>
                                    </button>

                                    <button className="sh-btn-manage" onClick={() => handleOpenManage(item)}>
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 20h9" />
                                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                        </svg>
                                        <span>Manage</span>
                                    </button>

                                    <button className="sh-btn-delete" onClick={() => handleOpenDelete(item)} title="Delete Listing">
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="3 6 5 6 21 6" />
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                            <line x1="10" y1="11" x2="10" y2="17" />
                                            <line x1="14" y1="11" x2="14" y2="17" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* MANAGE / EDIT LISTING MODAL */}
            {showManageModal && (
                <div className="sh-modal-overlay" onClick={() => setShowManageModal(false)}>
                    <div className="sh-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="sh-modal-header">
                            <h3 className="sh-modal-title">Manage Listing</h3>
                            <button className="sh-modal-close" onClick={() => setShowManageModal(false)}>✕</button>
                        </div>

                        <form onSubmit={handleSaveManage}>
                            <div className="sh-modal-body">
                                <div className="sh-form-field">
                                    <label className="sh-label">Listing Title *</label>
                                    <input
                                        type="text"
                                        className="sh-input"
                                        value={manageForm.title}
                                        onChange={(e) => setManageForm({ ...manageForm, title: e.target.value })}
                                        required
                                    />
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                    <div className="sh-form-field">
                                        <label className="sh-label">Category</label>
                                        <select
                                            className="sh-select"
                                            value={manageForm.category}
                                            onChange={(e) => setManageForm({ ...manageForm, category: e.target.value })}
                                        >
                                            {availableCategories.map((cat) => (
                                                <option key={cat} value={cat}>
                                                    {cat}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="sh-form-field">
                                        <label className="sh-label">Status</label>
                                        <select
                                            className="sh-select"
                                            value={manageForm.status}
                                            onChange={(e) => setManageForm({ ...manageForm, status: e.target.value })}
                                        >
                                            <option value="Active">Active (Accepting Offers)</option>
                                            <option value="In Progress">In Progress</option>
                                            <option value="Completed">Completed</option>
                                            <option value="Paused">Paused (Hidden)</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                    <div className="sh-form-field">
                                        <label className="sh-label">Target Audience</label>
                                        <select
                                            className="sh-select"
                                            value={manageForm.targetAudience}
                                            onChange={(e) => setManageForm({ ...manageForm, targetAudience: e.target.value })}
                                        >
                                            <option value="My College">My College Only</option>
                                            <option value="All Campuses">All Campuses</option>
                                        </select>
                                    </div>

                                    <div className="sh-form-field">
                                        <label className="sh-label">Role Type</label>
                                        <select
                                            className="sh-select"
                                            value={manageForm.roleType}
                                            onChange={(e) => setManageForm({ ...manageForm, roleType: e.target.value })}
                                        >
                                            <option value="remote">Remote</option>
                                            <option value="hybrid">Hybrid</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                    <div className="sh-form-field">
                                        <label className="sh-label">Budget (₹) *</label>
                                        <input
                                            type="number"
                                            className="sh-input"
                                            value={manageForm.budget}
                                            onChange={(e) => setManageForm({ ...manageForm, budget: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="sh-form-field">
                                        <label className="sh-label">Delivery Date</label>
                                        <input
                                            type="date"
                                            className="sh-input"
                                            min={getMinDeliveryDate()}
                                            value={manageForm.deliveryDate}
                                            onChange={(e) => setManageForm({ ...manageForm, deliveryDate: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="sh-form-field">
                                    <label className="sh-label">Description</label>
                                    <textarea
                                        className="sh-textarea"
                                        value={manageForm.description}
                                        onChange={(e) => setManageForm({ ...manageForm, description: e.target.value })}
                                    />
                                </div>

                                <div className="sh-form-field">
                                    <label className="sh-label">Tags (comma-separated)</label>
                                    <input
                                        type="text"
                                        className="sh-input"
                                        value={manageForm.tags}
                                        onChange={(e) => setManageForm({ ...manageForm, tags: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="sh-modal-footer">
                                <button type="button" className="sh-btn-secondary" onClick={() => setShowManageModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="sh-btn-submit" disabled={isSubmitting}>
                                    {isSubmitting ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* CREATE NEW LISTING MODAL */}
            {showCreateModal && (
                <div className="sh-modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="sh-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="sh-modal-header">
                            <h3 className="sh-modal-title">Create New Listing</h3>
                            <button className="sh-modal-close" onClick={() => setShowCreateModal(false)}>✕</button>
                        </div>

                        <form onSubmit={handleCreateSubmit}>
                            <div className="sh-modal-body">
                                <div className="sh-form-field">
                                    <label className="sh-label">Listing Title *</label>
                                    <input
                                        type="text"
                                        className="sh-input"
                                        placeholder="e.g. Build PyTorch Computer Vision Model for Drone Detection"
                                        value={createForm.title}
                                        onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                                        required
                                    />
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                    <div className="sh-form-field">
                                        <label className="sh-label">Category</label>
                                        <select
                                            className="sh-select"
                                            value={createForm.category}
                                            onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                                        >
                                            {availableCategories.map((cat) => (
                                                <option key={cat} value={cat}>
                                                    {cat}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="sh-form-field">
                                        <label className="sh-label">Target Audience</label>
                                        <select
                                            className="sh-select"
                                            value={createForm.targetAudience}
                                            onChange={(e) => setCreateForm({ ...createForm, targetAudience: e.target.value })}
                                        >
                                            <option value="My College">My College Only</option>
                                            <option value="All Campuses">All Campuses</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                    <div className="sh-form-field">
                                        <label className="sh-label">Budget (₹) *</label>
                                        <input
                                            type="number"
                                            className="sh-input"
                                            placeholder="e.g. 15000"
                                            value={createForm.budget}
                                            onChange={(e) => setCreateForm({ ...createForm, budget: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="sh-form-field">
                                        <label className="sh-label">Estimated Delivery Date</label>
                                        <input
                                            type="date"
                                            className="sh-input"
                                            min={getMinDeliveryDate()}
                                            value={createForm.deliveryDate}
                                            onChange={(e) => setCreateForm({ ...createForm, deliveryDate: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="sh-form-field">
                                    <label className="sh-label">Role Type</label>
                                    <select
                                        className="sh-select"
                                        value={createForm.roleType}
                                        onChange={(e) => setCreateForm({ ...createForm, roleType: e.target.value })}
                                    >
                                        <option value="remote">Remote Work</option>
                                        <option value="hybrid">Hybrid / In-Person</option>
                                    </select>
                                </div>

                                <div className="sh-form-field">
                                    <label className="sh-label">Description</label>
                                    <textarea
                                        className="sh-textarea"
                                        placeholder="Describe scope, required frameworks, and deliverable standards..."
                                        value={createForm.description}
                                        onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                                    />
                                </div>

                                <div className="sh-form-field">
                                    <label className="sh-label">Tags (comma-separated)</label>
                                    <input
                                        type="text"
                                        className="sh-input"
                                        placeholder="e.g. React, Next.js, Tailwind, API"
                                        value={createForm.tags}
                                        onChange={(e) => setCreateForm({ ...createForm, tags: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="sh-modal-footer">
                                <button type="button" className="sh-btn-secondary" onClick={() => setShowCreateModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="sh-btn-submit" disabled={isSubmitting}>
                                    {isSubmitting ? "Publishing..." : "Publish Listing"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* VIEW OFFERS & DETAILS POPUP MODAL */}
            {showOffersModal && offersListing && (
                <div className="sh-modal-overlay" onClick={() => setShowOffersModal(false)}>
                    <div className="sh-modal-content" style={{ maxWidth: "680px", width: "95%" }} onClick={(e) => e.stopPropagation()}>
                        <div className="sh-modal-header">
                            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <h3 className="sh-modal-title">Listing Details & Proposals</h3>
                                    <span className={`sh-status-pill ${(offersListing.status || "active").toLowerCase().replace(" ", "_")}`}>
                                        <span className="sh-status-dot"></span>
                                        <span>{offersListing.status}</span>
                                    </span>
                                </div>
                                <span style={{ fontSize: "12px", color: "var(--text-secondary)", maxWidth: "520px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {offersListing.title}
                                </span>
                            </div>
                            <button className="sh-modal-close" onClick={() => setShowOffersModal(false)}>✕</button>
                        </div>

                        <div className="sh-modal-body" style={{ maxHeight: "78vh" }}>
                            {/* Summary strip */}
                            <div className="sh-offers-summary-box">
                                <div>
                                    <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.04em" }}>Budget</div>
                                    <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--accent-green)", marginTop: "2px" }}>{offersListing.budget}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.04em" }}>Delivery Deadline</div>
                                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#ffffff", marginTop: "2px" }}>
                                        {offersListing.deliveryDate}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.04em" }}>Category</div>
                                    <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--accent-blue)", marginTop: "2px" }}>{offersListing.category}</div>
                                </div>
                            </div>

                            {/* Full Description */}
                            <div style={{ padding: "14px", background: "var(--bg-input)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)" }}>
                                <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, marginBottom: "6px" }}>Task Description</div>
                                <p style={{ fontSize: "13px", color: "var(--text-primary)", lineHeight: 1.5 }}>
                                    {offersListing.description || "No specific details provided for this task."}
                                </p>
                            </div>

                            {/* List of Offers / Candidate Proposals */}
                            {(!offersListing.offers || offersListing.offers.length === 0) ? (
                                <div style={{ textAlign: "center", padding: "32px 16px", color: "var(--text-muted)" }}>
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 8px auto", opacity: 0.5 }}>
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="8" x2="12" y2="12" />
                                        <line x1="12" y1="16" x2="12.01" y2="16" />
                                    </svg>
                                    <p style={{ fontSize: "14px", fontWeight: 600, color: "#ffffff" }}>No offers submitted yet</p>
                                    <p style={{ fontSize: "12px", marginTop: "4px" }}>Peer students who submit proposals from the dashboard will show up right here.</p>
                                </div>
                            ) : (
                                <div className="sh-offers-list">
                                    {offersListing.offers.map((offer) => {
                                        const isHiredCandidate = (offersListing.status === "In Progress" || offersListing.status === "Hired") && offersListing.hiredOffer?.id === offer.id;
                                        const isOtherHired = (offersListing.status === "In Progress" || offersListing.status === "Hired") && !isHiredCandidate;

                                        return (
                                            <div
                                                key={offer.id}
                                                className={`sh-offer-card ${isHiredCandidate ? "is-hired" : ""}`}
                                            >
                                                {/* Header: User & Price */}
                                                <div className="sh-offer-header">
                                                    <div className="sh-offer-user-info">
                                                        <div className="sh-offer-avatar">{offer.avatar || getInitials(offer.username)}</div>
                                                        <div className="sh-offer-user-details">
                                                            <div className="sh-offer-username">
                                                                <span>{offer.username}</span>
                                                                <span style={{ fontSize: "11px", color: "var(--accent-amber)", display: "inline-flex", alignItems: "center", gap: "2px", fontWeight: 600 }}>
                                                                    ★ {offer.rating} ({offer.reviewsCount || 10})
                                                                </span>
                                                            </div>
                                                            <div className="sh-offer-meta">
                                                                <span>{offer.college}</span> • <span>{offer.time || "Recently"}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="sh-offer-price-tag">
                                                        <span className="sh-offer-price">{offer.price}</span>
                                                        <span className="sh-offer-delivery">{offer.delivery}</span>
                                                    </div>
                                                </div>

                                                {/* Message Proposal */}
                                                <div className="sh-offer-message-box">
                                                    <div className="sh-offer-message-label">
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                                        </svg>
                                                        <span>Candidate Proposal</span>
                                                    </div>
                                                    <p>{offer.message}</p>
                                                </div>

                                                {/* Action / Accept Offer Footer */}
                                                <div className="sh-offer-footer">
                                                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                                                        {isHiredCandidate ? (
                                                            <span style={{ color: "var(--accent-green)", fontWeight: 600 }}>Selected candidate for this listing</span>
                                                        ) : isOtherHired ? (
                                                            <span>Another offer was accepted</span>
                                                        ) : (
                                                            <span>Accept this offer to start working together</span>
                                                        )}
                                                    </div>

                                                    <div>
                                                        {isHiredCandidate ? (
                                                            <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "12px", fontWeight: 600, color: "var(--accent-green)" }}>
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                    <path d="M20 6 9 17l-5-5" />
                                                                </svg>
                                                                <span>Accepted</span>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                className="sh-btn-accept-offer"
                                                                onClick={() => handleAcceptOffer(offersListing.id, offer)}
                                                            >
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                    <path d="M20 6 9 17l-5-5" />
                                                                </svg>
                                                                <span>Accept Offer ({offer.price})</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="sh-modal-footer">
                            <button
                                type="button"
                                className="sh-btn-secondary"
                                onClick={() => setShowOffersModal(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRMATION MODAL */}
            {showDeleteModal && (
                <div className="sh-modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="sh-modal-content" style={{ maxWidth: "440px" }} onClick={(e) => e.stopPropagation()}>
                        <div className="sh-modal-header">
                            <h3 className="sh-modal-title" style={{ color: "#f87171" }}>Delete Listing?</h3>
                            <button className="sh-modal-close" onClick={() => setShowDeleteModal(false)}>✕</button>
                        </div>

                        <div className="sh-modal-body">
                            <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                                Are you sure you want to delete <strong style={{ color: "#ffffff" }}>"{selectedListing?.title}"</strong>?
                            </p>
                            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                                This listing will be removed from the campus feed permanently.
                            </p>
                        </div>

                        <div className="sh-modal-footer">
                            <button className="sh-btn-secondary" onClick={() => setShowDeleteModal(false)}>
                                Cancel
                            </button>
                            <button className="sh-btn-danger-confirm" onClick={handleConfirmDelete} disabled={isSubmitting}>
                                {isSubmitting ? "Deleting..." : "Delete Listing"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* LOGOUT CONFIRMATION MODAL */}
            {showLogoutModal && (
                <div className="sh-modal-overlay" onClick={() => setShowLogoutModal(false)}>
                    <div className="sh-modal-content" style={{ maxWidth: "400px" }} onClick={(e) => e.stopPropagation()}>
                        <div className="sh-modal-header">
                            <h3 className="sh-modal-title">Confirm Log Out</h3>
                            <button className="sh-modal-close" onClick={() => setShowLogoutModal(false)}>✕</button>
                        </div>
                        <div className="sh-modal-body">
                            <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                                Are you sure you want to log out of SkillHive?
                            </p>
                        </div>
                        <div className="sh-modal-footer">
                            <button className="sh-btn-secondary" onClick={() => setShowLogoutModal(false)}>Cancel</button>
                            <button className="sh-btn-danger-confirm" onClick={handleLogoutConfirm}>Log Out</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ORDERS MODAL COMPONENT */}
            <OrdersModal isOpen={isOrdersOpen} onClose={() => setIsOrdersOpen(false)} />

            {/* TOAST NOTIFICATION */}
            {showToast && (
                <div className="sh-toast">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>{toastMessage}</span>
                </div>
            )}
        </div>
    );
}