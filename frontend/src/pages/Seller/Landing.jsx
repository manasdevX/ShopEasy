import React from "react";
import { Link } from "react-router-dom";
import { Zap, ShieldCheck, TrendingUp, ArrowRight, ShoppingBag } from "lucide-react";
import SellerNavbar from "../../components/Seller/SellerNavbar";
import SellerFooter from "../../components/Seller/SellerFooter";


export default function SellerLanding() {
  return (
    <div className="bg-white dark:bg-[#030712] min-h-screen transition-colors duration-500">
      <SellerNavbar isLoggedIn={false} />
      
      {/* Hero Section */}
      <section className="py-20 px-6 max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-bold uppercase mb-6">
            <Zap size={14} /> Start your business journey
          </div>
          <h1 className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-[1.1] mb-6">
            Sell to Millions <br />
            <span className="text-orange-500">Grow Faster.</span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-md">
            Join India's fastest growing marketplace. Low commissions, 24-hour payouts, and a dedicated support team.
          </p>
          <Link to="/Seller/login" className="inline-flex items-center gap-3 bg-slate-900 dark:bg-orange-500 text-white px-10 py-4 rounded-2xl font-bold hover:scale-105 transition-all shadow-2xl shadow-orange-500/20">
            Start Selling Today <ArrowRight size={20} />
          </Link>
        </div>
        <div className="relative">
          <img 
            src="https://images.unsplash.com/photo-1556740758-90de374c12ad?w=800" 
            className="rounded-[3rem] shadow-2xl border-8 border-white dark:border-slate-800" 
            alt="Seller" 
          />
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="bg-slate-50 dark:bg-slate-900/30 py-20 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
          <BenefitCard icon={<ShieldCheck size={32}/>} title="Secure Payments" desc="Get paid directly into your bank account every 24 hours." />
          <BenefitCard icon={<TrendingUp size={32}/>} title="Powerful Analytics" desc="Track your sales and growth with our advanced dashboard." />
          <BenefitCard icon={<ShoppingBag size={32}/>} title="Zero Setup Fee" desc="Start listing your products for free with no hidden charges." />
        </div>
      </section>

      <SellerFooter />
    </div>
  );
}

function BenefitCard({ icon, title, desc }) {
  return (
    <div className="bg-white dark:bg-[#030712] p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm text-center">
      <div className="text-orange-500 flex justify-center mb-6">{icon}</div>
      <h3 className="text-xl font-black dark:text-white mb-2">{title}</h3>
      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed">{desc}</p>
    </div>
  );
}