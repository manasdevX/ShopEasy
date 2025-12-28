import React from 'react';
import { ShieldCheck, Lock, Sparkles } from 'lucide-react';

const ShopEasyHeader = () => {
  return (
    <header className="bg-white dark:bg-[#030712] border-b border-gray-100 dark:border-gray-800 px-6 py-3 flex items-center gap-6">
      <div className="max-w-6xl mx-auto w-full px-6 flex items-center justify-between">
        
        {/* BRAND LOGO AREA */}
        <div className="flex flex-col items-start leading-none group cursor-pointer">
          <span className="text-orange-500 text-2xl font-black tracking-tighter shrink-0">
            ShopEasy
          </span>
        </div>

        {/* SECURE CHECKOUT STATUS */}
        <div className="flex items-center gap-4 text-white/90">
          <div className="hidden sm:flex items-center gap-2 border-r border-white/20 dark:border-slate-700 pr-4">
            <ShieldCheck size={18} className="text-white dark:text-orange-400" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              100% Secure
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Lock size={16} className="text-white dark:text-orange-400" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Safe Payment
            </span>
          </div>
        </div>

      </div>
    </header>
  );
};

export default ShopEasyHeader;