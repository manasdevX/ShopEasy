import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SellerNavbar from "../../components/Seller/SellerNavbar";
import SellerFooter from "../../components/Seller/SellerFooter";
import { ArrowLeft, RefreshCcw, Trash2, Upload, Tag, ImageIcon } from "lucide-react";
import toast from "react-hot-toast";

export default function EditProduct() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    brand: "",
    category: "",
    subCategory: "",
    price: "",
    mrp: "",
    stock: "",
    thumbnail: "",
    images: [],
    tags: "",
    isFeatured: false,
    isBestSeller: false
  });

  useEffect(() => {
    // Mocking API fetch based on Product Schema
    const fetchProduct = () => {
      setFormData({
        name: "Premium Headphones",
        description: "Best in class noise cancellation.",
        brand: "Sony",
        category: "Electronics",
        subCategory: "Audio",
        price: 2499,
        mrp: 4999,
        stock: 12,
        thumbnail: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
        images: ["https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400"],
        tags: "headphone, audio, sony",
        isFeatured: true,
        isBestSeller: false
      });
    };
    fetchProduct();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    toast.success("Catalog updated!");
    navigate("/Seller/dashboard");
  };

  const inputStyle = "w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20 transition-all font-medium";
  const labelStyle = "text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-2 block";

  return (
    <div className="bg-slate-50 dark:bg-[#030712] min-h-screen transition-colors duration-500 flex flex-col">
      <SellerNavbar isLoggedIn={true} />
      <main className="max-w-5xl mx-auto px-6 py-12 flex-grow w-full">
        
        <div className="flex justify-between items-center mb-10">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 font-bold hover:text-orange-500">
            <ArrowLeft size={18} /> Back
          </button>
          <button className="p-3 text-red-500 bg-red-50 dark:bg-red-500/10 rounded-xl hover:bg-red-500 hover:text-white transition-all">
            <Trash2 size={20} />
          </button>
        </div>

        <div className="mb-10">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Edit <span className="text-orange-500">Listing.</span></h1>
          <p className="text-slate-400 font-bold text-xs uppercase mt-2 tracking-widest">Product ID: #PROD-{id}</p>
        </div>

        <form onSubmit={handleUpdate} className="grid lg:grid-cols-3 gap-8">
          {/* Media Edit */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-sm border dark:border-slate-800">
              <label className={labelStyle}>Primary Thumbnail</label>
              <div className="relative aspect-square rounded-3xl overflow-hidden group">
                <img src={formData.thumbnail} className="w-full h-full object-cover" alt="product" />
                <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Upload className="text-white" size={24} />
                  <input type="file" className="hidden" />
                </label>
              </div>
              
              <div className="mt-6">
                <label className={labelStyle}>Gallery</label>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {formData.images.map((img, i) => (
                    <img key={i} src={img} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                  ))}
                  <button type="button" className="w-16 h-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-400">
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-4">Sale Performance</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Total Reviews</span>
                  <span className="font-black">128</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Avg Rating</span>
                  <span className="font-black text-orange-500">4.8/5.0</span>
                </div>
              </div>
            </div>
          </div>

          {/* Fields Edit */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border dark:border-slate-800 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className={labelStyle}>Product Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} className={inputStyle} />
                </div>
                <div>
                  <label className={labelStyle}>Brand</label>
                  <input type="text" name="brand" value={formData.brand} onChange={handleChange} className={inputStyle} />
                </div>
                <div>
                  <label className={labelStyle}>Stock Status</label>
                  <input type="number" name="stock" value={formData.stock} onChange={handleChange} className={inputStyle} />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl">
                <div>
                  <label className={labelStyle}>MRP</label>
                  <input type="number" name="mrp" value={formData.mrp} onChange={handleChange} className={inputStyle} />
                </div>
                <div>
                  <label className={labelStyle}>Selling Price</label>
                  <input type="number" name="price" value={formData.price} onChange={handleChange} className={inputStyle} />
                </div>
              </div>

              <div>
                <label className={labelStyle}>Full Description</label>
                <textarea name="description" rows="5" value={formData.description} onChange={handleChange} className={`${inputStyle} resize-none`} />
              </div>

              <div className="flex gap-4">
                 <button type="submit" className="flex-grow bg-orange-500 text-white py-5 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-orange-600 transition-all">
                  <RefreshCcw size={18} /> Update Listing
                </button>
              </div>
            </div>
          </div>
        </form>
      </main>
      <SellerFooter />
    </div>
  );
}