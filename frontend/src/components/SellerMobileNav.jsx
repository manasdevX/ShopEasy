import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Grid, ClipboardList, PlusCircle, Bell, Home } from "lucide-react";

export default function SellerMobileNav({ cartCount = 0 }) {
  const { pathname } = useLocation();
  const active = (p) => pathname.startsWith(p);

  return (
    <nav
      className="sm:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white dark:bg-[#030712] border-t border-gray-100 dark:border-gray-800"
      role="navigation"
      aria-label="Seller mobile"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between">
        <Link
          to="/Seller/Dashboard"
          className={`flex-1 flex flex-col items-center text-xs py-2 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
            active("/Seller/Dashboard") ? "text-orange-500" : "text-slate-700 dark:text-slate-200"
          }`}
          aria-label="Seller dashboard"
        >
          <Home size={20} />
          <span className="mt-1">Dashboard</span>
        </Link>

        <Link
          to="/Seller/Orders"
          className={`flex-1 flex flex-col items-center text-xs py-2 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
            active("/Seller/Orders") ? "text-orange-500" : "text-slate-700 dark:text-slate-200"
          }`}
          aria-label="Seller orders"
        >
          <ClipboardList size={20} />
          <span className="mt-1">Orders</span>
        </Link>

        <Link
          to="/Seller/Products"
          className={`flex-1 flex flex-col items-center text-xs py-2 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
            active("/Seller/Products") ? "text-orange-500" : "text-slate-700 dark:text-slate-200"
          }`}
          aria-label="Products"
        >
          <Grid size={20} />
          <span className="mt-1">Products</span>
        </Link>

        <Link
          to="/Seller/AddProduct"
          className={`flex-1 flex flex-col items-center text-xs py-2 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
            active("/Seller/AddProduct") ? "text-orange-500" : "text-slate-700 dark:text-slate-200"
          }`}
          aria-label="Add product"
        >
          <PlusCircle size={20} />
          <span className="mt-1">Add</span>
        </Link>

        <Link
          to="/Seller/Notification"
          className={`flex-1 flex flex-col items-center text-xs py-2 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
            active("/Seller/Notification") ? "text-orange-500" : "text-slate-700 dark:text-slate-200"
          }`}
          aria-label="Notifications"
        >
          <Bell size={20} />
          <span className="mt-1">Alerts</span>
        </Link>
      </div>
    </nav>
  );
}
