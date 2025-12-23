import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ShoppingBag,
  Moon,
  Sun,
  Search,
  Bell,
  ChevronDown,
  Package,
  ListOrdered,
  LogOut,
  Settings,
  User, // <--- Ensure this is imported for the menu
} from "lucide-react";

export default function SellerNavbar({ isLoggedIn }) {
  const navigate = useNavigate();
  const location = useLocation();

  // 1. Get user data safely
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const user = storedUser;

  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark")
  );

  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark");
    setIsDark(!isDark);
  };

  // 2. Define handleLogout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login"; // Force refresh to clear states
  };

  const navLinks = [
    { name: "Dashboard", path: "/Seller/Dashboard", icon: ShoppingBag },
    { name: "Inventory", path: "/Seller/products", icon: Package },
    { name: "Orders", path: "/Seller/orders", icon: ListOrdered },
  ];

  // Stepper Logic for Onboarding
  const isOnboarding = [
    "/Seller/login",
    "/Seller/signup",
    "/Seller/forgot-password",
    "/Seller/register",
    "/Seller/bank-details",
  ].includes(location.pathname);

  const steps = [
    { name: "EMAIL & PASSWORD", path: "/Seller/register" },
    { name: "BUSINESS DETAILS", path: "/Seller/business-details" },
    { name: "BANK VERIFICATION", path: "/Seller/bank-details" },
  ];

  const currentStepIndex = steps.findIndex((s) => s.path === location.pathname);

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-[#030712] border-b border-slate-100 dark:border-slate-800 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-8">
          {/* LOGO */}
          <Link
            to="/Seller/Dashboard"
            className="flex items-center gap-2.5 shrink-0 group"
          >
            <div className="bg-orange-500 p-2 rounded-xl shadow-lg shadow-orange-500/20 group-hover:rotate-6 transition-transform">
              <ShoppingBag className="text-white" size={22} />
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

          {/* CONDITIONAL CENTER CONTENT: SEARCH OR STEPPER */}
          <div className="hidden lg:flex flex-grow max-w-2xl justify-center">
            {isOnboarding ? (
              <div className="flex items-center gap-4">
                {steps.map((step, index) => (
                  <React.Fragment key={step.name}>
                    <div className="flex items-center gap-3">
                      {/* Step Icon (Circle with Check or Index) */}
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          index <= currentStepIndex
                            ? "bg-orange-500 border-orange-500 text-white"
                            : "border-slate-300 text-slate-400"
                        }`}
                      >
                        {index < currentStepIndex ? (
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : (
                          <span className="text-[10px] font-bold">
                            {index + 1}
                          </span>
                        )}
                      </div>

                      {/* Step Name */}
                      <span
                        className={`text-[10px] font-black tracking-widest whitespace-nowrap transition-colors ${
                          index <= currentStepIndex
                            ? "text-slate-900 dark:text-white"
                            : "text-slate-400"
                        }`}
                      >
                        {step.name}
                        {index === currentStepIndex && (
                          <div className="h-0.5 w-full bg-orange-500 mt-0.5 rounded-full" />
                        )}
                      </span>
                    </div>

                    {/* Connector Line */}
                    {index < steps.length - 1 && (
                      <div
                        className={`w-12 h-[1px] ${
                          index < currentStepIndex
                            ? "bg-orange-500"
                            : "bg-slate-200 dark:bg-slate-800"
                        }`}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
            ) : (
              /* DEFAULT SEARCH BAR (Visible on Dashboard/Inventory/etc) */
              !["/Seller/login", "/login"].includes(location.pathname) && (
                <div className="w-full relative group">
                  <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors"
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="Search products, orders or SKU..."
                    className="w-full bg-slate-100 dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-xl py-2.5 pl-12 pr-4 text-sm font-medium outline-none focus:bg-white dark:focus:bg-slate-950 focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/5 transition-all"
                  />
                </div>
              )
            )}
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {isLoggedIn && (
              <button className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 relative transition-colors">
                <Bell size={20} />
                <span className="absolute top-2 right-2.5 w-2 h-2 bg-orange-500 rounded-full border-2 border-white dark:border-[#030712]"></span>
              </button>
            )}

            <div className="h-8 w-[1px] bg-slate-100 dark:bg-slate-800 mx-1 hidden sm:block"></div>

            {/* USER PROFILE DROPDOWN */}
            {isLoggedIn ? (
              <div className="relative group">
                <button className="flex items-center gap-1 hover:text-orange-500 transition-colors">
                  {/* Full User Name in Avatar Style */}
                  <div className="flex items-center gap-1 hover:text-orange-500 transition-colors">
                    <User size={18} />
                    {user?.name?.split(" ")[0] || "Account"}
                  </div>
                  <ChevronDown
                    size={16}
                    className="text-slate-400 transition-transform group-hover:rotate-180"
                  />
                </button>

                {/* DROPDOWN MENU */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-52 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl overflow-hidden shadow-xl border border-gray-100 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <Link
                    to="/Seller/Dashboard"
                    className="block px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    My Profile
                  </Link>
                  <div className="border-t border-gray-100 dark:border-gray-700" />
                  <Link
                    to="/Seller/Landing"
                    className="w-full text-left px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 transition flex items-center gap-2 text-red-500"
                  >
                    <LogOut size={16} />
                    Logout
                  </Link>
                </div>
              </div>
            ) : (
              <Link
                to="/Seller/login"
                className="flex items-center gap-1 hover:text-orange-500 transition-colors"
              >
                <User size={18} />
                Login
              </Link>
            )}
          </div>
        </div>

        {/* BOTTOM NAV */}
        {isLoggedIn && (
          <div className="flex items-center gap-8 mt-4 border-t border-slate-50 dark:border-slate-800/50 pt-4 overflow-x-auto no-scrollbar">
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
                  <link.icon size={14} strokeWidth={3} />
                  {link.name}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-500 rounded-full"></span>
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
