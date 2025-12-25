import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import SellerNavbar from "../../components/Seller/SellerNavbar";
import SellerFooter from "../../components/Seller/SellerFooter";
import { Plus, Search, Edit3, Trash2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { showError, showSuccess } from "../../utils/toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // --- Fetch Seller Products ---
  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("sellerToken");
      // Note: We'll create a specific route for Seller's own products
      const res = await fetch(`${API_URL}/api/products/seller/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setProducts(data);
    } catch (err) {
      showError(err.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // --- Delete Product ---
  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("sellerToken");
      const res = await fetch(`${API_URL}/api/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        showSuccess("Product deleted");
        setProducts(products.filter((p) => p._id !== id));
      } else {
        const data = await res.json();
        throw new Error(data.message);
      }
    } catch (err) {
      showError(err.message);
    }
  };

  // Filter products locally for search
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white dark:bg-[#030712] min-h-screen transition-colors duration-500 font-sans">
      <SellerNavbar isLoggedIn={true} />

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
              My <span className="text-orange-500">Products.</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Manage your catalog and stock levels.
            </p>
          </div>
          <Link
            to="/Seller/add-product"
            className="flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-orange-500/20 hover:scale-105 transition-all"
          >
            <Plus size={20} /> Add New Product
          </Link>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-3xl mb-8 border border-transparent dark:border-slate-800 flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search your products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500/20 font-medium text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* PRODUCT LIST */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-orange-500" size={40} />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/20 rounded-[3rem]">
            <p className="text-slate-400 font-bold">
              No products found. Start by adding one!
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
                  {/* Note: Backend uses 'thumbnail' field */}
                  <img
                    src={product.thumbnail || "https://via.placeholder.com/200"}
                    className="w-20 h-20 rounded-2xl object-cover"
                    alt={product.name}
                  />
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-orange-500 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
                      {product.category}
                    </p>
                    <p className="text-orange-500 font-black">
                      ₹{product.price}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-center hidden sm:block">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Stock
                    </p>
                    <p
                      className={`font-bold ${
                        product.stock <= 0
                          ? "text-red-500"
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
                        navigate(`/Seller/edit-product`)
                      }
                      className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-orange-500 hover:text-white transition-all"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-red-500 hover:text-white transition-all"
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
