import React from "react";
import { Link, useNavigate } from "react-router-dom";
import SellerNavbar from "../../components/Seller/SellerNavbar";
import SellerFooter from "../../components/Seller/SellerFooter";
import { Plus, Search, Edit3, Trash2, ExternalLink } from "lucide-react";

export default function Products() {
  const navigate = useNavigate();
  const mockProducts = [
    { id: 1, name: "Premium Wireless Headphones", price: "₹2,999", stock: 15, category: "Electronics", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200" },
    { id: 2, name: "Minimalist Leather Wallet", price: "₹899", stock: 0, category: "Fashion", image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=200" },
  ];

  return (
    <div className="bg-white dark:bg-[#030712] min-h-screen transition-colors duration-500 font-sans">
      <SellerNavbar isLoggedIn={true} />

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
              My <span className="text-orange-500">Products.</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Manage your catalog and stock levels.</p>
          </div>
          <Link to="/Seller/add-product" className="flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-orange-500/20 hover:scale-105 transition-all">
            <Plus size={20} /> Add New Product
          </Link>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-3xl mb-8 border border-transparent dark:border-slate-800 flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search products..." 
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500/20 font-medium text-slate-900 dark:text-white"
            />
          </div>
          <select className="px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-bold text-sm text-slate-600 dark:text-slate-300">
            <option>All Categories</option>
            <option>Electronics</option>
            <option>Fashion</option>
          </select>
        </div>

        {/* PRODUCT LIST */}
        <div className="grid gap-4">
          {mockProducts.map((product) => (
            <div key={product.id} className="bg-white dark:bg-slate-900/20 border border-slate-100 dark:border-slate-800 p-4 rounded-[2rem] flex items-center justify-between hover:shadow-xl hover:shadow-orange-500/5 transition-all group">
              <div className="flex items-center gap-6">
                <img src={product.image} className="w-20 h-20 rounded-2xl object-cover" alt={product.name} />
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-orange-500 transition-colors">{product.name}</h3>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{product.category}</p>
                  <p className="text-orange-500 font-black">{product.price}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-8">
                <div className="text-center hidden sm:block">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock</p>
                  <p className={`font-bold ${product.stock === 0 ? "text-red-500" : "text-slate-900 dark:text-white"}`}>
                    {product.stock === 0 ? "Out of Stock" : `${product.stock} Units`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => navigate(`/Seller/edit-product/${product.id}`)} className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-orange-500 hover:text-white transition-all">
                    <Edit3 size={18} />
                  </button>
                  <button className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <SellerFooter />
    </div>
  );
}