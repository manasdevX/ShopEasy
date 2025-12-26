import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import SellerNavbar from "../../components/Seller/SellerNavbar";
import SellerFooter from "../../components/Seller/SellerFooter";
import { showError, showSuccess } from "../../utils/toast";
import {
  ArrowLeft,
  ImageIcon,
  Upload,
  X,
  Plus,
  Loader2,
  Tag as TagIcon,
  Sparkles,
  TrendingUp,
  ChevronDown,
  LayoutGrid,
  Package,
  Info,
  BarChart3,
} from "lucide-react";
import toast from "react-hot-toast";

// API URL Environment Variable
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function AddProduct() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false); // Loading state

  // State for Text Data
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    brand: "",
    category: "Electronics",
    subCategory: "",
    price: "",
    mrp: "",
    stock: "",
    tags: "",
    isFeatured: false,
    isBestSeller: false,
  });

  // State for Image Previews (Display only)
  const [previews, setPreviews] = useState({
    thumbnail: "",
    images: [],
  });

  // State for Actual Files (To send to Backend)
  const [files, setFiles] = useState({
    thumbnail: null,
    images: [],
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle Thumbnail
  const handleThumbnail = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 1. Set Preview URL
      setPreviews({ ...previews, thumbnail: URL.createObjectURL(file) });
      // 2. Set Actual File
      setFiles({ ...files, thumbnail: file });
    }
  };

  // Handle Gallery Images
  const handleGallery = (e) => {
    const selectedFiles = Array.from(e.target.files);

    // 1. Set Previews
    const newPreviews = selectedFiles.map((file) => URL.createObjectURL(file));
    setPreviews((prev) => ({
      ...prev,
      images: [...prev.images, ...newPreviews].slice(0, 5),
    }));

    // 2. Set Actual Files
    setFiles((prev) => ({
      ...prev,
      images: [...prev.images, ...selectedFiles].slice(0, 5),
    }));
  };

  // --- THESE FUNCTIONS MUST BE OUTSIDE handleGallery ---
  const removeThumbnail = () => {
    setPreviews((prev) => ({ ...prev, thumbnail: "" }));
    setFiles((prev) => ({ ...prev, thumbnail: null }));
  };

  const removeGalleryImage = (index) => {
    setPreviews((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
    setFiles((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("sellerToken");
      if (!token) {
        showError("Please login first");
        navigate("/Seller/login");
        return;
      }

      // 1. Create FormData (Required for File Uploads)
      const data = new FormData();

      // 2. Append Text Fields
      Object.keys(formData).forEach((key) => {
        data.append(key, formData[key]);
      });

      // 3. Append Files
      if (files.thumbnail) {
        data.append("thumbnail", files.thumbnail);
      }
      files.images.forEach((file) => {
        data.append("images", file);
      });

      // 4. Send Request
      const res = await fetch(`${API_URL}/api/products/add`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // Note: Do NOT set 'Content-Type' manually when using FormData
        },
        body: data,
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.message || "Failed to add product");

      showSuccess("Product Listed Successfully! 🎉");
      navigate("/Seller/dashboard");
    } catch (error) {
      console.error(error);
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle =
    "w-full px-5 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium";
  const labelStyle =
    "text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-2 block";

  return (
    <div className="bg-[#F8FAFC] dark:bg-[#020617] min-h-screen flex flex-col font-sans transition-colors duration-500">
      <SellerNavbar isLoggedIn={true} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-grow">
        {/* Header Section matching Edit Page */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="space-y-1">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-slate-500 hover:text-orange-500 font-semibold text-sm transition-colors group"
            >
              <ArrowLeft
                size={16}
                className="group-hover:-translate-x-1 transition-transform"
              />
              Back
            </button>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
              List New <span className="text-orange-500">Product</span>
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT COLUMN: MEDIA & INSIGHTS (Exact match to Edit UI) */}
          <div className="lg:col-span-4 space-y-6">
            <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
              <h3 className={labelStyle}>
                <ImageIcon size={14} /> Product Media
              </h3>

              {/* PRIMARY THUMBNAIL SLOT */}
              <div className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-orange-500/20 mb-4 hover:border-orange-500 cursor-pointer">
                {previews.thumbnail ? (
                  <>
                    <img
                      src={previews.thumbnail}
                      className="w-full h-full object-cover"
                      alt="Primary"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          removeThumbnail();
                        }}
                        className="p-3 bg-white rounded-full text-red-500 shadow-xl"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </>
                ) : (
                  <label className="flex flex-col items-center justify-center h-full w-full cursor-pointer text-slate-400">
                    <Plus size={32} />
                    <input
                      autoComplete="off"
                      type="file"
                      onChange={handleThumbnail}
                      className="hidden"
                      accept="image/*"
                    />
                  </label>
                )}
                <div className="absolute top-3 left-3 bg-orange-500 text-white text-[9px] font-black px-2 py-1 rounded-md">
                  PRIMARY
                </div>
              </div>

              {/* GALLERY SLOTS (2x2 Grid) */}
              <div className="grid grid-cols-2 gap-3">
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className="group relative aspect-square rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-center cursor-pointer"
                  >
                    {previews.images[idx] ? (
                      <>
                        <img
                          src={previews.images[idx]}
                          className="w-full h-full object-cover"
                          alt="Gallery"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => removeGalleryImage(idx)}
                            className="p-1.5 bg-white rounded-full text-red-500"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </>
                    ) : (
                      <label className="flex items-center justify-center w-full h-full cursor-pointer">
                        <Plus size={20} className="text-slate-300" />
                        <input
                          type="file"
                          autoComplete="off"
                          multiple
                          onChange={handleGallery}
                          className="hidden"
                          accept="image/*"
                        />
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: FORM (Matching Edit UI) */}
          <div className="lg:col-span-8">
            <form
              id="product-form"
              onSubmit={handleSubmit}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              <div className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className={labelStyle}>Product Title</label>
                    <input
                      type="text"
                      autoComplete="off"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={inputStyle}
                      placeholder="e.g. Sony WH-1000XM5"
                      required
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Brand</label>
                    <input
                      type="text"
                      autoComplete="off"
                      name="brand"
                      value={formData.brand}
                      onChange={handleChange}
                      className={inputStyle}
                      placeholder="e.g. Sony"
                      required
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Category</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className={inputStyle}
                    >
                      <option>Electronics</option>
                      <option>Fashion</option>
                      <option>Home</option>
                      <option>Beauty</option>
                      <option>Sports</option>
                    </select>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
                    <Sparkles size={16} className="text-orange-500" /> Pricing &
                    Inventory
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">
                        MRP (₹)
                      </label>
                      <input
                        type="number"
                        autoComplete="off"
                        name="mrp"
                        value={formData.mrp}
                        onChange={handleChange}
                        className={inputStyle}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">
                        Sale Price (₹)
                      </label>
                      <input
                        type="number"
                        autoComplete="off"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        className={inputStyle}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">
                        Initial Stock
                      </label>
                      <input
                        type="number"
                        autoComplete="off"
                        name="stock"
                        value={formData.stock}
                        onChange={handleChange}
                        className={inputStyle}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className={labelStyle}>Detailed Description</label>
                  <textarea
                    name="description"
                    rows="5"
                    value={formData.description}
                    onChange={handleChange}
                    className={`${inputStyle} resize-none`}
                    placeholder="Describe your product features..."
                    required
                  />
                </div>

                <div className="bg-orange-500/5 p-6 rounded-2xl border border-orange-500/10">
                  <h4 className="text-xs font-bold text-orange-600 uppercase mb-4">
                    Visibility Settings
                  </h4>
                  <div className="flex flex-wrap gap-6">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        autoComplete="off"
                        name="isFeatured"
                        checked={formData.isFeatured}
                        onChange={handleChange}
                        className="w-4 h-4 accent-orange-500"
                      />
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        Featured Product
                      </span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        autoComplete="off"
                        name="isBestSeller"
                        checked={formData.isBestSeller}
                        onChange={handleChange}
                        className="w-4 h-4 accent-orange-500"
                      />
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        Best Seller Tag
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="px-8 py-6 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-6 py-2.5 text-slate-500 text-sm font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-orange-500/30 flex items-center gap-2"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  Publish Product
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
      <SellerFooter />
    </div>
  );
}
