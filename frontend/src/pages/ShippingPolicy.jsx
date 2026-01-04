import React, { useEffect } from "react";
import { Link } from "react-router-dom";
// import { Navbar } from "../components/PaymentHeader";
import { 
  Truck, 
  Clock, 
  ShieldCheck, 
  Globe, 
  AlertCircle, 
  ArrowLeft,
  CheckCircle2
} from "lucide-react";

const ShippingPolicy = () => {
  // Ensure the page starts at the top when loaded
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#030712] transition-colors duration-500">
      {/* --- HEADER SECTION --- */}
      <div className="bg-white dark:bg-[#030712] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-sm font-medium text-orange-500 hover:gap-3 transition-all mb-6"
          >
            <ArrowLeft size={16} /> Back to Shopping
          </Link>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Shipping <span className="text-orange-500">Policy</span>
          </h1>
          <p className="mt-4 text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            Transparent shipping. No hidden costs. Just your favorite products delivered to your door.
          </p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* --- LEFT COLUMN: CORE POLICIES --- */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* Simple Shipping Rules */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <Truck className="text-orange-500" size={24} />
                <h2 className="text-xl font-bold dark:text-white">Shipping Rates</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-white dark:bg-slate-900 border-2 border-orange-500 rounded-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-lg uppercase tracking-widest">
                    Recommended
                  </div>
                  <h3 className="text-lg font-bold dark:text-white mb-1">Orders ₹400 or more</h3>
                  <p className="text-3xl font-black text-orange-500 mb-2">FREE</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Standard delivery across India at no extra cost.</p>
                </div>

                <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <h3 className="text-lg font-bold dark:text-white mb-1">Orders below ₹400</h3>
                  <p className="text-3xl font-black text-slate-900 dark:text-white mb-2">₹50</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Flat shipping fee applied at checkout.</p>
                </div>
              </div>
            </section>

            {/* Processing Time */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Clock className="text-orange-500" size={24} />
                <h2 className="text-xl font-bold dark:text-white">Delivery Timeline</h2>
              </div>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="shrink-0 w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center text-orange-600 font-bold text-sm">1</div>
                  <div>
                    <p className="font-bold dark:text-white">Order Processing</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Your order is packed and ready within 24-48 hours.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="shrink-0 w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center text-orange-600 font-bold text-sm">2</div>
                  <div>
                    <p className="font-bold dark:text-white">Transit Time</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Usually takes 3-5 business days depending on your location.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Tracking Confirmation */}
            <section className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="text-orange-500" size={24} />
                <h2 className="text-xl font-bold dark:text-white">Secure Tracking</h2>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm mb-4">
                Once your order is dispatched, we send a tracking link to your registered email and phone number.
              </p>
              <Link 
                to="/account?tab=orders" 
                className="inline-flex items-center gap-2 text-sm font-bold text-orange-500 hover:gap-3 transition-all"
              >
                Track your live order now <CheckCircle2 size={16} />
              </Link>
            </section>

          </div>

          {/* --- RIGHT COLUMN: QUICK INFO --- */}
          <div className="space-y-6">
            <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <Globe className="text-orange-500 mb-4" size={28} />
              <h3 className="font-bold dark:text-white mb-2 text-sm uppercase tracking-wider">Service Area</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                We currently deliver to over 19,000+ pin codes across India. International shipping is currently unavailable.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <AlertCircle className="text-orange-500 mb-4" size={28} />
              <h3 className="font-bold dark:text-white mb-2 text-sm uppercase tracking-wider">Note</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Delivery times may vary during festivals or extreme weather conditions. We appreciate your patience.
              </p>
            </div>

            <div className="p-8 bg-orange-500 rounded-3xl text-white shadow-xl shadow-orange-500/20">
              <h3 className="font-bold text-lg mb-2">Need Assistance?</h3>
              <p className="text-xs text-orange-100 mb-6">
                Our logistics team is here to help you with any delivery issues.
              </p>
              <Link 
                to="/contact" 
                className="block text-center py-3 bg-white text-orange-600 rounded-xl font-bold text-sm hover:scale-105 transition-transform"
              >
                Contact Us
              </Link>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default ShippingPolicy;