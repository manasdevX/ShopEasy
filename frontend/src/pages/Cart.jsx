import React, { useState, useEffect } from "react";
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  ChevronLeft,
  Loader2,
  ImageOff,
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { showError, showSuccess } from "../utils/toast";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_URL = BASE_URL.startsWith("http") ? BASE_URL : `http://${BASE_URL}`;

export default function Cart() {
  const navigate = useNavigate();
  const location = useLocation();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const token = localStorage.getItem("token");
  const isLoggedIn = !!token;

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("data:")) return imagePath;
    if (imagePath.startsWith("http")) return imagePath;
    const cleanPath = imagePath.startsWith("/") ? imagePath.substring(1) : imagePath;
    return `${API_URL}/${cleanPath}`;
  };

  useEffect(() => {
    const fetchCart = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/cart`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          const validItems = data.items?.filter((item) => item.product) || [];
          setCartItems(validItems);
        }
      } catch (error) {
        showError("Could not load your cart");
      }
      setLoading(false);
    };
    if (isLoggedIn) fetchCart();
    else setLoading(false);
  }, [isLoggedIn, token]);

  const handleUpdateQuantity = async (productId, currentQty, delta) => {
    const newQty = currentQty + delta;
    if (newQty < 1) return;
    setUpdating(true);
    try {
      const res = await fetch(`${API_URL}/api/cart/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity: newQty }),
      });
      if (res.ok) {
        setCartItems((prev) =>
          prev.map((item) => (item.product._id === productId ? { ...item, quantity: newQty } : item))
        );
        window.dispatchEvent(new Event("cartUpdated"));
      }
    } catch (err) {
      showError("Server connection error");
    }
    setUpdating(false);
  };

  const handleRemoveItem = async (productId) => {
    try {
      const res = await fetch(`${API_URL}/api/cart/${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setCartItems((prev) => prev.filter((item) => item.product._id !== productId));
        showSuccess("Item removed");
        window.dispatchEvent(new Event("cartUpdated"));
      }
    } catch (err) {
      showError("Server Error");
    }
  };

  // --- DELIVERY CALCULATIONS ---
  const subtotal = cartItems.reduce((acc, item) => acc + (item.product?.price || 0) * item.quantity, 0);
  const FREE_SHIPPING_THRESHOLD = 400;
  const SHIPPING_FEE = 50;
  
  // Logic: 50 charge if total < 400, else FREE
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD || cartItems.length === 0 ? 0 : SHIPPING_FEE;
  const total = subtotal + shipping;
  const amountToFreeShipping = FREE_SHIPPING_THRESHOLD - subtotal;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#030712]">
        <Loader2 className="animate-spin text-orange-500" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#030712] flex flex-col transition-colors duration-300">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto w-full px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">Your Cart</h1>
            <p className="text-slate-500 text-sm font-medium mt-1">{cartItems.length} items</p>
          </div>
          <Link to="/" className="text-sm font-bold text-orange-500 flex items-center gap-2 hover:underline">
            <ChevronLeft size={16} /> Continue Shopping
          </Link>
        </div>

        {cartItems.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* LEFT: CART ITEMS & PROGRESS BOX */}
            <div className="lg:col-span-2 space-y-4">
              
              {/* DELIVERY CONDITION PROGRESS BOX */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl shadow-sm mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                    {subtotal < FREE_SHIPPING_THRESHOLD 
                      ? `Add ₹${amountToFreeShipping} more for FREE delivery` 
                      : "You've earned FREE delivery!"}
                  </h4>
                  <span className="text-xs font-bold text-orange-500">Goal: ₹{FREE_SHIPPING_THRESHOLD}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-orange-500 h-full transition-all duration-500 ease-out"
                    style={{ width: `${Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-3 tracking-widest">
                  Orders below ₹400 incur a ₹50 delivery fee
                </p>
              </div>

              {cartItems.map((item) => (
  <div 
    key={item.product._id} 
    className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl flex gap-6 items-center group transition-all hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none"
  >
    {/* 1. IMAGE LINK */}
    <Link
      to={`/product/${item.product._id}`}
      className="w-24 h-24 rounded-xl overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center border border-slate-100 dark:border-slate-800"
    >
      {getImageUrl(item.product.thumbnail || item.product.images?.[0]) ? (
        <img
          src={getImageUrl(item.product.thumbnail || item.product.images?.[0])}
          alt={item.product.name}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
      ) : (
        <ImageOff size={24} className="text-slate-300" />
      )}
    </Link>

    <div className="flex-grow">
      <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">
        {item.product.category || "General"}
      </span>
      
      {/* 2. TITLE LINK */}
      <Link to={`/product/${item.product._id}`}>
        <h3 className="font-bold text-slate-900 dark:text-white text-lg line-clamp-1 group-hover:text-orange-500 transition-colors">
          {item.product.name}
        </h3>
      </Link>
      
      <p className="text-slate-500 text-sm font-bold mt-1">
        ₹{item.product.price?.toLocaleString()}
      </p>
    </div>

    {/* QUANTITY CONTROLS */}
    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
      <button
        onClick={() => handleUpdateQuantity(item.product._id, item.quantity, -1)}
        disabled={updating || item.quantity <= 1}
        className="p-1 hover:text-orange-500 transition-colors dark:text-slate-400 disabled:opacity-30"
      >
        <Minus size={16} />
      </button>
      <span className="w-8 text-center font-black text-sm dark:text-white">
        {item.quantity}
      </span>
      <button
        onClick={() => handleUpdateQuantity(item.product._id, item.quantity, 1)}
        disabled={updating}
        className="p-1 hover:text-orange-500 transition-colors dark:text-slate-400"
      >
        <Plus size={16} />
      </button>
    </div>

    {/* DELETE BUTTON */}
    <button
      onClick={() => handleRemoveItem(item.product._id)}
      className="p-2 text-slate-300 hover:text-red-500 transition-colors"
    >
      <Trash2 size={20} />
    </button>
  </div>
))}
            </div>

            {/* RIGHT: ORDER SUMMARY */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-8 sticky top-28 shadow-sm">
                <h2 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white mb-6 uppercase">Order Summary</h2>
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-slate-500 font-medium">
                    <span>Subtotal</span>
                    <span className="text-slate-900 dark:text-white">₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 font-medium">
                    <span>Delivery Fee</span>
                    <span className={shipping === 0 ? "text-green-500 font-bold" : "text-slate-900 dark:text-white"}>
                      {shipping === 0 ? "FREE" : `₹${shipping}`}
                    </span>
                  </div>
                  <div className="h-[1px] bg-slate-100 dark:bg-slate-800 my-2" />
                  <div className="flex justify-between items-end">
                    <span className="text-lg font-black dark:text-white">Total</span>
                    <span className="text-2xl font-black text-orange-500">₹{total.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const itemsToCheckout = cartItems.map((item) => ({
                      _id: item.product._id,
                      name: item.product.name,
                      price: item.product.price,
                      quantity: item.quantity,
                      seller: item.product.seller,
                      image: getImageUrl(item.product.thumbnail || item.product.images?.[0]),
                    }));
                    navigate("/payment", { state: { items: itemsToCheckout, shippingCharge: shipping } });
                  }}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-orange-500/20 transition-all hover:-translate-y-1"
                >
                  CHECKOUT NOW <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
            <ShoppingBag className="text-slate-300 mx-auto mb-6" size={64} />
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Your cart is empty</h2>
            <Link to="/" className="mt-8 bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-8 py-3 rounded-xl font-bold inline-block">Start Shopping</Link>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}