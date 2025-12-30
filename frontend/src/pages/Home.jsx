import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import { toast } from "react-hot-toast";

// 1. Swiper Imports
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, EffectCreative } from "swiper/modules"; // Updated import
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-creative"; // Updated import

// 2. Icon Imports
import {
  ArrowRight,
  ArrowUpRight, // New Icon
  Zap,
  ShoppingBag,
  Truck,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// --- HELPER: Category Images Map ---
const getCategoryImage = (categoryName) => {
  const lowerCat = categoryName.toLowerCase();

  if (
    lowerCat.includes("electronic") ||
    lowerCat.includes("phone") ||
    lowerCat.includes("laptop") ||
    lowerCat.includes("smartphones")
  )
    return "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500";

  if (
    lowerCat.includes("fashion") ||
    lowerCat.includes("cloth") ||
    lowerCat.includes("wear")
  )
    return "https://images.unsplash.com/photo-1445205170230-053b83016050?w=500";

  if (
    lowerCat.includes("home") ||
    lowerCat.includes("decor") ||
    lowerCat.includes("furniture") ||
    lowerCat.includes("groceries")
  )
    return "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500";

  if (lowerCat.includes("watch") || lowerCat.includes("luxury"))
    return "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500";

  if (
    lowerCat.includes("footwear") ||
    lowerCat.includes("shoe") ||
    lowerCat.includes("sports")
  )
    return "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=500";

  // Fallback Image
  return "https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?w=500";
};

export default function Home() {
  const isLoggedIn = !!localStorage.getItem("token");

  // --- STATE ---
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- 1. FETCH & PROCESS DATA ---
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${API_URL}/api/products`);
        const data = await res.json();

        if (res.ok) {
          const allProducts = Array.isArray(data) ? data : data.products || [];

          // A. Process Products (Sort by Rating for Best Sellers)
          const topRatedProducts = [...allProducts]
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 8);

          setProducts(topRatedProducts);

          // B. Process Categories (Fixed)
          const fixedCategories = [
            {
              name: "Groceries",
              items: "27",
              image: getCategoryImage("Groceries"),
            },
            {
              name: "Sports-Accessories",
              items: "17",
              image: getCategoryImage("Sports-Accessories"),
            },
            {
              name: "Smartphones",
              items: "16",
              image: getCategoryImage("Smartphones"),
            },
          ];

          setCategories(fixedCategories);
        } else {
          toast.error("Failed to load products");
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // --- STATIC SLIDER DATA ---
  const sliderImages = [
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200",
    "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200",
    "https://images.unsplash.com/photo-1573855619003-97b4799dcd8b?w=800",
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800",
    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800",
  ];

  return (
    <div className="bg-white dark:bg-[#030712] min-h-screen transition-colors duration-500 ease-in-out font-sans">
      <Navbar />

      {/* --- HERO SECTION --- */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-28">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none hidden dark:block">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-500/10 blur-[120px] rounded-full"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center relative z-10">
          <div className="text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 text-orange-600 dark:text-orange-400 text-xs font-bold uppercase tracking-widest mb-6">
              <Zap size={14} /> Global Shipping Now Available
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-slate-900 dark:text-white mb-6 leading-[1.1]">
              Elevate Your <span className="text-orange-500">Lifestyle.</span>
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed max-w-lg">
              Discover curated collections from top global brands. Quality meets
              affordability in every click.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() =>
                  document
                    .getElementById("products-section")
                    .scrollIntoView({ behavior: "smooth" })
                }
                className="flex items-center justify-center gap-2 bg-slate-900 dark:bg-orange-500 text-white px-8 py-4 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-lg"
              >
                Shop Collection <ArrowRight size={20} />
              </button>
              {!isLoggedIn && (
                <Link
                  to="/signup"
                  className="flex items-center justify-center bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 px-8 py-4 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  Join ShopEasy
                </Link>
              )}
            </div>
          </div>

          {/* --- NEW PREMIUM SLIDER SECTION --- */}
          <div className="relative hidden lg:block group">
            {/* Decorative Glow behind the slider */}
            <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-amber-500 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>

            <div className="relative rounded-[2rem] overflow-hidden shadow-2xl ring-1 ring-slate-900/5">
              <Swiper
                modules={[Autoplay, Pagination, EffectCreative]}
                effect="creative"
                creativeEffect={{
                  prev: {
                    shadow: true,
                    translate: ["-20%", 0, -1],
                  },
                  next: {
                    translate: ["100%", 0, 0],
                  },
                }}
                speed={1000}
                loop={true}
                autoplay={{ delay: 5000, disableOnInteraction: false }}
                pagination={{
                  clickable: true,
                  dynamicBullets: true,
                  renderBullet: function (index, className) {
                    return '<span class="' + className + ' bg-white"></span>';
                  },
                }}
                className="w-full h-[550px]"
              >
                {sliderImages.map((img, index) => (
                  <SwiperSlide key={index}>
                    <div className="relative w-full h-full">
                      <img
                        src={img}
                        alt={`Slide ${index}`}
                        className="w-full h-full object-cover transform transition-transform duration-[5000ms] hover:scale-110"
                      />

                      {/* Dark Gradient Overlay for readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                      {/* Glassmorphism Card Info */}
                      <div className="absolute bottom-8 left-8 right-8">
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl flex items-center justify-between text-white shadow-lg transform translate-y-4 opacity-0 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-forwards">
                          <div>
                            <span className="inline-block px-2 py-1 bg-orange-500 text-xs font-bold rounded-md mb-2">
                              TRENDING
                            </span>
                            <h3 className="text-2xl font-bold leading-tight">
                              Winter Collection
                            </h3>
                            <p className="text-sm text-gray-200 mt-1">
                              Up to 50% off on premium brands.
                            </p>
                          </div>

                          <button className="bg-white text-slate-900 p-3 rounded-full hover:bg-orange-500 hover:text-white transition-colors">
                            <ArrowUpRight size={24} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </div>
          {/* --- END SLIDER SECTION --- */}
        </div>
      </section>

      {/* --- TRUST BAR --- */}
      <section className="py-12 border-y border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { icon: Truck, label: "Free Shipping", sub: "Orders over ₹999" },
            {
              icon: ShieldCheck,
              label: "Secure Payment",
              sub: "100% Protected",
            },
            { icon: RotateCcw, label: "Easy Returns", sub: "30 Day Window" },
            {
              icon: ShoppingBag,
              label: "Quality Check",
              sub: "Certified Brands",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="flex flex-col items-center text-center gap-2"
            >
              <item.icon className="text-orange-500" size={28} />
              <h4 className="font-bold dark:text-white text-sm">
                {item.label}
              </h4>
              <p className="text-xs text-slate-500">{item.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --- REAL CATEGORY GRID --- */}
      <section className="py-20 max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-black dark:text-white">
              Browse Categories
            </h2>
            <div className="h-1 w-12 bg-orange-500 mt-2 rounded-full"></div>
          </div>
          <Link
            to="/search"
            className="text-orange-500 font-bold text-sm hover:underline"
          >
            View All
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse"
              />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            No categories found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {categories.map((cat, i) => (
              <Link
                to={`/search?q=${cat.name}`}
                key={i}
                className="group relative h-64 rounded-3xl overflow-hidden cursor-pointer"
              >
                <img
                  src={cat.image}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  alt={cat.name}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute bottom-6 left-6 text-white">
                  <h3 className="text-xl font-bold">{cat.name}</h3>
                  <p className="text-sm text-gray-300">{cat.items}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* --- WEEKLY BEST SELLERS (REAL DATA) --- */}
      <section
        id="products-section"
        className="py-20 bg-slate-50 dark:bg-slate-900/40"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black dark:text-white mb-4">
              Weekly Best Sellers
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Handpicked items from our database that you'll love.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="bg-slate-200 dark:bg-slate-800 rounded-2xl h-[400px] animate-pulse"
                ></div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-slate-500">No products found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
