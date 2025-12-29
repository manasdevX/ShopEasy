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
  User,
  Check,
  Store,
  LayoutDashboard,
} from "lucide-react";

export default function SellerNavbar({ isLoggedIn: propIsLoggedIn }) {
  const navigate = useNavigate();
  const location = useLocation();

  // ==========================================
  // 1. SAFE DATA RETRIEVAL (Fixes the Crash)
  // ==========================================
  const [seller, setSeller] = useState(() => {
    try {
      const stored = localStorage.getItem("sellerUser");
      if (!stored || stored === "undefined") return null;
      return JSON.parse(stored);
    } catch (e) {
      console.error("Error parsing seller data:", e);
      return null;
    }
  });

  const [token, setToken] = useState(localStorage.getItem("sellerToken"));

  // ==========================================
  // 2. SYNC STATE ON CHANGE
  // ==========================================
  useEffect(() => {
    const handleStorageChange = () => {
      setToken(localStorage.getItem("sellerToken"));
      try {
        const stored = localStorage.getItem("sellerUser");
        if (stored && stored !== "undefined") {
          setSeller(JSON.parse(stored));
        } else {
          setSeller(null);
        }
      } catch (err) {
        setSeller(null);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    // Custom event listener for immediate updates within the same tab
    window.addEventListener("seller-info-updated", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("seller-info-updated", handleStorageChange);
    };
  }, []);

  const isAuth = propIsLoggedIn || !!token;

  // Theme Logic
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark")
  );
  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark");
    setIsDark(!isDark);
  };

  // Logout Logic
  const handleLogout = () => {
    localStorage.removeItem("sellerToken");
    localStorage.removeItem("sellerUser");
    localStorage.removeItem("seller_step1");
    localStorage.removeItem("seller_step2");
    setSeller(null);
    setToken(null);
    navigate("/Seller/Landing");
  };

  const navLinks = [
    { name: "Dashboard", path: "/Seller/Dashboard", icon: LayoutDashboard },
    { name: "Inventory", path: "/Seller/products", icon: Package },
    { name: "Orders", path: "/Seller/orders", icon: ListOrdered },
  ];

  // Stepper Logic (for Registration Flow)
  const steps = [
    {
      name: "EMAIL & PASSWORD",
      path: ["/Seller/login", "/Seller/signup", "/Seller/forgot-password"],
    },
    { name: "BUSINESS DETAILS", path: ["/Seller/register"] },
    { name: "BANK VERIFICATION", path: ["/Seller/bank-details"] },
  ];

  const currentStepIndex = steps.findIndex((s) =>
    s.path.includes(location.pathname)
  );
  const isOnboarding = currentStepIndex !== -1;

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-[#030712] border-b border-slate-100 dark:border-slate-800 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-8">
          {/* LOGO */}
          <Link
            to={isAuth ? "/Seller/Dashboard" : "/Seller/Landing"}
            className="flex items-center gap-2.5 shrink-0 group"
          >
            <div className="bg-orange-500 p-2 rounded-xl shadow-lg shadow-orange-500/20  transition-transform">
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

          {/* CENTER: ONBOARDING STEPS OR SEARCH */}
          <div className="hidden lg:flex flex-grow max-w-2xl justify-center">
            {isOnboarding ? (
              <div className="flex items-center gap-4">
                {steps.map((step, index) => {
                  const isCompleted = index < currentStepIndex;
                  const isActive = Number(index) === Number(currentStepIndex);

                  return (
                    <React.Fragment key={step.name}>
                      <div className="flex items-center gap-3">
                        {/* STEP ICON */}
                        <div
                          className={`w-6 h-6 flex items-center justify-center border-2 transition-all duration-300 ${
                            isCompleted
                              ? "bg-orange-500 border-orange-500 text-white"
                              : "border-slate-300 dark:border-slate-700 text-slate-400"
                          }`}
                          style={{ borderRadius: "50px" }}
                        >
                          {isCompleted ? (
                            <Check size={14} strokeWidth={4} />
                          ) : (
                            <span className="text-[10px] font-black">
                              {index + 1}
                            </span>
                          )}
                        </div>

                        {/* STEP NAME */}
                        <div className="flex flex-col items-start">
                          <span
                            className={`text-[10px] font-black tracking-widest uppercase whitespace-nowrap transition-colors ${
                              isCompleted || isActive
                                ? "text-slate-900 dark:text-white"
                                : "text-slate-400"
                            }`}
                          >
                            {step.name}
                          </span>
                          {(isCompleted || isActive) && (
                            <div className="h-[2px] w-full bg-orange-500 mt-1" />
                          )}
                        </div>
                      </div>

                      {/* CONNECTOR LINE */}
                      {index < steps.length - 1 && (
                        <div
                          className={`w-12 h-[1px] transition-colors duration-500 ${
                            isCompleted
                              ? "bg-orange-500"
                              : "bg-slate-200 dark:bg-slate-800"
                          }`}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            ) : (
              /* SEARCH BAR (Only visible if logged in and not onboarding) */
              isAuth && (
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

          {/* RIGHT SIDE ACTIONS */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {isAuth && (
              <button className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 relative transition-colors">
                <Bell size={20} />
                <span className="absolute top-2 right-2.5 w-2 h-2 bg-orange-500 rounded-full border-2 border-white dark:border-[#030712]"></span>
              </button>
            )}

            <div className="h-8 w-[1px] bg-slate-100 dark:bg-slate-800 mx-1 hidden sm:block"></div>

            {/* PROFILE DROPDOWN */}
            {isAuth ? (
              <div className="relative group py-2">
                {" "}
                {/* Added py-2 to extend the hoverable area vertically */}
                <button className="flex items-center gap-1 hover:text-orange-500 transition-colors">
                  <div className="flex items-center gap-2 hover:text-orange-500 transition-colors font-bold text-sm text-slate-700 dark:text-slate-200">
                    <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold border border-orange-200 dark:border-orange-800">
                      {seller?.name ? seller.name.charAt(0).toUpperCase() : "S"}
                    </div>
                    <span className="hidden md:block">
                      {seller?.name ? seller.name.split(" ")[0] : "Seller"}
                    </span>
                  </div>
                  <ChevronDown
                    size={16}
                    className="text-slate-400 transition-transform group-hover:rotate-180"
                  />
                </button>
                {/* Dropdown Menu */}
                {/* CHANGE: Added 'pt-2' and removed 'mt-2'. 
        The 'pt-2' acts as an invisible bridge so the mouse stay 'inside' the group.
    */}
                <div className="absolute top-full right-0 w-52 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-xl overflow-hidden shadow-xl border border-slate-100 dark:border-slate-800">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Signed in as
                      </p>
                      <p className="text-sm font-bold truncate text-slate-900 dark:text-white mt-0.5">
                        {seller?.email || "No Email"}
                      </p>
                    </div>

                    <Link
                      to="/Seller/Dashboard"
                      className="block px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition font-medium text-sm"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/Seller/Settings"
                      className="block px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition font-medium text-sm"
                    >
                      Settings
                    </Link>

                    <div className="border-t border-slate-100 dark:border-slate-800" />

                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 transition flex items-center gap-2 text-red-500 font-medium text-sm"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/Seller/login"
                  className="hidden md:block font-bold text-lg text-slate-600 dark:text-slate-300 hover:text-orange-500 transition-colors"
                >
                  <User size={20} className="inline-block mr-1" />
                  Login
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM NAV (Only visible if logged in and NOT onboarding) */}
        {isAuth &&
          !isOnboarding &&
          ["/Seller/Dashboard", "/Seller/orders", "/Seller/products"].includes(
            location.pathname
          ) && (
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
