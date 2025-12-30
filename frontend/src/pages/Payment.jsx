import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  MapPin,
  CreditCard,
  ChevronLeft,
  Lock,
  CheckCircle2,
  LocateFixed,
  ShoppingBag,
} from "lucide-react";
import PaymentHeader from "../components/PaymentHeader";
import PaymentFooter from "../components/PaymentFooter";
import { toast } from "react-hot-toast";
import { showSuccess, showError } from "../utils/toast";

export default function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const items = location.state?.items || [];

  const [paymentMode, setPaymentMode] = useState("upi");
  const [formData, setFormData] = useState({
    fullName: "",
    street: "",
    landmark: "",
    city: "",
    pincode: "",
    phone: "",
  });
  const [saveAddress, setSaveAddress] = useState(false);

  // --- CALCULATIONS ---

  // 1. Calculate Total Item Count (Sum of all quantities)
  // ✅ FIX: This ensures "Price (3 items)" shows correctly instead of "Price (1 items)"
  const totalItemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const totalMRP = items.reduce(
    (acc, item) => acc + (item.mrp || item.price) * item.quantity,
    0
  );

  const totalDiscount = items.reduce(
    (acc, item) =>
      acc + ((item.mrp || item.price) - item.price) * item.quantity,
    0
  );

  const subtotal = items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const platformFee = items.length > 0 ? 3 : 0;
  const deliveryFee = subtotal > 500 || items.length === 0 ? 0 : 40;
  const totalPayable = subtotal + platformFee + deliveryFee;

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = () => {
    if (!formData.fullName || !formData.street || !formData.pincode) {
      toast.error("Please fill in the required shipping details");
      return;
    }

    // Logic to send to Backend
    console.log("Order Data:", {
      items,
      address: formData,
      paymentMode,
      totalPayable,
    });
    showSuccess("Order Placed Successfully!");
    // navigate("/order-success");
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#030712]">
        <ShoppingBag size={64} className="text-slate-300 mb-4" />
        <h2 className="text-xl font-bold dark:text-white">
          Your checkout is empty
        </h2>
        <button
          onClick={() => navigate("/")}
          className="mt-4 text-indigo-600 font-bold hover:underline"
        >
          Return to Shop
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#030712] transition-colors font-sans">
      <PaymentHeader />

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-6 mb-8 gap-4">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Checkout
          </h1>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-500 hover:text-orange-600 dark:hover:text-orange-400 text-sm font-bold transition-colors"
          >
            <ChevronLeft size={18} /> Back to Shopping
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* LEFT SIDE: SHIPPING & PAYMENT */}
          <div className="lg:col-span-7 space-y-8">
            {/* 1. Item Summary */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-orange-600">
                  <ShoppingBag size={18} />
                </div>
                <h2 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">
                  Order Summary ({items.length}{" "}
                  {items.length > 1 ? "Items" : "Item"})
                </h2>
              </div>
              <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-contain rounded-lg bg-white"
                    />
                    <div className="flex-1">
                      <h4 className="text-sm font-bold dark:text-white line-clamp-1">
                        {item.name}
                      </h4>
                      <p className="text-[11px] font-bold text-slate-500">
                        QTY: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      {/* ✅ FIX: Showing UNIT Price (item.price), not Total */}
                      <p className="text-sm font-black dark:text-white">
                        ₹{item.price.toLocaleString()}
                      </p>
                      {item.mrp > item.price && (
                        <p className="text-[10px] text-slate-400 line-through">
                          ₹{item.mrp.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Shipping Address */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                    <MapPin size={18} />
                  </div>
                  <h2 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">
                    Shipping Address
                  </h2>
                </div>
              </div>

              <button
                type="button"
                className="bg-indigo-600 m-1 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-bold text-sm mb-6 shadow-sm transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <LocateFixed size={18} />
                "Use my current location"
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ">
                <div className="md:col-span-2">
                  <input
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Full Name (Required)"
                    className="w-full px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 outline-none text-sm dark:text-white font-medium"
                  />
                </div>
                <div className="md:col-span-2">
                  <input
                    name="street"
                    value={formData.street}
                    onChange={handleInputChange}
                    placeholder="Street Address, House No."
                    className="w-full px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 outline-none text-sm dark:text-white font-medium"
                  />
                </div>
                <input
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="City"
                  className="w-full px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 outline-none text-sm dark:text-white font-medium"
                />
                <input
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  maxLength="6"
                  placeholder="Pincode"
                  className="w-full px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 outline-none text-sm dark:text-white font-medium"
                />
              </div>
              <div
                onClick={() => setSaveAddress(!saveAddress)}
                className="flex px-2 mt-2 items-center gap-3 cursor-pointer group pt-2"
              >
                <div
                  className={`
    w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200
    ${
      saveAddress
        ? "bg-indigo-600 border-indigo-600 scale-110"
        : "border-slate-300 dark:border-slate-700 scale-100"
    }
  `}
                >
                  {saveAddress && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
                <span className="text-xs font-bold text-slate-500 uppercase">
                  Save Address
                </span>
              </div>
            </div>

            {/* 3. Payment Method */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                  <CreditCard size={18} />
                </div>
                <h2 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">
                  Payment Method
                </h2>
              </div>
              <div className="space-y-3">
                {["upi", "card", "cod"].map((mode) => (
                  <label
                    key={mode}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      paymentMode === mode
                        ? "border-indigo-600 bg-indigo-50/30 dark:bg-indigo-500/5"
                        : "border-slate-100 dark:border-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          paymentMode === mode
                            ? "border-indigo-600"
                            : "border-slate-300"
                        }`}
                      >
                        {paymentMode === mode && (
                          <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />
                        )}
                      </div>
                      <span className="text-sm font-bold dark:text-white uppercase tracking-tight">
                        {mode === "upi"
                          ? "UPI / Netbanking"
                          : mode === "card"
                          ? "Credit / Debit Card"
                          : "Cash on Delivery"}
                      </span>
                    </div>
                    <input
                      type="radio"
                      className="hidden"
                      checked={paymentMode === mode}
                      onChange={() => setPaymentMode(mode)}
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: PRICE BREAKDOWN */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                <h2 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs">
                  Price Details
                </h2>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex justify-between text-sm font-medium">
                  {/* ✅ FIX: Showing Total Item Count here */}
                  <span className="text-slate-500">
                    Price ({totalItemCount} items)
                  </span>
                  <span className="text-slate-900 dark:text-white">
                    ₹{totalMRP.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-slate-500">Discount</span>
                  <span className="text-green-500">
                    - ₹{totalDiscount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-slate-500">Platform Fee</span>
                  <span className="text-slate-900 dark:text-white">
                    ₹{platformFee}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-medium border-b border-dashed border-slate-200 dark:border-slate-800 pb-4">
                  <span className="text-slate-500">Delivery Charges</span>
                  <span
                    className={
                      deliveryFee === 0
                        ? "text-green-500 font-bold"
                        : "text-slate-900 dark:text-white"
                    }
                  >
                    {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
                  </span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    Total Payable
                  </span>
                  <span className="text-xl font-black text-slate-900 dark:text-white">
                    ₹{totalPayable.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="bg-green-500/10 p-4 mx-6 mb-6 rounded-2xl flex items-center gap-3 border border-green-500/20">
                <CheckCircle2 size={18} className="text-green-500" />
                <p className="text-xs font-bold text-green-600">
                  You will save ₹{totalDiscount.toLocaleString()} on this order
                </p>
              </div>

              <div className="p-6 pt-0">
                <button
                  onClick={handlePlaceOrder}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-xs mb-4"
                >
                  <Lock size={16} /> Place Order Now
                </button>
                <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-bold uppercase">
                  <ShieldCheck size={14} /> 100% Secure Transaction
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
