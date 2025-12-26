import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, Filter, Loader2, ShoppingCart, Star } from "lucide-react";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || ""; // Get keyword from URL ?q=earphones
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSearchResults = async () => {
      setLoading(true);
      try {
        // Hits your updated getAllProducts controller with the keyword
        const res = await fetch(`${API_URL}/api/products?keyword=${query}`);
        const data = await res.json();

        if (res.ok) {
          setProducts(data);
        } else {
          throw new Error(data.message);
        }
      } catch (err) {
        toast.error("Search failed. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (query) fetchSearchResults();
  }, [query]);

  return (
    <div className="bg-slate-50 min-h-screen font-sans">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* RESULTS HEADER */}
        <div className="mb-8">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            Results for <span className="text-orange-500">"{query}"</span>
          </h2>
          <p className="text-slate-500 font-medium">
            {products.length} products found in our catalog.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="animate-spin text-orange-500 mb-4" size={40} />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
              Scanning Inventory...
            </p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-slate-200">
            <Search className="mx-auto text-slate-200 mb-4" size={60} />
            <h3 className="text-xl font-bold text-slate-800">
              No matches found
            </h3>
            <p className="text-slate-400 mt-2">
              Try checking your spelling or using different keywords.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProductCard({ product }) {
  return (
    <Link
      to={`/product/${product._id}`}
      className="group bg-white rounded-[2rem] p-4 border border-transparent hover:border-orange-500/20 hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-500"
    >
      <div className="aspect-square rounded-[1.5rem] overflow-hidden bg-slate-100 mb-4 relative">
        <img
          src={product.thumbnail}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        {product.isBestSeller && (
          <div className="absolute top-3 left-3 bg-slate-900 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
            Bestseller
          </div>
        )}
      </div>

      <div className="space-y-1 px-1">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          {product.category}
        </p>
        <h3 className="font-bold text-slate-900 line-clamp-1 group-hover:text-orange-500 transition-colors">
          {product.name}
        </h3>

        <div className="flex items-center gap-1 text-amber-400 mb-2">
          <Star size={12} fill="currentColor" />
          <span className="text-xs font-bold text-slate-700">
            {product.rating || "New"}
          </span>
        </div>

        <div className="flex items-center justify-between mt-4">
          <span className="text-xl font-black text-slate-900">
            ₹{product.price.toLocaleString()}
          </span>
          <button className="p-3 bg-slate-900 text-white rounded-xl hover:bg-orange-500 transition-colors">
            <ShoppingCart size={18} />
          </button>
        </div>
      </div>
    </Link>
  );
}
