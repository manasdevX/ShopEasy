import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, Loader2, ShoppingCart, Star, SlidersHorizontal, PackageSearch } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import toast from "react-hot-toast";
import { showError, showSuccess } from "../utils/toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSearchResults = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/products?keyword=${query}`);
        const data = await res.json();

        if (res.ok) {
          setProducts(data);
        } else {
          throw new Error(data.message);
        }
      } catch (err) {
        showError("Search failed. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (query) fetchSearchResults();
  }, [query]);

  return (
    <div className="bg-[#F8FAFC] dark:bg-[#020617] min-h-screen flex flex-col font-sans transition-colors duration-300">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* RESULTS HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-orange-500 font-bold text-xs uppercase tracking-[0.2em]">
              <Search size={14} /> Search Discovery
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Showing results for <span className="text-orange-500">"{query}"</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              We found <span className="text-slate-900 dark:text-slate-200 font-bold">{products.length}</span> premium matches.
            </p>
          </div>

          <button className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:border-orange-500 transition-all shadow-sm">
            <SlidersHorizontal size={16} /> Filters
          </button>
        </div>

        {/* CONTENT AREA */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="relative">
              <Loader2 className="animate-spin text-orange-500 mb-4" size={48} />
              <div className="absolute inset-0 blur-xl bg-orange-500/20 animate-pulse"></div>
            </div>
            <p className="text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.3em] text-[10px] mt-4">
              Analyzing Inventory...
            </p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-24 bg-white dark:bg-slate-900/50 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800">
            <div className="bg-slate-100 dark:bg-slate-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <PackageSearch className="text-slate-300 dark:text-slate-600" size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white">
              No matches found
            </h3>
            <p className="text-slate-400 dark:text-slate-500 mt-2 max-w-xs mx-auto font-medium">
              We couldn't find anything for "{query}". Try different keywords or browse categories.
            </p>
            <Link to="/" className="inline-block mt-8 px-8 py-3 bg-orange-500 text-white font-black rounded-2xl shadow-lg shadow-orange-500/20 hover:scale-105 transition-all text-sm">
              Return Home
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

// INTERNAL PRODUCT CARD COMPONENT (Refined for Dark Mode)
function ProductCard({ product }) {
  return (
    <Link
      to={`/product/${product._id}`}
      className="group bg-white dark:bg-slate-900 rounded-[2.5rem] p-4 border border-slate-100 dark:border-slate-800 hover:border-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-500"
    >
      {/* Image Container */}
      <div className="aspect-[4/5] rounded-[2rem] overflow-hidden bg-slate-100 dark:bg-slate-800 mb-5 relative">
        <img
          src={product.thumbnail}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        
        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {product.stock < 10 && product.stock > 0 && (
            <div className="bg-red-500 text-white text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-lg">
              Low Stock
            </div>
          )}
          {product.isBestSeller && (
            <div className="bg-slate-900 dark:bg-orange-500 text-white text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-lg">
              Bestseller
            </div>
          )}
        </div>

        {/* Quick Add Overlay */}
        <div className="absolute inset-x-4 bottom-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <button 
            onClick={(e) => {
              e.preventDefault();
              toast.success("Added to cart");
            }}
            className="w-full py-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-slate-900 dark:text-white text-xs font-black rounded-xl shadow-xl border border-white/20"
          >
            QUICK ADD
          </button>
        </div>
      </div>

      {/* Details */}
      <div className="px-2 pb-2 space-y-2">
        <div className="flex justify-between items-center">
          <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">
            {product.brand || product.category}
          </p>
          <div className="flex items-center gap-1 bg-amber-400/10 px-2 py-0.5 rounded-md">
            <Star size={10} className="text-amber-500" fill="currentColor" />
            <span className="text-[10px] font-bold text-amber-600">
              {product.rating || "4.5"}
            </span>
          </div>
        </div>

        <h3 className="font-bold text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-orange-500 transition-colors">
          {product.name}
        </h3>

        <div className="flex items-center justify-between pt-2">
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 line-through font-medium">
              ₹{(product.mrp || product.price + 500).toLocaleString()}
            </span>
            <span className="text-lg font-black text-slate-900 dark:text-white leading-none">
              ₹{product.price.toLocaleString()}
            </span>
          </div>
          <div className="h-10 w-10 bg-slate-900 dark:bg-slate-800 text-white rounded-full flex items-center justify-center group-hover:bg-orange-500 transition-all duration-300 group-hover:rotate-12">
            <ShoppingCart size={18} />
          </div>
        </div>
      </div>
    </Link>
  );
}