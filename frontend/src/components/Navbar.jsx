import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import useDarkSide from "../hooks/useDarkSide"; // ✅ Import your custom hook
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

const CATEGORY_DATA = {
  "Mobiles & Tablets": ["Smartphones", "Tablets", "Accessories", "Power Banks"],
  Fashion: ["Men", "Women", "Kids", "Footwear", "Accessories"],
  Electronics: ["Laptops", "Headphones", "Cameras", "Gaming", "Wearables"],
  "TVs & Appliances": ["Televisions", "Refrigerators", "Washing Machines", "Air Conditioners"],
  "Home & Furniture": ["Furniture", "Home Decor", "Lighting", "Kitchen & Dining"],
  "Beauty, Food & More": ["Makeup", "Skincare", "Nutrition", "Personal Care"],
  Grocery: ["Fruits & Vegetables", "Snacks", "Staples", "Household Essentials"],
};

export default function Navbar() {
  const [activeCategory, setActiveCategory] = useState(null);
  const navigate = useNavigate();

  // ✅ DARK MODE LOGIC
  const [colorTheme, setTheme] = useDarkSide();
  // Derived state to keep your existing JSX logic (theme === "light") working
  const theme = colorTheme === "dark" ? "light" : "dark";

  const toggleTheme = () => {
    setTheme(colorTheme);
  };

  // ✅ SAFE AUTH CHECK
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch {
    user = null;
  }
  const isLoggedIn = !!localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <header className="relative w-full z-50 transition-colors duration-300">
      {/* 🔹 TOP NAVBAR */}
      <div className="bg-white dark:bg-[#030712] border-b border-gray-100 dark:border-gray-800 px-6 py-3 flex items-center gap-6">
        <Link to="/" className="text-orange-500 text-2xl font-bold tracking-tighter">
          ShopEasy
        </Link>

        {/* SEARCH - Adjusted for Dark Mode depth */}
        <div className="flex flex-1 bg-gray-100 dark:bg-gray-800/50 border border-transparent dark:border-gray-700 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-orange-500/50 transition-all">
          <input
            type="text"
            placeholder="Search for products, brands and more"
            className="px-4 py-2 w-full outline-none bg-transparent text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          />
          <button className="px-5 bg-orange-500 text-white hover:bg-orange-600 transition-colors">
            <Search size={18} />
          </button>
        </div>

        {/* RIGHT ACTIONS */}
        <div className="flex items-center gap-6 text-gray-800 dark:text-gray-200">
          {/* THEME TOGGLE BUTTON */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-slate-700 dark:text-yellow-400 transition-all duration-300"
            title="Toggle Theme"
          >
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          {/* LOGIN / ACCOUNT */}
          {!isLoggedIn ? (
            <Link to="/login" className="flex items-center gap-1 hover:text-orange-500 transition-colors">
              <User size={18} />
              <span>Login</span>
            </Link>
          ) : (
            <div className="relative group">
              <button className="flex items-center gap-1 hover:text-orange-500 transition-colors">
                <User size={18} />
                <span>{user?.name.split(' ')[0] || "Account"}</span>
                <ChevronDown size={14} />
              </button>

              {/* ACCOUNT DROPDOWN */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-52 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl overflow-hidden shadow-xl border border-gray-100 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <Link to="/account" className="block px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  My Profile
                </Link>
                <div className="border-t border-gray-100 dark:border-gray-700" />
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 transition flex items-center gap-2 text-red-500"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          )}

          <Link to="/cart" className="flex items-center gap-1 hover:text-orange-500 transition-colors">
            <ShoppingCart size={18} />
            Cart
          </Link>

          <Link
            to="/Seller/Landing"
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-orange-400 text-orange-500 hover:bg-orange-500 hover:text-white transition-all font-medium text-sm"
          >
            <Store size={18} />
            <span>Become a Seller</span>
          </Link>
        </div>
      </div>

      {/* 🔹 CATEGORY BAR */}
      <div className="bg-white dark:bg-[#030712] border-b border-gray-200 dark:border-gray-800 px-6 py-3 hidden md:flex justify-between text-sm font-medium">
        {Object.keys(CATEGORY_DATA).map((category) => {
          let positionClass = "left-1/2 -translate-x-1/2";
          if (category === "Mobiles & Tablets") positionClass = "left-0 translate-x-0";
          else if (category === "Grocery") positionClass = "right-0 translate-x-0";

          return (
            <div
              key={category}
              className="relative flex items-center gap-1 cursor-pointer text-gray-600 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
              onMouseEnter={() => setActiveCategory(category)}
              onMouseLeave={() => setActiveCategory(null)}
            >
              <span>{category}</span>
              <ChevronDown size={14} className={`transition-transform duration-200 ${activeCategory === category ? 'rotate-180' : ''}`} />

              {activeCategory === category && (
                <div className={`absolute top-full ${positionClass} w-60 bg-white dark:bg-gray-800 shadow-2xl border border-gray-100 dark:border-gray-700 rounded-xl z-50 overflow-hidden`}>
                  <div className="p-3 grid gap-1">
                    {CATEGORY_DATA[category].map((item) => (
                      <div
                        key={item}
                        className="px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-orange-50 dark:hover:bg-gray-700 hover:text-orange-600 dark:hover:text-orange-400 rounded-lg transition-colors"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </header>
  );
}