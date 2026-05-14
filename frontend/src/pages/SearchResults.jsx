import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
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
  ArrowUpDown,
  Sparkles,
  ShoppingBag,
  RefreshCw,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { showError } from "../utils/toast";
import ProductCard from "../components/ProductCard";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ── Skeleton Loader Component ──
const ProductCardSkeleton = () => (
  <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-pulse">
    <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700" />
    <div className="p-4 space-y-3">
      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full w-3/4" />
      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full w-1/2" />
      <div className="flex items-center gap-2">
        <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-full w-16" />
        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full w-12" />
      </div>
      <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full w-1/3" />
    </div>
  </div>
);

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = (searchParams.get("q") || searchParams.get("keyword") || "").trim();

  // --- States ---
  const [items, setItems] = useState([]);
  const [facets, setFacets] = useState({ categories: [], ratings: [] });
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [correctedQuery, setCorrectedQuery] = useState(null);
  const [queryIntent, setQueryIntent] = useState(null);

  const currentPage = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);
  const selectedCategory = searchParams.get("category") || "";
  const selectedRating = Number.parseInt(searchParams.get("ratingMin") || "0", 10) || 0;
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const sortBy = searchParams.get("sort") || "relevance";

  const updateParams = (patch, { resetPage = false } = {}) => {
    const next = new URLSearchParams(searchParams);
    const patchHasQuery = Object.prototype.hasOwnProperty.call(patch, "q");

    Object.entries(patch).forEach(([key, value]) => {
      if (value === "" || value === null || value === undefined || value === 0) {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    });

    if (resetPage) {
      next.set("page", "1");
    }

    if (!patchHasQuery) {
      next.set("q", query);
    }
    setSearchParams(next, { replace: true });
  };

  // --- Effects ---

  // Fetch Data
  useEffect(() => {
    const controller = new AbortController();

    const fetchSearchResults = async () => {
      const params = new URLSearchParams();
      params.set("q", query);
      params.set("page", String(currentPage));
      params.set("limit", "12");

      if (sortBy === "price_low") params.set("sort", "price_asc");
      else if (sortBy === "price_high") params.set("sort", "price_desc");
      else if (sortBy === "rating") params.set("sort", "rating_desc");
      else if (sortBy === "newest") params.set("sort", "newest");
      else params.set("sort", "relevance");

      if (minPrice) params.set("minPrice", minPrice);
      if (maxPrice) params.set("maxPrice", maxPrice);
      if (selectedRating > 0) params.set("ratingMin", String(selectedRating));
      if (selectedCategory) params.set("category", selectedCategory);

      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/products?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = await res.json();

        if (res.ok) {
          const normalizedItems = Array.isArray(data)
            ? data
            : data.items || data.products || [];

          setItems(normalizedItems);
          setTotalCount(data.total || 0);
          setTotalPages(data.totalPages || data.pages || 1);
          setCorrectedQuery(data.correctedQuery || null);
          setQueryIntent(data.queryIntent || null);
          if (data.facets) setFacets(data.facets);
        } else {
          throw new Error(data.message || "Failed to fetch");
        }
      } catch (err) {
        if (err?.name === "AbortError") return;
        showError("Search failed. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();

    return () => controller.abort();
  }, [
    query,
    selectedCategory,
    selectedRating,
    minPrice,
    maxPrice,
    sortBy,
    currentPage,
  ]);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });
  }, [currentPage]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      updateParams({ page: totalPages }, { resetPage: false });
    }
  }, [currentPage, totalPages]);

  // --- Handlers ---
  const clearFilters = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("category");
    next.delete("ratingMin");
    next.delete("minPrice");
    next.delete("maxPrice");
    next.delete("sort");
    next.set("page", "1");
    next.set("q", query);
    setSearchParams(next, { replace: true });
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      updateParams({ page: newPage }, { resetPage: false });
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
                    <XCircle size={12} />Clear
                  </button>
                )}
              </div>

              {/* Query Intent Chip */}
              {queryIntent?.broadCategoryLabel && (
                <div className="mb-6 flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-500/10 dark:to-amber-500/10 rounded-xl border border-orange-100 dark:border-orange-500/20">
                  <Sparkles size={14} className="text-orange-500 shrink-0" />
                  <span className="text-xs font-bold text-orange-700 dark:text-orange-400">
                    Searching in{" "}
                    <span className="capitalize">{queryIntent.broadCategoryLabel}</span>
                    {queryIntent.specificity === "narrow" && queryIntent.primaryIntent && (
                      <> → <span className="capitalize">{queryIntent.primaryIntent}</span></>
                    )}
                  </span>
                </div>
              )}

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
                        onClick={() => {
                          const nextCategory = selectedCategory === cat._id ? "" : cat._id;
                          updateParams({ category: nextCategory }, { resetPage: true });
                        }}
                        className={`w-full flex items-center justify-between group py-2 px-3 rounded-xl transition-all border ${
                          selectedCategory === cat._id
                            ? "bg-orange-50 border-orange-200 dark:bg-orange-500/10 dark:border-orange-500/20"
                            : "bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
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
                      onChange={(e) =>
                        updateParams({ minPrice: e.target.value }, { resetPage: true })
                      }
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
                      onChange={(e) =>
                        updateParams({ maxPrice: e.target.value }, { resetPage: true })
                      }
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
                        onClick={() => {
                          const nextRating = selectedRating === star ? 0 : star;
                          updateParams({ ratingMin: nextRating }, { resetPage: true });
                        }}
                        className={`w-full flex items-center justify-between group py-1.5 px-2 -mx-2 rounded-lg transition-all ${
                          selectedRating === star
                            ? "bg-slate-50 dark:bg-slate-800/60"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        }`}
                      >
                        <div className="flex items-center gap-3">
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
            {/* Content Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-orange-500 font-bold text-xs uppercase tracking-[0.2em]">
                  <Search size={14} /> Search Discovery
                </div>
                <div className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                  <>
                    Results for <span className="text-orange-500">"{query}"</span>
                  </>
                </div>
                {correctedQuery && correctedQuery !== query && (
                  <div className="text-sm md:text-base font-semibold text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2">
                    <span>Did you mean</span>
                    <button
                      type="button"
                      onClick={() => updateParams({ q: correctedQuery }, { resetPage: true })}
                      className="text-orange-500 hover:text-orange-600 underline underline-offset-2"
                    >
                      "{correctedQuery}"
                    </button>
                    <span>?</span>
                  </div>
                )}
                {!loading && (
                  <p className="text-slate-500 dark:text-slate-400 font-medium">
                    We found{" "}
                    <span className="text-slate-900 dark:text-white font-black text-lg">
                      {totalCount}
                    </span>{" "}
                    product{totalCount !== 1 ? "s" : ""} matching your criteria.
                  </p>
                )}
              </div>

              {/* Sort By Dropdown */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <ArrowUpDown size={14} />
                  <span className="text-xs font-bold uppercase tracking-wider">Sort By</span>
                </div>
                <select
                  value={sortBy}
                  onChange={(e) =>
                    updateParams({ sort: e.target.value }, { resetPage: true })
                  }
                  className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer transition-all appearance-none pr-8"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23f97316' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
                >
                  <option value="relevance">Relevance</option>
                  <option value="price_low">Price: Low → High</option>
                  <option value="price_high">Price: High → Low</option>
                  <option value="rating">Rating</option>
                  <option value="newest">Newest First</option>
                </select>
              </div>
            </div>

            {loading ? (
              /* ── Skeleton Grid ── */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : items.length === 0 ? (
              /* ── Enhanced Empty State ── */
              <div className="text-center py-24 bg-white dark:bg-slate-900/50 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800">
                <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-500/10 dark:to-amber-500/10 flex items-center justify-center mb-6">
                  <PackageSearch
                    className="text-orange-500"
                    size={36}
                  />
                </div>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">
                  No products found
                </h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8">
                  {hasFilters
                    ? "Try adjusting your filters or search with different keywords."
                    : `We couldn't find any products matching "${query}". Try a different search term.`}
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  {hasFilters && (
                    <button
                      onClick={clearFilters}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-2xl hover:scale-105 transition-transform"
                    >
                      <XCircle size={16} /> Clear Filters
                    </button>
                  )}
                  <button
                    onClick={() => navigate("/")}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white font-bold rounded-2xl hover:scale-105 transition-transform"
                  >
                    <ShoppingBag size={16} /> Browse All Products
                  </button>
                  {correctedQuery && correctedQuery !== query && (
                    <button
                      onClick={() => updateParams({ q: correctedQuery }, { resetPage: true })}
                      className="inline-flex items-center gap-2 px-6 py-3 border-2 border-orange-500 text-orange-500 font-bold rounded-2xl hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors"
                    >
                      <RefreshCw size={16} /> Try "{correctedQuery}"
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {items.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>

                {/* --- PAGINATION CONTROLS --- */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-4 mt-16 pb-8">
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
