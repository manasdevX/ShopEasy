import React, { useState } from "react";
import { Star, ShoppingCart, ShieldCheck, Truck, RotateCcw, Plus, Minus, MessageSquare } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function ProductDetails() {
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [userRating, setUserRating] = useState(0);

  // 1. DUMMY DATA
  const product = {
    name: "FocusPro Wireless Noise Cancelling Headphones",
    price: 299.00,
    rating: 4.8,
    reviewsCount: 1240,
    description: "Experience pure sound with the FocusPro Wireless. Featuring industry-leading noise cancellation, 40-hour battery life, and ultra-soft memory foam cushions for all-day comfort.",
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
      "https://images.unsplash.com/photo-1546435770-a3e426ff472b?w=800&q=80",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=80"
    ],
    features: ["Active Noise Cancellation", "Bluetooth 5.2", "40-Hour Battery", "Built-in Mic"]
  };

  const reviews = [
    { id: 1, user: "Alex M.", rating: 5, comment: "Best headphones I've ever owned. The bass is incredible!", date: "2 days ago" },
    { id: 2, user: "Sarah K.", rating: 4, comment: "Very comfortable for long flights. Noise cancelling is top-tier.", date: "1 week ago" }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#030712] transition-colors duration-500">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          
          {/* LEFT: IMAGE GALLERY */}
          <div className="space-y-6">
            <div className="aspect-square bg-slate-50 dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800">
              <img src={product.images[selectedImage]} alt="Product" className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" />
            </div>
            <div className="flex gap-4">
              {product.images.map((img, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setSelectedImage(idx)}
                  className={`w-24 h-24 rounded-2xl overflow-hidden border-2 transition-all ${selectedImage === idx ? 'border-orange-500' : 'border-transparent opacity-60'}`}
                >
                  <img src={img} className="w-full h-full object-cover" alt="thumb" />
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT: PRODUCT INFO */}
          <div className="flex flex-col">
            <span className="text-orange-500 font-black text-xs tracking-widest uppercase mb-2">New Arrival</span>
            <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white mb-4 leading-tight">
              {product.name}
            </h1>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="flex text-orange-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={18} fill={i < Math.floor(product.rating) ? "currentColor" : "none"} />
                ))}
              </div>
              <span className="text-sm font-bold text-slate-400">({product.reviewsCount} Reviews)</span>
            </div>

            <div className="text-3xl font-black text-slate-900 dark:text-white mb-6">
              ${product.price.toFixed(2)}
            </div>

            <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
              {product.description}
            </p>

            {/* ACTION BOX */}
            <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-6">
                <span className="font-bold text-slate-900 dark:text-white">Quantity</span>
                <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))}><Minus size={16} /></button>
                  <span className="w-8 text-center font-black">{quantity}</span>
                  <button onClick={() => setQuantity(q => q + 1)}><Plus size={16} /></button>
                </div>
              </div>

              <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-transform active:scale-95 mb-4 shadow-lg shadow-orange-500/20">
                <ShoppingCart size={20} /> ADD TO CART
              </button>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                  <Truck size={14} className="text-orange-500" /> Free Delivery
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                  <RotateCcw size={14} className="text-orange-500" /> 30-Day Returns
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* REVIEWS SECTION */}
        <section className="mt-24 pt-16 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              <MessageSquare className="text-orange-500" /> REVIEWS & RATINGS
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* ADD REVIEW FORM */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-slate-50 dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800">
                <h3 className="font-black text-sm uppercase tracking-widest mb-4">Rate this product</h3>
                <div className="flex gap-2 mb-6">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button 
                      key={num} 
                      onClick={() => setUserRating(num)}
                      className={`transition-colors ${userRating >= num ? 'text-orange-500' : 'text-slate-300'}`}
                    >
                      <Star size={24} fill={userRating >= num ? "currentColor" : "none"} />
                    </button>
                  ))}
                </div>
                <textarea 
                  placeholder="Share your experience..." 
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-xl outline-none focus:border-orange-500 h-32 mb-4 text-sm"
                />
                <button className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-black py-3 rounded-xl text-xs uppercase tracking-widest transition-all hover:bg-orange-500 hover:text-white">
                  Submit Review
                </button>
              </div>
            </div>

            {/* REVIEW LIST */}
            <div className="lg:col-span-2 space-y-6">
              {reviews.map((rev) => (
                <div key={rev.id} className="border-b border-slate-100 dark:border-slate-800 pb-8">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-slate-900 dark:text-white">{rev.user}</span>
                    <span className="text-xs text-slate-400 font-bold">{rev.date}</span>
                  </div>
                  <div className="flex text-orange-500 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} fill={i < rev.rating ? "currentColor" : "none"} />
                    ))}
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                    {rev.comment}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}