import React, { useState, useEffect } from "react";
import SellerFooter from "../../components/Seller/SellerFooter";
import SellerNavbar from "../../components/Seller/SellerNavbar";
import {
  Search,
  Eye,
  Truck,
  CheckCircle,
  XCircle,
  MoreVertical,
  Download,
  Calendar,
  Package,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  // --- Fetch Real Orders from Backend ---
  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("sellerToken");
      const res = await fetch(`${API_URL}/api/orders/seller-orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to fetch orders");

      setOrders(data);
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // --- Logic: Dynamic Stats Calculation ---
  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "Pending").length,
    revenue: orders.reduce((acc, curr) => acc + (curr.sellerTotal || 0), 0),
    cancelled: orders.filter((o) => o.status === "Cancelled").length,
  };

  const tabs = ["All", "Pending", "Shipped", "Delivered", "Cancelled"];

  // --- Logic: Filtering ---
  const filteredOrders = orders.filter((order) => {
    const matchesTab = activeTab === "All" || order.status === activeTab;
    const matchesSearch =
      order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-500";
      case "Shipped":
        return "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-500";
      case "Delivered":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-500";
      case "Cancelled":
        return "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-500";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="bg-white dark:bg-[#030712] min-h-screen transition-colors duration-500 font-sans">
      <SellerNavbar isLoggedIn={true} />

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* HEADING */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
              Manage <span className="text-orange-500">Orders.</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Monitor sales performance and shipping fulfillment.
            </p>
          </div>
          <button className="flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-orange-500/20 hover:scale-105 transition-all">
            <Download size={20} /> Export CSV
          </button>
        </div>

        {/* DYNAMIC STATS SUMMARY */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            {
              label: "Total Orders",
              val: stats.total,
              icon: Package,
              color: "text-blue-500",
            },
            {
              label: "Pending",
              val: stats.pending,
              icon: Calendar,
              color: "text-amber-500",
            },
            {
              label: "My Revenue",
              val: `₹${stats.revenue.toLocaleString()}`,
              icon: CheckCircle,
              color: "text-emerald-500",
            },
            {
              label: "Cancelled",
              val: stats.cancelled,
              icon: XCircle,
              color: "text-rose-500",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 transition-all"
            >
              <stat.icon className={`${stat.color} mb-4`} size={24} />
              <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                {stat.label}
              </p>
              <h3 className="text-2xl font-black dark:text-white mt-1">
                {stat.val}
              </h3>
            </div>
          ))}
        </div>

        {/* SEARCH & FILTER TABS */}
        <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-3xl mb-8 border border-transparent dark:border-slate-800 flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search by Order ID or Customer Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500/20 font-medium text-slate-900 dark:text-white"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === tab
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                    : "bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* TABLE CONTAINER */}
        <div className="bg-white dark:bg-slate-900/20 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="animate-spin text-orange-500" size={40} />
              <p className="text-slate-400 font-bold animate-pulse uppercase tracking-widest text-xs">
                Syncing Orders...
              </p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-24 text-center">
              <Package className="mx-auto text-slate-300 mb-4" size={48} />
              <p className="text-slate-500 font-bold">
                No orders found for this selection.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.1em]">
                  <tr>
                    <th className="px-8 py-5">Order ID</th>
                    <th className="px-8 py-5">Customer</th>
                    <th className="px-8 py-5">Status</th>
                    <th className="px-8 py-5">Items</th>
                    <th className="px-8 py-5">Subtotal</th>
                    <th className="px-8 py-5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredOrders.map((order) => (
                    <tr
                      key={order._id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group"
                    >
                      <td className="px-8 py-6 font-bold text-slate-900 dark:text-white text-sm">
                        #{order._id.slice(-6).toUpperCase()}
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold dark:text-slate-200">
                            {order.user?.name || "Guest User"}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-sm font-medium dark:text-slate-400">
                        {order.items.length}{" "}
                        {order.items.length === 1 ? "Item" : "Items"}
                      </td>
                      <td className="px-8 py-6 text-sm font-black text-slate-900 dark:text-white">
                        ₹{order.sellerTotal?.toLocaleString()}
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            title="View Details"
                            className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl hover:bg-orange-500 hover:text-white transition-all"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            title="Update Status"
                            className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl hover:bg-blue-500 hover:text-white transition-all"
                          >
                            <Truck size={18} />
                          </button>
                          <button className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                            <MoreVertical size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <SellerFooter />
    </div>
  );
}
