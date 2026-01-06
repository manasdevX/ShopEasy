import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import SellerNavbar from "../../components/Seller/SellerNavbar";
import SellerFooter from "../../components/Seller/SellerFooter";
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Loader2,
  Package,
  RefreshCw,
} from "lucide-react";
import { useSocket } from "../../context/SocketContext";
import { showSuccess, showError } from "../../utils/toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Products() {
  const navigate = useNavigate();

  // ✅ Access socket context mainly for connection status check if needed
  const { isConnected } = useSocket();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // --- 1. FETCH PRODUCTS ---
  const fetchProducts = useCallback(
    async (isSilent = false) => {
      if (!isSilent) setLoading(true);
      try {
        const token = localStorage.getItem("sellerToken");
        if (!token) {
          navigate("/Seller/login");
          return;
        }

        const res = await fetch(`${API_URL}/api/products/seller/all`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });

        const data = await res.json();

        if (res.ok) {
          setProducts(data);
        } else if (res.status === 401) {
          localStorage.removeItem("sellerToken");
          localStorage.removeItem("sellerUser");
          navigate("/Seller/login?message=session_expired");
        } else {
          throw new Error(data.message || "Could not load products");
        }
      } catch (err) {
        showError(err.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [navigate]
  );

  // Initial Fetch
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // --- 2. REAL-TIME INVENTORY SYNC ---
  // Listens for the global 'refresh-data' event dispatched by SocketContext
  useEffect(() => {
    const handleGlobalRefresh = () => {
      console.log("📦 Inventory: Syncing stock levels via global event...");
      fetchProducts(true); // Silent refresh
    };

    window.addEventListener("refresh-data", handleGlobalRefresh);

    return () => {
      window.removeEventListener("refresh-data", handleGlobalRefresh);
    };
  }, [fetchProducts]);

  // --- 3. DELETE ACTION ---
  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this product? This action cannot be undone."
      )
    )
      return;

    try {
      const token = localStorage.getItem("sellerToken");
      const res = await fetch(`${API_URL}/api/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });

      if (res.ok) {
        showSuccess("Product deleted successfully");
        setProducts((prev) => prev.filter((p) => p._id !== id));
      } else {
        const data = await res.json();
        throw new Error(data.message || "Deletion failed");
      }
    } catch (err) {
      showError(err.message);
    }
  };

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  // Filter products locally for search
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.category &&
        p.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="bg-white dark:bg-[#030712] min-h-screen transition-colors duration-500 font-sans flex flex-col">
      <SellerNavbar isLoggedIn={true} />

      <main className="max-w-7xl mx-auto px-6 py-12 flex-grow w-full">
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
                My <span className="text-orange-500">Products.</span>
              </h1>
              <button
                onClick={handleManualRefresh}
                className={`p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                  refreshing ? "animate-spin text-orange-500" : "text-slate-400"
                }`}
                title="Refresh Inventory"
              >
                <RefreshCw size={20} />
              </button>
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Manage your catalog and stock levels.
            </p>
          </div>
          <Link
            to="/Seller/add-product"
            className="flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={20} /> Add New Product
          </Link>
        </div>

        {/* SEARCH BAR */}
        <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-3xl mb-8 border border-transparent dark:border-slate-800 flex flex-col md:flex-row gap-4 shadow-sm">
          <div className="relative flex-grow">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={20}
            />
            <input
              type="text"
              autoComplete="off"
              placeholder="Search by product name or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500/20 font-medium text-slate-900 dark:text-white transition-all"
            />
          </div>
        </div>

        {/* PRODUCT LIST */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-orange-500" size={40} />
            <p className="text-slate-400 font-bold animate-pulse text-xs uppercase tracking-widest">
              Fetching Inventory...
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-24 bg-slate-50 dark:bg-slate-900/20 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800">
            <Package className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-400 font-bold">
              {searchTerm
                ? "No products match your search."
                : "No products found. Start by adding one!"}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredProducts.map((product) => (
              <div
                key={product._id}
                className="bg-white dark:bg-slate-900/20 border border-slate-100 dark:border-slate-800 p-4 rounded-[2rem] flex items-center justify-between hover:shadow-xl hover:shadow-orange-500/5 transition-all group"
              >
                <div className="flex items-center gap-6">
                  <img
                    src={product.thumbnail || "https://via.placeholder.com/200"}
                    className="w-20 h-20 rounded-2xl object-cover bg-slate-100 dark:bg-slate-800"
                    alt={product.name}
                  />
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-orange-500 transition-colors tracking-tight">
                      {product.name}
                    </h3>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
                      {product.category || "General"}
                    </p>
                    <p className="text-orange-500 font-black">
                      ₹{product.price?.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-center hidden sm:block">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Inventory
                    </p>
                    <p
                      className={`font-bold ${
                        product.stock <= 0
                          ? "text-red-500"
                          : product.stock < 10
                          ? "text-amber-500"
                          : "text-slate-900 dark:text-white"
                      }`}
                    >
                      {product.stock <= 0
                        ? "Out of Stock"
                        : `${product.stock} Units`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        navigate(`/Seller/edit-product/${product._id}`)
                      }
                      className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-orange-500 hover:text-white transition-all shadow-sm border border-transparent dark:border-slate-700"
                      title="Edit Product"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm border border-transparent dark:border-slate-700"
                      title="Delete Product"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <SellerFooter />
    </div>
  );
}
