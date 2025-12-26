import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import React from "react";
import ProductCard from "../components/ProductCard";
// 1. Import the Swiper React components
import { Swiper, SwiperSlide } from "swiper/react";

// 2. Import Swiper modules (these power the features like autoplay and fade)
import { Autoplay, Pagination, EffectFade } from "swiper/modules";

// 3. Import Swiper styles (critical for it to look right)
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-fade";
import {
  ArrowRight,
  Zap,
  ShoppingBag,
  Truck,
  ShieldCheck,
  RotateCcw,
  Star,
} from "lucide-react";

export default function Home() {
  const isLoggedIn = !!localStorage.getItem("token");

  const sliderImages = [
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200",
    "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200",
    "https://images.unsplash.com/photo-1573855619003-97b4799dcd8b?w=800",
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800",
    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800",
  ];

  // Mock Data for the modern sections
  const categories = [
    {
      name: "Electronics",
      image:
        "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500",
      items: "120+ Items",
    },
    {
      name: "Fashion",
      image:
        "https://images.unsplash.com/photo-1445205170230-053b83016050?w=500",
      items: "340+ Items",
    },
    {
      name: "Home Decor",
      image:
        "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=500",
      items: "80+ Items",
    },
  ];

  const featuredProducts = [
    {
      id: 1,
      name: "Premium Wireless Headphones",
      price: "₹2,999",
      rating: 4.8,
      image:
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
    },
    {
      id: 2,
      name: "Smart Fitness Watch",
      price: "₹1,499",
      rating: 4.5,
      image:
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
    },
    {
      id: 3,
      name: "Minimalist Leather Wallet",
      price: "₹899",
      rating: 4.9,
      image:
        "https://images.unsplash.com/photo-1627123424574-724758594e93?w=400",
    },
    {
      id: 4,
      name: "Portable Bluetooth Speaker",
      price: "₹1,999",
      rating: 4.7,
      image:
        "https://images.unsplash.com/photo-1589003077984-894e133dabab?w=800",
    },
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
              <Link
                to="/products"
                className="flex items-center justify-center gap-2 bg-slate-900 dark:bg-orange-500 text-white px-8 py-4 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-lg"
              >
                Shop Collection <ArrowRight size={20} />
              </Link>
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

          {/* Hero Image / Visual Element - Tailwind & Swiper Optimized */}
          <div className="relative hidden lg:block">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-8 border-white dark:border-slate-800">
              <Swiper
                modules={[Autoplay, Pagination, EffectFade]}
                effect="fade"
                fadeEffect={{ crossFade: true }}
                speed={1000}
                loop={true}
                autoplay={{
                  delay: 4000,
                  disableOnInteraction: false,
                }}
                pagination={{
                  clickable: true,
                  dynamicBullets: true,
                }}
                className="w-full h-[500px]"
              >
                {sliderImages.map((img, index) => (
                  <SwiperSlide key={index}>
                    {/* Use 'swiper-slide-active' class to trigger the zoom animation via custom CSS below */}
                    <div className="relative w-full h-full overflow-hidden">
                      <img
                        src={img}
                        alt={`Slide ${index}`}
                        className="slider-image w-full h-full object-cover"
                      />
                      {/* Dark Gradient Overlay for text readability */}
                      <div className="absolute inset-0 bg-black/10 dark:bg-black/20" />
                    </div>
                  </SwiperSlide>
                ))}

                {/* FLASH SALE TAG - Floating fixed overlay */}
                <div className="absolute bottom-6 left-6 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-5 rounded-2xl shadow-2xl border border-white/20 transform hover:scale-105 transition-transform duration-300">
                  <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-1">
                    Flash Sale
                  </p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                    Up to 60% Off
                  </p>
                </div>
              </Swiper>
            </div>
          </div>
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

      {/* --- CATEGORY GRID --- */}
      <section className="py-20 max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-black dark:text-white">
              Browse Categories
            </h2>
            <div className="h-1 w-12 bg-orange-500 mt-2 rounded-full"></div>
          </div>
          <Link
            to="/categories"
            className="text-orange-500 font-bold text-sm hover:underline"
          >
            View All
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {categories.map((cat, i) => (
            <div
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
            </div>
          ))}
        </div>
      </section>

      {/* --- FEATURED PRODUCTS --- */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black dark:text-white mb-4">
              Weekly Best Sellers
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Handpicked items that our community loves the most.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product) => (
              <ProductCard product={product} />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
