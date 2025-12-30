import React from 'react';
import { Link } from 'react-router-dom';

const ShopEasyFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-[#f1f3f6] dark:bg-slate-950 py-8 transition-colors duration-300">
      {/* --- BOTTOM BAR (REVISED TO MATCH AUTHFOOTER) --- */}
        <div className="pt-8 border-t border-slate-100 dark:border-slate-900 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} ShopEasy. All rights reserved.
          </p>
          <div className="mt-2 flex justify-center gap-6 text-sm text-slate-500 dark:text-slate-500">
            <Link to="/terms" className="hover:underline hover:text-orange-500 transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:underline hover:text-orange-500 transition-colors">Privacy</Link>
            <Link to="/help" className="hover:underline hover:text-orange-500 transition-colors">Help</Link>
          </div>
        </div>
    </footer>
  )
}
export default ShopEasyFooter;