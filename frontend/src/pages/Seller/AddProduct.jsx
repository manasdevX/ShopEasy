import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import SellerNavbar from "../../components/Seller/SellerNavbar";
import SellerFooter from "../../components/Seller/SellerFooter";
import { ArrowLeft, Plus, Upload, X, Tag } from "lucide-react";
import toast from "react-hot-toast";

export default function AddProduct() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    brand: "",
    category: "Electronics",
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  // Handle Thumbnail (Single)
  const handleThumbnail = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, thumbnail: URL.createObjectURL(file) });
      toast.success("Thumbnail added");
    }
  };

  // Handle Gallery Images (Multiple)
  const handleGallery = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => URL.createObjectURL(file));
    setFormData(prev => ({ ...prev, images: [...prev.images, ...newImages].slice(0, 5) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Logic: Calculate discount % before sending to API
    const discount = formData.mrp > 0 ? ((formData.mrp - formData.price) / formData.mrp) * 100 : 0;
    
    console.log("Submitting Product:", { ...formData, discountPercentage: discount.toFixed(2) });
    toast.success("Product listed successfully!");
    navigate("/Seller/dashboard");
  };

  const inputStyle = "w-full px-5 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium";
  const labelStyle = "text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-2 block";

  return (
    <div className="bg-white dark:bg-[#030712] min-h-screen transition-colors duration-500 flex flex-col">
      <SellerNavbar isLoggedIn={true} />
      <main className="max-w-5xl mx-auto px-6 py-12 flex-grow">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 font-bold text-sm mb-8 hover:text-orange-500 transition-colors">
          <ArrowLeft size={18} /> Back
        </button>

        <header className="mb-10">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">List New <span className="text-orange-500">Product.</span></h1>
        </header>

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">
          {/* Left: Media Upload */}
          <div className="space-y-6">
            <div className="bg-slate-50 dark:bg-slate-900/40 p-6 rounded-[2.5rem] border dark:border-slate-800">
              <label className={labelStyle}>Main Thumbnail *</label>
              <div className="relative group aspect-square bg-slate-200 dark:bg-slate-800 rounded-3xl overflow-hidden mb-4">
                {formData.thumbnail ? (
                  <img src={formData.thumbnail} className="w-full h-full object-cover" alt="thumb" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <Upload size={32} className="mb-2" />
                    <span className="text-[10px] font-bold">CLICK TO UPLOAD</span>
                  </div>
                )}
                <input type="file" onChange={handleThumbnail} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>

              <label className={labelStyle}>Gallery Images (Max 5)</label>
              <div className="grid grid-cols-3 gap-2">
                {formData.images.map((img, i) => (
                  <div key={i} className="aspect-square rounded-xl overflow-hidden border dark:border-slate-700">
                    <img src={img} className="w-full h-full object-cover" alt="gallery" />
                  </div>
                ))}
                {formData.images.length < 5 && (
                  <label className="aspect-square flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer hover:border-orange-500 transition-colors">
                    <Plus size={20} className="text-slate-400" />
                    <input type="file" multiple onChange={handleGallery} className="hidden" />
                  </label>
                )}
              </div>
            </div>
            
            <div className="bg-orange-500/10 p-6 rounded-[2rem] border border-orange-500/20">
              <h4 className="text-orange-600 dark:text-orange-400 font-black text-xs uppercase mb-3">Visibility</h4>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" name="isFeatured" checked={formData.isFeatured} onChange={handleChange} className="w-4 h-4 accent-orange-500" />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Featured Product</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" name="isBestSeller" checked={formData.isBestSeller} onChange={handleChange} className="w-4 h-4 accent-orange-500" />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Best Seller Tag</span>
                </label>
              </div>
            </div>
          </div>

          {/* Right: Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className={labelStyle}>Product Name *</label>
                <input type="text" name="name" required value={formData.name} onChange={handleChange} className={inputStyle} placeholder="e.g. Sony WH-1000XM5" />
              </div>
              <div>
                <label className={labelStyle}>Brand *</label>
                <input type="text" name="brand" required value={formData.brand} onChange={handleChange} className={inputStyle} placeholder="e.g. Sony" />
              </div>
              <div>
                <label className={labelStyle}>Category *</label>
                <select name="category" value={formData.category} onChange={handleChange} className={inputStyle}>
                  <option>Electronics</option>
                  <option>Fashion</option>
                  <option>Home</option>
                </select>
              </div>
              <div>
                <label className={labelStyle}>Sub-Category</label>
                <input type="text" name="subCategory" value={formData.subCategory} onChange={handleChange} className={inputStyle} placeholder="e.g. Wireless Headphones" />
              </div>
              <div>
                <label className={labelStyle}>Stock Quantity *</label>
                <input type="number" name="stock" required value={formData.stock} onChange={handleChange} className={inputStyle} placeholder="0" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 p-6 bg-slate-50 dark:bg-slate-900/40 rounded-[2rem]">
              <div>
                <label className={labelStyle}>MRP (Original Price) *</label>
                <input type="number" name="mrp" required value={formData.mrp} onChange={handleChange} className={inputStyle} placeholder="₹ 0.00" />
              </div>
              <div>
                <label className={labelStyle}>Selling Price *</label>
                <input type="number" name="price" required value={formData.price} onChange={handleChange} className={inputStyle} placeholder="₹ 0.00" />
              </div>
            </div>

            <div>
              <label className={labelStyle}>Description *</label>
              <textarea name="description" required rows="4" value={formData.description} onChange={handleChange} className={`${inputStyle} resize-none`} placeholder="Write detailed product features..." />
            </div>

            <div>
              <label className={labelStyle}>Tags (Comma separated)</label>
              <div className="relative">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" name="tags" value={formData.tags} onChange={handleChange} className={`${inputStyle} pl-12`} placeholder="tech, audio, wireless" />
              </div>
            </div>

            <button type="submit" className="w-full bg-slate-900 dark:bg-orange-500 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest hover:scale-[1.01] transition-all shadow-xl shadow-orange-500/10">
              Publish Product
            </button>
          </div>
        </form>
      </main>
      <SellerFooter />
    </div>
  );
}