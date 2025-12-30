import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Bell, 
  Package, 
  Tag, 
  Info, 
  CheckCheck, 
  Trash2, 
  ChevronRight, 
  Circle,
  ArrowLeft,
  Loader2
} from "lucide-react";
import Navbar from "../../components/Seller/SellerNavbar";
import Footer from "../../components/Seller/SellerFooter";
import { showSuccess, showError } from "../../utils/toast";

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, unread, orders

  // Mock Data - Replace with your API fetch
  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      // const res = await fetch(`${API_URL}/api/notifications`, { headers: { Authorization: `Bearer ${token}` } });
      const mockData = [
        {
          _id: "1",
          type: "order",
          title: "Order Shipped!",
          message: "Your order #ORD-9928 has been dispatched and is on its way.",
          createdAt: new Date(),
          read: false,
        },
        {
          _id: "2",
          type: "offer",
          title: "Flash Sale Alert",
          message: "Get 20% off on all electronics for the next 2 hours!",
          createdAt: new Date(Date.now() - 86400000),
          read: true,
        },
      ];
      setNotifications(mockData);
      setLoading(false);
    };
    fetchNotifications();
  }, []);

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    showSuccess("Marked as read");
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n._id !== id));
  };

  const filtered = notifications.filter(n => {
    if (filter === "unread") return !n.read;
    if (filter === "orders") return n.type === "order";
    return true;
  });

  const getIcon = (type) => {
    switch (type) {
      case "order": return <Package size={18} className="text-blue-500" />;
      case "offer": return <Tag size={18} className="text-orange-500" />;
      default: return <Info size={18} className="text-slate-400" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#030712] font-sans transition-colors">
      <Navbar />

      <main className="flex-grow w-full max-w-7xl mx-auto px-6 py-12">
        {/* HEADER */}
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

        {/* LIST */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-orange-500" /></div>
          ) : filtered.length > 0 ? (
            filtered.map((n) => (
              <div 
                key={n._id}
                className={`group relative p-5 rounded-[2rem] border transition-all duration-300 ${
                  n.read 
                  ? "bg-transparent border-slate-200/50 dark:border-slate-800/50 opacity-70" 
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md"
                }`}
              >
                <div className="flex gap-5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    n.read ? "bg-slate-100 dark:bg-slate-800" : "bg-slate-50 dark:bg-slate-800"
                  }`}>
                    {getIcon(n.type)}
                  </div>

                  <div className="flex-grow min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`text-sm font-black tracking-tight ${n.read ? "text-slate-600 dark:text-slate-400" : "text-slate-900 dark:text-white"}`}>
                        {n.title}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                      {n.message}
                    </p>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-3 block">
                      {new Date(n.createdAt).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                    </span>
                  </div>

                  {/* HOVER ACTIONS */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!n.read && (
                      <button 
                        onClick={() => markAsRead(n._id)}
                        className="p-2 hover:bg-green-50 dark:hover:bg-green-500/10 text-slate-400 hover:text-green-500 rounded-full transition-colors"
                        title="Mark as Read"
                      >
                        <CheckCheck size={16} />
                      </button>
                    )}
                    <button 
                      onClick={() => deleteNotification(n._id)}
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
              <p className="text-slate-400 text-xs mt-1">No new notifications in this category.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}