import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSocket } from "../../context/SocketContext";
import { logout } from "../../utils/auth";
import {
  Moon,
  Sun,
  Search,
  Bell,
  ChevronDown,
  Package,
  ListOrdered,
  LogOut,
  Store,
  LayoutDashboard,
  Loader2,
  X,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function SellerNavbar({ isLoggedIn: propIsLoggedIn }) {
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef(null);
  const socket = useSocket();

  // --- STATE ---
  const [seller, setSeller] = useState(() => {
    try {
      const stored = localStorage.getItem("sellerUser");
      if (!stored || stored === "undefined") return null;
      return JSON.parse(stored);
    } catch (e) {
      return null;
    }
  });

  const [token, setToken] = useState(localStorage.getItem("sellerToken"));
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  /**
   * 🟢 FIX: Start with TRUE (Optimistic UI)
   * We initialize as 'true' so the UI shows "Live" immediately.
   * If the socket is actually disconnected, useEffect will catch it and flip it to false,
   * but this prevents the initial "Connecting..." flicker on navigation.
   */
  const [isSocketConnected, setIsSocketConnected] = useState(true);

  // --- SOCKET.IO SYNC ---
  useEffect(() => {
    if (!socket) return;

    // Sync with actual socket state after mount
    if (socket.connected !== isSocketConnected) {
      setIsSocketConnected(socket.connected);
    }

    const onConnect = () => setIsSocketConnected(true);
    const onDisconnect = () => setIsSocketConnected(false);

    const onNotify = () => {
      setHasUnread(true);
      window.dispatchEvent(new Event("notification-updated"));
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("new_notification", onNotify);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("new_notification", onNotify);
    };
  }, [socket, isSocketConnected]);

  // --- AUTH & NOTIFICATION FETCH ---
  useEffect(() => {
    const handleSync = () => {
      const currentToken = localStorage.getItem("sellerToken");
      setToken(currentToken);
      const stored = localStorage.getItem("sellerUser");
      setSeller(stored && stored !== "undefined" ? JSON.parse(stored) : null);
    };

    const fetchUnreadCount = async () => {
      const currentToken = localStorage.getItem("sellerToken");
      if (!currentToken) return;
      try {
        const res = await fetch(`${API_URL}/api/notifications?filter=unread`, {
          headers: { Authorization: `Bearer ${currentToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setHasUnread(data.length > 0);
        }
      } catch (e) {
        console.error("Unread count fetch failed");
      }
    };

    if (token) fetchUnreadCount();

    window.addEventListener("storage", handleSync);
    window.addEventListener("seller-info-updated", handleSync);
    window.addEventListener("notification-updated", fetchUnreadCount);

    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("seller-info-updated", handleSync);
      window.removeEventListener("notification-updated", fetchUnreadCount);
    };
  }, [token]);

  const isAuth = propIsLoggedIn || !!token;

  // --- THEME LOGIC ---
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark")
  );
  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark");
    setIsDark(!isDark);
  };

  // --- LOGOUT LOGIC ---
  const handleLogoutClick = () => {
    logout("seller");
  };

  // --- SEARCH LOGIC ---
  useEffect(() => {
    if (searchQuery.trim().length <= 2) {
      setSearchResults(null);
      if (searchQuery.trim().length === 0) setShowDropdown(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      setShowDropdown(true);
      try {
        const res = await fetch(
          `${API_URL}/api/sellers/search?query=${searchQuery}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const result = await res.json();
        if (res.ok) setSearchResults(result.results);
      } catch (error) {
        console.error("Search failed");
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, token]);

  // Click Outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target))
        setShowDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinks = [
    { name: "Dashboard", path: "/Seller/Dashboard", icon: LayoutDashboard },
    { name: "Inventory", path: "/Seller/products", icon: Package },
    { name: "Orders", path: "/Seller/orders", icon: ListOrdered },
  ];

  const onboardingPaths = [
    "/Seller/login",
    "/Seller/signup",
    "/Seller/forgot-password",
    "/Seller/register",
    "/Seller/bank-details",
  ];
  const isOnboarding = onboardingPaths.includes(location.pathname);

  // 🟢 DISPLAY LOGIC
  // Since we start as true, this will show "Live" immediately on mount.
  const displayStatus = isAuth ? "Live" : "Offline";

  const statusColor = isAuth
    ? isSocketConnected
      ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" // Connected (Bright Green)
      : "bg-emerald-500/50" // Connecting/Syncing (Dim Green - fallback)
    : "bg-amber-500"; // Offline

  return (
    <nav className="sticky top-0 z-[100] bg-white dark:bg-[#030712] border-b border-slate-100 dark:border-slate-800 transition-all duration-300">
      <div className="w-full px-4 sm:px-8 py-4">
        <div className="flex items-center justify-between gap-8">
          {/* LOGO */}
          <Link
            to={isAuth ? "/Seller/Dashboard" : "/Seller/Landing"}
            className="flex items-center gap-2.5 shrink-0"
          >
            <div className="bg-orange-500 p-2 rounded-xl shadow-lg shadow-orange-500/20">
              <Store className="text-white" size={22} />
            </div>
            <div className="hidden sm:block">
              <span className="text-xl font-black tracking-tighter text-slate-900 dark:text-white block leading-none">
                ShopEasy
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">
                Seller Central
              </span>
            </div>
          </Link>

          {/* SEARCH BOX */}
          <div className="flex-grow max-w-2xl relative" ref={searchRef}>
            {isAuth && !isOnboarding && (
              <>
                <div className="relative group">
                  <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors"
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="Search inventory or orders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() =>
                      searchQuery.length > 2 && setShowDropdown(true)
                    }
                    className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-xl py-2.5 pl-12 pr-10 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {showDropdown && (
                  <div className="absolute top-full mt-2 w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden z-[101]">
                    {isSearching ? (
                      <div className="p-6 text-center text-slate-500 flex items-center justify-center gap-2 text-xs font-bold uppercase">
                        <Loader2 className="animate-spin" size={16} />{" "}
                        Searching...
                      </div>
                    ) : (
                      <div className="max-h-80 overflow-y-auto p-2">
                        {searchResults?.products?.length > 0 ? (
                          searchResults.products.map((p) => (
                            <div
                              key={p._id}
                              onClick={() => {
                                navigate(`/Seller/edit-product/${p._id}`);
                                setShowDropdown(false);
                              }}
                              className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                            >
                              <img
                                src={p.thumbnail}
                                alt=""
                                className="w-10 h-10 rounded-lg object-cover bg-slate-100"
                              />
                              <div>
                                <p className="text-sm font-bold dark:text-white line-clamp-1">
                                  {p.name}
                                </p>
                                <p className="text-xs text-slate-500">
                                  ₹{p.price} • Stock: {p.stock}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                            No results found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* ACTIONS */}
          <div className="flex items-center gap-4 sm:gap-6 shrink-0">
            {isAuth && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-50 dark:bg-slate-900 rounded-full border border-slate-100 dark:border-slate-800">
                <div
                  className={`w-2 h-2 rounded-full ${statusColor} ${
                    isSocketConnected ? "animate-pulse" : ""
                  }`}
                />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  {displayStatus}
                </span>
              </div>
            )}

            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {isAuth && (
              <Link
                to="/Seller/Notifications"
                className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 relative"
              >
                <Bell size={20} />
                {hasUnread && (
                  <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-white dark:border-[#030712] animate-pulse" />
                )}
              </Link>
            )}

            {isAuth ? (
              <div className="relative group">
                <button className="flex items-center gap-2 group-hover:text-orange-500 transition-colors">
                  <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold border border-orange-200 dark:border-orange-800 uppercase">
                    {seller?.name?.charAt(0) || "S"}
                  </div>
                  <ChevronDown
                    size={16}
                    className="text-slate-400 transition-transform group-hover:rotate-180"
                  />
                </button>
                <div className="absolute top-full right-0 w-52 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-xl border border-slate-100 dark:border-slate-800">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Store Manager
                      </p>
                      <p className="text-xs font-bold truncate dark:text-white mt-0.5">
                        {seller?.email}
                      </p>
                    </div>
                    <Link
                      to="/Seller/Dashboard"
                      className="block px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/Seller/Settings"
                      className="block px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium"
                    >
                      Settings
                    </Link>
                    <button
                      onClick={handleLogoutClick}
                      className="w-full text-left px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 text-sm font-bold flex items-center gap-2 border-t dark:border-slate-800"
                    >
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                to="/Seller/login"
                className="px-5 py-2.5 bg-slate-900 dark:bg-orange-500 text-white rounded-xl font-bold text-sm hover:scale-105 transition-all active:scale-95"
              >
                Login
              </Link>
            )}
          </div>
        </div>

        {/* BOTTOM NAV LINKS */}
        {isAuth && !isOnboarding && (
          <div className="flex items-center gap-8 mt-6 border-t border-slate-50 dark:border-slate-900 pt-4 overflow-x-auto no-scrollbar">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`flex items-center gap-2 pb-2 text-[11px] font-black uppercase tracking-[0.15em] transition-all relative whitespace-nowrap ${
                    isActive
                      ? "text-orange-500"
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  }`}
                >
                  <link.icon size={14} strokeWidth={3} /> {link.name}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-500 rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}
