import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Sparkles, ArrowRight, AlertCircle, RefreshCw } from "lucide-react";
import ProductCard from "./ProductCard";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * Retry configuration for resilience
 * - MAX_RETRIES: Maximum number of retry attempts
 * - INITIAL_DELAY_MS: Starting delay between retries
 * - MAX_DELAY_MS: Maximum delay between retries
 * - BACKOFF_MULTIPLIER: Exponential backoff multiplier
 */
const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_DELAY_MS: 500,
  MAX_DELAY_MS: 3000,
  BACKOFF_MULTIPLIER: 2,
};

/**
 * Recommendations Component - Production Grade
 * 
 * Features:
 * - Error handling with exponential backoff retry logic
 * - Request deduplication and cancellation
 * - Real-time updates on search intent changes
 * - Graceful degradation on errors
 * - Accessibility support (ARIA labels, keyboard navigation)
 */
const Recommendations = () => {
  // STATE MANAGEMENT
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPersonalized, setIsPersonalized] = useState(false);
  const [error, setError] = useState(null);
  const [retrying, setRetrying] = useState(false);

  // LIFECYCLE MANAGEMENT
  const abortControllerRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const fetchLockRef = useRef(false); // Prevent concurrent fetches
  const requestIdRef = useRef(0); // Generation counter — guards lock release against stale cancelled requests
  const searchRefreshTimeoutRef = useRef(null); // Debounce search-intent refreshes

  /**
   * Fetch recommendations with exponential backoff retry logic
   * @param {number} retryCount - Current retry attempt number
   */
  const fetchRecsWithRetry = async (retryCount = 0) => {
    const myId = requestIdRef.current;
    try {
      const token = localStorage.getItem("token");

      // Prevent concurrent fetch requests
      if (fetchLockRef.current) {
        return;
      }
      fetchLockRef.current = true;

      // Cancel any previous request
      if (abortControllerRef.current) {
        try {
          abortControllerRef.current.abort();
        } catch (e) {
          // ignore
        }
      }
      abortControllerRef.current = new AbortController();

      const startTime = performance.now();

      let data;
      if (token) {
        const res = await axios.get(`${API_URL}/api/user/recommendations`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: abortControllerRef.current.signal,
          timeout: 10000,
        });
        data = res.data;
      } else {
        // Public fallback: fetch trending / high-rated products so unauthenticated
        // users still see updated recommendations on search events.
        const res = await axios.get(`${API_URL}/api/products?sort=rating&limit=12`, {
          signal: abortControllerRef.current.signal,
          timeout: 10000,
        });
        const products = Array.isArray(res.data) ? res.data : res.data.items || res.data.products || [];
        data = { products: products.slice(0, RECOMMENDATION_CONFIG.RECOMMENDATIONS.TARGET_COUNT), personalized: false };
      }

      const fetchTime = performance.now() - startTime;

      // Validate response data
      if (!data.products || !Array.isArray(data.products)) {
        throw new Error("Invalid response format: missing products array");
      }

      setProducts(data.products || []);
      setIsPersonalized(Boolean(data.personalized));
      setError(null);
      setRetrying(false);
      setLoading(false);

      console.log(`[Recommendations] Fetched ${data.products.length} products in ${fetchTime.toFixed(0)}ms`);
    } catch (err) {
      // Don't retry if request was cancelled. Only release the lock if this
      // is still the active request — a newer fetchRecs() call owns it now.
      if (axios.isCancel(err)) {
        if (myId === requestIdRef.current) fetchLockRef.current = false;
        return;
      }

      // Determine if error is retryable
      const isTimeout = err.code === "ECONNABORTED";
      const isNetworkError = !err.response;
      const isServerError = err.response?.status >= 500;
      const isRateLimited = err.response?.status === 429;

      const isRetryable =
        isTimeout || isNetworkError || isServerError || isRateLimited;
      const shouldRetry = isRetryable && retryCount < RETRY_CONFIG.MAX_RETRIES;

      if (shouldRetry) {
        // Calculate exponential backoff delay
        const delay = Math.min(
          RETRY_CONFIG.INITIAL_DELAY_MS *
            Math.pow(RETRY_CONFIG.BACKOFF_MULTIPLIER, retryCount),
          RETRY_CONFIG.MAX_DELAY_MS
        );

        console.warn(
          `[Recommendations] Retry ${retryCount + 1}/${RETRY_CONFIG.MAX_RETRIES} after ${delay}ms`
        );

        setRetrying(true);
        retryTimeoutRef.current = setTimeout(() => {
          if (myId !== requestIdRef.current) return; // superseded by a newer fetchRecs() call
          fetchLockRef.current = false;
          fetchRecsWithRetry(retryCount + 1);
        }, delay);
      } else {
        // Max retries exceeded or non-retryable error
        const errorMessage = isNetworkError
          ? "Network error. Please check your connection."
          : err.response?.status === 404
            ? "Recommendations not available at this time."
            : "Unable to load recommendations. Please try again later.";

        console.error("[Recommendations] Failed to fetch after retries:", err.message);

        setError({
          message: errorMessage,
          retry: () => {
            setError(null);
            setLoading(true);
            setRetrying(false);
            fetchLockRef.current = false;
            fetchRecsWithRetry(0);
          },
        });
        setLoading(false);
        setRetrying(false);
      }
    } finally {
      if (myId === requestIdRef.current) fetchLockRef.current = false;
    }
  };

  /**
   * Initiate fresh recommendations fetch
   */
  const fetchRecs = () => {
    if (!loading) {
      setLoading(true);
    }
    setError(null);
    setRetrying(false);
    requestIdRef.current += 1; // Invalidate any in-flight request's lock ownership
    fetchLockRef.current = false;
    fetchRecsWithRetry(0);
  };

  /**
   * Component lifecycle - setup and cleanup
   */
  useEffect(() => {
    fetchRecs();

    const handleSearchIntentUpdated = () => {
      // Debounce: wait 400ms after the last search event before re-fetching,
      // so rapid sequential searches only trigger one recommendation refresh.
      if (searchRefreshTimeoutRef.current) {
        clearTimeout(searchRefreshTimeoutRef.current);
      }
      searchRefreshTimeoutRef.current = setTimeout(() => {
        // Abort any in-flight request so we always fetch fresh data
        if (abortControllerRef.current) {
          try {
            abortControllerRef.current.abort();
          } catch (e) {
            // ignore
          }
        }

        // Bump request id to invalidate previous fetch ownership
        requestIdRef.current += 1;
        fetchLockRef.current = false;

        fetchRecs();
      }, 400);
    };

    window.addEventListener("search-intent-updated", handleSearchIntentUpdated);

    return () => {
      window.removeEventListener(
        "search-intent-updated",
        handleSearchIntentUpdated
      );

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (searchRefreshTimeoutRef.current) {
        clearTimeout(searchRefreshTimeoutRef.current);
      }
    };
  }, []);

  // Don't render if no products and not loading
  if (!loading && !error && products.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-white dark:bg-[#030712] transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* HEADER */}
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
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                {isPersonalized
                  ? "Based on your recent searches & views"
                  : "Check out what's hot in the store right now"}
              </p>
            </div>
          </div>
        </div>

        {/* ERROR STATE */}
        {error && !loading && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-start gap-4">
            <AlertCircle className="text-red-500 flex-shrink-0 mt-1" size={20} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                {error.message}
              </p>
              {error.retry && (
                <button
                  onClick={error.retry}
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  <RefreshCw size={16} />
                  Try Again
                </button>
              )}
            </div>
          </div>
        )}

        {/* RETRYING STATE */}
        {retrying && (
          <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl flex items-center gap-3">
            <RefreshCw
              className="text-blue-500 animate-spin flex-shrink-0"
              size={18}
            />
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
              Retrying... Please wait
            </p>
          </div>
        )}

        {/* PRODUCTS GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {loading
            ? [1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <div
                  key={n}
                  className="h-80 bg-slate-100 dark:bg-slate-800/50 rounded-2xl animate-pulse border border-slate-200 dark:border-slate-800"
                  aria-hidden="true"
                />
              ))
            : products.map((item) => (
                <div key={item._id} className="group cursor-pointer">
                  <ProductCard product={item} />
                </div>
              ))}
        </div>

        {/* EMPTY STATE */}
        {!loading && products.length === 0 && !error && (
          <div className="text-center py-12">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
              No recommendations available at this time
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default Recommendations;
