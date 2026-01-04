import React from "react";
import { Link } from "react-router-dom";
import { Home, Search, ShoppingCart, User } from "lucide-react";

// Mobile bottom navigation. Keeps layout minimal and accessible.
export default function MobileNav({ cartCount = 0, isLoggedIn = false, onOpenSearch = () => {} }) {
  return (
    <nav
      className="sm:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white dark:bg-[#030712] border-t border-gray-100 dark:border-gray-800"
      role="navigation"
      aria-label="Mobile"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between">
        <Link
          to="/"
          className="flex-1 flex flex-col items-center text-slate-700 dark:text-slate-200 text-xs py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-md"
          aria-label="Home"
        >
          <Home size={20} />
          <span className="mt-1">Home</span>
        </Link>

        <button
          onClick={onOpenSearch}
          className="flex-1 flex flex-col items-center text-slate-700 dark:text-slate-200 text-xs py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-md"
          aria-label="Search"
        >
          <Search size={20} />
          <span className="mt-1">Search</span>
        </button>

        <button
          onClick={() => {
            const ev = new CustomEvent("mobile-cart-clicked");
            window.dispatchEvent(ev);
          }}
          className="relative flex-1 flex flex-col items-center text-slate-700 dark:text-slate-200 text-xs py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-md"
          aria-label={`Cart with ${cartCount} items`}
        >
          <ShoppingCart size={20} />
          {cartCount > 0 && (
            <span className="absolute -top-1 right-6 bg-orange-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-[#030712]">
              {cartCount}
            </span>
          )}
          <span className="mt-1">Cart</span>
        </button>

        <Link
          to={isLoggedIn ? "/account" : "/login"}
          className="flex-1 flex flex-col items-center text-slate-700 dark:text-slate-200 text-xs py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-md"
          aria-label={isLoggedIn ? "Account" : "Login"}
        >
          <User size={20} />
          <span className="mt-1">{isLoggedIn ? "Account" : "Login"}</span>
        </Link>
      </div>
    </nav>
  );
}
