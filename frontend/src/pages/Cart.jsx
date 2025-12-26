import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import {
  Trash2,
  Minus,
  Plus,
  ShoppingBag,
  ArrowRight,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL;

export default function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const isLoggedIn = !!token;

  // --- Fetch Cart Data ---
  const fetchCart = async () => {
    setLoading(true);
    try {
      if (isLoggedIn) {
        // PRODUCTION: Fetch from MongoDB
        const res = await fetch(`${API_URL}/api/cart`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          // Flatten items for easier UI rendering
          const items = data.items.map((item) => ({
            ...item.product,
            quantity: item.quantity,
          }));
          setCartItems(items);
        }
      } else {
        // GUEST: Fetch from LocalStorage
        const savedCart = JSON.parse(localStorage.getItem("cart")) || [];
        setCartItems(savedCart);
      }
    } catch (err) {
      toast.error("Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [isLoggedIn]);

  // --- Update Quantity ---
  const updateQuantity = async (productId, delta) => {
    // Optimistic UI update
    const updatedItems = cartItems.map((item) => {
      if (item._id === productId) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    });
    setCartItems(updatedItems);

    if (isLoggedIn) {
      try {
        // PRODUCTION: Sync with MongoDB
        const newQty = updatedItems.find((i) => i._id === productId).quantity;
        await fetch(`${API_URL}/api/cart/sync`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            localItems: [{ product: productId, quantity: newQty }],
          }),
        });
      } catch (err) {
        console.error("Failed to sync quantity to server");
      }
    } else {
      // GUEST: Update LocalStorage
      localStorage.setItem("cart", JSON.stringify(updatedItems));
      // Dispatch event to update Navbar count in real-time
      window.dispatchEvent(new Event("storage"));
    }
  };

  // --- Remove Item ---
  const removeItem = async (productId) => {
    const updatedItems = cartItems.filter((item) => item._id !== productId);
    setCartItems(updatedItems);

    if (isLoggedIn) {
      try {
        // PRODUCTION: Call DELETE endpoint (Ensure your backend has this)
        await fetch(`${API_URL}/api/cart/${productId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Item removed");
      } catch (err) {
        toast.error("Failed to remove item from server");
      }
    } else {
      // GUEST: Update LocalStorage
      localStorage.setItem("cart", JSON.stringify(updatedItems));
      window.dispatchEvent(new Event("storage"));
      toast.error("Item removed from cart");
    }
  };

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  return (
    <div className="bg-slate-50 min-h-screen font-sans transition-colors duration-300">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
            Your <span className="text-orange-500">Cart.</span>
          </h1>
          <span className="bg-orange-500/10 text-orange-500 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
            {cartItems.length} Items
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin text-orange-500 mb-4" size={40} />
            <p className="text-slate-400 font-bold uppercase tracking-tighter text-xs">
              Loading your bag...
            </p>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-slate-200">
            <ShoppingBag className="mx-auto text-slate-200 mb-6" size={80} />
            <h3 className="text-2xl font-black text-slate-800">
              Your bag is empty.
            </h3>
            <p className="text-slate-400 mb-8 font-medium">
              Looks like you haven't added anything yet.
            </p>
            <Link
              to="/search?q="
              className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black hover:bg-orange-500 transition-all shadow-xl shadow-slate-900/10"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-12">
            {/* ITEM LIST */}
            <div className="lg:col-span-2 space-y-6">
              {cartItems.map((item) => (
                <div
                  key={item._id}
                  className="bg-white p-6 rounded-[2.5rem] flex flex-col sm:flex-row items-center gap-6 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-orange-500/5 transition-all group"
                >
                  <div className="w-32 h-32 rounded-[2rem] overflow-hidden bg-slate-50 shrink-0">
                    <img
                      src={item.thumbnail}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>

                  <div className="flex-grow text-center sm:text-left">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      {item.category}
                    </p>
                    <h3 className="font-bold text-slate-900 text-xl mb-1 group-hover:text-orange-500 transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-orange-500 font-black text-lg">
                      ₹{item.price.toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center bg-slate-50 rounded-2xl p-1.5 border border-slate-100">
                      <button
                        onClick={() => updateQuantity(item._id, -1)}
                        className="p-2 text-slate-400 hover:text-orange-500 transition-colors"
                      >
                        <Minus size={18} />
                      </button>
                      <span className="px-5 font-black text-slate-900 text-lg">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item._id, 1)}
                        className="p-2 text-slate-400 hover:text-orange-500 transition-colors"
                      >
                        <Plus size={18} />
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(item._id)}
                      className="p-4 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                    >
                      <Trash2 size={22} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ORDER SUMMARY */}
            <div className="lg:sticky lg:top-24 h-fit">
              <div className="bg-white p-8 rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100">
                <h3 className="text-2xl font-black text-slate-900 mb-8 tracking-tighter">
                  Order Summary
                </h3>
                <div className="space-y-4 mb-10">
                  <div className="flex justify-between text-slate-500 font-bold">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 font-bold">
                    <span>Shipping</span>
                    <span className="text-green-500 uppercase text-xs tracking-widest font-black">
                      Free
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500 font-bold">
                    <span>Tax</span>
                    <span>Calculated at checkout</span>
                  </div>
                  <div className="border-t border-slate-100 pt-6 flex justify-between items-end">
                    <div>
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                        Total Amount
                      </span>
                      <p className="text-3xl font-black text-slate-900">
                        ₹{subtotal.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/checkout")}
                  className="w-full bg-slate-900 text-white font-black py-6 rounded-[2rem] flex items-center justify-center gap-3 hover:bg-orange-500 transition-all shadow-xl shadow-slate-900/20 active:scale-95"
                >
                  Proceed to Checkout <ArrowRight size={20} />
                </button>
              </div>

              <p className="text-center mt-6 text-slate-400 text-xs font-bold uppercase tracking-widest">
                Secure SSL Encrypted Checkout
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
