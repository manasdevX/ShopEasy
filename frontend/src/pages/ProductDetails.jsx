import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
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
  Zap,
  ThumbsUp,
  ThumbsDown,
  Heart,
} from "lucide-react";
import { toast } from "react-hot-toast";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { showError, showSuccess } from "../utils/toast";

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");
  const isLoggedIn = !!token;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [allImages, setAllImages] = useState([]);

  // Wishlist States
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlisting, setWishlisting] = useState(false);

  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const SAFE_API_URL = BASE_URL.startsWith("http")
    ? BASE_URL
    : `http://${BASE_URL}`;

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("data:")) return imagePath;
    if (imagePath.startsWith("http")) return imagePath;
    const cleanPath = imagePath.startsWith("/")
      ? imagePath.substring(1)
      : imagePath;
    return `${SAFE_API_URL}/${cleanPath}`;
  };

  // Sync Wishlist status from LocalStorage
  const checkWishlistStatus = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user.wishlist && Array.isArray(user.wishlist)) {
        const exists = user.wishlist.some(
          (item) => (typeof item === "string" ? item : item._id) === id
        );
        setIsWishlisted(exists);
      }
    } catch (e) {
      console.error("Wishlist sync error", e);
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`${SAFE_API_URL}/api/products/${id}`);
        const data = await res.json();
        if (res.ok) {
          setProduct(data);
          const mergedImages = [data.thumbnail, ...(data.images || [])]
            .filter((img) => img)
            .filter((img, index, self) => self.indexOf(img) === index);
          setAllImages(mergedImages);
          checkWishlistStatus();
        } else {
          showError("Product not found");
          navigate("/");
        }
      } catch (error) {
        showError("Could not load product");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProduct();

    // Listen for changes from other components
    window.addEventListener("wishlistUpdated", checkWishlistStatus);
    return () =>
      window.removeEventListener("wishlistUpdated", checkWishlistStatus);
  }, [id, navigate, SAFE_API_URL]);

  const handleWishlistToggle = async () => {
    if (!isLoggedIn) {
      toast.error("Please login to save items", { icon: "🔒" });
      return;
    }

    setWishlisting(true);
    try {
      // Note: If your backend uses DELETE to remove, you should check
      // isWishlisted here and switch between POST and DELETE methods.
      const method = isWishlisted ? "DELETE" : "POST";

      const res = await fetch(`${SAFE_API_URL}/api/user/wishlist/${id}`, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        // Update global storage
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        user.wishlist = data; // Backend must return the full updated list
        localStorage.setItem("user", JSON.stringify(user));

        setIsWishlisted(!isWishlisted);
        window.dispatchEvent(new Event("wishlistUpdated"));
        toast.success(
          isWishlisted ? "Removed from Wishlist" : "Added to Wishlist!",
          { icon: "❤️" }
        );
      }
    } catch (error) {
      showError("Action failed");
    } finally {
      setWishlisting(false);
    }
  };

  const handleAddToCart = async (isBuyNow = false) => {
    if (!product) return;
    const token = localStorage.getItem("token");

    if (!token) {
      toast("Please login to add to cart", { icon: "🔒" });
      navigate("/login", { state: { from: location.pathname } });
      return;
    }

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
        window.dispatchEvent(new Event("cartUpdated"));
        if (isBuyNow) {
          navigate("/payment");
        } else {
          showSuccess("Added to cart!");
        }
      } else {
        showError("Failed to update cart");
      }
    } catch (error) {
      showError("Server connection failed");
    }
  };

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setSelectedImage(
      (prev) => (prev - 1 + allImages.length) % allImages.length
    );
  };

  const handleBuyNow = () => {
    if (isLoggedIn) {
      navigate("/payment", {
        state: {
          items: [
            {
              _id: product._id,
              name: product.name,
              price: product.price,
              mrp: product.mrp || product.price,
              quantity: quantity,
              seller: product.seller || product.sellerId,
              image: getImageUrl(product.thumbnail || product.images?.[0]),
            },
          ],
        },
      });
    } else {
      toast("Please login to Buy Now", { icon: "🔒" });
      navigate("/login", { state: { from: location.pathname } });
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#030712] transition-colors duration-300 font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-12">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-orange-500 font-bold text-xs uppercase tracking-widest mb-8 transition-colors"
        >
          <ChevronLeft size={16} /> Back to Results
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 relative">
          {/* LEFT COLUMN: IMAGES */}
          <div className="lg:sticky lg:top-24 h-fit space-y-8">
            <div className="group relative aspect-square bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden flex items-center justify-center p-8 shadow-sm">
              {/* ✅ NEW: FLOATING WISHLIST BUTTON */}
              <button
                onClick={handleWishlistToggle}
                disabled={wishlisting}
                className="absolute top-6 right-6 z-30 p-3.5 rounded-full bg-white/90 dark:bg-slate-800/90 shadow-xl backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-90 border border-slate-100 dark:border-slate-700"
              >
                {wishlisting ? (
                  <Loader2 size={20} className="animate-spin text-red-500" />
                ) : (
                  <Heart
                    size={20}
                    className={`${
                      isWishlisted
                        ? "text-red-500 fill-red-500"
                        : "text-slate-400"
                    } transition-colors duration-300`}
                  />
                )}
              </button>

              {allImages.length > 1 && (
                <button
                  onClick={prevImage}
                  className="absolute left-4 z-20 p-3 rounded-full bg-white/90 dark:bg-slate-800/90 text-slate-900 dark:text-white shadow-xl backdrop-blur-md transition-all duration-300 hover:bg-orange-500 hover:text-white"
                >
                  <ChevronLeft size={24} strokeWidth={3} />
                </button>
              )}

              {getImageUrl(allImages[selectedImage]) ? (
                <img
                  src={getImageUrl(allImages[selectedImage])}
                  alt={product.name}
                  key={selectedImage}
                  className="w-full h-full object-contain hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-300">
                  <ImageOff size={64} strokeWidth={1} />
                  <span className="text-xs font-bold mt-2 uppercase tracking-widest">
                    No Image
                  </span>
                </div>
              )}

              {allImages.length > 1 && (
                <button
                  onClick={nextImage}
                  className="absolute right-4 z-20 p-3 rounded-full bg-white/90 dark:bg-slate-800/90 text-slate-900 dark:text-white shadow-xl backdrop-blur-md transition-all duration-300 hover:bg-orange-500 hover:text-white"
                >
                  <ChevronLeft
                    size={24}
                    strokeWidth={3}
                    className="rotate-180"
                  />
                </button>
              )}

              <div className="absolute bottom-6 px-4 py-1.5 bg-slate-900/10 dark:bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 border border-white/20">
                {selectedImage + 1} / {allImages.length}
              </div>
            </div>

            {allImages.length > 1 && (
              <div className="flex py-2 px-2 gap-4 overflow-x-auto pb-2 no-scrollbar">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`w-16 h-16 rounded-xl border-2 flex-shrink-0 overflow-hidden p-1 bg-white dark:bg-slate-900 transition-all ${
                      selectedImage === idx
                        ? "scale-105 shadow-md border-orange-500"
                        : "border-transparent opacity-60"
                    }`}
                  >
                    <img
                      src={getImageUrl(img)}
                      alt=""
                      className="w-full h-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => handleAddToCart(false)}
                  disabled={product.stock === 0}
                  className="flex-1 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-black py-4 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-xs disabled:opacity-50"
                >
                  <ShoppingCart size={18} /> Add to Cart
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={product.stock === 0}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-orange-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-xs disabled:opacity-50"
                >
                  <Zap size={18} fill="currentColor" /> Buy Now
                </button>
              </div>

              <div className="flex items-center justify-between bg-slate-100/50 dark:bg-slate-800/50 rounded-2xl p-1.5 border border-slate-200/60 dark:border-slate-700/50">
                <span className="pl-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Quantity
                </span>
                <div className="flex items-center bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-orange-500 transition-colors"
                  >
                    <Minus size={14} strokeWidth={3} />
                  </button>
                  <span className="w-10 text-center font-black text-sm text-slate-900 dark:text-white">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-orange-500 transition-colors"
                  >
                    <Plus size={14} strokeWidth={3} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: INFO */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-orange-500 font-black tracking-[0.3em] uppercase text-[10px]">
                  {product.category || "Premium Collection"}
                </span>
                <h1 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white leading-tight">
                  {product.name}
                </h1>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        className={
                          i < (product.rating || 0)
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-slate-300"
                        }
                      />
                    ))}
                  </div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                    {product.numReviews || 0} Reviews
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-widest">
                  The Details
                </h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm max-w-prose">
                  {product.description || "No description available."}
                </p>
              </div>

              <div className="pt-4">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    ₹{product.price?.toLocaleString()}
                  </span>
                  {product.mrp > product.price && (
                    <div className="flex items-center gap-2">
                      <span className="text-lg text-slate-400 line-through font-medium">
                        ₹{product.mrp?.toLocaleString()}
                      </span>
                      <span className="text-green-500 font-bold text-xs uppercase">
                        {Math.round(
                          ((product.mrp - product.price) / product.mrp) * 100
                        )}
                        % Off
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest mt-1">
                  Free Express Delivery Included
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
              {[
                {
                  icon: <Truck size={20} />,
                  title: "Free Shipping",
                  desc: "Express delivery for all orders",
                },
                {
                  icon: <RotateCcw size={20} />,
                  title: "Easy Returns",
                  desc: "14-day hassle-free policy",
                },
                {
                  icon: <ShieldCheck size={20} />,
                  title: "Brand Warranty",
                  desc: "100% authentic products",
                },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 group-hover:text-orange-500 transition-all">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-[15px] font-black text-slate-800 dark:text-slate-200 tracking-wider">
                      {item.title}
                    </h4>
                    <p className="text-[12px] text-slate-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-10 border-t border-slate-100 dark:border-slate-800 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    Ratings & Reviews
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 bg-green-500 text-white px-2 py-0.5 rounded-md">
                      <span className="text-sm font-black">
                        {product.rating?.toFixed(1) || 0}
                      </span>
                      <Star size={12} fill="currentColor" />
                    </div>
                    <p className="text-xs font-bold text-slate-500">
                      {product.numReviews} Ratings
                    </p>
                  </div>
                </div>
                <button
                  className="border-2 border-slate-200 dark:border-slate-700 hover:border-orange-500 dark:text-white font-black py-2 px-6 rounded-xl transition-all text-xs uppercase"
                  onClick={() => navigate(`/product/${product._id}/reviews`)}
                >
                  Rate Product
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2 pt-2">
                {[5, 4, 3, 2, 1].map((star) => (
                  <div key={star} className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-slate-400 w-3">
                      {star}
                    </span>
                    <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500"
                        style={{
                          width: `${
                            product.reviews?.length > 0
                              ? (product.reviews.filter(
                                  (r) => Math.round(r.rating) === star
                                ).length /
                                  product.reviews.length) *
                                100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 w-8">
                      {product.reviews?.length > 0
                        ? Math.round(
                            (product.reviews.filter(
                              (r) => Math.round(r.rating) === star
                            ).length /
                              product.reviews.length) *
                              100
                          )
                        : 0}
                      %
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-4 space-y-4">
                {product.reviews?.length > 0 ? (
                  product.reviews.map((review) => (
                    <div
                      key={review._id}
                      className="p-5 bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-100 dark:border-slate-800"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="bg-green-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                            {review.rating}{" "}
                            <Star size={8} fill="currentColor" />
                          </div>
                          <span className="text-sm font-black dark:text-white">
                            {review.rating >= 4 ? "Great!" : "Good"}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 uppercase">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-[13px] italic text-slate-600 dark:text-slate-400 font-medium">
                        "{review.comment}"
                      </p>
                      <div className="flex items-center justify-between mt-5 pt-4 border-t dark:border-slate-800">
                        <div className="flex flex-col">
                          <span className="text-xs font-black dark:text-slate-400">
                            {review.name}
                          </span>
                          <div className="flex items-center gap-1 text-[9px] font-bold text-green-500 uppercase">
                            <ShieldCheck size={10} fill="currentColor" />{" "}
                            Verified Buyer
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button className="p-2 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-green-500 transition-all">
                            <ThumbsUp size={12} />
                          </button>
                          <button className="p-2 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-red-500 transition-all">
                            <ThumbsDown size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <p className="text-slate-400 text-xs font-bold mb-2">
                      No reviews yet.
                    </p>
                    <Link
                      to={`/product/${id}/reviews`}
                      className="text-orange-500 text-xs font-black uppercase hover:underline"
                    >
                      Be the first to write one!
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
