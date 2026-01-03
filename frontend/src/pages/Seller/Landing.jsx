import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Zap,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  ShoppingBag,
} from "lucide-react";
import SellerNavbar from "../../components/Seller/SellerNavbar";
import SellerFooter from "../../components/Seller/SellerFooter";

export default function SellerLanding() {
  // --- LOGIC: Check Login Status ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if the seller token exists in localStorage
    const token = localStorage.getItem("sellerToken");
    setIsLoggedIn(!!token);

    // Optional: Sync check with session cookie could be added here
  }, []);

  return (
    <div className="bg-white dark:bg-[#030712] min-h-screen transition-colors duration-500 font-sans">
      {/* Updated to pass real login status to Navbar */}
      <SellerNavbar isLoggedIn={isLoggedIn} />

      {/* Hero Section */}
      <section className="py-20 px-6 max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        <div className="animate-in fade-in slide-in-from-left duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-bold uppercase mb-6">
            <Zap size={14} /> Start your business journey
          </div>
          <h1 className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-[1.1] mb-6">
            Sell to Millions <br />
            <span className="text-orange-500">Grow Faster.</span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-md font-medium leading-relaxed">
            Join India's fastest growing marketplace. Low commissions, 24-hour
            payouts, and a dedicated support team to help you scale.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to={isLoggedIn ? "/Seller/Dashboard" : "/Seller/signup"}
              className="inline-flex items-center justify-center gap-3 bg-slate-900 dark:bg-orange-500 text-white px-10 py-4 rounded-2xl font-bold hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-orange-500/20"
            >
              {isLoggedIn ? "Go to Dashboard" : "Start Selling Today"}
              <ArrowRight size={20} />
            </Link>

            {!isLoggedIn && (
              <Link
                to="/Seller/login"
                className="inline-flex items-center justify-center gap-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 px-10 py-4 rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
              >
                Login to Account
              </Link>
            )}
          </div>
        </div>

        <div className="relative animate-in fade-in zoom-in duration-1000">
          {/* Decorative Elements */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />

          <img
            src="https://images.unsplash.com/photo-1556740758-90de374c12ad?w=800"
            className="relative z-10 rounded-[3rem] shadow-2xl border-8 border-white dark:border-slate-800 object-cover aspect-[4/3]"
            alt="Seller managing orders"
          />

          {/* Floating Badge Example */}
          <div className="absolute bottom-10 -left-6 z-20 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 flex items-center gap-3 animate-bounce">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400">
                Daily Sales
              </p>
              <p className="text-sm font-bold dark:text-white">+124% Growth</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="bg-slate-50 dark:bg-slate-900/30 py-24 px-6 border-y border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
              Why Choose ShopEasy?
            </h2>
            <div className="w-20 h-1.5 bg-orange-500 mx-auto rounded-full" />
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <BenefitCard
              icon={<ShieldCheck size={32} />}
              title="Secure Payments"
              desc="Get paid directly into your bank account every 24 hours with automated settlement reports."
            />
            <BenefitCard
              icon={<TrendingUp size={32} />}
              title="Powerful Analytics"
              desc="Track your inventory, sales, and customer behavior with our intuitive seller dashboard."
            />
            <BenefitCard
              icon={<ShoppingBag size={32} />}
              title="Zero Setup Fee"
              desc="No hidden charges. Start listing your products for free and only pay when you make a sale."
            />
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      {!isLoggedIn && (
        <section className="py-20 px-6 text-center">
          <div className="max-w-3xl mx-auto bg-orange-500 rounded-[3rem] p-12 text-white shadow-2xl shadow-orange-500/40">
            <h2 className="text-4xl font-black mb-6 tracking-tight">
              Ready to grow your business?
            </h2>
            <p className="text-orange-50 text-lg mb-10 font-medium">
              It takes less than 10 minutes to set up your shop and start
              selling.
            </p>
            <Link
              to="/Seller/signup"
              className="inline-flex items-center gap-3 bg-white text-orange-500 px-12 py-4 rounded-2xl font-black hover:bg-slate-900 hover:text-white transition-all shadow-lg"
            >
              Get Started Now <ArrowRight size={20} />
            </Link>
          </div>
        </section>
      )}

      <SellerFooter />
    </div>
  );
}

function BenefitCard({ icon, title, desc }) {
  return (
    <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm text-center hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
      <div className="text-orange-500 flex justify-center mb-6">{icon}</div>
      <h3 className="text-xl font-black dark:text-white mb-2 tracking-tight">
        {title}
      </h3>
      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed">
        {desc}
      </p>
    </div>
  );
}
