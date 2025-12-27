import React, { useState, useEffect } from "react";
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  ChevronLeft,
  Loader2,
  ImageOff, // Import ImageOff for broken images
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

// ✅ Safe API URL
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_URL = BASE_URL.startsWith("http") ? BASE_URL : `http://${BASE_URL}`;

export default function Cart() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const token = localStorage.getItem("token");
  const isLoggedIn = !!token;

  // ✅ Helper for Images (Matches ProductDetails logic)
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http")) return imagePath;
    const cleanPath = imagePath.startsWith("/")
      ? imagePath.substring(1)
      : imagePath;
    return `${API_URL}/${cleanPath}`;
  };

  // 1. FETCH CART
  useEffect(() => {
    const fetchCart = async () => {
      setLoading(true);
      if (isLoggedIn) {
        try {
          const res = await fetch(`${API_URL}/api/cart`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();

          if (res.ok) {
            // Filter out invalid items (where product might be null)
            const validItems = data.items?.filter((item) => item.product) || [];
            setCartItems(validItems);
          } else {
            console.error("Failed to fetch cart");
          }
        } catch (error) {
          console.error("Cart Fetch Error:", error);
          toast.error("Could not load your cart");
        }
      } else {
        const localCart = JSON.parse(localStorage.getItem("cart") || "[]");
        setCartItems(localCart);
      }
      setLoading(false);
    };

    fetchCart();
  }, [isLoggedIn, token]);

  // 2. UPDATE QUANTITY
  const handleUpdateQuantity = async (productId, currentQty, delta) => {
    const newQty = currentQty + delta;
    if (newQty < 1) return;

    setUpdating(true);

    if (isLoggedIn) {
      try {
        const res = await fetch(`${API_URL}/api/cart/update`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ productId, quantity: newQty }),
        });

        if (res.ok) {
          setCartItems((prev) =>
            prev.map((item) =>
              item.product._id === productId
                ? { ...item, quantity: newQty }
                : item
            )
          );
        } else {
          toast.error("Failed to update quantity");
        }
      } catch (err) {
        toast.error("Server connection error");
      }
    } else {
      const updatedCart = cartItems.map((item) =>
        item.product._id === productId ? { ...item, quantity: newQty } : item
      );
      setCartItems(updatedCart);
      localStorage.setItem("cart", JSON.stringify(updatedCart));
    }
    setUpdating(false);
  };

  // 3. REMOVE ITEM
  const handleRemoveItem = async (productId) => {
    if (isLoggedIn) {
      try {
        const res = await fetch(`${API_URL}/api/cart/remove/${productId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          setCartItems((prev) =>
            prev.filter((item) => item.product._id !== productId)
          );
          toast.success("Item removed");
        } else {
          toast.error("Could not remove item");
        }
      } catch (err) {
        toast.error("Server Error");
      }
    } else {
      const updatedCart = cartItems.filter(
        (item) => item.product._id !== productId
      );
      setCartItems(updatedCart);
      localStorage.setItem("cart", JSON.stringify(updatedCart));
      toast.success("Item removed");
    }
  };

  const subtotal = cartItems.reduce(
    (acc, item) => acc + (item.product?.price || 0) * item.quantity,
    0
  );
  const shipping = subtotal > 500 ? 0 : 15.0;
  const total = subtotal + shipping;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#030712]">
        <Loader2 className="animate-spin text-orange-500" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#030712] transition-colors duration-300 flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto w-full px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">
              YOUR CART
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-1">
              {cartItems.length} items in your bag
            </p>
          </div>
          <Link
            to="/"
            className="text-sm font-bold text-orange-500 flex items-center gap-2 hover:underline"
          >
            <ChevronLeft size={16} /> Continue Shopping
          </Link>
        </div>

        {cartItems.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.product._id}
                  className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl flex gap-6 items-center group transition-all hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none"
                >
                  {/* ✅ Fixed Image Section */}
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center">
                    {getImageUrl(item.product.images?.[0]) ? (
                      <img
                        src={getImageUrl(item.product.images?.[0])}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                      />
                    ) : null}

                    {/* Fallback Icon if Image Fails */}
                    <div
                      className="hidden w-full h-full items-center justify-center text-slate-300"
                      style={{
                        display: getImageUrl(item.product.images?.[0])
                          ? "none"
                          : "flex",
                      }}
                    >
                      <ImageOff size={24} />
                    </div>
                  </div>

                  <div className="flex-grow">
                    <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">
                      {item.product.category || "General"}
                    </span>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg line-clamp-1">
                      {item.product.name}
                    </h3>
                    <p className="text-slate-500 text-sm font-bold mt-1">
                      ${item.product.price?.toFixed(2)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() =>
                        handleUpdateQuantity(
                          item.product._id,
                          item.quantity,
                          -1
                        )
                      }
                      disabled={updating || item.quantity <= 1}
                      className="p-1 hover:text-orange-500 transition-colors dark:text-slate-400 disabled:opacity-30"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-8 text-center font-black text-sm dark:text-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        handleUpdateQuantity(item.product._id, item.quantity, 1)
                      }
                      disabled={updating}
                      className="p-1 hover:text-orange-500 transition-colors dark:text-slate-400 disabled:opacity-30"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  <button
                    onClick={() => handleRemoveItem(item.product._id)}
                    className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-8 sticky top-28">
                <h2 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white mb-6">
                  ORDER SUMMARY
                </h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-slate-500 font-medium">
                    <span>Subtotal</span>
                    <span className="text-slate-900 dark:text-white">
                      ${subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500 font-medium">
                    <span>Estimated Shipping</span>
                    <span className="text-slate-900 dark:text-white">
                      {shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="h-[1px] bg-slate-100 dark:bg-slate-800 my-2" />
                  <div className="flex justify-between items-end">
                    <span className="text-lg font-black dark:text-white">
                      Total
                    </span>
                    <span className="text-2xl font-black text-orange-500">
                      ${total.toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => toast.success("Proceeding to Checkout...")}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-orange-500/20 transition-all hover:-translate-y-1"
                >
                  CHECKOUT NOW <ArrowRight size={20} />
                </button>

                <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest mt-6">
                  Secure Checkout Guaranteed
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
            <div className="bg-slate-50 dark:bg-slate-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="text-slate-300" size={32} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              Your cart is empty
            </h2>
            <p className="text-slate-500 mt-2 mb-8">
              Looks like you haven't added anything yet.
            </p>
            <Link
              to="/"
              className="bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-8 py-3 rounded-xl font-bold transition-transform hover:scale-105 inline-block"
            >
              Start Shopping
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
