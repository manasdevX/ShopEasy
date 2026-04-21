import { Link } from "react-router-dom";
import {
  ShoppingBag,
  ArrowRight,
  Star,
  Tag,
  CheckCircle,
  XCircle,
  ExternalLink,
} from "lucide-react";

const ProductMessage = ({ data }) => {
  if (!data?.products || data.products.length === 0) return null;

  return (
    <div
      className="bg-white dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl border border-slate-200/80 dark:border-slate-700/80 overflow-hidden shadow-lg w-full max-w-[310px]"
      style={{ animation: "chatFadeIn 0.3s ease-out" }}
    >
      {/* Header */}
      <div className="px-3 py-2 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-500/10 dark:to-amber-500/10 border-b border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <ShoppingBag size={12} className="text-orange-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 truncate max-w-[160px]">
            {data.summary || "Products"}
          </span>
        </div>
        <span className="text-[9px] bg-orange-500 text-white px-1.5 py-0.5 rounded-full font-bold min-w-[18px] text-center">
          {data.products.length}
        </span>
      </div>

      {/* Product List */}
      <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-700/40 max-h-[300px] overflow-y-auto">
        {data.products.map((p) => (
          <Link
            key={p.id}
            to={p.link}
            className="group p-2.5 hover:bg-orange-50/50 dark:hover:bg-orange-500/5 transition-all duration-150 flex gap-2.5 items-center"
          >
            {/* Thumbnail */}
            <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-700/50 overflow-hidden shrink-0 border border-slate-200/40 dark:border-slate-600/40">
              {p.thumbnail ? (
                <img
                  src={p.thumbnail}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  loading="lazy"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling?.classList.remove("hidden");
                  }}
                />
              ) : null}
              <div
                className={`w-full h-full flex items-center justify-center text-slate-400 ${
                  p.thumbnail ? "hidden" : ""
                }`}
              >
                <ShoppingBag size={14} />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 space-y-0.5">
              <p className="text-[11px] font-bold text-slate-800 dark:text-slate-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 line-clamp-1 transition-colors leading-tight">
                {p.name}
              </p>

              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[12px] font-black text-slate-900 dark:text-white">
                  ₹{Number(p.price).toLocaleString("en-IN")}
                </span>
                {p.mrp && p.mrp > p.price && (
                  <span className="text-[9px] text-slate-400 line-through">
                    ₹{Number(p.mrp).toLocaleString("en-IN")}
                  </span>
                )}
                {p.discountPercentage > 0 && (
                  <span className="text-[8px] font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-500/20 px-1 py-px rounded">
                    {p.discountPercentage}% off
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-[9px]">
                {p.rating > 0 && (
                  <span className="flex items-center gap-0.5 text-amber-500 font-semibold bg-amber-50 dark:bg-amber-500/10 px-1 py-px rounded">
                    <Star size={8} fill="currentColor" />
                    {p.rating.toFixed(1)}
                  </span>
                )}
                <span
                  className={`flex items-center gap-0.5 font-semibold ${
                    p.availability === "In Stock"
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-500 dark:text-red-400"
                  }`}
                >
                  {p.availability === "In Stock" ? (
                    <CheckCircle size={8} />
                  ) : (
                    <XCircle size={8} />
                  )}
                  {p.availability}
                </span>
              </div>
            </div>

            {/* Arrow */}
            <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <ExternalLink size={12} className="text-orange-500" />
            </div>
          </Link>
        ))}
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 bg-slate-900 dark:bg-slate-950 text-center">
        <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">
          Tap any product to view details
        </p>
      </div>
    </div>
  );
};

export default ProductMessage;