import React, { useState, useEffect } from "react";
import {
  Search,
  Eye,
  Truck,
  MoreVertical,
  Package,
  CheckCircle,
  XCircle,
  Loader2,
  MapPin,
  CreditCard,
  Calendar,
  Download,
  Phone,
} from "lucide-react";
import Navbar from "../../components/Seller/SellerNavbar";
import Footer from "../../components/Seller/SellerFooter";
import { showSuccess, showError } from "../../utils/toast";
import { useSocket } from "../../context/SocketContext"; // ✅ Added Socket Hook
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const socket = useSocket(); // ✅ Initialize Socket

  // State for Dropdown and Modal
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // --- SOCKET.IO REAL-TIME LOGIC ---
  useEffect(() => {
    // 🔴 FIX: Check 'sellerUser' first (matching your Navbar logic), then fallback to 'user'
    let seller = null;
    try {
        seller = JSON.parse(localStorage.getItem("sellerUser") || localStorage.getItem("user"));
    } catch (e) {
        console.error("Parsing error", e);
    }

    if (socket && seller?._id) {
      console.log("🔌 Joining Seller Room:", seller._id); // [DEBUG] Verify ID
      
      // Ensure seller is in their room to receive new order broadcasts
      socket.emit("join_seller_room", seller._id);

      // Listen for new orders to refresh the list automatically
      socket.on("order_alert", (data) => {
        console.log("📦 New Order Broadcast Received:", data); // [DEBUG] Verify Event
        fetchOrders(); // Refresh the list when a new order comes in
      });
    }

    return () => {
      if (socket) socket.off("order_alert");
    };
  }, [socket]);

  // --- FETCH ORDERS ---
  const fetchOrders = async () => {
    // Only set loading on initial fetch, not on background refreshes
    if (orders.length === 0) setLoading(true);
    
    try {
      const token = localStorage.getItem("sellerToken");
      const res = await fetch(
        `${API_URL}/api/orders/seller-orders?status=${activeTab}&search=${searchQuery}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();

      if (res.ok) {
        setOrders(data);
      } else {
        // Suppress error toast on background refreshes to avoid spam
        console.error(data.message || "Failed to fetch orders");
      }
    } catch (error) {
      console.error("Failed to fetch orders", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchOrders();
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [activeTab, searchQuery]);

  // Auto-refresh Modal when Order Data updates
  useEffect(() => {
    if (selectedOrder) {
      const updatedOrder = orders.find((o) => o._id === selectedOrder._id);
      if (updatedOrder) {
        setSelectedOrder(updatedOrder);
      }
    }
  }, [orders]);

  // --- GENERIC UPDATE STATUS (Only for Shipping) ---
  const updateStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem("sellerToken");
      const res = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (res.ok) {
        showSuccess(`Order marked as ${newStatus}`);
        fetchOrders();
        setActiveDropdown(null);
      } else {
        showError(data.message || "Update failed");
      }
    } catch (error) {
      showError("Server error");
    }
  };

  // --- UI HELPERS ---
  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "Processing").length,
    revenue: orders.reduce((acc, curr) => acc + (curr.sellerTotal || 0), 0),
    cancelled: orders.filter((o) => o.status === "Cancelled").length,
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Delivered":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-500 border-emerald-200 dark:border-emerald-500/20";
      case "Shipped":
        return "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-500 border-blue-200 dark:border-blue-500/20";
      case "Cancelled":
        return "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-500 border-rose-200 dark:border-rose-500/20";
      case "Returned":
      case "Return Initiated":
        return "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-500 border-purple-200 dark:border-purple-500/20";
      default:
        return "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-500 border-amber-200 dark:border-amber-500/20";
    }
  };

  const tabs = [
    "All",
    "Processing",
    "Shipped",
    "Delivered",
    "Cancelled",
    "Return Initiated",
  ];

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(249, 115, 22);
    doc.text("ShopEasy", 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Seller Central Fulfillment Report", 14, 27);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 33);

    const tableColumn = [
      "Order ID",
      "Customer & Contact",
      "Shipping Address",
      "Total",
    ];
    const tableRows = orders.map((order) => [
      `#${order._id.slice(-6).toUpperCase()}`,
      `${order.user?.name}\nPh: ${order.shippingAddress?.phone || "N/A"}`,
      `${order.shippingAddress?.address}, ${order.shippingAddress?.city}`,
      `INR ${order.sellerTotal?.toLocaleString()}`,
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: "striped",
      headStyles: { fillColor: [249, 115, 22], fontSize: 10 },
      styles: { fontSize: 8, cellPadding: 4 },
      columnStyles: { 2: { cellWidth: 60 } },
    });

    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFillColor(245, 245, 245);
    doc.rect(14, finalY, 182, 20, "F");
    doc.setFont(undefined, "bold");
    doc.setTextColor(0);
    doc.text(`Total Orders: ${orders.length}`, 20, finalY + 12);
    doc.text(
      `Total Tab Revenue: INR ${stats.revenue.toLocaleString()}`,
      100,
      finalY + 12
    );
    doc.save(`ShopEasy_${activeTab}_Report.pdf`);
  };

  return (
    <div className="bg-white dark:bg-[#030712] min-h-screen transition-colors duration-500 font-sans">
      <Navbar isLoggedIn={true} />

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
              Manage <span className="text-orange-500">Orders.</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
              Monitor sales performance and shipping fulfillment.
            </p>
          </div>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-orange-500/20 hover:scale-105 transition-all"
          >
            <Download size={20} /> Export PDF
          </button>
        </div>

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
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {stat.val}
              </h3>
            </div>
          ))}
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-3xl mb-8 border border-transparent dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by Order ID, Customer or Product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500/20 font-medium text-slate-900 dark:text-white transition-colors"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar w-full md:w-auto">
            {tabs.map((status) => (
              <button
                key={status}
                onClick={() => setActiveTab(status)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                  activeTab === status
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                    : "bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/20 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em]">
              <tr>
                <th className="px-8 py-5">Order ID</th>
                <th className="px-8 py-5">Product Details</th>
                <th className="px-8 py-5">Customer</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5">Amount</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-24 text-center">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <Loader2
                        className="animate-spin text-orange-500"
                        size={40}
                      />
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse">
                        Syncing Orders...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-24 text-center">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <Package className="text-slate-300" size={48} />
                      <p className="text-slate-500 font-bold">
                        No orders found.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order._id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group"
                  >
                    <td className="px-8 py-6 font-bold text-slate-900 dark:text-white text-sm">
                      #{order._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0">
                          <img
                            src={
                              order.items[0]?.product?.thumbnail ||
                              "https://via.placeholder.com/50"
                            }
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white line-clamp-1 max-w-[150px] text-sm">
                            {order.items[0]?.product?.name || (
                              <span className="text-slate-400 italic">
                                Unknown
                              </span>
                            )}
                          </p>
                          {order.totalItems > 1 && (
                            <p className="text-[10px] text-slate-500 font-medium">
                              + {order.totalItems - 1} other items
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {order.user?.name || "Guest"}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 font-black text-slate-900 dark:text-white text-sm">
                      ₹{order.sellerTotal?.toLocaleString()}
                    </td>
                    <td className="px-8 py-6 text-right relative">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl hover:bg-orange-500 hover:text-white transition-all"
                        >
                          <Eye size={18} />
                        </button>
                        {order.status === "Processing" && (
                          <button
                            onClick={() => updateStatus(order._id, "Shipped")}
                            className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl hover:bg-blue-500 hover:text-white transition-all"
                          >
                            <Truck size={18} />
                          </button>
                        )}
                        <div className="relative">
                          <button
                            onClick={() =>
                              setActiveDropdown(
                                activeDropdown === order._id ? null : order._id
                              )
                            }
                            className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                          >
                            <MoreVertical size={18} />
                          </button>
                          {activeDropdown === order._id && (
                            <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden py-1">
                              {order.status === "Shipped" && (
                                <button
                                  onClick={() =>
                                    updateStatus(order._id, "Delivered")
                                  }
                                  className="w-full text-left px-4 py-3 text-xs font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 flex items-center gap-2"
                                >
                                  <CheckCircle size={14} /> Mark Delivered
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setActiveDropdown(null);
                                }}
                                className="w-full text-left px-4 py-3 text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                              >
                                <Eye size={14} /> View Details
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {selectedOrder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 w-full max-w-2xl rounded-[2rem] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                  Order Details
                </h2>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
                  ID: #{selectedOrder._id}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-white transition-colors"
              >
                <XCircle size={24} />
              </button>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-3 flex items-center gap-2">
                    <MapPin size={14} /> Shipping Address
                  </h3>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl text-sm text-slate-600 dark:text-slate-300 leading-relaxed border border-slate-100 dark:border-slate-800">
                    <p className="font-bold text-slate-900 dark:text-white mb-1">
                      {selectedOrder.user?.name}
                    </p>
                    <p>{selectedOrder.shippingAddress.address}</p>
                    <p>
                      {selectedOrder.shippingAddress.city},{" "}
                      {selectedOrder.shippingAddress.postalCode}
                    </p>
                    <p>{selectedOrder.shippingAddress.country}</p>
                    <p className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-500 flex items-center gap-2">
                      <Phone size={12} />{" "}
                      {selectedOrder.shippingAddress.phone || "No Phone"}
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-3 flex items-center gap-2">
                    <CreditCard size={14} /> Payment Info
                  </h3>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl text-sm flex justify-between items-center border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Method:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {selectedOrder.paymentMethod}
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl text-sm flex justify-between items-center mt-2 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Status:</span>
                    <span
                      className={`font-bold ${
                        selectedOrder.isRefunded
                          ? "text-purple-500"
                          : selectedOrder.isPaid
                          ? "text-emerald-500"
                          : "text-orange-500"
                      }`}
                    >
                      {selectedOrder.isRefunded
                        ? "REFUNDED"
                        : selectedOrder.isPaid
                        ? "PAID"
                        : "PENDING"}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-3 flex items-center gap-2">
                  <Package size={14} /> Order Items
                </h3>
                <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {selectedOrder.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex gap-4 bg-slate-50 dark:bg-slate-800/30 p-3 rounded-2xl border border-slate-100 dark:border-slate-800"
                    >
                      <img
                        src={
                          item.product?.thumbnail ||
                          "https://via.placeholder.com/50"
                        }
                        alt=""
                        className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700 object-cover"
                      />
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                          {item.product?.name || "Unknown"}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Qty:{" "}
                          <span className="text-slate-900 dark:text-white font-bold">
                            {item.qty}
                          </span>{" "}
                          × ₹{item.price}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <span className="text-sm text-slate-500 font-bold">
                    Total Earnings
                  </span>
                  <span className="text-2xl font-black text-orange-500">
                    ₹{selectedOrder.sellerTotal?.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-50 dark:bg-slate-950/30 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              {selectedOrder.status === "Processing" && (
                <button
                  onClick={() => updateStatus(selectedOrder._id, "Shipped")}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-blue-500/20"
                >
                  Mark as Shipped
                </button>
              )}
              {selectedOrder.status === "Shipped" && (
                <button
                  onClick={() => updateStatus(selectedOrder._id, "Delivered")}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20"
                >
                  Mark as Delivered
                </button>
              )}
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-6 py-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-bold rounded-xl text-sm transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
