import React, { useState } from "react";
import { Star, ThumbsUp, ThumbsDown, ShieldCheck, Filter, Search, MessageSquarePlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function ReviewPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("Most Relevant");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#030712] transition-colors duration-300 font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* --- SECTION 1: DYNAMIC STATS HEADER --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16 items-center">
          <div className="lg:col-span-2">
            <h1 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white leading-tight mb-4">
              Real Stories. <br />
              <span className="text-orange-500">Real Feedback.</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 max-w-md font-medium">
              Join thousands of happy customers. Our reviews are 100% verified to ensure the highest quality standards.
            </p>
          </div>
          
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl flex flex-col items-center justify-center text-center">
             <div className="text-5xl font-black text-slate-900 dark:text-white mb-2">4.8</div>
             <div className="flex gap-1 mb-3">
               {[...Array(5)].map((_, i) => (
                 <Star key={i} size={18} fill={i < 4 ? "#fbbf24" : "none"} className={i < 4 ? "text-yellow-400" : "text-slate-200"} />
               ))}
             </div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Based on 12,450 Ratings</p>
             <button 
                onClick={() => navigate("/write-review")}
                className="mt-6 w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-orange-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-[10px]"
             >
               <MessageSquarePlus size={16} /> Write A Review
             </button>
          </div>
        </div>

        <hr className="border-slate-100 dark:border-slate-800 mb-12" />

        {/* --- SECTION 2: FILTERS & SEARCH --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
            {["Most Relevant", "Recent", "High to Low", "Images"].map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  filter === item 
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900" 
                  : "bg-white dark:bg-slate-900 text-slate-400 border border-slate-100 dark:border-slate-800"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search reviews..." 
              className="w-full md:w-64 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
          </div>
        </div>

        {/* --- SECTION 3: THE REVIEW GRID --- */}
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <ReviewCard key={idx} />
          ))}
        </div>

        <div className="flex justify-center mt-16">
          <button className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 hover:border-orange-500 dark:hover:border-orange-500 text-slate-900 dark:text-white font-black py-4 px-12 rounded-2xl transition-all active:scale-95 text-xs uppercase tracking-[0.2em] shadow-sm">
            Load More Reviews
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// Optimized Sub-component using your specific UI code
function ReviewCard() {
  return (
    <div className="break-inside-avoid group p-6 bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      {/* TOP ROW: RATING & TITLE */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-green-600 dark:bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black shadow-sm">
            5 <Star size={8} fill="currentColor" />
          </div>
          <span className="text-sm font-black text-slate-800 dark:text-white tracking-tight">
            Perfect Experience
          </span>
        </div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          2 days ago
        </span>
      </div>

      {/* REVIEW TEXT */}
      <p className="text-[13px] italic text-slate-600 dark:text-slate-400 leading-relaxed font-medium mb-6">
        "Absolutely stunning quality. The attention to detail exceeded my expectations. Fast delivery too!"
      </p>

      {/* BOTTOM ROW: USER INFO & VOTING */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center text-[10px] font-black text-orange-600 uppercase">
            RM
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-black text-slate-800 dark:text-slate-200">
              Rahul M.
            </span>
            <div className="flex items-center gap-1 text-[9px] font-bold text-green-500 uppercase tracking-tighter">
              <ShieldCheck size={10} fill="currentColor" className="text-green-500/20" />
              Verified Buyer
            </div>
          </div>
        </div>

        {/* INTERACTION: LIKE / DISLIKE */}
        <div className="flex items-center gap-1">
          {/* LIKE */}
          <div className="flex items-center gap-1 group/like cursor-pointer">
            <button className="p-2 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover/like:text-green-500 group-hover/like:bg-green-50 dark:group-hover/like:bg-green-500/10 transition-all">
              <ThumbsUp size={11} />
            </button>
            <span className="text-[9px] font-black text-slate-400 group-hover/like:text-slate-600 dark:group-hover/like:text-slate-200">
              24
            </span>
          </div>

          {/* DISLIKE */}
          <div className="flex items-center gap-1 group/dislike cursor-pointer">
            <button className="p-2 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover/dislike:text-red-500 group-hover/dislike:bg-red-50 dark:group-hover/dislike:bg-red-500/10 transition-all">
              <ThumbsDown size={11} />
            </button>
            <span className="text-[9px] font-black text-slate-400 group-hover/dislike:text-slate-600 dark:group-hover/dislike:text-slate-200">
              2
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}