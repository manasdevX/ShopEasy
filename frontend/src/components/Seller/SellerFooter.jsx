import React from "react";
import { Link } from "react-router-dom";

export default function SellerFooter() {
  return (
    <footer className="mt-auto py-4 text-center text-sm text-gray-500">
      <div className="pt-8 border-t border-slate-100 dark:border-slate-900 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          © {new Date().getFullYear()} ShopEasy. All rights reserved.
        </p>
        <div className="mt-2 flex justify-center gap-6 text-sm text-slate-500 dark:text-slate-500">
          <Link
          state={{origin : "/Seller/Landing"}}
            to="/Terms"
            className="hover:underline hover:text-orange-500 transition-colors"
          >
            Terms
          </Link>
          <Link
          state={{origin : "/Seller/Landing"}}
            to="/Privacy"
            className="hover:underline hover:text-orange-500 transition-colors"
          >
            Privacy
          </Link>
          <Link
          state={{origin : "/Seller/Landing"}}
            to="/Help"
            className="hover:underline hover:text-orange-500 transition-colors"
          >
            Help
          </Link>
        </div>
      </div>
    </footer>
  );
}