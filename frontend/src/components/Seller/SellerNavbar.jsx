import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  ShoppingBag, Moon, Sun, Search, 
  Bell, ChevronDown, Package, ListOrdered, 
  UserCircle, LogOut, Settings, HelpCircle 
} from "lucide-react";

export default function SellerNavbar({ isLoggedIn }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains("dark"));
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark");
    setIsDark(!isDark);
  };

  const navLinks = [
    { name: "Dashboard", path: "/Seller/Dashboard", icon: ShoppingBag },
    { name: "Inventory", path: "/Seller/products", icon: Package },
    { name: "Orders", path: "/Seller/orders", icon: ListOrdered },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-[#030712] border-b border-slate-100 dark:border-slate-800 transition-all duration-300">
      {/* TOP STRIP - Help & Support (Professional Touch) */}
      <div className="bg-slate-50 dark:bg-slate-900/50 py-1.5 px-6 border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto flex justify-end gap-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
          <Link to="/support" className="hover:text-orange-500 transition-colors flex items-center gap-1">
            <HelpCircle size={12} /> Seller Support
          </Link>
          <span className="cursor-default">English (IN)</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-8">
          
          {/* LOGO */}
          <Link to="/Seller/Dashboard" className="flex items-center gap-2.5 shrink-0 group">
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

          {/* SEARCH BAR (Professional Search) */}
          <div className="hidden lg:flex flex-grow max-w-xl relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search products, orders or SKU..."
              className="w-full bg-slate-100 dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-xl py-2.5 pl-12 pr-4 text-sm font-medium outline-none focus:bg-white dark:focus:bg-slate-950 focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/5 transition-all"
            />
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* THEME TOGGLE */}
            <button onClick={toggleTheme} className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* NOTIFICATIONS */}
            {isLoggedIn && (
              <button className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 relative transition-colors">
                <Bell size={20} />
                <span className="absolute top-2 right-2.5 w-2 h-2 bg-orange-500 rounded-full border-2 border-white dark:border-[#030712]"></span>
              </button>
            )}

            <div className="h-8 w-[1px] bg-slate-100 dark:bg-slate-800 mx-1 hidden sm:block"></div>

            {/* USER PROFILE DROPDOWN */}
            {isLoggedIn ? (
              <div className="relative">
                <button 
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                >
                  <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-black text-xs">
                    JD
                  </div>
                  <ChevronDown size={16} className={`text-slate-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* DROPDOWN MENU */}
                {showProfileMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)}></div>
                    <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl z-20 py-2 overflow-hidden animate-in fade-in zoom-in duration-200">
                      <div className="px-4 py-3 border-b border-slate-50 dark:border-slate-800">
                        <p className="text-sm font-black text-slate-900 dark:text-white">John Doe</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase truncate">j.doe@store.com</p>
                      </div>
                      <Link to="/Seller/settings" className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-orange-500 transition-colors">
                        <Settings size={16} /> Store Settings
                      </Link>
                      <button onClick={() => navigate("/login")} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                        <LogOut size={16} /> Logout Account
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link to="/Seller/login" className="bg-slate-900 dark:bg-orange-500 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:scale-[1.02] active:scale-95 transition-all">
                Login
              </Link>
            )}
          </div>
        </div>

        {/* BOTTOM NAV - Only visible when logged in */}
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