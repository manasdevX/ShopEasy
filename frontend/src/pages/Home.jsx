import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import { ArrowRight, Zap } from "lucide-react";

export default function Home() {
  const isLoggedIn = !!localStorage.getItem("token");
  return (
    // 1. Added transition-colors to ensure the background fades smoothly
    <div className="bg-slate-50 dark:bg-[#030712] min-h-screen transition-colors duration-500 ease-in-out">
      <Navbar />

      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32">
        {/* 2. Decorative Background Glows - Adjusted for better depth */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none hidden dark:block">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-500/10 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-blue-600/5 blur-[100px] rounded-full"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          {/* 3. Badge - Optimized border for dark mode visibility */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 text-orange-600 dark:text-orange-400 text-xs font-bold uppercase tracking-widest mb-6 transition-all">
            <Zap size={14} /> New Season Arrivals
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6 leading-tight">
            Shop Smart. <span className="text-orange-500">Shop Easy.</span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg text-slate-600 dark:text-slate-400 mb-10 leading-relaxed">
            Experience the next generation of shopping with curated collections
            across electronics, fashion, and lifestyle essentials.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* Primary Button */}
            <Link
              to="/products"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-orange-600/20 transition-all active:scale-95"
            >
              Explore Products <ArrowRight size={20} />
            </Link>

            {/* REPLACE THE OLD SECONDARY BUTTON WITH THIS: */}
            {!isLoggedIn && (
              <Link
                to="/signup"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 px-8 py-4 rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 backdrop-blur-sm transition-all shadow-sm"
              >
                Join ShopEasy
              </Link>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
