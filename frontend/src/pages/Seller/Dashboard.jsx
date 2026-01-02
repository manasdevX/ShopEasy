import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SellerNavbar from "../../components/Seller/SellerNavbar";
import SellerFooter from "../../components/Seller/SellerFooter";
import { showSuccess, showError } from "../../utils/toast";
import {
  BarChart3,
  ShoppingBag,
  Package,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Edit3,
  Trash2,
  Settings,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [lowStockItems, setLowStockItems] = useState([]);

  const fetchLowStock = async () => {
  try {
    const token = localStorage.getItem("sellerToken");
    
    // CHANGE THIS LINE: Added the extra '/' to match your product.route.js
    const res = await fetch(`${API_URL}/api/products/seller/all`, { 
      headers: { 
        Authorization: `Bearer ${token}` 
      },
    });
    
    const result = await res.json();

    if (res.ok) {
      // Filter the entire inventory for items < 5
      const low = result.filter((p) => p.stock < 5).sort((a , b) => a.stock - b.stock);
      setLowStockItems(low);
    } else {
      console.error("Failed to fetch low stock:", result.message);
    }
  } catch (error) {
    console.error("Error fetching full inventory:", error);
  }
};

  useEffect(() => {
    fetchLowStock();
  }, []);

  // Initial State
  const [data, setData] = useState({
    seller: { name: "", businessName: "My Store", rating: 0 },
    stats: { totalRevenue: 0, activeOrders: 0, totalProducts: 0 },
    recentProducts: [],
    trends: { revenue: "0%", revenueIsUp: true, products: "Active" },
  });

  // --- FETCH DATA FROM API ---
  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("sellerToken");

      if (!token) {
        showError("Please login first");
        navigate("/Seller/login");
        return;
      }

      const res = await fetch(`${API_URL}/api/sellers/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await res.json();

      if (res.ok) {
        setData(result);
      } else {
        if (res.status === 401) {
          localStorage.removeItem("sellerToken");
          navigate("/Seller/login");
        }
      }
    } catch (error) {
      console.error("Dashboard Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [navigate]);

  // --- HELPER: Format Currency ---
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // --- HELPER: Get Next Friday (For Payout Date) ---
  const getNextPayoutDate = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;
    const nextFriday = new Date(today);
    nextFriday.setDate(today.getDate() + daysUntilFriday);
    return nextFriday.toLocaleDateString("en-US", {
      weekday: "long",
      day: "numeric",
      month: "short",
    });
  };

  // --- REAL BACKEND DELETE ---
  const handleRemoveProduct = async (id) => {
    try {
      const token = localStorage.getItem("sellerToken");
      const res = await fetch(`${API_URL}/api/products/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        showSuccess(`Product deleted successfully`);
        fetchDashboardData(); // Refresh data
      } else {
        const result = await res.json();
        showError(result.message || "Failed to delete product");
      }
    } catch (error) {
      showError("Server error. Please try again.");
    }
  };

  const stats = [
    {
      title: "Total Revenue",
      value: loading ? "..." : formatCurrency(data.stats.totalRevenue),
      trend: loading ? "..." : data.trends?.revenue || "0%",
      trendUp: data.trends?.revenueIsUp,
      icon: BarChart3,
    },
    {
      title: "Active Orders",
      value: loading ? "..." : data.stats.activeOrders,
      trend: "Pending",
      icon: ShoppingBag,
    },
    {
      title: "Total Products",
      value: loading ? "..." : data.stats.totalProducts,
      trend: loading ? "..." : data.trends?.products || "Active",
      icon: Package,
    },
    {
      title: "Store Rating",
      value: loading ? "..." : data.seller.rating || "N/A",
      trend: "Live",
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="bg-white dark:bg-[#030712] min-h-screen transition-colors duration-500 font-sans flex flex-col">
      {/* 1. Moved Search Logic to SellerNavbar so it persists across pages. 
          Ensure your SellerNavbar component has the search input and API call logic if needed there. 
      */}
      <SellerNavbar isLoggedIn={true} />

      <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-12">
        {/* HEADER - CLEANED UP */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
              {loading ? "Loading..." : data.seller.businessName || "My Store"}
              <span className="text-orange-500">.</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium mt-3 text-lg">
              Welcome back,{" "}
              <span className="text-slate-900 dark:text-slate-200 font-bold">
                {loading ? "..." : data.seller.name}
              </span>
              .
            </p>
          </div>

          {/* REMOVED DUPLICATE SEARCH BAR HERE */}
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="bg-slate-50 dark:bg-slate-900/40 p-8 rounded-[2.5rem] border border-transparent dark:border-slate-800 hover:border-orange-500/20 transition-all group"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm text-orange-500 group-hover:rotate-6 transition-transform">
                  <stat.icon size={26} />
                </div>
                <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg flex items-center gap-1">
                  <ArrowUpRight size={12} /> {stat.trend}
                </span>
              </div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                {stat.title}
              </p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">
                {stat.value}
              </h3>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* RECENT PRODUCTS TABLE */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900/20 rounded-[3rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/30 dark:bg-transparent">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  Recent Inventory
                </h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
                  Active Listings
                </p>
              </div>
              <Settings
                size={20}
                className="text-slate-400 cursor-pointer hover:rotate-90 transition-transform duration-500"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 dark:bg-slate-900/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  <tr>
                    <th className="px-8 py-5">Product Name</th>
                    <th className="px-8 py-5">Stock</th>
                    <th className="px-8 py-5">Price</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {loading ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="px-8 py-10 text-center text-slate-500"
                      >
                        <div className="flex justify-center items-center gap-2">
                          <Loader2 className="animate-spin" size={20} /> Loading
                          inventory...
                        </div>
                      </td>
                    </tr>
                  ) : data.recentProducts.length === 0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="px-8 py-10 text-center text-slate-500 font-medium"
                      >
                        No products found. Start adding!
                      </td>
                    </tr>
                  ) : (
                    data.recentProducts.map((product) => (
                      <ProductRow
                        key={product._id}
                        id={product._id}
                        name={product.name}
                        stock={product.stock}
                        amount={formatCurrency(product.price)}
                        onRemove={handleRemoveProduct}
                        onEdit={(id) => navigate(`/Seller/edit-product/${id}`)}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* SIDEBAR WIDGETS */}
          <div className="space-y-6">
            <div className="bg-slate-900 dark:bg-slate-900/60 rounded-[2.5rem] p-8 text-white relative border border-slate-800 shadow-2xl">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2 bg-red-500/10 text-red-500 w-fit px-3 py-1 rounded-full border border-red-500/20">
                    <AlertCircle size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      Inventory Alert
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-slate-500 uppercase">
                    {lowStockItems.length} Items
                  </span>
                </div>

                <h3 className="text-2xl font-black mb-4 tracking-tighter">
                  Critical Stock
                </h3>

                {/* Scrollable area for all low stock products */}
                <div className="space-y-4 mb-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {lowStockItems.length > 0 ? (
                    lowStockItems.map((prod) => (
                      <div
                        key={prod._id}
                        onClick={() =>
                          navigate(`/Seller/edit-product/${prod._id}`)
                        }
                        className="group cursor-pointer p-3 rounded-2xl hover:bg-white/5 transition-all border border-transparent hover:border-slate-800"
                      >
                        <div className="flex justify-between items-center gap-4">
                          <div className="flex-grow min-w-0">
                            <p className="text-sm font-bold text-slate-200 group-hover:text-orange-500 transition-colors truncate">
                              {prod.name}
                            </p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                              SKU: {prod._id.slice(-6).toUpperCase()}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <span
                              className={`text-xs font-black px-2 py-1 rounded-lg ${
                                prod.stock === 0
                                  ? "bg-red-500 text-white"
                                  : "bg-orange-500/20 text-orange-500 border border-orange-500/20"
                              }`}
                            >
                              {prod.stock}
                            </span>
                          </div>
                        </div>

                        {/* Visual Health Bar */}
                        <div className="w-full bg-slate-800 h-1 mt-3 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-1000 ${
                              prod.stock === 0 ? "bg-red-500" : "bg-orange-500"
                            }`}
                            style={{
                              width: `${Math.max((prod.stock / 5) * 100, 5)}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-10 text-center bg-slate-800/20 rounded-[2rem] border border-dashed border-slate-800">
                      <CheckCircle2
                        size={32}
                        className="mx-auto text-emerald-500 mb-3 opacity-20"
                      />
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        Inventory Healthy
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => navigate("/Seller/products")}
                  className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all active:scale-95"
                >
                  View Full Inventory
                </button>
              </div>
            </div>

            {/* STORE STATUS BOX (Keep your existing one below) */}
          </div>
        </div>
      </main>

      <SellerFooter />
    </div>
  );
}

// Sub-Component for Product Rows
function ProductRow({ id, name, stock, amount, onRemove, onEdit }) {
  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group border-b border-slate-100 dark:border-slate-800">
      <td className="px-8 py-6">
        <p className="font-black text-slate-900 dark:text-white text-sm tracking-tight line-clamp-1 uppercase">
          {name}
        </p>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          ID: #{id.slice(-6)}
        </p>
      </td>
      <td className="px-8 py-6">
        <span
          className={`px-3 py-1.5 border text-[10px] font-black uppercase tracking-tighter ${
            stock > 0
              ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
              : "bg-red-50 text-red-600 border-red-100"
          }`}
        >
          {stock} in stock
        </span>
      </td>
      <td className="px-8 py-6 font-black text-slate-900 dark:text-white text-sm tracking-tighter">
        {amount}
      </td>

      <td className="px-8 py-6 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onEdit(id)}
            className="p-2.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-all border border-transparent hover:border-orange-200 dark:hover:border-orange-900/30"
            title="Edit Product"
          >
            <Edit3 size={18} />
          </button>

          <button
            onClick={() => onRemove(id)}
            className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all border border-transparent hover:border-red-200 dark:hover:border-red-900/30"
            title="Remove Product"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
}
