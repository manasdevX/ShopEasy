import React from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  CheckCircle2,
  Package,
  Truck,
  ArrowRight,
  Home,
  Download,
  ShoppingBag,
  MapPin,
  ExternalLink,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function OrderSuccess() {
  const navigate = useNavigate();
  const location = useLocation();

  // Data passed from CheckoutPage.jsx
  // Handles both Razorpay structure (state.order) and COD structure (state)
  const order = location.state?.order || location.state;

  if (!order) {
    return (
      <div className="min-h-screen bg-[#030712] text-white flex flex-col items-center justify-center font-sans">
        <ShoppingBag size={64} className="text-slate-700 mb-4" />
        <h2 className="text-2xl font-bold mb-4">No Order Found</h2>
        <Link
          to="/"
          className="bg-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-500 transition-colors"
        >
          Return to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-white font-sans">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-12 lg:py-20">
        {/* Success Header */}
        <div className="text-center mb-12 animate-in fade-in zoom-in duration-700">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 mb-6">
            <CheckCircle2 size={48} className="text-green-500" />
          </div>
          <h1 className="text-4xl font-black tracking-tight mb-3">
            Order Placed Successfully!
          </h1>
          <p className="text-slate-400">
            Thank you for your purchase. Your order has been received and is
            being processed.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* 1. Order Summary Card */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Package size={20} className="text-blue-500" />
              </div>
              <h3 className="font-bold uppercase text-xs tracking-widest text-slate-300">
                Order Information
              </h3>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Order ID</span>
                <span className="font-mono font-bold text-orange-500 tracking-tighter">
                  {order._id || order.orderId}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total Amount</span>
                <span className="font-bold text-white text-lg">
                  ₹{order.totalPrice?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Payment Method</span>
                <span className="text-blue-400 font-bold uppercase text-[10px] bg-blue-500/10 px-2 py-1 rounded">
                  {order.paymentMethod}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Payment Status</span>
                <span
                  className={
                    order.isPaid
                      ? "text-green-500 font-bold"
                      : "text-orange-500 font-bold"
                  }
                >
                  {order.isPaid ? "Paid" : "Pending (COD)"}
                </span>
              </div>
            </div>

            {/* Clickable Item List */}
            <div className="mt-6 pt-6 border-t border-slate-800">
              <h4 className="text-[10px] font-black uppercase text-slate-500 mb-3 tracking-widest">
                Items Purchased
              </h4>
              <div className="space-y-4">
                {order.orderItems?.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      {/* Clickable Thumbnail */}
                      <Link
                        to={`/product/${item.product}`}
                        className="w-12 h-12 bg-black rounded-lg overflow-hidden border border-slate-800 hover:border-orange-500 transition-colors shrink-0"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </Link>

                      <div className="flex flex-col">
                        {/* Clickable Name */}
                        <Link
                          to={`/product/${item.product}`}
                          className="text-xs font-bold text-slate-300 hover:text-orange-500 transition-colors line-clamp-1 flex items-center gap-1"
                        >
                          {item.name}{" "}
                          <ExternalLink
                            size={10}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          />
                        </Link>
                        <span className="text-[10px] text-slate-500 font-medium">
                          Price: ₹{item.price?.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-slate-400 block">
                        x{item.qty}
                      </span>
                      <span className="text-[10px] font-bold text-white">
                        ₹{(item.price * item.qty).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Shipping Details Card */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Truck size={20} className="text-purple-500" />
              </div>
              <h3 className="font-bold uppercase text-xs tracking-widest text-slate-300">
                Delivery Details
              </h3>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex gap-3">
                <MapPin size={16} className="text-slate-500 shrink-0" />
                <div>
                  <p className="text-sm text-white font-bold mb-1">
                    Shipping Address
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {order.shippingAddress?.address} <br />
                    {order.shippingAddress?.city},{" "}
                    {order.shippingAddress?.postalCode} <br />
                    {order.shippingAddress?.country || "India"}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-black/30 rounded-2xl p-4 border border-slate-800/50">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">
                Estimated Delivery
              </span>
              <span className="text-sm font-bold text-slate-200">
                3-5 Business Days
              </span>
            </div>

            <div className="mt-8">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
              >
                <Download size={14} /> Download Invoice PDF
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            to="/account"
            state={{ activeTab: "orders" }} // ✅ FIXED: Redirects to Orders Tab
            className="w-full sm:w-auto px-10 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-500 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-blue-600/20 uppercase text-xs tracking-widest"
          >
            Track My Order <ArrowRight size={18} />
          </Link>

          <Link
            to="/"
            className="w-full sm:w-auto px-10 py-4 bg-slate-900 border border-slate-800 text-white font-black rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 active:scale-95 uppercase text-xs tracking-widest"
          >
            <Home size={18} /> Back to Shopping
          </Link>
        </div>

        <p className="text-center text-slate-600 text-[10px] font-bold uppercase tracking-widest mt-16">
          Order Confirmation sent to your registered email
        </p>
      </main>

      <Footer />
    </div>
  );
}
