import React, { useEffect, useState } from "react";
import axios from "axios";
import { Sparkles, ArrowRight } from "lucide-react";
import ProductCard from "./ProductCard";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const Recommendations = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPersonalized, setIsPersonalized] = useState(false);

  // Inside Recommendations.jsx useEffect
  useEffect(() => {
  const fetchRecs = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return setLoading(false);

      const { data } = await axios.get(`${API_URL}/api/user/recommendations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(data.products || []);
      setIsPersonalized(data.personalized || false);
    } catch (err) {
      console.error("Fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  fetchRecs();

  window.addEventListener("search-intent-updated", fetchRecs);
  return () => window.removeEventListener("search-intent-updated", fetchRecs);
}, []); // No need for isSearching here, the event handles it.

  const handleTrackClick = async (product) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      // Fires in the background to update category weights and recently viewed
      await axios.post(
        `${API_URL}/api/user/track-interest`,
        { category: product.category, productId: product._id },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch (err) {
      // Silent fail to not disrupt user experience
    }
  };

  // Do not render the section if there's nothing to show
  if (!loading && products.length === 0) return null;

  return (
    <section className="py-12 bg-white dark:bg-[#030712] transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-500/10 rounded-2xl">
              <Sparkles
                size={24}
                className="text-orange-500 fill-orange-500/20"
              />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight dark:text-white flex items-center gap-2">
                {isPersonalized ? "Suggested" : "Trending"}
                <span className="text-orange-500">For You</span>
              </h2>
              {/* ✅ MODIFIED: Updated the text to match your new AI logic */}
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                {isPersonalized
                  ? "Based on your recent searches & views" // Removed wishlist/cart mention
                  : "Check out what's hot in the store right now"}
              </p>
            </div>
          </div>
        </div>

        {/* 8-Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {loading
            ? [1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <div
                  key={n}
                  className="h-80 bg-slate-100 dark:bg-slate-800/50 rounded-2xl animate-pulse border border-slate-200 dark:border-slate-800"
                />
              ))
            : products.map((item) => (
                <div
                  key={item._id}
                  onClick={() => handleTrackClick(item)}
                  className="group"
                >
                  <ProductCard product={item} />
                </div>
              ))}
        </div>
      </div>
    </section>
  );
};

export default Recommendations;
