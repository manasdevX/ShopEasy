import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Search,
  Loader2,
  SlidersHorizontal,
  PackageSearch,
  Star,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { showError } from "../utils/toast";
import ProductCard from "../components/ProductCard";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRating, setSelectedRating] = useState(0);

  // Filter states
  const [priceRange, setPriceRange] = useState("all");
  const RATING_OPTIONS = [
    { label: "All Ratings", value: 0 },
    { label: "4", value: 4 },
    { label: "3", value: 3 },
    { label: "2", value: 2 },
  ];

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!query) return;
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/products?keyword=${query}`);
        const data = await res.json();

        if (res.ok) {
          // data should be an array of product objects
          setProducts(Array.isArray(data) ? data : data.products || []);
        } else {
          throw new Error(data.message || "Failed to fetch");
        }
      } catch (err) {
        showError("Search failed. Please try again.");
        console.error("Search Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [query]);

  return (
    <div className="bg-[#F8FAFC] dark:bg-[#020617] min-h-screen flex flex-col font-sans transition-colors duration-300">
      <Navbar />

      <main className="flex-grow max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* --- LEFT SIDEBAR (Add this block) --- */}
          <aside className="hidden lg:block w-72 flex-shrink-0 space-y-8 sticky top-24 h-fit">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <SlidersHorizontal size={20} className="text-orange-500" />{" "}
                Filters
              </h3>

              {/* Price Filter Section */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Price Range
                </h4>
                <div className="space-y-3">
                  {[
                    { label: "All Prices", value: "all" },
                    { label: "Under ₹1,000", value: "0-1000" },
                    { label: "₹1,000 - ₹5,000", value: "1000-5000" },
                    { label: "Over ₹5,000", value: "5000-above" },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <input
                        type="radio"
                        name="price"
                        checked={priceRange === option.value}
                        onChange={() => setPriceRange(option.value)}
                        className="hidden"
                      />
                      <div
                        className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${
                          priceRange === option.value
                            ? "bg-orange-500 border-orange-500"
                            : "border-slate-200 dark:border-slate-700 group-hover:border-orange-500"
                        }`}
                      >
                        {priceRange === option.value && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                      <span
                        className={`text-sm font-bold ${
                          priceRange === option.value
                            ? "text-slate-900 dark:text-white"
                            : "text-slate-500"
                        }`}
                      >
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* rating Filter Section */}
              {/* Ratings Filter Section */}
              <div className="space-y-4 py-5">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Customer Ratings
                </h4>
                <div className="space-y-3">
                  {RATING_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <input
                        type="radio"
                        name="rating"
                        checked={selectedRating === option.value}
                        onChange={() => setSelectedRating(option.value)}
                        className="hidden"
                      />

                      {/* Custom Radio Circle */}
                      <div
                        className={`w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center ${
                          selectedRating === option.value
                            ? "border-orange-500"
                            : "border-slate-200 dark:border-slate-700 group-hover:border-orange-500"
                        }`}
                      >
                        {selectedRating === option.value && (
                          <div className="w-2.5 h-2.5 bg-orange-500 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.4)]" />
                        )}
                      </div>

                      {/* Label Container: Number + Star */}
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-sm font-bold ${
                            selectedRating === option.value
                              ? "text-slate-900 dark:text-white"
                              : "text-slate-500"
                          }`}
                        >
                          {option.label}
                        </span>

                        {/* Only show Star and "& Up" for 4, 3, and 2 */}
                        {option.value > 0 && (
                          <div className="flex items-center gap-1">
                            <Star
                              size={14}
                              className="text-amber-400"
                              fill="currentColor"
                              stroke="none"
                            />
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                              & Up
                            </span>
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              {/* Reset Button */}
              <button
                onClick={() => setPriceRange("all")}
                className="w-full mt-8 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors border-t border-slate-50 dark:border-slate-800 pt-6"
              >
                Clear All
              </button>
            </div>
          </aside>

          {/* --- MAIN CONTENT AREA (Wrap your existing code here) --- */}
          <div className="flex-grow">
            {/* RESULTS HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-orange-500 font-bold text-xs uppercase tracking-[0.2em]">
                  <Search size={14} /> Search Discovery
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                  Showing results for{" "}
                  <span className="text-orange-500">"{query}"</span>
                </h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium">
                  We found{" "}
                  <span className="text-slate-900 dark:text-slate-200 font-bold">
                    {products.length}
                  </span>{" "}
                  premium matches.
                </p>
              </div>
            </div>

            {/* CONTENT AREA */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32">
                <div className="relative">
                  <Loader2
                    className="animate-spin text-orange-500 mb-4"
                    size={48}
                  />
                  <div className="absolute inset-0 blur-xl bg-orange-500/20 animate-pulse"></div>
                </div>
                <p className="text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.3em] text-[10px] mt-4">
                  Analyzing Inventory...
                </p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-24 bg-white dark:bg-slate-900/50 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800">
                <div className="bg-slate-100 dark:bg-slate-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <PackageSearch
                    className="text-slate-300 dark:text-slate-600"
                    size={40}
                  />
                </div>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white">
                  No matches found
                </h3>
                <p className="text-slate-400 dark:text-slate-500 mt-2 max-w-xs mx-auto font-medium">
                  We couldn't find anything for "{query}". Try different
                  keywords.
                </p>
                <Link
                  to="/"
                  className="inline-block mt-8 px-8 py-3 bg-orange-500 text-white font-black rounded-2xl shadow-lg shadow-orange-500/20 hover:scale-105 transition-all text-sm"
                >
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
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
