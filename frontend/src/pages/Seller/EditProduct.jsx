import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import SellerNavbar from "../../components/Seller/SellerNavbar";
import SellerFooter from "../../components/Seller/SellerFooter";
import { 
  ArrowLeft, RefreshCcw, Trash2, Upload, Plus, X, 
  ChevronDown, Package, Tag as TagIcon, Sparkles,
  Eye, Save, AlertCircle, TrendingUp, Image as ImageIcon
} from "lucide-react";
import toast from "react-hot-toast";

export default function EditProduct() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tagInput, setTagInput] = useState("");

  // Refs for file inputs
  const thumbnailInputRef = useRef(null);
  const galleryInputRefs = useRef([]);

  const PLACEHOLDER_PRODUCT = {
    name: "Acoustic Pro Headphones",
    description: "Premium sound quality with active noise cancellation and 40-hour battery life. Designed for comfort and high-fidelity audio enthusiasts.",
    brand: "SoundWave",
    category: "Electronics",
    price: 1999,
    mrp: 3999,
    stock: 24,
    tags: ["wireless", "studio", "pro"],
    thumbnail: "https://images.unsplash.com/photo-1546435770-a3e426da473b?w=800",
    images: [
        "https://images.unsplash.com/photo-1583333222040-546059e8911b?w=400",
        null, null, null
    ],
    isFeatured: true,
    isBestSeller: true
  };

  const [formData, setFormData] = useState(PLACEHOLDER_PRODUCT);

  useEffect(() => {
    setLoading(true);
    const simulationTimer = setTimeout(() => {
      setFormData(PLACEHOLDER_PRODUCT);
      setLoading(false);
      toast.success("Listing Draft Loaded", {
        style: { borderRadius: '12px', background: '#0F172A', color: '#fff' }
      });
    }, 1000);
    return () => clearTimeout(simulationTimer);
  }, []);

  const discount = formData.mrp > 0 
    ? Math.round(((formData.mrp - formData.price) / formData.mrp) * 100) 
    : 0;

  // --- IMAGE LOGIC ---
  const handleImageChange = (e, index = -1) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (index === -1) {
        setFormData(prev => ({ ...prev, thumbnail: reader.result }));
      } else {
        const newImages = [...formData.images];
        newImages[index] = reader.result;
        setFormData(prev => ({ ...prev, images: newImages }));
      }
      toast.success("Image uploaded", { icon: '📸' });
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (e, index = -1) => {
    e.stopPropagation(); 
    if (index === -1) {
      setFormData(prev => ({ ...prev, thumbnail: null }));
    } else {
      const newImages = [...formData.images];
      newImages[index] = null;
      setFormData(prev => ({ ...prev, images: newImages }));
    }
    toast.error("Image removed");
  };

  // --- FORM LOGIC ---
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === "checkbox" ? checked : value 
    }));
  };

  const addTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      }
      setTagInput("");
    }
  };

  const removeTag = (index) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter((_, i) => i !== index) }));
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    toast.promise(
        new Promise((resolve) => setTimeout(resolve, 1500)),
        {
          loading: 'Syncing with Catalog...',
          success: 'Product Updated Successfully!',
          error: 'Error updating product.',
        }
      );
  };

  const inputStyle = "w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-xl text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-300 placeholder:text-slate-400 font-medium";
  const labelStyle = "text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-2";

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-[#020617]">
      <div className="w-20 h-20 border-4 border-orange-500/10 border-t-orange-500 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="bg-[#F8FAFC] dark:bg-[#020617] min-h-screen flex flex-col font-sans">
      <SellerNavbar isLoggedIn={true} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* TOP BAR */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="space-y-1">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-orange-500 font-semibold text-sm transition-colors group">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
            </button>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">Manage Listing</h1>
          </div>
          
          <div className="flex items-center gap-3">
             <button onClick={() => window.location.reload()} className="p-2.5 text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 transition-all shadow-sm">
                <RefreshCcw size={18} />
             </button>
             <button className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold rounded-xl border border-slate-200 dark:border-slate-800 hover:border-orange-500 transition-all shadow-sm">
                <Eye size={18} /> Preview
             </button>
             <button onClick={handleUpdate} className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 dark:bg-orange-500 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 hover:scale-[1.02] active:scale-95 transition-all">
                <Save size={18} /> Save Changes
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Media & Insights */}
          <div className="lg:col-span-4 space-y-6">
            <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className={labelStyle}><ImageIcon size={14} /> Product Media</h3>
                <span className="text-[10px] font-bold text-slate-400">
                   {[formData.thumbnail, ...formData.images].filter(Boolean).length} / 5 Slots
                </span>
              </div>

              {/* THUMBNAIL SLOT (PRIMARY) */}
              <div 
                onClick={() => thumbnailInputRef.current.click()}
                className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-orange-500/20 mb-4 transition-all hover:border-orange-500 cursor-pointer"
              >
                <input type="file" ref={thumbnailInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, -1)} />
                {formData.thumbnail ? (
                  <>
                    <img src={formData.thumbnail} className="w-full h-full object-cover" alt="Primary" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <button onClick={(e) => removeImage(e, -1)} className="p-3 bg-white rounded-full text-red-500 shadow-xl hover:scale-110 transition-transform">
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <Plus size={32} />
                    <span className="text-xs font-bold mt-2">Upload Hero</span>
                  </div>
                )}
                <div className="absolute top-3 left-3 bg-orange-500 text-white text-[9px] font-black px-2 py-1 rounded-md">PRIMARY</div>
              </div>

              {/* GALLERY SLOTS (OPTIONAL 4) */}
              <div className="grid grid-cols-2 gap-3">
                {[0, 1, 2, 3].map((idx) => {
                  const img = formData.images[idx];
                  return (
                    <div 
                      key={idx} 
                      onClick={() => galleryInputRefs.current[idx].click()}
                      className="group relative aspect-square rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:border-orange-500/50 transition-all cursor-pointer"
                    >
                      <input 
                        type="file" 
                        ref={el => galleryInputRefs.current[idx] = el}
                        className="hidden" 
                        accept="image/*"
                        onChange={(e) => handleImageChange(e, idx)} 
                      />
                      {img ? (
                        <>
                          <img src={img} className="w-full h-full object-cover" alt="Gallery" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <button onClick={(e) => removeImage(e, idx)} className="p-1.5 bg-white rounded-full text-red-500 shadow-xl">
                              <X size={14} />
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-slate-300 dark:text-slate-600">
                          <Plus size={20} />
                          <span className="text-[9px] font-bold uppercase tracking-tighter">Add</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Seller Insights */}
            <section className="bg-slate-900 rounded-3xl p-6 text-white border border-slate-800 shadow-xl relative overflow-hidden">
                <div className="absolute -right-8 -bottom-8 text-white/[0.03] rotate-12"><TrendingUp size={160} /></div>
                <h3 className="text-xs font-black uppercase tracking-[.2em] text-orange-500 mb-6 flex items-center gap-2"><TrendingUp size={14} /> Insights</h3>
                <div className="space-y-5 relative z-10">
                    <div className="flex justify-between items-end">
                        <span className="text-slate-400 text-xs font-semibold">Stock Status</span>
                        <span className={`text-sm font-bold ${formData.stock < 10 ? 'text-red-400' : 'text-green-400'}`}>{formData.stock} Units</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-orange-500 h-full w-[60%]"></div>
                    </div>
                </div>
            </section>
          </div>

          {/* RIGHT COLUMN: Edit Form */}
          <div className="lg:col-span-8 space-y-6">
            <form onSubmit={handleUpdate} className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-8">
                    <button type="button" className="text-sm font-bold text-orange-500 border-b-2 border-orange-500 pb-4 -mb-[21px]">General Info</button>
                </div>

                <div className="p-8 space-y-8">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className={labelStyle}>Product Title</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} className={inputStyle} />
                        </div>
                        <div>
                            <label className={labelStyle}>Brand Name</label>
                            <input type="text" name="brand" value={formData.brand} onChange={handleChange} className={inputStyle} />
                        </div>
                        <div>
                            <label className={labelStyle}>Category</label>
                            <div className="relative">
                                <select name="category" value={formData.category} onChange={handleChange} className={`${inputStyle} appearance-none`}>
                                    <option>Electronics</option>
                                    <option>SaaS Products</option>
                                    <option>Digital Services</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                            </div>
                        </div>
                    </div>

                    {/* Pricing */}
                    <div className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2"><Sparkles size={16} className="text-orange-500" /> Pricing</h4>
                            {discount > 0 && <span className="bg-green-100 dark:bg-green-500/10 text-green-600 text-[10px] font-black px-2 py-1 rounded uppercase border border-green-200">{discount}% Discount</span>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">MRP</label><input type="number" name="mrp" value={formData.mrp} onChange={handleChange} className={inputStyle} /></div>
                            <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Price</label><input type="number" name="price" value={formData.price} onChange={handleChange} className={`${inputStyle} border-orange-500/30`} /></div>
                            <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Stock</label><input type="number" name="stock" value={formData.stock} onChange={handleChange} className={inputStyle} /></div>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className={labelStyle}>Detailed Description</label>
                        <textarea name="description" rows="5" value={formData.description} onChange={handleChange} className={`${inputStyle} resize-none`} />
                    </div>

                    {/* Tags */}
                    <div>
                        <label className={labelStyle}><TagIcon size={14} /> Keywords</label>
                        <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl">
                            {formData.tags.map((tag, i) => (
                                <span key={i} className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold border border-slate-100 dark:border-slate-700 shadow-sm">
                                    {tag}
                                    <button type="button" onClick={() => removeTag(i)} className="text-slate-400 hover:text-red-500"><X size={14} /></button>
                                </span>
                            ))}
                            <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={addTag} className="flex-grow bg-transparent outline-none text-xs text-slate-900 dark:text-white px-2" placeholder="Add tag..." />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-6 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <button type="button" className="text-red-500 text-xs font-bold flex items-center gap-2 hover:underline"><Trash2 size={14} /> Archive Listing</button>
                    <div className="flex gap-4">
                        <button type="button" onClick={() => navigate(-1)} className="px-6 py-2.5 text-slate-500 text-sm font-bold">Cancel</button>
                        <button type="submit" className="px-8 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-orange-500/30">Publish Updates</button>
                    </div>
                </div>
            </form>
          </div>
        </div>
      </main>
      <SellerFooter />
    </div>
  );
}