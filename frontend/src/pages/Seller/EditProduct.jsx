import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SellerNavbar from "../../components/Seller/SellerNavbar";
import SellerFooter from "../../components/Seller/SellerFooter";
import { showSuccess, showError } from "../../utils/toast";
import {
  ArrowLeft,
  Trash2,
  Plus,
  X,
  Tag as TagIcon,
  Sparkles,
  Save,
  TrendingUp,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [tagInput, setTagInput] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    brand: "",
    category: "Electronics",
    price: 0,
    mrp: 0,
    stock: 0,
    tags: [],
    thumbnail: null, // Stores URL (string) or Base64 (preview)
    images: [null, null, null, null], // Stores URLs (string) or Base64 (previews)
  });

  // File states for NEW uploads (Files to be sent to backend)
  const [newThumbnail, setNewThumbnail] = useState(null);
  const [newGalleryFiles, setNewGalleryFiles] = useState([
    null,
    null,
    null,
    null,
  ]);

  const thumbnailInputRef = useRef(null);
  const galleryInputRefs = useRef([]);

  // --- FETCH PRODUCT DATA ---
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`${API_URL}/api/products/${id}`);
        const data = await res.json();

        if (res.ok) {
          setFormData({
            ...data,
            // Ensure gallery images array has length 4 for UI slots
            images: data.images
              ? [...data.images, ...Array(4 - data.images.length).fill(null)]
              : [null, null, null, null],
          });
        } else {
          showError("Product not found");
          navigate("/Seller/Products");
        }
      } catch (err) {
        showError("Error loading product");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, navigate]);

  // --- IMAGE LOGIC ---
  const handleImageChange = (e, index = -1) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (index === -1) {
        // Thumbnail Update
        setFormData((prev) => ({ ...prev, thumbnail: reader.result }));
        setNewThumbnail(file); // Save File for upload
      } else {
        // Gallery Update
        const newPreviews = [...formData.images];
        newPreviews[index] = reader.result;
        setFormData((prev) => ({ ...prev, images: newPreviews }));

        const newFiles = [...newGalleryFiles];
        newFiles[index] = file; // Save File for upload
        setNewGalleryFiles(newFiles);
      }
      showSuccess("Image preview updated");
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (e, index = -1) => {
    e.stopPropagation();
    if (index === -1) {
      setFormData((prev) => ({ ...prev, thumbnail: null }));
      setNewThumbnail(null);
    } else {
      const newImages = [...formData.images];
      newImages[index] = null;
      setFormData((prev) => ({ ...prev, images: newImages }));

      const newFiles = [...newGalleryFiles];
      newFiles[index] = null; // Clear file if it was new
      setNewGalleryFiles(newFiles);
    }
  };

  // --- FORM LOGIC ---
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const addTag = (e) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData((prev) => ({
          ...prev,
          tags: [...prev.tags, tagInput.trim()],
        }));
      }
      setTagInput("");
    }
  };

  const removeTag = (index) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index),
    }));
  };

  // --- ✅ FIX: ROBUST UPDATE HANDLER ---
  const handleUpdate = async (e) => {
    if (e) e.preventDefault();
    setIsUpdating(true);

    const updateData = new FormData();
    // 1. Append Text Data
    updateData.append("name", formData.name);
    updateData.append("description", formData.description);
    updateData.append("price", formData.price);
    updateData.append("mrp", formData.mrp);
    updateData.append("stock", formData.stock);
    updateData.append("category", formData.category);
    updateData.append("brand", formData.brand);
    updateData.append("tags", JSON.stringify(formData.tags));

    // 2. Handle THUMBNAIL
    // If a new file exists, send it as 'thumbnail' to replace the old one.
    if (newThumbnail) {
      updateData.append("thumbnail", newThumbnail);
    }
    // If no new file, but we have an old URL, send it as 'existingThumbnail'.
    else if (
      formData.thumbnail &&
      typeof formData.thumbnail === "string" &&
      formData.thumbnail.startsWith("http")
    ) {
      updateData.append("existingThumbnail", formData.thumbnail);
    }

    // 3. Handle GALLERY IMAGES
    // We iterate through the 4 slots to see what we need to keep or upload.
    for (let i = 0; i < 4; i++) {
      const newFile = newGalleryFiles[i]; // Is there a new file?
      const existingUrl = formData.images[i]; // Is there a preview/url?

      if (newFile) {
        // Case A: New File Upload -> Append to 'images' for Cloudinary upload
        updateData.append("images", newFile);
      } else if (
        existingUrl &&
        typeof existingUrl === "string" &&
        existingUrl.startsWith("http")
      ) {
        // Case B: Existing URL -> Append to 'existingImages' so backend keeps it
        updateData.append("existingImages", existingUrl);
      }
      // Case C: Null/Empty -> Do nothing, effectively deleting it from backend list
    }

    try {
      const token = localStorage.getItem("sellerToken");
      const res = await fetch(`${API_URL}/api/products/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: updateData,
      });

      if (res.ok) {
        showSuccess("Product Updated Successfully!");
        navigate("/Seller/Products");
      } else {
        const error = await res.json();
        throw new Error(error.message);
      }
    } catch (err) {
      showError(err.message || "Update failed");
    } finally {
      setIsUpdating(false);
    }
  };

  const inputStyle =
    "w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-xl text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-300 placeholder:text-slate-400 font-medium";
  const labelStyle =
    "text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-2";

  if (loading)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-[#020617]">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
        <p className="mt-4 text-slate-500 font-bold uppercase tracking-widest text-xs">
          Fetching Listing...
        </p>
      </div>
    );

  return (
    <div className="bg-[#F8FAFC] dark:bg-[#020617] min-h-screen flex flex-col font-sans">
      <SellerNavbar isLoggedIn={true} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="space-y-1">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-slate-500 hover:text-orange-500 font-semibold text-sm transition-colors group"
            >
              <ArrowLeft
                size={16}
                className="group-hover:-translate-x-1 transition-transform"
              />{" "}
              Back
            </button>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
              Edit Product
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
            >
              {isUpdating ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Save size={18} />
              )}
              {isUpdating ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* MEDIA COLUMN */}
          <div className="lg:col-span-4 space-y-6">
            <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
              <h3 className={labelStyle}>
                <ImageIcon size={14} /> Product Media
              </h3>

              {/* PRIMARY THUMBNAIL */}
              <div
                onClick={() => thumbnailInputRef.current.click()}
                className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-orange-500/20 mb-4 hover:border-orange-500 cursor-pointer"
              >
                <input
                  type="file"
                  ref={thumbnailInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, -1)}
                />
                {formData.thumbnail ? (
                  <>
                    <img
                      src={formData.thumbnail}
                      className="w-full h-full object-cover"
                      alt="Primary"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                      <button
                        onClick={(e) => removeImage(e, -1)}
                        className="p-3 bg-white rounded-full text-red-500"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <Plus size={32} />
                  </div>
                )}
                <div className="absolute top-3 left-3 bg-orange-500 text-white text-[9px] font-black px-2 py-1 rounded-md">
                  PRIMARY
                </div>
              </div>

              {/* GALLERY */}
              <div className="grid grid-cols-2 gap-3">
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    onClick={() => galleryInputRefs.current[idx].click()}
                    className="group relative aspect-square rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-center cursor-pointer"
                  >
                    <input
                      type="file"
                      autoComplete="off"
                      ref={(el) => (galleryInputRefs.current[idx] = el)}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, idx)}
                    />
                    {formData.images[idx] ? (
                      <>
                        <img
                          src={formData.images[idx]}
                          className="w-full h-full object-cover"
                          alt="Gallery"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                          <button
                            onClick={(e) => removeImage(e, idx)}
                            className="p-1.5 bg-white rounded-full text-red-500"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </>
                    ) : (
                      <Plus size={20} className="text-slate-300" />
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-slate-900 rounded-3xl p-6 text-white border border-slate-800 shadow-xl">
              <h3 className="text-xs font-black uppercase tracking-[.2em] text-orange-500 mb-6 flex items-center gap-2">
                <TrendingUp size={14} /> Stock Insights
              </h3>
              <div className="flex justify-between items-end mb-2">
                <span className="text-slate-400 text-xs font-semibold">
                  Inventory Level
                </span>
                <span
                  className={`text-sm font-bold ${
                    formData.stock < 10 ? "text-red-400" : "text-green-400"
                  }`}
                >
                  {formData.stock} Units
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-orange-500 h-full"
                  style={{
                    width: `${Math.min((formData.stock / 100) * 100, 100)}%`,
                  }}
                ></div>
              </div>
            </section>
          </div>

          {/* FORM COLUMN */}
          <div className="lg:col-span-8">
            <form
              onSubmit={handleUpdate}
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
                      <option>Home & Decor</option>
                      <option>Beauty</option>
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
                        Current Stock
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
                    required
                  />
                </div>

                <div>
                  <label className={labelStyle}>
                    <TagIcon size={14} /> Keywords
                  </label>
                  <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl">
                    {formData.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold border border-slate-100 dark:border-slate-700"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(i)}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      autoComplete="off"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={addTag}
                      className="flex-grow bg-transparent outline-none text-xs text-slate-900 dark:text-white px-2"
                      placeholder="Add tag..."
                    />
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
                  disabled={isUpdating}
                  className="px-8 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-orange-500/30 flex items-center gap-2"
                >
                  {isUpdating && <Loader2 size={16} className="animate-spin" />}
                  Update Listing
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
