import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Star, Heart, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { showError , showSuccess } from "../utils/toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ProductCard({ product }) {
  const [adding, setAdding] = useState(false);
  const [wishlisting, setWishlisting] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Normalize Data
  const productId = product._id || product.id;
  const price =
    typeof product.price === "number"
      ? product.price
      : parseFloat(product.price) || 0;
  const mrp = product.mrp || price + 500;
  const imageDisplay =
    product.thumbnail || product.image || (product.images && product.images[0]);

  // 1. Logic to check if item is in wishlist and handle global sync
  const checkWishlistStatus = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user.wishlist && Array.isArray(user.wishlist)) {
        // Check if product ID exists (handles both object arrays and ID string arrays)
        const exists = user.wishlist.some(
          (item) => (typeof item === "string" ? item : item._id) === productId
        );
        setIsWishlisted(exists);
      } else {
        setIsWishlisted(false);
      }
    } catch (e) {
      console.error("Error parsing user data for wishlist check", e);
    }
  };

  useEffect(() => {
    // Initial check on mount
    checkWishlistStatus();

    // Listen for custom event from Account.jsx to sync the UI
    window.addEventListener("wishlistUpdated", checkWishlistStatus);
    return () =>
      window.removeEventListener("wishlistUpdated", checkWishlistStatus);
  }, [productId]);

  // Handle Quick Add to Cart
  const handleQuickAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const token = localStorage.getItem("token");
    if (!token) {
      showError("Please login to add items to cart", { icon: "🔒" });
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
        showSuccess(`${product.name} added to cart!`);
        window.dispatchEvent(new Event("cartUpdated"));
      } else {
        showError(data.message || "Failed to add item");
      }
    } catch (error) {
      showError("Something went wrong");
    } finally {
      setAdding(false);
    }
  };

  // Handle Toggle Wishlist (Add/Remove)
  const handleAddToWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const token = localStorage.getItem("token");
    if (!token) {
      showError("Please login to save items", { icon: "🔒" });
      return;
    }

    setWishlisting(true);
    try {
      // ✅ MODIFICATION: Dynamically choose method based on current status
      const method = isWishlisted ? "DELETE" : "POST";
      
      const res = await fetch(`${API_URL}/api/user/wishlist/${productId}`, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        user.wishlist = data;
        localStorage.setItem("user", JSON.stringify(user));

        // Update local state
        setIsWishlisted(!isWishlisted);
        
        // Show appropriate toast
        if (isWishlisted) {
          showSuccess("Removed from Wishlist");
        } else {
          showSuccess("Added to Wishlist!", { icon: "❤️" });
        }

        // Notify other components
        window.dispatchEvent(new Event("wishlistUpdated"));
      } else {
        showError(data.message || "Failed to update wishlist");
      }
    } catch (error) {
      showError("Server error");
    } finally {
      setWishlisting(false);
    }
  };

  // ✅ Optimized Tracking for AI
  // ✅ AI Tracking: Only triggered when visiting a product
  const handleTrackInterest = () => {
  const token = localStorage.getItem("token");
  if (!token || !product.category) return;

  // Use standard fetch with keepalive to ensure the request 
  // reaches the server during navigation.
  fetch(`${API_URL}/api/user/track-interest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ 
      category: product.category,
      productId: productId 
    }),
    keepalive: true, 
  });

  // This tells the Recommendations component to re-fetch NOW
  window.dispatchEvent(new Event("search-intent-updated"));
};

  return (
    <Link
      to={`/product/${productId}`}
      onClick={handleTrackInterest} // 🔥 Triggered when user clicks the product
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
          onClick={handleAddToWishlist}
          disabled={wishlisting}
          className={`absolute top-4 right-4 z-20 p-2.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-full shadow-sm transition-all duration-300 hover:scale-110 active:scale-95 disabled:opacity-50`}
        >
          {wishlisting ? (
            <Loader2 size={16} className="animate-spin text-red-500" />
          ) : (
            <Heart
              size={16}
              className={`${
                isWishlisted ? "text-red-500 fill-red-500" : "text-slate-400"
              } transition-colors duration-300`}
            />
          )}
        </button>

        <img
          src={imageDisplay}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
          alt={product.name}
          onError={(e) => {
            e.target.src = "https://via.placeholder.com/300?text=No+Image";
          }}
        />

        {/* Quick Add Button Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out z-10">
          <button
            onClick={handleQuickAdd}
            disabled={adding}
            className="w-full py-3 bg-slate-900 dark:bg-orange-500 text-white rounded-2xl shadow-xl font-bold text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-70"
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
        {product.rating? (<div className="flex items-center gap-1 text-orange-400">
          <Star size={12} fill="currentColor" />
          <span className="text-[11px] font-black text-slate-500 dark:text-slate-400">
            {product.rating}
          </span>
        </div>) : (<div className="flex items-center gap-1 text-orange-400">
          <span className="text-[11px] font-black text-slate-500 dark:text-slate-400">
            No Reviews
          </span>
        </div>)}
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          {product.category || "Premium"}
        </span>
      </div>

      {/* INFO */}
      <div className="px-1 flex-grow flex flex-col justify-between">
        <h3 className="font-bold text-slate-900 dark:text-white mb-2 group-hover:text-orange-500 transition-colors leading-tight line-clamp-2">
          {product.name}
        </h3>
        <div className="flex items-center gap-2">
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
