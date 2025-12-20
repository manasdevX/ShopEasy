import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";
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
  const navigate = useNavigate();

  const { theme, toggleTheme } = useContext(ThemeContext);

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
    <header className="relative w-full z-50">
      {/* 🔹 TOP NAVBAR */}
      <div className="bg-white dark:bg-gray-900 px-6 py-3 flex items-center gap-6">
        <Link to="/" className="text-orange-500 text-2xl font-bold">
          ShopEasy
        </Link>

        {/* SEARCH */}
        <div className="flex flex-1 bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden">
          <input
            type="text"
            placeholder="Search for products, brands and more"
            className="px-4 py-2 w-full outline-none
           bg-transparent text-gray-800 dark:text-gray-100
           placeholder-gray-500 dark:placeholder-gray-400"
          />
          <button className="px-4 bg-orange-500 text-white">
            <Search size={18} />
          </button>
        </div>

        {/* RIGHT ACTIONS */}
        <div className="flex items-center gap-6 text-gray-800 dark:text-white">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full
           hover:bg-gray-200 dark:hover:bg-gray-700
           transition"
          >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {/* LOGIN / ACCOUNT */}
          {!isLoggedIn ? (
            <Link
              to="/login"
              className="flex items-center gap-1 hover:text-orange-400"
            >
              <User size={18} />
              <span>Login</span>
            </Link>
          ) : (
            <div className="relative group">
              <button className="flex items-center gap-1 hover:text-orange-400">
                <User size={18} />
                <span>{user?.name || "Account"}</span>
                <ChevronDown size={14} />
              </button>

              {/* ACCOUNT DROPDOWN */}
              <div
                className="absolute top-full right-0 mt-2
           w-52 bg-white dark:bg-gray-800
           text-gray-800 dark:text-gray-100
           rounded-lg overflow-hidden shadow-xl
           opacity-0 invisible
           group-hover:opacity-100 group-hover:visible
           transition-all duration-200
           z-50"
              >
                <Link
                  to="/account"
                  className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  My Profile
                </Link>

                <div className="border-t" />

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2
               hover:bg-gray-100 dark:hover:bg-gray-700 transition
               flex items-center gap-2 text-red-500"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          )}

          <Link
            to="/cart"
            className="flex items-center gap-1 hover:text-orange-400"
          >
            <ShoppingCart size={18} />
            Cart
          </Link>

          <Link
            to="/seller"
            className="flex items-center gap-2 px-3 py-1.5
             rounded-md
             border border-orange-400
             text-orange-500
             hover:bg-orange-500 hover:text-white
             transition"
          >
            <Store size={18} />
            <span className="text-sm font-medium">Become a Seller</span>
          </Link>
        </div>
      </div>

      {/* 🔹 CATEGORY BAR */}
      <div
        className="bg-white dark:bg-gray-900
                border-b border-gray-200 dark:border-gray-700
                px-6 py-3 hidden md:flex justify-between text-sm font-medium"
      >
        {Object.keys(CATEGORY_DATA).map((category) => {
          let positionClass = "left-1/2 -translate-x-1/2";

          if (category === "Mobiles & Tablets") {
            positionClass = "left-0 translate-x-0";
          } else if (category === "Grocery") {
            positionClass = "right-0 translate-x-0";
          }

          return (
            <div
              key={category}
              className="relative flex items-center gap-1 cursor-pointer
           text-gray-700 dark:text-gray-200
           hover:text-orange-500 transition"
              onMouseEnter={() => setActiveCategory(category)}
              onMouseLeave={() => setActiveCategory(null)}
            >
              <span>{category}</span>
              <ChevronDown size={14} />

              {activeCategory === category && (
                <div
                  className={`absolute top-full ${positionClass} w-56 bg-white dark:bg-gray-800 shadow-lg rounded-md z-50`}
                >
                  <div className="p-4">
                    {CATEGORY_DATA[category].map((item) => (
                      <div
                        key={item}
                        className="py-1 text-gray-700 dark:text-gray-200
           hover:text-orange-500 transition"
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
