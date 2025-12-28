import React from 'react';

const ShopEasyFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-[#f1f3f6] dark:bg-slate-950 py-8 mt-12 border-t border-slate-200 dark:border-slate-800 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          
          {/* POLICIES & COPYRIGHT */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2 text-[13px] text-slate-600 dark:text-slate-400">
            <span className="font-bold text-slate-800 dark:text-slate-200">Policies:</span>
            <a href="#" className="hover:text-[#2874f0] dark:hover:text-orange-400 transition-colors">Returns Policy</a>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <a href="#" className="hover:text-[#2874f0] dark:hover:text-orange-400 transition-colors">Terms of use</a>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <a href="#" className="hover:text-[#2874f0] dark:hover:text-orange-400 transition-colors">Security</a>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <a href="#" className="hover:text-[#2874f0] dark:hover:text-orange-400 transition-colors">Privacy</a>
            <span className="ml-0 md:ml-4 text-slate-500 dark:text-slate-500 font-medium">
              ©{currentYear} ShopEasy.com
            </span>
          </div>

          {/* HELP CENTER & SUPPORT */}
          <div className="text-[13px] text-slate-600 dark:text-slate-400 font-semibold tracking-tight">
            Need help? Visit our <a href="#" className="text-[#2874f0] dark:text-orange-400 hover:underline">Help Center</a> or <a href="#" className="text-[#2874f0] dark:text-orange-400 hover:underline">Contact Us</a>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default ShopEasyFooter;