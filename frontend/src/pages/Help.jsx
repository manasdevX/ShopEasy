import React from "react";
import { Search, Package, CreditCard, RefreshCcw, Truck, MessageSquare, ExternalLink } from "lucide-react";
import Navbar from "../components/PaymentHeader";
import Footer from "../components/PaymentFooter";

export default function Help() {
  const categories = [
    { icon: <Package size={24} />, title: "Orders", desc: "Shipping & Fulfillment" },
    { icon: <CreditCard size={24} />, title: "Payments", desc: "Taxes & Payouts" },
    { icon: <RefreshCcw size={24} />, title: "Returns", desc: "Refunds & Disputes" },
    { icon: <Truck size={24} />, title: "Delivery", desc: "Carrier Partners" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#030712]">
      <Navbar />
      
      {/* Hero Section */}
      <div className="bg-slate-900 dark:bg-slate-950 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-black text-white mb-8">Seller Help Center</h1>
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search for articles, guides..."
              className="w-full h-16 bg-white dark:bg-slate-900 rounded-2xl pl-14 pr-6 text-slate-900 dark:text-white font-medium shadow-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/20 transition-all"
            />
          </div>
        </div>
      </div>

      <main className="flex-grow max-w-6xl w-full mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {categories.map((cat, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 hover:border-orange-500/50 transition-all cursor-pointer group shadow-sm hover:shadow-xl">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-orange-500 group-hover:text-white transition-all">
                {cat.icon}
              </div>
              <h3 className="font-black text-slate-900 dark:text-white mb-1">{cat.title}</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">{cat.desc}</p>
            </div>
          ))}
        </div>

        {/* Contact Section */}
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Still need assistance?</h2>
            <p className="text-slate-500 dark:text-slate-400">Our support team is available 24/7 for dedicated seller support.</p>
          </div>
          <button className="flex items-center gap-3 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-2xl font-black text-sm transition-all shadow-lg shadow-orange-500/20">
            <MessageSquare size={18} /> Contact Support
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}