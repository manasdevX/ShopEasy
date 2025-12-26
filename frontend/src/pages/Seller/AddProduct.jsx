import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import SellerNavbar from "../../components/Seller/SellerNavbar";
import SellerFooter from "../../components/Seller/SellerFooter";
import { showError, showSuccess } from "../../utils/toast";
import {
  ArrowLeft,
  Plus,
  Upload,
  Tag,
  Loader2,
  X,
  ChevronDown,
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
    <div className="bg-white dark:bg-[#030712] min-h-screen transition-colors duration-500 flex flex-col">
      <SellerNavbar isLoggedIn={true} />
      <main className="max-w-5xl mx-auto px-6 py-12 flex-grow">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 font-bold text-sm mb-8 hover:text-orange-500 transition-colors"
        >
          <ArrowLeft size={18} /> Back
        </button>

        <header className="mb-10">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
            List New <span className="text-orange-500">Product.</span>
          </h1>
        </header>

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">
          {/* Left: Media Upload */}
          <div className="space-y-6">
            <div className="bg-slate-50 dark:bg-slate-900/40 p-6 rounded-[2.5rem] border dark:border-slate-800">
              <label className={labelStyle}>Main Thumbnail *</label>
              <div className="relative group aspect-square bg-slate-200 dark:bg-slate-800 rounded-3xl overflow-hidden mb-4 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-orange-500 transition-colors">
                {previews.thumbnail ? (
                  <div className="relative h-full w-full">
                    <img
                      src={previews.thumbnail}
                      className="w-full h-full object-cover"
                      alt="thumb"
                    />
                    <button
                      type="button"
                      // Added z-50 to ensure it stays above the hidden file input
                      className="absolute top-3 right-3 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg z-50"
                      onClick={(e) => {
                        e.preventDefault(); // Prevent any default behavior
                        e.stopPropagation(); // Stop the click from bubbling to the input
                        removeThumbnail();
                      }}
                    >
                      <X size={15} />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 pointer-events-none">
                    <Upload size={32} className="mb-2" />
                    <span className="text-[10px] font-bold">
                      CLICK TO UPLOAD
                    </span>
                  </div>
                )}
                <input
                  type="file"
                  autoComplete="off"
                  onChange={handleThumbnail}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  accept="image/*"
                />
              </div>

              <label className={labelStyle}>Gallery Images (Max 5)</label>
              <div className="grid grid-cols-3 gap-2">
                {previews.images.map((img, i) => (
                  <div
                    key={i}
                    className="relative aspect-square rounded-xl overflow-hidden border dark:border-slate-700 group"
                  >
                    <img
                      src={img}
                      className="w-full h-full object-cover"
                      alt="gallery"
                    />
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(i)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {previews.images.length < 5 && (
                  <label className="aspect-square flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer hover:border-orange-500 transition-colors">
                    <Plus size={20} className="text-slate-400" />
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
            </div>

            {/* Visibility Toggles */}
            <div className="bg-orange-500/10 p-6 rounded-[2rem] border border-orange-500/20">
              <h4 className="text-orange-600 dark:text-orange-400 font-black text-xs uppercase mb-3">
                Visibility
              </h4>
              <div className="space-y-3">
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

          {/* Right: Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className={labelStyle}>Product Name *</label>
                <input
                  autoComplete="off"
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className={inputStyle}
                  placeholder="e.g. Sony WH-1000XM5"
                />
              </div>
              <div>
                <label className={labelStyle}>Brand *</label>
                <input
                  type="text"
                  autoComplete="off"
                  name="brand"
                  required
                  value={formData.brand}
                  onChange={handleChange}
                  className={inputStyle}
                  placeholder="e.g. Sony"
                />
              </div>
              <div>
                <label className={labelStyle}>Category *</label>
                {/* 1. Wrapper must be relative */}
                <div className="relative group">
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    // 2. appearance-none removes the old arrow.
                    // 3. pr-12 adds space so text doesn't hit the new arrow.
                    className={`${inputStyle} appearance-none pr-12 cursor-pointer`}
                  >
                    <option>Electronics</option>
                    <option>Fashion</option>
                    <option>Home</option>
                    <option>Beauty</option>
                    <option>Sports</option>
                  </select>

                  {/* 4. This is your new arrow. Adjust 'right-5' to move it further left or right */}
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-orange-500 transition-colors">
                    <ChevronDown size={18} strokeWidth={3} />
                  </div>
                </div>
              </div>
              <div>
                <label className={labelStyle}>Sub-Category</label>
                <input
                  type="text"
                  autoComplete="off"
                  name="subCategory"
                  value={formData.subCategory}
                  onChange={handleChange}
                  className={inputStyle}
                  placeholder="e.g. Wireless Headphones"
                />
              </div>
              <div>
                <label className={labelStyle}>Stock Quantity *</label>
                <input
                  type="number"
                  autoComplete="off"
                  name="stock"
                  required
                  value={formData.stock}
                  onChange={handleChange}
                  className={inputStyle}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 p-6 bg-slate-50 dark:bg-slate-900/40 rounded-[2rem]">
              <div>
                <label className={labelStyle}>MRP (Original Price) *</label>
                <input
                  type="number"
                  name="mrp"
                  autoComplete="off"
                  required
                  value={formData.mrp}
                  onChange={handleChange}
                  className={inputStyle}
                  placeholder="₹ 0.00"
                />
              </div>
              <div>
                <label className={labelStyle}>Selling Price *</label>
                <input
                  type="number"
                  name="price"
                  required
                  autoComplete="off"
                  value={formData.price}
                  onChange={handleChange}
                  className={inputStyle}
                  placeholder="₹ 0.00"
                />
              </div>
            </div>

            <div>
              <label className={labelStyle}>Description *</label>
              <textarea
                name="description"
                required
                rows="4"
                value={formData.description}
                onChange={handleChange}
                className={`${inputStyle} resize-none`}
                placeholder="Write detailed product features..."
              />
            </div>

            <div>
              <label className={labelStyle}>Tags (Comma separated)</label>
              <div className="relative">
                <Tag
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type="text"
                  name="tags"
                  autoComplete="off"
                  value={formData.tags}
                  onChange={handleChange}
                  className={`${inputStyle} pl-12`}
                  placeholder="tech, audio, wireless"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 dark:bg-orange-500 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest hover:scale-[1.01] transition-all shadow-xl shadow-orange-500/10 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-3"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" /> Publishing...
                </>
              ) : (
                "Publish Product"
              )}
            </button>
          </div>
        </form>
      </main>
      <SellerFooter />
    </div>
  );
}
