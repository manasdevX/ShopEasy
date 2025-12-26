import React, { useState } from "react";
import { 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  ArrowRight, 
  ChevronLeft 
} from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function Cart() {
  // 1. DUMMY DATA
  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      name: "Premium Wireless Headphones",
      price: 299.99,
      quantity: 1,
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80",
      category: "Electronics"
    },
    {
      id: 2,
      name: "Minimalist Leather Watch",
      price: 150.00,
      quantity: 2,
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80",
      category: "Accessories"
    }
  ]);

  // 2. LOGIC HANDLERS
  const updateQuantity = (id, delta) => {
    setCartItems(prev => prev.map(item => 
      item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    ));
  };

  const removeItem = (id) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const shipping = subtotal > 500 ? 0 : 15.00;
  const total = subtotal + shipping;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#030712] transition-colors duration-300 flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto w-full px-6 py-12">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">
              YOUR CART
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-1">
              {cartItems.length} items in your bag
            </p>
          </div>
          <Link to="/" className="text-sm font-bold text-orange-500 flex items-center gap-2 hover:underline">
            <ChevronLeft size={16} /> Continue Shopping
          </Link>
        </div>

        {cartItems.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* ITEM LIST (Left) */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl flex gap-6 items-center group transition-all hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none">
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>

                  <div className="flex-grow">
                    <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">
                      {item.category}
                    </span>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                      {item.name}
                    </h3>
                    <p className="text-slate-500 text-sm font-bold mt-1">${item.price.toFixed(2)}</p>
                  </div>

                  {/* QUANTITY CONTROLS */}
                  <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    <button 
                      onClick={() => updateQuantity(item.id, -1)}
                      className="p-1 hover:text-orange-500 transition-colors dark:text-slate-400"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-8 text-center font-black text-sm dark:text-white">
                      {item.quantity}
                    </span>
                    <button 
                      onClick={() => updateQuantity(item.id, 1)}
                      className="p-1 hover:text-orange-500 transition-colors dark:text-slate-400"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  <button 
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>

            {/* SUMMARY (Right) */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-8 sticky top-28">
                <h2 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white mb-6">
                  ORDER SUMMARY
                </h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-slate-500 font-medium">
                    <span>Subtotal</span>
                    <span className="text-slate-900 dark:text-white">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 font-medium">
                    <span>Estimated Shipping</span>
                    <span className="text-slate-900 dark:text-white">
                      {shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="h-[1px] bg-slate-100 dark:bg-slate-800 my-2" />
                  <div className="flex justify-between items-end">
                    <span className="text-lg font-black dark:text-white">Total</span>
                    <span className="text-2xl font-black text-orange-500">${total.toFixed(2)}</span>
                  </div>
                </div>

                <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-orange-500/20 transition-all hover:-translate-y-1">
                  CHECKOUT NOW <ArrowRight size={20} />
                </button>

                <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest mt-6">
                  Secure Checkout Guaranteed
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* EMPTY STATE */
          <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
            <div className="bg-slate-50 dark:bg-slate-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="text-slate-300" size={32} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Your cart is empty</h2>
            <p className="text-slate-500 mt-2 mb-8">Looks like you haven't added anything yet.</p>
            <Link to="/" className="bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-8 py-3 rounded-xl font-bold transition-transform hover:scale-105 inline-block">
              Start Shopping
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}