import React from "react";
import { ShoppingBag, Star, Heart } from "lucide-react";

export default function ProductCard({ product }) {
  return (
    <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-[2rem] p-4 shadow-sm hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-500 group border border-slate-100 dark:border-slate-700/50 hover:border-orange-500/30 flex flex-col">
      
      {/* IMAGE CONTAINER */}
      <div className="relative h-64 rounded-[1.5rem] overflow-hidden mb-5 bg-slate-100 dark:bg-slate-900">
        {/* Discount Badge */}
        <div className="absolute top-3 left-3 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-full shadow-sm">
          <p className="text-[10px] font-black text-orange-600 uppercase tracking-tighter">Save 20%</p>
        </div>

        {/* Wishlist Button */}
        <button className="absolute top-3 right-3 z-10 p-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-full shadow-sm text-slate-400 hover:text-red-500 transition-colors">
          <Heart size={16} />
        </button>

        <img 
          src={product.image} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" 
          alt={product.name} 
        />
        
        {/* Quick Add Button Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out">
          <button 
            className="w-full py-3 bg-slate-900 dark:bg-orange-500 text-white rounded-xl shadow-xl font-bold text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <ShoppingBag size={18} />
            Quick Add
          </button>
        </div>
      </div>

      {/* RATING & CATEGORY */}
      <div className="flex justify-between items-center mb-2 px-1">
        <div className="flex items-center gap-1 text-orange-400">
          <Star size={12} fill="currentColor" />
          <span className="text-[11px] font-black text-slate-500 dark:text-slate-400">
            {product.rating} <span className="font-normal opacity-60">(1.2k)</span>
          </span>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Premium</span>
      </div>

      {/* INFO */}
      <div className="px-1 flex-grow">
        <h3 className="font-bold text-slate-900 dark:text-white mb-2 group-hover:text-orange-500 transition-colors leading-tight">
          {product.name}
        </h3>
        <div className="flex items-center gap-2">
          <p className="text-orange-600 dark:text-orange-400 font-black text-lg">
            {product.price}
          </p>
          <p className="text-slate-400 line-through text-xs font-medium">
            ₹{parseInt(product.price.replace(/[^\d]/g, '')) + 500}
          </p>
        </div>
      </div>
    </div>
  );
}