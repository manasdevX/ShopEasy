import { Link } from "react-router-dom";
import { ExternalLink, ShoppingBag, ArrowRight } from "lucide-react";

const ProductMessage = ({ data }) => {
  if (!data?.products || data.products.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xl w-full max-w-[300px] animate-in fade-in zoom-in duration-300">
      {/* Header - Keep as is */}
      <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border-b dark:border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingBag size={14} className="text-orange-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            {data.summary?.includes("category") ? "Category View" : "Search Results"}
          </span>
        </div>
        {/* Optional: Show count */}
        <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-300">
            {data.products.length} Items
        </span>
      </div>

      {/* --- SCROLLABLE LIST AREA --- */}
      {/* Added max-h-[260px] and overflow-y-auto here */}
      <div className="flex flex-col divide-y dark:divide-slate-700 max-h-[260px] overflow-y-auto custom-scrollbar">
        {data.products.map((p) => (
          <Link
            key={p.id}
            to={p.link}
            className="group p-4 hover:bg-orange-50 dark:hover:bg-orange-500/5 transition-all"
          >
            {/* ... Content stays the same ... */}
            <div className="flex justify-between items-center">
               <div className="flex flex-col">
                 <span className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-orange-600 line-clamp-1">
                   {p.name}
                 </span>
                 <span className="text-[10px] font-bold text-orange-500 mt-1 flex items-center gap-1 uppercase">
                   View Details <ArrowRight size={10} />
                 </span>
               </div>
               <div className="text-right px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg group-hover:bg-orange-600 group-hover:text-white transition-colors">
                 <span className="text-xs font-black">₹{p.price}</span>
               </div>
             </div>
          </Link>
        ))}
      </div>

      {/* Footer Summary - Keep as is */}
      {data.summary && (
        <div className="p-3 bg-slate-900 text-center relative z-10">
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter truncate">
            {data.summary}
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductMessage;