import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Star,
  ShoppingCart,
  Truck,
  RotateCcw,
  ShieldCheck,
  Minus,
  Plus,
  Loader2,
  ChevronLeft,
  ImageOff,
} from "lucide-react";
import { toast } from "react-hot-toast";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  // Holds merged list of Thumbnail + Gallery images
  const [allImages, setAllImages] = useState([]);

  // Safety Checks for API URL
  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const SAFE_API_URL = BASE_URL.startsWith("http")
    ? BASE_URL
    : `http://${BASE_URL}`;

  // Helper to resolve image paths (Local vs Cloudinary)
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("data:")) return imagePath;
    if (imagePath.startsWith("http")) return imagePath;
    const cleanPath = imagePath.startsWith("/")
      ? imagePath.substring(1)
      : imagePath;
    return `${SAFE_API_URL}/${cleanPath}`;
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`${SAFE_API_URL}/api/products/${id}`);
        const data = await res.json();

        if (res.ok) {
          setProduct(data);

          // ✅ MERGE IMAGES: Combine thumbnail + gallery, remove duplicates/nulls
          const mergedImages = [data.thumbnail, ...(data.images || [])]
            .filter((img) => img)
            .filter((img, index, self) => self.indexOf(img) === index);

          setAllImages(mergedImages);
        } else {
          toast.error("Product not found");
          navigate("/");
        }
      } catch (error) {
        console.error("Fetch Error:", error);
        toast.error("Could not load product");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [id, navigate, SAFE_API_URL]);

  // ✅ ADD TO CART (Logged-in Only)
  const handleAddToCart = async () => {
    if (!product) return;
    const token = localStorage.getItem("token");

    // 1. Check if User is Logged In
    if (!token) {
      toast("Please login to add items to your cart", { icon: "🔒" });
      navigate("/login");
      return;
    }

    // 2. Proceed with Backend Call
    try {
      const res = await fetch(`${SAFE_API_URL}/api/cart/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: product._id, quantity }),
      });

      if (res.ok) {
        toast.success("Added to cart!");

        // 🚀 CRITICAL UPDATE: Trigger Navbar update immediately
        window.dispatchEvent(new Event("cartUpdated"));
      } else {
        toast.error("Failed to add item");
      }
    } catch (error) {
      toast.error("Server connection failed");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#030712]">
        <Loader2 className="animate-spin text-orange-500" size={40} />
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#030712] transition-colors duration-300">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-12">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-orange-500 font-bold text-xs uppercase tracking-widest mb-8 transition-colors"
        >
          <ChevronLeft size={16} /> Back to Results
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* LEFT: IMAGE GALLERY */}
          <div className="space-y-6">
            <div className="aspect-square bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden flex items-center justify-center p-8 relative group">
              {getImageUrl(allImages[selectedImage]) ? (
                <img
                  src={getImageUrl(allImages[selectedImage])}
                  alt={product.name}
                  className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "flex";
                  }}
                />
              ) : null}

              {/* Fallback Icon */}
              <div
                className="hidden w-full h-full flex-col items-center justify-center text-slate-300"
                style={{
                  display: getImageUrl(allImages[selectedImage])
                    ? "none"
                    : "flex",
                }}
              >
                <ImageOff size={64} strokeWidth={1} />
                <span className="text-xs font-bold mt-2 uppercase tracking-widest">
                  No Image
                </span>
              </div>
            </div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`w-20 h-20 rounded-xl border-2 flex-shrink-0 overflow-hidden p-2 bg-white dark:bg-slate-900 transition-all ${
                      selectedImage === idx
                        ? "border-orange-500 opacity-100"
                        : "border-transparent hover:border-slate-200 dark:hover:border-slate-700 opacity-60 hover:opacity-100"
                    }`}
                  >
                    {getImageUrl(img) ? (
                      <img
                        src={getImageUrl(img)}
                        alt=""
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <div
                      className="hidden w-full h-full items-center justify-center text-slate-300"
                      style={{ display: getImageUrl(img) ? "none" : "flex" }}
                    >
                      <ImageOff size={20} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: PRODUCT INFO */}
          <div>
            <span className="text-orange-500 font-black tracking-widest uppercase text-xs mb-2 block">
              {product.category || "New Arrival"}
            </span>

            <h1 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white mb-4 leading-tight">
              {product.name}
            </h1>

            <div className="flex items-center gap-3 mb-6">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    fill={i < (product.rating || 4) ? "currentColor" : "none"}
                  />
                ))}
              </div>
              <span className="text-slate-400 text-sm font-bold">
                ({product.numReviews || 0} Reviews)
              </span>
            </div>

            {/* PRICE SECTION (Rupees + MRP) */}
            <div className="mb-8">
              <div className="flex items-baseline gap-4">
                <span className="text-4xl font-black text-slate-900 dark:text-white">
                  ₹{product.price?.toLocaleString()}
                </span>

                {product.mrp && product.mrp > product.price && (
                  <>
                    <span className="text-xl text-slate-400 line-through font-bold">
                      ₹{product.mrp?.toLocaleString()}
                    </span>
                    <span className="text-xs font-bold text-green-500 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-md">
                      {Math.round(
                        ((product.mrp - product.price) / product.mrp) * 100
                      )}
                      % OFF
                    </span>
                  </>
                )}
              </div>
              <p className="text-xs text-slate-400 font-bold mt-1">
                Inclusive of all taxes
              </p>
            </div>

            <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium mb-8">
              {product.description ||
                "No description available for this product."}
            </p>

            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 mb-8 shadow-xl shadow-slate-200/50 dark:shadow-none">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 rounded-xl px-4 py-3 sm:w-1/3 border border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="text-slate-400 hover:text-orange-500"
                  >
                    <Minus size={18} />
                  </button>
                  <span className="font-black text-slate-900 dark:text-white w-8 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="text-slate-400 hover:text-orange-500"
                  >
                    <Plus size={18} />
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-black py-3.5 rounded-xl shadow-lg shadow-orange-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
                >
                  <ShoppingCart size={18} />
                  {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Truck className="text-orange-500 shrink-0" size={20} />
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase">
                    Free Delivery
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium">
                    On orders over ₹500
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <RotateCcw className="text-orange-500 shrink-0" size={20} />
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase">
                    Returns
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium">
                    30-day easy returns
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="text-orange-500 shrink-0" size={20} />
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase">
                    Warranty
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium">
                    1 year included
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
