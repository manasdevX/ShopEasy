import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Search,
  Loader2,
  SlidersHorizontal,
  PackageSearch,
  Star,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
  Check,
  XCircle,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { showError } from "../utils/toast";
import ProductCard from "../components/ProductCard";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  // --- States ---
  const [products, setProducts] = useState([]);
  const [facets, setFacets] = useState({ categories: [], ratings: [] });
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedRating, setSelectedRating] = useState(0);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // --- Effects ---

  // 1. Reset Page on Filter Change
  useEffect(() => {
    setCurrentPage(1);
  }, [query, selectedCategory, selectedRating, minPrice, maxPrice]);

  // 2. Fetch Data
  useEffect(() => {
    const fetchSearchResults = async () => {
      let link = `${API_URL}/api/products?keyword=${query}&pageNumber=${currentPage}`;

      if (minPrice) link += `&minPrice=${minPrice}`;
      if (maxPrice) link += `&maxPrice=${maxPrice}`;
      if (selectedRating > 0) link += `&rating=${selectedRating}`;
      if (selectedCategory) link += `&category=${selectedCategory}`;

      setLoading(true);
      try {
        const res = await fetch(link);
        const data = await res.json();

        if (res.ok) {
          setProducts(Array.isArray(data) ? data : data.products || []);
          setTotalCount(data.total || 0);
          setTotalPages(data.pages || 1);
          if (data.facets) setFacets(data.facets);
        } else {
          throw new Error(data.message || "Failed to fetch");
        }
      } catch (err) {
        showError("Search failed. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchSearchResults, 300);
    return () => clearTimeout(timeoutId);
  }, [
    query,
    selectedCategory,
    selectedRating,
    minPrice,
    maxPrice,
    currentPage,
  ]);

  // --- Handlers ---
  const clearFilters = () => {
    setMinPrice("");
    setMaxPrice("");
    setSelectedRating(0);
    setSelectedCategory("");
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const hasFilters =
    minPrice || maxPrice || selectedRating > 0 || selectedCategory;

  return (
    <div className="bg-[#F8FAFC] dark:bg-[#020617] min-h-screen flex flex-col font-sans transition-colors duration-300">
      <Navbar />

      <main className="flex-grow max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* --- LEFT SIDEBAR (PREMIUM UI) --- */}
          <aside className="hidden lg:block w-80 flex-shrink-0 space-y-8 sticky top-24 h-fit">
            <div className="bg-white dark:bg-[#0f172a] rounded-[2rem] border border-slate-100 dark:border-slate-800 p-8 shadow-2xl shadow-slate-200/50 dark:shadow-none">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
                  <SlidersHorizontal
                    size={20}
                    className="text-orange-500"
                    strokeWidth={2.5}
                  />
                  Filters
                </h3>
                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1 text-[11px] font-bold text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-500/10 px-2 py-1 rounded-full transition-colors"
                  >
                    <XCircle size={12} /> Clear
                  </button>
                )}
              </div>

              {/* 1. DYNAMIC CATEGORIES */}
              {facets.categories?.length > 0 && (
                <div className="mb-8">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">
                    Categories
                  </h4>
                  <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                    {facets.categories.map((cat) => (
                      <button
                        key={cat._id}
                        onClick={() =>
                          setSelectedCategory(
                            selectedCategory === cat._id ? "" : cat._id
                          )
                        }
                        className={`w-full flex items-center justify-between group py-2 px-3 rounded-xl transition-all border ${
                          selectedCategory === cat._id
                            ? "bg-orange-50 border-orange-200 dark:bg-orange-500/10 dark:border-orange-500/20"
                            : "bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Custom Checkbox */}
                          <div
                            className={`w-5 h-5 rounded-[6px] border-[1.5px] flex items-center justify-center transition-all ${
                              selectedCategory === cat._id
                                ? "bg-orange-500 border-orange-500 shadow-md shadow-orange-500/20"
                                : "border-slate-300 dark:border-slate-600 group-hover:border-orange-400"
                            }`}
                          >
                            {selectedCategory === cat._id && (
                              <Check
                                size={12}
                                className="text-white"
                                strokeWidth={4}
                              />
                            )}
                          </div>
                          <span
                            className={`text-sm font-medium capitalize ${
                              selectedCategory === cat._id
                                ? "text-slate-900 dark:text-white font-bold"
                                : "text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white"
                            }`}
                          >
                            {cat._id}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-1 rounded-full transition-colors ${
                            selectedCategory === cat._id
                              ? "bg-orange-200 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-white dark:group-hover:bg-slate-700"
                          }`}
                        >
                          {cat.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. PRICE RANGE */}
              <div className="mb-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">
                  Price Range
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors">
                      <IndianRupee size={14} />
                    </div>
                    <input
                      type="number"
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="w-full pl-8 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-slate-400"
                    />
                  </div>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors">
                      <IndianRupee size={14} />
                    </div>
                    <input
                      type="number"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="w-full pl-8 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* 3. DYNAMIC RATINGS */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">
                  Ratings
                </h4>
                <div className="space-y-3">
                  {[4, 3, 2, 1].map((star) => {
                    const facetData = facets.ratings?.find(
                      (r) => r._id === star
                    );
                    const count = facetData ? facetData.count : 0;
                    if (count === 0 && selectedRating !== star) return null;

                    return (
                      <button
                        key={star}
                        onClick={() =>
                          setSelectedRating(selectedRating === star ? 0 : star)
                        }
                        className={`w-full flex items-center justify-between group py-1.5 px-2 -mx-2 rounded-lg transition-all ${
                          selectedRating === star
                            ? "bg-slate-50 dark:bg-slate-800/60"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Radio Circle */}
                          <div
                            className={`w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center transition-all ${
                              selectedRating === star
                                ? "border-orange-500"
                                : "border-slate-300 dark:border-slate-600 group-hover:border-orange-400"
                            }`}
                          >
                            {selectedRating === star && (
                              <div className="w-2.5 h-2.5 bg-orange-500 rounded-full shadow-sm" />
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-bold ${
                                selectedRating === star
                                  ? "text-slate-900 dark:text-white"
                                  : "text-slate-600 dark:text-slate-400"
                              }`}
                            >
                              {star}
                            </span>
                            <div className="flex items-center gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={12}
                                  className={
                                    i < star
                                      ? "text-amber-400 fill-amber-400"
                                      : "text-slate-200 dark:text-slate-700"
                                  }
                                />
                              ))}
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight ml-1">
                              & Up
                            </span>
                          </div>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            selectedRating === star
                              ? "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>

          {/* --- MAIN CONTENT AREA --- */}
          <div className="flex-grow">
            {/* ... Content Header ... */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-orange-500 font-bold text-xs uppercase tracking-[0.2em]">
                  <Search size={14} /> Search Discovery
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                  Results for <span className="text-orange-500">"{query}"</span>
                </h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium">
                  We found{" "}
                  <span className="text-slate-900 dark:text-white font-black text-lg">
                    {totalCount}
                  </span>{" "}
                  products matching your criteria.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-32">
                <Loader2
                  className="animate-spin text-orange-500 mb-4"
                  size={48}
                />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-24 bg-white dark:bg-slate-900/50 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800">
                <PackageSearch
                  className="text-slate-300 dark:text-slate-600 mx-auto mb-6"
                  size={48}
                />
                <h3 className="text-2xl font-black text-slate-800 dark:text-white">
                  No products found
                </h3>
                <button
                  onClick={clearFilters}
                  className="mt-8 px-8 py-3 bg-slate-900 text-white font-bold rounded-2xl hover:scale-105 transition-transform"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>

                {/* --- UPDATED PAGINATION CONTROLS (HIGH VISIBILITY) --- */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-4 mt-16 pb-8">
                    {/* Previous Button */}
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all shadow-sm ${
                        currentPage === 1
                          ? "bg-slate-100 text-slate-300 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed"
                          : "bg-white text-slate-700 hover:bg-orange-500 hover:text-white border border-slate-200 hover:border-orange-500 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-orange-500"
                      }`}
                    >
                      <ChevronLeft size={18} /> Previous
                    </button>

                    {/* Page Indicator */}
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 text-sm font-medium">
                        Page
                      </span>
                      <span className="text-slate-900 dark:text-white font-black">
                        {currentPage}
                      </span>
                      <span className="text-slate-300">of</span>
                      <span className="text-slate-500 text-sm font-medium">
                        {totalPages}
                      </span>
                    </div>

                    {/* Next Button */}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all shadow-sm ${
                        currentPage === totalPages
                          ? "bg-slate-100 text-slate-300 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed"
                          : "bg-white text-slate-700 hover:bg-orange-500 hover:text-white border border-slate-200 hover:border-orange-500 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-orange-500"
                      }`}
                    >
                      Next <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
