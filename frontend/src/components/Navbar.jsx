import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import useDarkSide from "../hooks/useDarkSide";
import axios from "axios"; // ✅ AXIOS for robust Logout
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
} from "lucide-react";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Navbar() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  // --- RECOMMENDATION STATES ---
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const dropdownRef = useRef(null);

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
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ LIVE SEARCH LOGIC
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchTerm.trim().length < 2) {
        setSuggestions([]);
        setShowDropdown(false);
        return;
      }

      setIsSearching(true);
      try {
        const res = await fetch(
          `${API_URL}/api/products?keyword=${searchTerm}&pageSize=10`
        );
        const data = await res.json();
        if (res.ok) {
          const products = Array.isArray(data) ? data : data.products || [];
          const names = [...new Set(products.map((p) => p.name))];
          setSuggestions(names);
          setShowDropdown(true);
        }
      } catch (err) {
        console.error("Suggestion fetch failed", err);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // ✅ FETCH CART COUNT
  const updateCartCount = async () => {
    const currentToken = localStorage.getItem("token");
    if (currentToken) {
      try {
        const res = await fetch(`${API_URL}/api/cart`, {
          credentials: "include", // ✅ CRITICAL: Sends Cookies for verification
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
    if (searchTerm.trim()) {
      setShowDropdown(false);
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  // ✅ LOGOUT FUNCTION (The Bug Fix)
  const handleLogout = async () => {
    try {
      // 1. Call Backend to remove Session from DB
      await axios.post(
        `${API_URL}/api/auth/logout`,
        {},
        { withCredentials: true } // ✅ Essential: Sends the cookie so backend knows which session to delete
      );

      // 2. Clear Local State
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setCartCount(0);
      setUser(null);

      toast.success("Logged out successfully");

      // 3. Redirect
      window.location.href = "/";
    } catch (err) {
      console.error("Logout failed", err);
      // Fallback: Force clear local state even if backend fails
      localStorage.clear();
      window.location.href = "/";
    }
  };

  const handleCart = () => {
    if (isLoggedIn) {
      navigate("/cart");
    } else {
      toast("Please login to view your cart", { icon: "🔒" });
    }
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

        {/* --- SEARCH BAR WITH RECOMMENDATIONS --- */}
        <div className="relative flex-1 group" ref={dropdownRef}>
          <div className="flex bg-gray-100 dark:bg-gray-800/50 border border-transparent dark:border-gray-700 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-orange-500/50 transition-all">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              onFocus={() => searchTerm.length >= 2 && setShowDropdown(true)}
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
              onClick={handleSearch}
              className="px-6 bg-orange-500 text-white hover:bg-orange-600 transition-colors"
            >
              <Search size={18} />
            </button>
          </div>

          {/* RECOMMENDATIONS DROPDOWN */}
          {showDropdown && suggestions.length > 0 && (
            <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-[#0f172a] rounded-b-2xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden z-[999]">
              <div className="py-1">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSearchTerm(suggestion);
                      setShowDropdown(false);
                      navigate(`/search?q=${encodeURIComponent(suggestion)}`);
                    }}
                    className="w-full flex items-center gap-4 px-5 py-2.5 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-left group"
                  >
                    <Search
                      size={16}
                      className="text-slate-400 group-hover:text-orange-500"
                    />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      <span className="font-normal text-slate-400">
                        {searchTerm.toLowerCase()}
                      </span>
                      {suggestion
                        .toLowerCase()
                        .replace(searchTerm.toLowerCase(), "")}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT ACTIONS */}
        <div className="flex items-center gap-6 text-gray-800 dark:text-gray-200 shrink-0">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
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
                      className="w-full h-full object-cover"
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
            className="hidden lg:flex px-5 py-2.5 rounded-2xl border-2 border-orange-500/20 text-orange-500 hover:bg-orange-500 hover:text-white font-black text-xs uppercase tracking-widest transition-all"
          >
            <Store size={16} className="mr-2" /> Become a seller
          </Link>
        </div>
      </div>
    </header>
  );
}
