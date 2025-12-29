import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Star, Heart, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ProductCard({ product }) {
  const [adding, setAdding] = useState(false);

  // Normalize Data
  const productId = product._id || product.id;
  const price =
    typeof product.price === "number"
      ? product.price
      : parseFloat(product.price) || 0;
  const mrp = product.mrp || price + 500;
  const imageDisplay =
    product.thumbnail || product.image || (product.images && product.images[0]);

  // Handle Quick Add to Cart (Connects to Backend)
  const handleQuickAdd = async (e) => {
    e.preventDefault(); // Prevent navigating to product page
    e.stopPropagation();

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to add items to cart", { icon: "🔒" });
      return;
    }

    setAdding(true);
    try {
      const res = await fetch(`${API_URL}/api/cart/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId, quantity: 1 }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`${product.name} added to cart!`);
        // 🚀 Trigger Navbar Update Instantly
        window.dispatchEvent(new Event("cartUpdated"));
      } else {
        toast.error(data.message || "Failed to add item");
      }
    } catch (error) {
      console.error("Add to cart error:", error);
      toast.error("Something went wrong");
    } finally {
      setAdding(false);
    }
  };

  return (
    <Link
      to={`/product/${productId}`}
      className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-[2rem] p-4 shadow-sm hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-500 group border border-slate-100 dark:border-slate-700/50 hover:border-orange-500/30 flex flex-col h-full"
    >
      <div className="relative h-64 rounded-[1.5rem] overflow-hidden mb-5 bg-slate-100 dark:bg-slate-900">
        {/* Discount Badge */}
        {mrp > price && (
          <div className="absolute top-4 left-4 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-full shadow-sm">
            <p className="text-[10px] font-black text-green-600 uppercase tracking-tighter">
              Save ₹{(mrp - price).toFixed(0)}
            </p>
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            toast("Wishlist feature coming soon!", { icon: "❤️" });
          }}
          className="absolute top-4 right-4 z-10 p-2.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-full shadow-sm text-slate-400 hover:text-red-500 transition-colors"
        >
          <Heart size={16} />
        </button>

        <img
          src={imageDisplay}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
          alt={product.name}
        />

        {/* Quick Add Button Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out">
          <button
            onClick={handleQuickAdd}
            disabled={adding}
            className="w-full py-3 bg-slate-900 dark:bg-orange-500 text-white rounded-2xl shadow-xl font-bold text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {adding ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Adding...
              </>
            ) : (
              <>
                <ShoppingBag size={18} /> Quick Add
              </>
            )}
          </button>
        </div>
      </div>

      {/* RATING & CATEGORY */}
      <div className="flex justify-between items-center mb-2 px-1">
        <div className="flex items-center gap-1 text-orange-400">
          <Star size={12} fill="currentColor" />
          <span className="text-[11px] font-black text-slate-500 dark:text-slate-400">
            {product.rating || "4.5"}
          </span>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          {product.category || "Premium"}
        </span>
      </div>

      {/* INFO */}
      <div className="px-1 flex-grow">
        <h3 className="font-bold text-slate-900 dark:text-white mb-2 group-hover:text-orange-500 transition-colors leading-tight line-clamp-2">
          {product.name}
        </h3>
        <div className="flex items-center gap-2 mt-auto">
          <p className="text-orange-600 dark:text-orange-400 font-black text-lg">
            ₹{price.toLocaleString()}
          </p>
          {mrp > price && (
            <p className="text-slate-400 line-through text-xs font-medium">
              ₹{mrp.toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
