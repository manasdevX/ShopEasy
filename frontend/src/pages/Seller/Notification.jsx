import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Package,
  Tag,
  Info,
  CheckCheck,
  Trash2,
  ArrowLeft,
  Loader2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import Navbar from "../../components/Seller/SellerNavbar";
import Footer from "../../components/Seller/SellerFooter";
import { showSuccess, showError } from "../../utils/toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("sellerToken");
      if (!token) {
        navigate("/Seller/login");
        return;
      }

      const res = await fetch(`${API_URL}/api/notifications?filter=${filter}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) setNotifications(data);
      else showError("Failed to load notifications");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  // ✅ INSTANT UPDATE LOGIC
  const markAsRead = async (id, e) => {
    if (e) e.stopPropagation(); // Stop click from bubbling to parent row

    try {
      const token = localStorage.getItem("sellerToken");

      // 1. Update Backend
      const res = await fetch(`${API_URL}/api/notifications/${id}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        // 2. Update Local List (Visual Change)
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );

        // 3. CRITICAL: Tell Navbar to refresh the red dot immediately
        window.dispatchEvent(new Event("notification-updated"));

        showSuccess("Marked as read");
      }
    } catch (error) {
      showError("Connection error");
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("sellerToken");
      const res = await fetch(`${API_URL}/api/notifications/read-all`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

        // CRITICAL: Clear the red dot immediately
        window.dispatchEvent(new Event("notification-updated"));

        showSuccess("All marked as read");
      }
    } catch (error) {
      showError("Action failed");
    }
  };

  const deleteNotification = async (id, e) => {
    if (e) e.stopPropagation();
    // Assuming you implement a DELETE endpoint later, for now we just remove from UI
    // If you have a backend route: await fetch(`${API_URL}/api/notifications/${id}`, { method: 'DELETE'... })

    setNotifications((prev) => prev.filter((n) => n._id !== id));
    showSuccess("Notification removed");
  };

  const handleNotificationClick = (notification) => {
    // 1. Mark as read immediately when clicked
    if (!notification.isRead) {
      markAsRead(notification._id, null);
    }

    // 2. Navigate based on type
    if (notification.type === "order" && notification.relatedId) {
      navigate("/Seller/orders");
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "order":
        return <Package size={18} className="text-blue-500" />;
      case "promotion":
        return <Tag size={18} className="text-orange-500" />;
      case "alert":
        return <AlertCircle size={18} className="text-red-500" />;
      default:
        return <Info size={18} className="text-slate-400" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#030712] font-sans transition-colors">
      <Navbar isLoggedIn={true} />

      <main className="flex-grow w-full max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-slate-400 hover:text-orange-500 font-bold text-[10px] uppercase tracking-[0.2em] mb-3 transition-colors"
            >
              <ArrowLeft size={14} /> Back
            </button>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              Notifications
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {notifications.some((n) => !n.isRead) && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-bold text-blue-500 hover:underline uppercase tracking-wide mr-2"
              >
                Mark all read
              </button>
            )}
            <div className="flex bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              {["all", "unread", "orders"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                    filter === f
                      ? "bg-slate-900 dark:bg-slate-800 text-white shadow-md"
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-orange-500" />
            </div>
          ) : notifications.length > 0 ? (
            notifications.map((n) => (
              <div
                key={n._id}
                onClick={() => handleNotificationClick(n)}
                className={`group relative p-5 rounded-[2rem] border transition-all duration-300 cursor-pointer ${
                  n.isRead
                    ? "bg-transparent border-slate-200/50 dark:border-slate-800/50 opacity-70 hover:opacity-100"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-500/30"
                }`}
              >
                <div className="flex gap-5">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                      n.isRead
                        ? "bg-slate-100 dark:bg-slate-800"
                        : "bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700"
                    }`}
                  >
                    {getIcon(n.type)}
                  </div>

                  <div className="flex-grow min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3
                        className={`text-sm font-black tracking-tight ${
                          n.isRead
                            ? "text-slate-600 dark:text-slate-400"
                            : "text-slate-900 dark:text-white"
                        }`}
                      >
                        {n.title}
                      </h3>
                      {!n.isRead && (
                        <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                      {n.message}
                    </p>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-3 block">
                      {new Date(n.createdAt).toLocaleString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {n.type === "order" && (
                      <ExternalLink size={16} className="text-slate-400 mr-2" />
                    )}

                    {!n.isRead && (
                      <button
                        onClick={(e) => markAsRead(n._id, e)}
                        className="p-2 hover:bg-green-50 dark:hover:bg-green-500/10 text-slate-400 hover:text-green-500 rounded-full transition-colors"
                        title="Mark as Read"
                      >
                        <CheckCheck size={16} />
                      </button>
                    )}
                    <button
                      onClick={(e) => deleteNotification(n._id, e)}
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 rounded-full transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell size={24} className="text-slate-300" />
              </div>
              <p className="text-slate-500 font-bold text-sm">All caught up!</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
