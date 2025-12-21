import React from "react";

export default function SellerFooter() {
  return (
    <footer className="py-12 px-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#030712]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-slate-500 text-sm font-medium">
          © {new Date().getFullYear()} ShopEasy Seller Studio. All rights reserved.
        </p>
        <div className="flex gap-8 text-sm font-bold text-slate-400">
          <a href="#" className="hover:text-orange-500 transition">Terms</a>
          <a href="#" className="hover:text-orange-500 transition">Privacy</a>
          <a href="#" className="hover:text-orange-500 transition">Support</a>
        </div>
      </div>
    </footer>
  );
}