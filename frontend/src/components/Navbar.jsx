import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import useDarkSide from "../hooks/useDarkSide";
import axios from "axios";
import {
  Moon,
  Sun,
  ShoppingCart,
  User,
  Store,
  ChevronDown,
  Search,
  LogOut,
  Loader2,
  TrendingUp,
  Tag,
} from "lucide-react";
import toast from "react-hot-toast";
import { showSuccess } from "../utils/toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Navbar() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  // --- SEARCH STATES ---
  const [suggestions, setSuggestions] = useState([]);
  const [categoryChips, setCategoryChips] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  const [cartCount, setCartCount] = useState(0);
  const [colorTheme, setTheme] = useDarkSide();
  const theme = colorTheme === "dark" ? "light" : "dark";
  const toggleTheme = () => setTheme(colorTheme);

  const token = localStorage.getItem("token");
  const isLoggedIn = !!token;

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });

  // ✅ CLICK OUTSIDE TO CLOSE DROPDOWN
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ LIVE SEARCH LOGIC (with category chips)
  useEffect(() => {
    const controller = new AbortController();

    const fetchSuggestions = async () => {
      if (searchTerm.trim().length < 1) {
        setSuggestions([]);
        setCategoryChips([]);
        setShowDropdown(false);
        setActiveIndex(-1);
        return;
      }

      setIsSearching(true);
      try {
        const res = await fetch(
          `${API_URL}/api/products?q=${encodeURIComponent(searchTerm)}&limit=8&page=1&sort=relevance`,
          { signal: controller.signal }
        );
        const data = await res.json();
        if (res.ok) {
          const products = Array.isArray(data)
            ? data
            : data.items || data.products || [];

          // Deduplicate product names
          const nameSet = new Set();
          const uniqueProducts = [];
          for (const p of products) {
            const name = p.name?.trim();
            if (name && !nameSet.has(name.toLowerCase())) {
              nameSet.add(name.toLowerCase());
              uniqueProducts.push({
                name,
                category: p.category || "",
                brand: p.brand || "",
                thumbnail: p.thumbnail || "",
                price: p.price,
              });
            }
          }
          setSuggestions(uniqueProducts.slice(0, 6));

          // Extract category chips from facets or products
          const facetCategories = data.facets?.categories || [];
          if (facetCategories.length > 0) {
            setCategoryChips(
              facetCategories
                .slice(0, 4)
                .map((c) => ({ name: c._id, count: c.count }))
            );
          } else {
            const catCounts = {};
            for (const p of products) {
              if (p.category) {
                catCounts[p.category] = (catCounts[p.category] || 0) + 1;
              }
            }
            setCategoryChips(
              Object.entries(catCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 4)
                .map(([name, count]) => ({ name, count }))
            );
          }

          setShowDropdown(true);
          setActiveIndex(-1);
        }
      } catch (err) {
        if (err?.name === "AbortError") return;
        console.error("Suggestion fetch failed", err);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [searchTerm]);

  // Total interactive items for keyboard navigation
  const totalItems = suggestions.length + categoryChips.length;

  // ✅ KEYBOARD NAVIGATION
  const handleKeyDown = useCallback(
    (e) => {
      if (!showDropdown || totalItems === 0) {
        if (e.key === "Enter") {
          handleSearch();
        }
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (activeIndex >= 0) {
          if (activeIndex < suggestions.length) {
            // Selected a product suggestion
            const selected = suggestions[activeIndex];
            selectSuggestion(selected.name);
          } else {
            // Selected a category chip
            const chipIndex = activeIndex - suggestions.length;
            const chip = categoryChips[chipIndex];
            if (chip) {
              selectCategory(chip.name);
            }
          }
        } else {
          handleSearch();
        }
      } else if (e.key === "Escape") {
        setShowDropdown(false);
        setActiveIndex(-1);
      }
    },
    [showDropdown, totalItems, activeIndex, suggestions, categoryChips]
  );

  const selectSuggestion = (name) => {
    setSearchTerm(name);
    setShowDropdown(false);
    setActiveIndex(-1);
    trackSearchIntent(name);
    navigate(`/search?q=${encodeURIComponent(name)}`);
  };

  const selectCategory = (categoryName) => {
    setShowDropdown(false);
    setActiveIndex(-1);
    navigate(`/search?q=${encodeURIComponent(searchTerm)}&category=${encodeURIComponent(categoryName)}`);
  };

  // ✅ FETCH CART COUNT
  const updateCartCount = async () => {
    const currentToken = localStorage.getItem("token");
    if (currentToken) {
      try {
        const res = await fetch(`${API_URL}/api/cart`, {
          credentials: "include",
          headers: { Authorization: `Bearer ${currentToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          const total =
            data.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;
          setCartCount(total);
        } else {
          setCartCount(0);
        }
      } catch (err) {
        console.debug("Backend connection pending...");
      }
    } else {
      setCartCount(0);
    }
  };

  // ✅ SYNC HEADER STATE
  useEffect(() => {
    updateCartCount();
    const syncHeader = () => {
      try {
        const updatedUser = JSON.parse(localStorage.getItem("user"));
        setUser(updatedUser);
        updateCartCount();
      } catch (e) {
        console.error("Header sync error", e);
      }
    };
    window.addEventListener("storage", syncHeader);
    window.addEventListener("user-info-updated", syncHeader);
    window.addEventListener("cartUpdated", updateCartCount);
    return () => {
      window.removeEventListener("storage", syncHeader);
      window.removeEventListener("user-info-updated", syncHeader);
      window.removeEventListener("cartUpdated", updateCartCount);
    };
  }, [isLoggedIn, token]);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    const query = searchTerm.trim();

    setShowDropdown(false);
    setActiveIndex(-1);

    if (query) {
      trackSearchIntent(query);
    }
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  // ✅ LOGOUT FUNCTION
  const handleLogout = async () => {
    try {
      await axios.post(
        `${API_URL}/api/auth/logout`,
        {},
        { withCredentials: true }
      );

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      try {
        const CHAT_SESSION_KEY = "shopeasy_chat_session_id";
        const CHAT_MESSAGES_KEY = "shopeasy_chat_messages";
        const sessionId = localStorage.getItem(CHAT_SESSION_KEY);
        if (sessionId) {
          try {
            await axios.delete(`${API_URL}/api/chat/session/${sessionId}`, {
              withCredentials: true,
            });
          } catch (e) {
            // ignore
          }
        }
        localStorage.removeItem(CHAT_SESSION_KEY);
        sessionStorage.removeItem(CHAT_MESSAGES_KEY);
        try {
          window.dispatchEvent(new Event("chat-cleared"));
        } catch (e) {
          // ignore
        }
      } catch (e) {
        // ignore
      }

      setCartCount(0);
      setUser(null);

      showSuccess("Logged out successfully");

      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    } catch (err) {
      console.error("Logout failed", err);
      localStorage.clear();
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    }
  };

  const handleCart = () => {
    if (isLoggedIn) {
      navigate("/cart");
    } else {
      toast("Please login to view your cart", { icon: "🔒" });
    }
  };

  const trackSearchIntent = async (query) => {
    if (!isLoggedIn || !query || query.trim().length < 2) return;
    try {
      const currentToken = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/api/user/track-search-intent`,
        { query: query.trim() },
        { headers: { Authorization: `Bearer ${currentToken}` } }
      );
      window.dispatchEvent(new Event("search-intent-updated"));
    } catch (err) {
      console.debug("AI Tracking skipped");
    }
  };

  // Highlight matching part in suggestion text
  const highlightMatch = (text, query) => {
    if (!query || !text) return text;
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase().trim();
    const matchIdx = lowerText.indexOf(lowerQuery);

    if (matchIdx === -1) return text;

    return (
      <>
        {text.slice(0, matchIdx)}
        <span className="font-semibold text-orange-500 dark:text-orange-400">
          {text.slice(matchIdx, matchIdx + lowerQuery.length)}
        </span>
        {text.slice(matchIdx + lowerQuery.length)}
      </>
    );
  };

  return (
    <header className="sticky top-0 w-full z-[100] transition-colors duration-300 shadow-sm">
      <div className="bg-white dark:bg-[#030712] border-b border-gray-100 dark:border-gray-800 px-6 py-3 flex items-center gap-6">
        <Link
          to="/"
          className="text-orange-500 text-2xl font-black tracking-tighter shrink-0"
        >
          ShopEasy
        </Link>

        {/* --- SEARCH BAR WITH GROUPED SUGGESTIONS --- */}
        <div className="relative flex-1" ref={dropdownRef}>
          <form 
            onSubmit={handleSearch}
            className="flex bg-gray-100 dark:bg-gray-800/50 border border-transparent dark:border-gray-700 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-orange-500/50 transition-all"
          >
            <input
              ref={inputRef}
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => searchTerm.length >= 1 && suggestions.length > 0 && setShowDropdown(true)}
              className="px-5 py-2.5 w-full outline-none bg-transparent text-gray-800 dark:text-gray-100 font-medium"
            />
            <div className="flex items-center pr-3 bg-transparent">
              {isSearching && (
                <Loader2
                  size={18}
                  className="animate-spin text-orange-500 mr-2"
                />
              )}
            </div>
            <button
              type="submit"
              className="px-6 bg-orange-500 text-white hover:bg-orange-600 transition-colors"
            >
              <Search size={18} />
            </button>
          </form>

          {/* ENHANCED SUGGESTIONS DROPDOWN */}
          {showDropdown && (suggestions.length > 0 || categoryChips.length > 0) && (
            <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden z-[999]">
              {/* Product Suggestions */}
              {suggestions.length > 0 && (
                <div className="py-1">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={`s-${index}`}
                      onClick={() => selectSuggestion(suggestion.name)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left group ${
                        activeIndex === index
                          ? "bg-orange-50 dark:bg-orange-500/10"
                          : "hover:bg-gray-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      {suggestion.thumbnail ? (
                        <img
                          src={suggestion.thumbnail}
                          alt=""
                          className="w-8 h-8 rounded-lg object-cover shrink-0 border border-gray-200 dark:border-slate-700"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                          <Search size={14} className="text-slate-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-slate-700 dark:text-slate-200 block truncate">
                          {highlightMatch(suggestion.name, searchTerm)}
                        </span>
                        {suggestion.category && (
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 block truncate">
                            in {suggestion.category}
                            {suggestion.brand ? ` · ${suggestion.brand}` : ""}
                          </span>
                        )}
                      </div>
                      {suggestion.price != null && (
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
                          ₹{suggestion.price.toLocaleString("en-IN")}
                        </span>
                      )}
                      <TrendingUp
                        size={14}
                        className={`shrink-0 transition-colors ${
                          activeIndex === index
                            ? "text-orange-500"
                            : "text-slate-300 dark:text-slate-600 group-hover:text-orange-500"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Category Chips */}
              {categoryChips.length > 0 && (
                <>
                  <div className="border-t border-gray-100 dark:border-slate-800" />
                  <div className="px-4 py-2.5">
                    <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 mb-1.5 block">
                      Categories
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {categoryChips.map((chip, index) => {
                        const chipGlobalIndex = suggestions.length + index;
                        return (
                          <button
                            key={`c-${index}`}
                            onClick={() => selectCategory(chip.name)}
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                              activeIndex === chipGlobalIndex
                                ? "bg-orange-500 text-white"
                                : "bg-gray-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-orange-100 dark:hover:bg-orange-500/20 hover:text-orange-600 dark:hover:text-orange-400"
                            }`}
                          >
                            <Tag size={10} />
                            {chip.name}
                            <span className="opacity-60">({chip.count})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* RIGHT ACTIONS */}
        <div className="flex items-center gap-6 text-gray-800 dark:text-gray-200 shrink-0">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors cursor-pointer"
          >
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          {!isLoggedIn ? (
            <Link
              to="/login"
              className="hidden md:block font-bold text-lg text-slate-600 dark:text-slate-300 hover:text-orange-500 transition-colors"
            >
              <User size={20} className="inline-block mr-1" /> Login
            </Link>
          ) : (
            <div className="relative group flex items-center h-full">
              <button className="flex items-center gap-1 font-bold hover:text-orange-500 py-2 cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs shadow-lg overflow-hidden border-2 border-white dark:border-slate-800 cursor-pointer">
                  {user?.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt="User"
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => {
                        try {
                          const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            user?.name || "User"
                          )}&background=random&color=fff`;
                          if (e?.target) e.target.src = fallback;
                        } catch (err) {
                          // ignore
                        }
                      }}
                    />
                  ) : (
                    user?.name?.charAt(0) || "U"
                  )}
                </div>
                <span className="max-w-[80px] truncate ml-1 font-bold text-slate-900 dark:text-white cursor-pointer">
                  {user?.name ? user.name.split(" ")[0] : "Account"}
                </span>
                <ChevronDown
                  size={14}
                  className="group-hover:rotate-180 transition-transform duration-300"
                />
              </button>

              <div className="absolute top-full right-0 w-56 pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[99999]">
                <div className="bg-white dark:bg-[#0f172a] rounded-2xl overflow-hidden shadow-2xl border border-gray-100 dark:border-slate-800">
                  <Link
                    to="/account"
                    className="block px-5 py-3.5 hover:bg-orange-500 hover:text-white font-bold text-sm text-slate-700 dark:text-slate-200"
                  >
                    My Profile
                  </Link>
                  <div className="border-t border-gray-100 dark:border-slate-800" />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-5 py-3.5 hover:bg-red-500 hover:text-white text-red-500 font-bold text-sm flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              </div>
            </div>
          )}

          <button
            className="relative group flex items-center gap-1 font-bold hover:text-orange-500 cursor-pointer"
            onClick={handleCart}
          >
            <ShoppingCart size={24} />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-[#030712]">
                {cartCount}
              </span>
            )}
          </button>

          <Link
            to="/Seller/Landing"
            className="hidden lg:flex items-center whitespace-nowrap px-5 py-2.5 rounded-xl border-2 border-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white font-bold text-xs uppercase tracking-widest transition-all"
          >
            <Store size={16} className="mr-2" /> Become a seller
          </Link>
        </div>
      </div>
    </header>
  );
}
