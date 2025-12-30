import React from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { 
  CheckCircle2, 
  Package, 
  Truck, 
  ArrowRight, 
  Home, 
  Download,
  ShoppingBag
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function OrderSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Data passed from the checkout process via navigate('/order-success', { state: { orderData } })
  const orderData = location.state?.orderData || {
    orderId: "ORD-" + Math.random().toString(36).toUpperCase().substring(2, 10),
    amount: "0.00",
    items: [],
    address: "Not provided",
    estimatedDelivery: "3-5 Business Days"
  };

  return (
    <div className="min-h-screen bg-[#030712] text-white font-sans">
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 py-12 lg:py-20">
        {/* Success Header */}
        <div className="text-center mb-12 animate-in fade-in zoom-in duration-700">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 mb-6">
            <CheckCircle2 size={48} className="text-green-500" />
          </div>
          <h1 className="text-4xl font-black tracking-tight mb-3">Payment Successful!</h1>
          <p className="text-slate-400">
            Thank you for your purchase. Your order has been received and is being processed.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          
          {/* Order Details Card */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Package size={20} className="text-blue-500" />
              </div>
              <h3 className="font-bold">Order Summary</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Order ID</span>
                <span className="font-mono font-bold text-orange-500">{orderData.orderId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Amount Paid</span>
                <span className="font-bold text-white">₹{orderData.amount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Payment Status</span>
                <span className="text-green-500 font-medium">Completed</span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800">
               <button 
                 onClick={() => window.print()}
                 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors"
               >
                 <Download size={14} /> Download Invoice
               </button>
            </div>
          </div>

          {/* Shipping Details Card */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Truck size={20} className="text-purple-500" />
              </div>
              <h3 className="font-bold">Shipping To</h3>
            </div>
            
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              {orderData.address}
            </p>

            <div className="bg-black/30 rounded-2xl p-4 border border-slate-800/50">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">
                Estimated Delivery
              </span>
              <span className="text-sm font-bold text-slate-200">
                {orderData.estimatedDelivery}
              </span>
            </div>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link 
            to="/account"
            className="w-full sm:w-auto px-8 py-4 bg-blue-500 text-white font-bold rounded-2xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            Track Order <ArrowRight size={18} />
          </Link>
          
          <Link 
            to="/"
            className="w-full sm:w-auto px-8 py-4 bg-slate-900 border border-slate-800 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <Home size={18} /> Back to Home
          </Link>
        </div>

        {/* Support Footer */}
        <p className="text-center text-slate-600 text-xs mt-16">
          Having trouble? <Link to="/support" className="text-blue-500 hover:underline">Contact our support team</Link>
        </p>
      </main>

      <Footer />
    </div>
  );
}