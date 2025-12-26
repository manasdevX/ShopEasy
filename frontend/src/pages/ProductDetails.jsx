import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  ShoppingCart,
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  ChevronRight,
  Loader2,
  Minus,
  Plus,
} from "lucide-react";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState("");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`${API_URL}/api/products/${id}`);
        const data = await res.json();
        if (res.ok) {
          setProduct(data);
          setMainImage(data.thumbnail); // Set initial large view to thumbnail
        } else {
          toast.error("Product not found");
          navigate("/");
        }
      } catch (err) {
        toast.error("Connection error");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, navigate]);

  const handleAddToCart = () => {
    toast.success(`${product.name} added to cart!`, {
      icon: "🛒",
      style: { borderRadius: "12px", background: "#0F172A", color: "#fff" },
    });
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#030712]">
        <Loader2 className="animate-spin text-orange-500" size={40} />
      </div>
    );

  return (
    <div className="bg-white dark:bg-[#030712] min-h-screen transition-colors duration-300">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* BREADCRUMBS */}
        <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 mb-8">
          <span
            className="hover:text-orange-500 cursor-pointer"
            onClick={() => navigate("/")}
          >
            Home
          </span>
          <ChevronRight size={14} />
          <span>{product.category}</span>
          <ChevronRight size={14} />
          <span className="text-slate-900 dark:text-white">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-16">
          {/* LEFT: IMAGE GALLERY */}
          <div className="space-y-6">
            <div className="aspect-square rounded-[3rem] overflow-hidden bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 shadow-sm relative">
              <img
                src={mainImage}
                alt={product.name}
                className="w-full h-full object-contain p-8"
              />
              {product.isBestSeller && (
                <div className="absolute top-8 left-8 bg-slate-900 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em]">
                  Bestseller
                </div>
              )}
            </div>

            <div className="grid grid-cols-5 gap-4">
              <button
                onClick={() => setMainImage(product.thumbnail)}
                className={`aspect-square rounded-2xl border-2 transition-all overflow-hidden bg-slate-50 ${
                  mainImage === product.thumbnail
                    ? "border-orange-500"
                    : "border-transparent"
                }`}
              >
                <img
                  src={product.thumbnail}
                  className="w-full h-full object-cover"
                  alt="thumb"
                />
              </button>
              {product.images?.map(
                (img, i) =>
                  img && (
                    <button
                      key={i}
                      onClick={() => setMainImage(img)}
                      className={`aspect-square rounded-2xl border-2 transition-all overflow-hidden bg-slate-50 ${
                        mainImage === img
                          ? "border-orange-500"
                          : "border-transparent"
                      }`}
                    >
                      <img
                        src={img}
                        className="w-full h-full object-cover"
                        alt={`gallery-${i}`}
                      />
                    </button>
                  )
              )}
            </div>
          </div>

          {/* RIGHT: PRODUCT INFO */}
          <div className="flex flex-col justify-center">
            <p className="text-orange-500 font-black uppercase tracking-[0.3em] text-xs mb-4">
              {product.brand}
            </p>
            <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-6 leading-none">
              {product.name}
              <span className="text-orange-500">.</span>
            </h1>

            <div className="flex items-center gap-6 mb-8">
              <div className="flex items-center gap-1 bg-amber-400/10 text-amber-500 px-3 py-1 rounded-full text-sm font-black">
                <Star size={16} fill="currentColor" />
                {product.rating || "New"}
              </div>
              <span className="text-slate-400 font-bold text-sm">
                {product.numReviews || 0} Customer Reviews
              </span>
            </div>

            <div className="flex items-end gap-4 mb-10">
              <span className="text-5xl font-black text-slate-900 dark:text-white">
                ₹{product.price.toLocaleString()}
              </span>
              {product.mrp > product.price && (
                <span className="text-2xl text-slate-400 line-through font-bold mb-1">
                  ₹{product.mrp.toLocaleString()}
                </span>
              )}
            </div>

            <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-lg mb-10 font-medium">
              {product.description}
            </p>

            {/* ACTION AREA */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-2xl p-2 border border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-3 text-slate-500 hover:text-orange-500 transition-colors"
                >
                  <Minus size={20} />
                </button>
                <span className="px-6 font-black text-slate-900 dark:text-white text-xl">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-3 text-slate-500 hover:text-orange-500 transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className="flex-grow bg-orange-500 text-white font-black text-lg py-5 rounded-3xl shadow-2xl shadow-orange-500/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <ShoppingCart size={24} />{" "}
                {product.stock <= 0 ? "Out of Stock" : "Add to Cart"}
              </button>
            </div>

            {/* TRUST BADGES */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl text-orange-500">
                  <Truck size={20} />
                </div>
                <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-tight">
                  Fast
                  <br />
                  Delivery
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl text-orange-500">
                  <RotateCcw size={20} />
                </div>
                <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-tight">
                  7 Days
                  <br />
                  Return
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl text-orange-500">
                  <ShieldCheck size={20} />
                </div>
                <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-tight">
                  Secure
                  <br />
                  Payment
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
