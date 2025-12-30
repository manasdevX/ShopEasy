import React, { useState, useEffect } from "react";
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
  Loader2,
} from "lucide-react";
import PaymentHeader from "../components/PaymentHeader";
import PaymentFooter from "../components/PaymentFooter";
import { toast } from "react-hot-toast";
import { showSuccess, showError } from "../utils/toast";

const API_URL = import.meta.env.VITE_API_URL;

export default function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const items = location.state?.items || [];

  const [paymentMode, setPaymentMode] = useState("upi");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    street: "",
    landmark: "",
    city: "",
    pincode: "",
    phone: "",
    country: "India", // Defaulting for schema validation
  });
  const [saveAddress, setSaveAddress] = useState(false);

  // --- CALCULATIONS ---
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

  // ================= GEOLOCATION HANDLER =================
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          if (data && data.address) {
            setFormData((prev) => ({
              ...prev,
              street:
                data.display_name.split(",")[0] +
                ", " +
                (data.address.suburb || ""),
              city: data.address.city || data.address.town || "",
              pincode: data.address.postcode || "",
            }));
            showSuccess("Location detected!");
          }
        } catch (error) {
          showError("Failed to fetch address details");
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setIsLocating(false);
        showError("Location access denied.");
      }
    );
  };

  // ================= RAZORPAY INTEGRATION =================
  const handlePayment = async () => {
    // 1. Validation
    if (
      !formData.fullName ||
      !formData.street ||
      !formData.pincode ||
      !formData.phone
    ) {
      toast.error("Please fill in all required shipping details");
      return;
    }

    setIsProcessing(true);

    try {
      const token = localStorage.getItem("token");

      // 2. Create Order on Backend
      const res = await fetch(`${API_URL}/api/payment/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: totalPayable }),
      });

      const orderData = await res.json();

      if (!res.ok) {
        throw new Error(orderData.message || "Failed to create order");
      }

      // 3. Configure Razorpay Options
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.order.amount,
        currency: "INR",
        name: "ShopEasy",
        description: `Payment for ${totalItemCount} items`,
        order_id: orderData.order.id,
        handler: async function (response) {
          try {
            // 4. Verify Payment on Backend
            // Mapping fields to match Order Model schema exactly
            const verifyRes = await fetch(
              `${API_URL}/api/payment/verify-payment`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  orderItems: items,
                  shippingAddress: formData,
                  itemsPrice: subtotal,
                  taxPrice: platformFee,
                  shippingPrice: deliveryFee,
                  totalPrice: totalPayable,
                }),
              }
            );

            const verifyData = await verifyRes.json();

            if (verifyRes.ok) {
              showSuccess("Order Placed Successfully!");
              localStorage.removeItem("cart");
              window.dispatchEvent(new Event("cartUpdated"));
              navigate("/account");
            } else {
              showError(verifyData.message || "Order saving failed");
            }
          } catch (err) {
            showError("Error verifying payment");
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: formData.fullName,
          contact: formData.phone,
        },
        theme: {
          color: "#4f46e5",
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Payment Error:", error);
      showError(error.message || "An error occurred during checkout");
      setIsProcessing(false);
    }
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
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-orange-600">
                  <ShoppingBag size={18} />
                </div>
                <h2 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">
                  Order Summary ({totalItemCount}{" "}
                  {totalItemCount > 1 ? "Items" : "Item"})
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
                <button
                  onClick={handleUseCurrentLocation}
                  disabled={isLocating}
                  className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 text-xs font-bold uppercase transition-colors disabled:opacity-50"
                >
                  {isLocating ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <LocateFixed size={14} />
                  )}
                  Detect Location
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Mobile Number (Required)"
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
            </div>

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
                {[
                  { id: "upi", label: "Online Payment (Razorpay)" },
                  { id: "card", label: "Credit / Debit Card (Razorpay)" },
                  { id: "cod", label: "Cash on Delivery" },
                ].map((mode) => (
                  <label
                    key={mode.id}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      paymentMode === mode.id
                        ? "border-indigo-600 bg-indigo-50/30 dark:bg-indigo-500/5"
                        : "border-slate-100 dark:border-slate-800"
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
                      <span className="text-sm font-bold dark:text-white uppercase tracking-tight">
                        {mode.label}
                      </span>
                    </div>
                    <input
                      type="radio"
                      className="hidden"
                      checked={paymentMode === mode.id}
                      onChange={() => setPaymentMode(mode.id)}
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                <h2 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs">
                  Price Details
                </h2>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex justify-between text-sm font-medium">
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
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-xs mb-4"
                >
                  {isProcessing ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      <Lock size={16} /> Place Order Now
                    </>
                  )}
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
