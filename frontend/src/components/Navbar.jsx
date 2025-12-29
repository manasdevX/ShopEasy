import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import useDarkSide from "../hooks/useDarkSide";
import {
  Moon,
  Sun,
  ShoppingCart,
  User,
  Store,
  ChevronDown,
  Search,
  LogOut,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const CATEGORY_DATA = {
  "Mobiles & Tablets": ["Smartphones", "Tablets", "Accessories", "Power Banks"],
  Fashion: ["Men", "Women", "Kids", "Footwear", "Accessories"],
  Electronics: ["Laptops", "Headphones", "Cameras", "Gaming", "Wearables"],
  "TVs & Appliances": [
    "Televisions",
    "Refrigerators",
    "Washing Machines",
    "Air Conditioners",
  ],
  "Home & Furniture": [
    "Furniture",
    "Home Decor",
    "Lighting",
    "Kitchen & Dining",
  ],
  "Beauty, Food & More": ["Makeup", "Skincare", "Nutrition", "Personal Care"],
  Grocery: ["Fruits & Vegetables", "Snacks", "Staples", "Household Essentials"],
};

export default function Navbar() {
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const navigate = useNavigate();

  // ✅ DARK MODE LOGIC
  const [colorTheme, setTheme] = useDarkSide();
  const theme = colorTheme === "dark" ? "light" : "dark";
  const toggleTheme = () => setTheme(colorTheme);

  // ✅ DYNAMIC AUTH & USER STATE
  const token = localStorage.getItem("token");
  const isLoggedIn = !!token;

  // Initialize user from localStorage to prevent "empty" state on reload
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });

  // ✅ 1. Reusable Cart Fetch Function
  const updateCartCount = async () => {
    const currentToken = localStorage.getItem("token");

    if (currentToken) {
      try {
        const res = await fetch(`${API_URL}/api/cart`, {
          headers: { Authorization: `Bearer ${currentToken}` },
        });

        if (res.ok) {
          const data = await res.json();
          // Calculate total quantity of items
          const total =
            data.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;
          setCartCount(total);
        } else {
          // Fallback to local storage if API fails
          const localCart = JSON.parse(localStorage.getItem("cart")) || [];
          setCartCount(localCart.reduce((acc, item) => acc + item.quantity, 0));
        }
      } catch (err) {
        console.debug("Backend connection pending...");
      }
    } else {
      // Guest User: Check local storage
      const localCart = JSON.parse(localStorage.getItem("cart")) || [];
      setCartCount(localCart.reduce((acc, item) => acc + item.quantity, 0));
    }
  };

  // ✅ 2. Event Listeners for Real-time Updates
  useEffect(() => {
    // Initial fetch
    updateCartCount();

    // Sync User Info on Login/Changes
    const syncHeader = () => {
      try {
        const updatedUser = JSON.parse(localStorage.getItem("user"));
        setUser(updatedUser);
        updateCartCount();
      } catch (e) {
        console.error("Header sync error", e);
      }
    };

    // Listeners
    window.addEventListener("storage", syncHeader); // Tabs sync
    window.addEventListener("user-info-updated", syncHeader); // Profile update
    window.addEventListener("cartUpdated", updateCartCount); // ✅ NEW: Cart update event

    return () => {
      window.removeEventListener("storage", syncHeader);
      window.removeEventListener("user-info-updated", syncHeader);
      window.removeEventListener("cartUpdated", updateCartCount);
    };
  }, [isLoggedIn, token]);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setCartCount(0);
    setUser(null);
    window.location.href = "/login";
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

        {/* SEARCH BAR */}
        <div className="flex flex-1 bg-gray-100 dark:bg-gray-800/50 border border-transparent dark:border-gray-700 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-orange-500/50 transition-all">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="px-5 py-2.5 w-full outline-none bg-transparent text-gray-800 dark:text-gray-100 font-medium"
          />
          <button
            onClick={handleSearch}
            className="px-6 bg-orange-500 text-white hover:bg-orange-600"
          >
            <Search size={18} />
          </button>
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
              className="hidden md:block font-bold text-md text-slate-600 dark:text-slate-300 hover:text-orange-500 transition-colors"
            >
              <User size={16} className="inline-block mr-1" />
              Login
            </Link>
          ) : (
            <div className="relative group flex items-center h-full">
              <button className="flex items-center gap-1 font-bold hover:text-orange-500 py-2">
                <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs shadow-lg overflow-hidden border-2 border-white dark:border-slate-800">
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
                <span className="max-w-[80px] truncate ml-1 font-bold text-slate-900 dark:text-white">
                  {user?.name ? user.name.split(" ")[0] : "Account"}
                </span>
                <ChevronDown
                  size={14}
                  className="group-hover:rotate-180 transition-transform duration-300"
                />
              </button>

              {/* DROPDOWN MENU */}
              <div className="absolute top-full right-0 w-56 pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[99999]">
                <div className="bg-white dark:bg-[#0f172a] rounded-2xl overflow-hidden shadow-2xl border border-gray-100 dark:border-slate-800 pointer-events-auto">
                  <Link
                    to="/account"
                    className="block px-5 py-3.5 hover:bg-orange-500 hover:text-white font-bold text-sm text-slate-700 dark:text-slate-200"
                  >
                    My Profile
                  </Link>
                  <Link
                    to="/orders"
                    className="block px-5 py-3.5 hover:bg-orange-500 hover:text-white font-bold text-sm text-slate-700 dark:text-slate-200"
                  >
                    My Orders
                  </Link>
                  <div className="border-t border-gray-100 dark:border-slate-800" />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-5 py-3.5 hover:bg-red-500 hover:text-white text-red-500 font-bold text-sm flex items-center gap-2"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CART ICON WITH BADGE */}
          <Link
            to="/cart"
            className="relative group flex items-center gap-1 font-bold hover:text-orange-500"
          >
            <ShoppingCart size={22} />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-[#030712]">
                {cartCount}
              </span>
            )}
          </Link>

          <Link
            to="/Seller/Landing"
            className="hidden lg:flex px-5 py-2.5 rounded-2xl border-2 border-orange-500/20 text-orange-500 hover:bg-orange-500 hover:text-white font-black text-xs uppercase tracking-widest transition-all"
          >
            <Store size={16} className="mr-2" /> Sell
          </Link>
        </div>
      </div>
    </header>
  );
}
