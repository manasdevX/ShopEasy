import { Link } from "react-router-dom";
import { ShoppingBag, ArrowRight, Layers } from "lucide-react";

const ProductMessage = ({ data }) => {
  if (!data?.products || data.products.length === 0) return null;

  // Determine if it's a category view for the icon
  const isCategory = data.summary?.toLowerCase().includes("category");

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xl w-full max-w-[300px] animate-in fade-in zoom-in duration-300">
      {/* Dynamic Header */}
      <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border-b dark:border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isCategory ? (
            <Layers size={14} className="text-blue-500" />
          ) : (
            <ShoppingBag size={14} className="text-orange-500" />
          )}
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 truncate max-w-[150px]">
            {data.summary}
          </span>
        </div>
        <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-300 font-bold">
          {data.products.length}
        </span>
      </div>

      {/* Optimized Scrollable List */}
      <div className="flex flex-col divide-y dark:divide-slate-700 max-h-[250px] overflow-y-auto">
        {data.products.map((p) => (
          <Link
            key={p.id}
            to={p.link}
            className="group p-3 hover:bg-orange-50 dark:hover:bg-orange-500/5 transition-all flex justify-between items-center"
          >
            <div className="flex flex-col overflow-hidden pr-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-orange-600 truncate">
                {p.name}
              </span>
              <span className="text-[9px] font-medium text-slate-400 uppercase flex items-center gap-1">
                View Item <ArrowRight size={8} />
              </span>
            </div>
            <div className="shrink-0 px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg group-hover:bg-orange-600 group-hover:text-white transition-colors">
              <span className="text-xs font-black">₹{p.price}</span>
            </div>
          </Link>
        ))}
      </div>
      
      {/* Footer Branding */}
      <div className="p-2 bg-slate-900 text-center">
        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
          ShopEasy Smart Search
        </p>
      </div>
    </div>
  );
};

export default ProductMessage;