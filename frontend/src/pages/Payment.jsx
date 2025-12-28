import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  MapPin,
  CreditCard,
  ChevronLeft,
  Lock,
  Info,
  CheckCircle2,
  LocateFixed,
} from "lucide-react";
import PaymentHeader from "../components/PaymentHeader";
import PaymentFooter from "../components/PaymentFooter";

export default function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { product, quantity } = location.state || {};

  const [paymentMode, setPaymentMode] = useState("upi");
  const [address, setAddress] = useState("");

  // Logic for calculations
  const price = product?.price || 0;
  const mrp = product?.mrp || price;
  const totalMRP = mrp * quantity;
  const totalDiscount = (mrp - price) * quantity;
  const platformFee = 3;
  const deliveryFee = price * quantity > 500 ? 0 : 40;
  const totalPayable = price * quantity + platformFee + deliveryFee;

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <button
          onClick={() => navigate("/")}
          className="text-indigo-600 font-bold"
        >
          Return to Shop
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#030712] transition-colors">
      <PaymentHeader />

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-6 mb-2">
          <h1 className="text-5xl font-bold text-slate-900 dark:text-white tracking-tight">
            Checkout
          </h1>
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:hover:text-white mb-8 text-sm font-semibold transition-colors"
          >
            <ChevronLeft size={18} /> Back to Product
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* LEFT SIDE: INPUTS (8 Columns) */}
          <div className="lg:col-span-7 space-y-8">
            {/* Section 1: Shipping Address */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                    <MapPin size={18} />
                  </div>
                  <h2 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-sm">
                    Shipping Address
                  </h2>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                  Required
                </span>
              </div>

              <button
                type="button"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-bold text-sm mb-6 shadow-sm transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <LocateFixed size={18} />
                Use my current location
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[11px] font-black text-slate-500 uppercase ml-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                  />
                </div>

                {/* Street Address */}
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[11px] font-black text-slate-500 uppercase ml-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    placeholder="House No, Building Name, Street"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                  />
                </div>

                {/* Landmark (Optional) */}
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[11px] font-black text-slate-400 uppercase ml-1">
                    Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Near City Hospital"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                  />
                </div>

                {/* City */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-500 uppercase ml-1">
                    City
                  </label>
                  <input
                    type="text"
                    placeholder="City"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                  />
                </div>

                {/* Pincode */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-500 uppercase ml-1">
                    Pincode
                  </label>
                  <input
                    type="text"
                    maxLength="6"
                    placeholder="6-digit Pincode"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Payment Mode */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                  <CreditCard size={18} />
                </div>
                <h2 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-sm">
                  Payment Method
                </h2>
              </div>

              <div className="space-y-3">
                {[
                  {
                    id: "upi",
                    label: "UPI / Netbanking",
                    desc: "Pay using PhonePe, Google Pay or Bank",
                  },
                  {
                    id: "card",
                    label: "Credit / Debit Card",
                    desc: "All major cards accepted",
                  },
                  {
                    id: "cod",
                    label: "Cash on Delivery",
                    desc: "Pay when you receive the product",
                  },
                ].map((mode) => (
                  <label
                    key={mode.id}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      paymentMode === mode.id
                        ? "border-indigo-600 bg-indigo-50/30 dark:bg-indigo-500/5"
                        : "border-slate-100 dark:border-slate-800 hover:border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          paymentMode === mode.id
                            ? "border-indigo-600"
                            : "border-slate-300"
                        }`}
                      >
                        {paymentMode === mode.id && (
                          <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-900 dark:text-white">
                          {mode.label}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {mode.desc}
                        </p>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="payment"
                      className="hidden"
                      checked={paymentMode === mode.id}
                      onChange={() => setPaymentMode(mode.id)}
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: PRICE DETAILS (5 Columns) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                <h2 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs">
                  Price Details
                </h2>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">
                    Price ({quantity} items)
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    ₹{totalMRP.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Discount</span>
                  <span className="font-semibold text-green-500">
                    - ₹{totalDiscount.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    Platform Fee <Info size={12} />
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    ₹{platformFee}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Delivery Charges</span>
                  <span
                    className={`font-semibold ${
                      deliveryFee === 0
                        ? "text-green-500"
                        : "text-slate-900 dark:text-white"
                    }`}
                  >
                    {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
                  </span>
                </div>

                <div className="pt-4 mt-4 border-t border-dashed border-slate-200 dark:border-slate-800 flex justify-between">
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    Total Payable
                  </span>
                  <span className="text-lg font-black text-slate-900 dark:text-white">
                    ₹{totalPayable.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Savings Message */}
              <div className="bg-green-500/5 dark:bg-green-500/10 p-4 mx-6 mb-6 rounded-2xl flex items-center gap-3 border border-green-500/20">
                <CheckCircle2 size={18} className="text-green-500" />
                <p className="text-xs font-bold text-green-600">
                  Your Total Savings on this order ₹
                  {totalDiscount.toLocaleString()}
                </p>
              </div>

              {/* Secure Call to Action */}
              <div className="p-6 pt-0">
                <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-widest text-xs mb-4">
                  <Lock size={16} /> Place Order Now
                </button>
                <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                  <ShieldCheck size={14} /> 256-Bit SSL Secure Checkout
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
        <PaymentFooter />
    </div>
  );
}
