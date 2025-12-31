import React from 'react';
import { ShieldCheck, Lock, Sparkles , ArrowLeft } from 'lucide-react';
import { useNavigate , useLocation } from 'react-router-dom';

const ShopEasyHeader = () => {

  const navigate = useNavigate();
  const location = useLocation();

  return (
    <header className="bg-white dark:bg-[#030712] border-b border-gray-100 dark:border-gray-800 px-6 py-3 flex items-center gap-6">
      <div className="max-w-6xl mx-auto w-full px-6 flex items-center justify-between">
        
        {/* BRAND LOGO AREA */}
        <div className="flex flex-col items-start leading-none group cursor-pointer" onClick={() => navigate("/")}>
          <span className="text-orange-500 text-2xl font-black tracking-tighter shrink-0">
            ShopEasy
          </span>
        </div>

        {/* SECURE CHECKOUT STATUS */}
        {location.pathname == "/payment" && <div className="flex items-center gap-4 text-white/90">
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
        </div>}
        {location.pathname != "/payment" && 
          <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-slate-400 hover:text-orange-500 font-bold text-[10px] uppercase tracking-[0.2em]"
            >
              <ArrowLeft size={14} /> 
              <span>Back</span>
            </button>
        }

      </div>
    </header>
  );
};

export default ShopEasyHeader;