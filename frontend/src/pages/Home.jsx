import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard"; // Ensure ProductCard uses dark:bg-slate-800
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import { ShoppingBag, ArrowRight, Zap, Star } from "lucide-react";

const products = [
  {
    _id: "1",
    name: "Wireless Headphones",
    thumbnail: "https://via.placeholder.com/200",
    price: 2999,
    mrp: 3999,
    discountPercentage: 25,
    rating: 4.5,
    numReviews: 128,
    stock: 12,
    isAvailable: true,
    isBestSeller: true,
  },
  {
    _id: "2",
    name: "Smart Watch",
    thumbnail: "https://via.placeholder.com/200",
    price: 4999,
    mrp: 6999,
    discountPercentage: 28,
    rating: 4.2,
    numReviews: 86,
    stock: 7,
    isAvailable: true,
    isBestSeller: false,
  },
  {
    _id: "3",
    name: "Bluetooth Speaker",
    thumbnail: "https://via.placeholder.com/200",
    price: 1999,
    mrp: 2499,
    discountPercentage: 20,
    rating: 4.0,
    numReviews: 64,
    stock: 0,
    isAvailable: false,
    isBestSeller: false,
  },
  {
    _id: "4",
    name: "Gaming Mouse",
    thumbnail: "https://via.placeholder.com/200",
    price: 1499,
    mrp: 1999,
    discountPercentage: 25,
    rating: 4.6,
    numReviews: 210,
    stock: 18,
    isAvailable: true,
    isBestSeller: true,
  },
  {
    _id: "5",
    name: "Mechanical Keyboard",
    thumbnail: "https://via.placeholder.com/200",
    price: 3499,
    mrp: 4999,
    discountPercentage: 30,
    rating: 4.4,
    numReviews: 97,
    stock: 4,
    isAvailable: true,
    isBestSeller: false,
  },
  {
    _id: "6",
    name: "Noise Cancelling Earbuds",
    thumbnail: "https://via.placeholder.com/200",
    price: 3999,
    mrp: 5999,
    discountPercentage: 33,
    rating: 4.3,
    numReviews: 143,
    stock: 9,
    isAvailable: true,
    isBestSeller: true,
  },
];

export default function Home() {
  return (
    <div className="bg-slate-50 dark:bg-[#030712] min-h-screen transition-colors duration-300">
      <Navbar />

      {/* --- HERO SECTION --- */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32">
        {/* Decorative Background Glows (Dark Mode Only) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none hidden dark:block">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-500/10 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-blue-500/10 blur-[120px] rounded-full"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 text-orange-600 dark:text-orange-400 text-xs font-bold uppercase tracking-widest mb-6 transition-all">
            <Zap size={14} /> New Season Arrivals
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6 leading-tight">
            Shop Smart. <span className="text-orange-500">Shop Easy.</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg text-slate-600 dark:text-slate-400 mb-10 leading-relaxed">
            Experience the next generation of shopping with curated collections across 
            electronics, fashion, and lifestyle essentials.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/products" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-orange-600/20 transition-all active:scale-95">
              Explore Products <ArrowRight size={20} />
            </Link>
            <Link to="/signup" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 px-8 py-4 rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
              Join ShopEasy
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}