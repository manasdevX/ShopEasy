import { useState, useRef, useEffect } from "react";
import { Link , useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { showSuccess, showError } from "../utils/toast";
import Footer from "../components/Footer";
const API_URL = import.meta.env.VITE_API_URL;
import {
  User,
  Mail,
  Phone,
  MapPin,
  Pencil,
  ChevronRight,
  Heart,
  Lock,
  Globe,
  X,
  Check,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Edit2,
  Plus,
  MoreVertical,
  Trash2,
  Home,
  Briefcase,
  Star,
  Info,
  LocateFixed,
  Package,
  ShoppingBag,
} from "lucide-react";
import toast from "react-hot-toast";

export default function Account() {
  const fileInputRef = useRef(null);

  // STATE
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

  // Address State
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [isAddressSaving, setIsAddressSaving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const [newAddress, setNewAddress] = useState({
    name: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    type: "Home",
  });

  const [user, setUser] = useState({
    name: "",
    email: "",
    phone: "",
    avatar: null,
    passwordChangedAt: null, // Stores the date from DB
    addresses: [],
    address: {
      name: "",
      phone: "",
      street: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
      type: "Home",
    },
    orders: [],
    order: {},
    wishlist: [],
    product: {},
  });

  const [formData, setFormData] = useState({ ...user });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("loading");

  // ================= FETCH LOGIC =================
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setStatus("idle");
          return;
        }

        const res = await fetch(`${API_URL}/api/user/profile`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401) {
          localStorage.removeItem("token");
          setStatus("idle");
          return;
        }

        const data = await res.json();
        if (res.ok) {
          const allAddresses = data.addresses || [];
          const primaryAddr =
            allAddresses.find((a) => a.isDefault) ||
            allAddresses[allAddresses.length - 1] ||
            {};

          const userData = {
            name: data.name || "",
            email: data.email || "",
            phone: (data.phone || "").replace(/^\+91/, ""),
            avatar:
              data.profilePicture ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                data.name || "User"
              )}&background=random&color=fff`,
            // ✅ FIX: Capture the passwordChangedAt date
            passwordChangedAt: data.passwordChangedAt,
            addresses: allAddresses,
            address: {
              name: data.address?.name || primaryAddr.fullName || data.name,
              phone: (
                data.address?.phone ||
                primaryAddr.phone ||
                data.phone ||
                ""
              ).replace(/^\+91/, ""),
              street: data.address?.street || primaryAddr.addressLine || "",
              city: data.address?.city || primaryAddr.city || "",
              state: data.address?.state || primaryAddr.state || "",
              pincode: data.address?.pincode || primaryAddr.pincode || "",
              country: data.address?.country || primaryAddr.country || "India",
              type: data.address?.type || primaryAddr.type || "Home",
            },
            orders: data.orders || [],
            wishlist: data.wishlist || [],
          };
          setUser(userData);
          setFormData(userData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setStatus("idle");
      }
    };
    fetchProfile();
  }, []);

  // ================= WISHLIST HANDLER =================
  const handleRemoveFromWishlist = async (productId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/user/wishlist/${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const updatedWishlist = await res.json();
        setUser((prev) => ({ ...prev, wishlist: updatedWishlist }));
        showSuccess("Item removed from wishlist");
      } else {
        showError("Failed to remove item");
      }
    } catch (err) {
      showError("Server error");
    }
  };

  // ================= GEOLOCATION HANDLER (HIGH ACCURACY) =================
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      showError("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);

    // Request high accuracy from the browser
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Use OpenStreetMap Nominatim with jsonv2 for detailed address breakdown
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();

          if (data && data.address) {
            const addr = data.address;

            // 👇 1. Construct DETAILED Street Address (Flipkart Style)
            const streetComponents = [
              addr.house_number,
              addr.building,
              addr.apartment,
              addr.residential,
              addr.hamlet,
              addr.village,
              addr.road,
              addr.street,
              addr.suburb,
              addr.neighbourhood,
              addr.city_district,
            ].filter((part) => part);

            // Remove duplicates and join with commas
            const uniqueStreetComponents = [...new Set(streetComponents)];
            const fullStreet = uniqueStreetComponents.join(", ");

            // 👇 2. Determine City (Fallback cascade)
            const city =
              addr.city ||
              addr.town ||
              addr.municipality ||
              addr.county ||
              addr.state_district ||
              "";

            setNewAddress((prev) => ({
              ...prev,
              street: fullStreet || addr.display_name.split(",")[0],
              city: city,
              state: addr.state || "",
              pincode: addr.postcode || "",
              country: addr.country || "India",
            }));

            showSuccess("Location fetched successfully!");
          } else {
            showError("Could not determine precise address");
          }
        } catch (error) {
          showError("Failed to fetch address details");
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        showError("Location access denied. Please enable GPS.");
      },
      options // Pass high accuracy options
    );
  };

  // ================= ADDRESS HANDLERS =================
  const handleSetDefault = async (id) => {
    setOpenMenuId(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/user/address/${id}/default`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });

      const updatedAddresses = await res.json();

      if (res.ok) {
        setUser((prev) => ({ ...prev, addresses: updatedAddresses }));
        const newDefault = updatedAddresses.find((a) => a.isDefault);
        if (newDefault) {
          setFormData((prev) => ({
            ...prev,
            address: {
              name: newDefault.fullName,
              phone: newDefault.phone,
              street: newDefault.addressLine,
              city: newDefault.city,
              state: newDefault.state,
              pincode: newDefault.pincode,
              country: newDefault.country,
              type: newDefault.type,
            },
          }));
        }
        showSuccess("Default Address Updated");
      }
    } catch (err) {
      showError("Failed to update default address");
    }
  };

  const handleSaveAddress = async () => {
    const phoneRegex = /^[0-9]{10}$/;
    const pincodeRegex = /^[0-9]{6}$/;
    if (
      !newAddress.name ||
      !newAddress.phone ||
      !newAddress.street ||
      !newAddress.city ||
      !newAddress.pincode
    ) {
      showError("Please fill all required fields");
      return;
    }

    // Validate Phone Number
    if (!phoneRegex.test(newAddress.phone)) {
      showError("Enter a valid 10-digit phone number");
      return;
    }

    // Validate Pincode
    if (!pincodeRegex.test(newAddress.pincode)) {
      showError("Enter a valid 6-digit pincode");
      return;
    }

    // Validate Street Address Length
    // if (newAddress.street.trim().length < 5) {
    //   showError("Street address is too short");
    //   return;
    // }

    setIsAddressSaving(true);

    try {
      const token = localStorage.getItem("token");
      let url = `${API_URL}/api/user/address`;
      let method = "POST";

      if (editingAddressId) {
        url = `${API_URL}/api/user/address/${editingAddressId}`;
        method = "PUT";
      }

      const res = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newAddress),
      });

      const updatedAddresses = await res.json();

      if (res.ok) {
        setUser((prev) => ({ ...prev, addresses: updatedAddresses }));

        const primaryAddr =
          updatedAddresses.find((a) => a.isDefault) ||
          updatedAddresses[updatedAddresses.length - 1] ||
          {};

        setFormData((prev) => ({
          ...prev,
          address: {
            name: primaryAddr.fullName,
            phone: primaryAddr.phone,
            street: primaryAddr.addressLine,
            city: primaryAddr.city,
            state: primaryAddr.state,
            pincode: primaryAddr.pincode,
            country: primaryAddr.country,
            type: primaryAddr.type,
          },
        }));

        setShowAddAddress(false);
        setEditingAddressId(null);
        setNewAddress({
          name: "",
          phone: "",
          street: "",
          city: "",
          state: "",
          pincode: "",
          country: "India",
          type: "Home",
        });
        showSuccess(editingAddressId ? "Address Updated!" : "Address Added!");
      } else {
        showError("Failed to save address");
      }
    } catch (err) {
      showError("Network Error");
    } finally {
      setIsAddressSaving(false);
    }
  };

  const handleEditClick = (addr) => {
    setNewAddress({
      name: addr.fullName,
      phone: addr.phone,
      street: addr.addressLine,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      country: addr.country,
      type: addr.type || "Home",
    });
    setEditingAddressId(addr._id);
    setShowAddAddress(true);
    setOpenMenuId(null);
    window.scrollTo({ top: 200, behavior: "smooth" });
  };

  const handleCancelClick = () => {
    setShowAddAddress(false);
    setEditingAddressId(null);
    setNewAddress({
      name: "",
      phone: "",
      street: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
      type: "Home",
    });
  };

  const handleAddNewClick = () => {
    setEditingAddressId(null);
    setNewAddress({
      name: user.name,
      phone: user.phone,
      street: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
      type: "Home",
    });
    setShowAddAddress(true);
  };

  const handleDeleteAddress = async (id) => {
    setOpenMenuId(null);
    if (!window.confirm("Are you sure you want to delete this address?"))
      return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/user/address/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const updatedAddresses = await res.json();
      if (res.ok) {
        setUser((prev) => ({ ...prev, addresses: updatedAddresses }));
        const primaryAddr =
          updatedAddresses.find((a) => a.isDefault) ||
          updatedAddresses[updatedAddresses.length - 1] ||
          {};
        setFormData((prev) => ({
          ...prev,
          address: {
            name: primaryAddr.fullName,
            phone: primaryAddr.phone,
            street: primaryAddr.addressLine,
            city: primaryAddr.city,
            state: primaryAddr.state,
            pincode: primaryAddr.pincode,
            country: primaryAddr.country,
            type: primaryAddr.type,
          },
        }));
        showSuccess("Address Deleted");
      }
    } catch (err) {
      showError("Failed to delete");
    }
  };

  const toggleMenu = (id) => {
    if (openMenuId === id) setOpenMenuId(null);
    else setOpenMenuId(id);
  };

  // ================= PROFILE HANDLERS =================
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "addressName") {
      setFormData((prev) => ({
        ...prev,
        address: { ...prev.address, name: value },
      }));
    } else if (name === "addressPhone") {
      setFormData((prev) => ({
        ...prev,
        address: { ...prev.address, phone: value },
      }));
    } else if (
      ["street", "city", "state", "pincode", "country"].includes(name)
    ) {
      setFormData((prev) => ({
        ...prev,
        address: { ...prev.address, [name]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, avatar: reader.result }));
        setIsEditing(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // 👇 UPDATED: Handle QuotaExceededError
  const handleSave = async () => {
    // 1. --- VALIDATION LOGIC ---
    const phoneRegex = /^[0-9]{10}$/;
    const pincodeRegex = /^[0-9]{6}$/;

    // Validate Main Profile Phone (without +91)
    if (!phoneRegex.test(formData.phone)) {
      showError("Please enter a valid 10-digit profile phone number");
      return;
    }

    // Validate Address Phone (if address exists)
    if (formData.address.phone && !phoneRegex.test(formData.address.phone)) {
      showError("Please enter a valid 10-digit address phone number");
      return;
    }

    // Validate Pincode
    if (
      formData.address.pincode &&
      !pincodeRegex.test(formData.address.pincode)
    ) {
      showError("Please enter a valid 6-digit pincode");
      return;
    }

    setStatus("saving");
    try {
      const token = localStorage.getItem("token");
      const payload = {
        name: formData.name,
        phone: formData.phone,
        profilePicture: formData.avatar,
        address: {
          ...formData.address,
          name: formData.address.name,
          phone: formData.address.phone,
        },
      };
      const res = await fetch(`${API_URL}/api/user/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        // 1. Update State
        setUser({
          ...formData,
          avatar: data.profilePicture || formData.avatar,
          addresses: data.addresses,
        });
        setFormData((prev) => ({
          ...prev,
          addresses: data.addresses,
          address: data.address,
        }));

        // 2. Safe Local Storage Update
        try {
          const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
          const updatedUser = {
            ...storedUser,
            name: formData.name,
            // Only save picture if it's NOT a massive base64 string, or try to save it
            profilePicture: data.profilePicture || formData.avatar,
          };
          localStorage.setItem("user", JSON.stringify(updatedUser));
        } catch (storageErr) {
          console.warn(
            "LocalStorage quota exceeded. Saving minimal user data."
          );
          // Fallback: Save ONLY name (skip image) to ensure Navbar updates
          try {
            const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
            const safeUser = { ...storedUser, name: formData.name }; // Skip profilePicture
            localStorage.setItem("user", JSON.stringify(safeUser));
          } catch (e) {
            console.error("Critical: LocalStorage completely full", e);
          }
        }

        // 3. Dispatch Custom Event
        window.dispatchEvent(new Event("user-info-updated"));
        window.dispatchEvent(new Event("storage"));

        setIsEditing(false);
        showSuccess("Profile Updated Successfully!");
        setStatus("idle");
      } else {
        showError("Save failed");
        setStatus("idle");
      }
    } catch (err) {
      console.error(err);
      showError("Server Error");
      setStatus("idle");
    }
  };

  const handleRemoveImg = () => {};

  const navItems = [
    { id: "profile", label: "Profile Settings", icon: <User size={18} /> },
    { id: "orders", label: "Order History", icon: <Package size={18} /> },
    { id: "wishlist", label: "My Wishlist", icon: <Heart size={18} /> },
    { id: "addresses", label: "Manage Addresses", icon: <MapPin size={18} /> },
    { id: "security", label: "Privacy & Security", icon: <Lock size={18} /> },
  ];
  
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#030712] text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans">
      <Navbar />

      {/* Reduced top/bottom padding from py-12 to py-8 */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Reduced gap between sidebar and main content from gap-8 to gap-6 */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* SIDEBAR - Slightly tighter spacing */}
          <aside className="w-full lg:w-80 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 text-center transition-colors">
              <div className="relative w-28 h-28 mx-auto mb-4">
                <div
                  className={`w-full h-full rounded-full bg-slate-100 dark:bg-slate-800 border-4 shadow-md overflow-hidden flex items-center justify-center transition-all duration-300 ${
                    isEditing
                      ? "border-orange-500 scale-105"
                      : "border-white dark:border-slate-900"
                  }`}
                >
                  <img
                    src={formData.avatar || user.avatar}
                    className="w-full h-full object-cover"
                    alt="Profile"
                  />
                </div>
                {isEditing && (
                  <div>
                    <button
                      onClick={() => fileInputRef.current.click()}
                      className="absolute bottom-1 right-1 bg-orange-600 text-white p-2 rounded-full shadow-lg hover:bg-orange-500 transition-all active:scale-90 z-10"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleRemoveImg()}
                      className="absolute top-1 right-1 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-orange-500 transition-all active:scale-90 z-10"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                <input
                  autoComplete="off"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className="hidden"
                  accept="image/*"
                />
              </div>
              <h2 className="text-lg font-bold">{user.name}</h2>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] font-bold uppercase tracking-widest mt-2">
                <ShieldCheck size={12} /> Verified Account
              </div>
            </div>
            <nav className="bg-white dark:bg-slate-900 rounded-3xl p-3 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all duration-200 group ${
                    activeTab === item.id
                      ? "bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 ring-1 ring-orange-200 dark:ring-orange-900"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3 font-semibold text-sm">
                    {item.icon} {item.label}
                  </div>
                  <ChevronRight
                    size={16}
                    className={
                      activeTab === item.id
                        ? "text-orange-500"
                        : "text-slate-300"
                    }
                  />
                </button>
              ))}
            </nav>
          </aside>

          {/* MAIN CONTENT */}
          <div className="flex-1">
            {/* 1. PROFILE SETTINGS */}
            {activeTab === "profile" && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden relative">
                  {/* Header */}
                  <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-10 transition-colors duration-500">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        Profile Settings
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 transition-colors">
                        {isEditing
                          ? "Update your details"
                          : "View profile info"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* EDIT / SAVE BUTTON - Fixed Dark Mode Visibility */}
                      {!isEditing ? (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-xs 
                   bg-slate-900 text-white 
                   dark:bg-white dark:text-slate-900 
                   hover:opacity-90 shadow-lg transition-all active:scale-95"
                        >
                          <Edit2 size={14} /> Edit
                        </button>
                      ) : (
                        <button
                          onClick={handleSave}
                          disabled={status === "saving"}
                          className="flex items-center gap-2 px-6 py-2 rounded-xl font-bold text-xs 
                   bg-orange-500 text-white shadow-lg 
                   hover:bg-orange-600 transition-all 
                   disabled:opacity-50 active:scale-95"
                        >
                          {status === "saving" ? (
                            <Loader2 className="animate-spin" size={14} />
                          ) : (
                            <Check size={16} />
                          )}
                          Save
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Body - Compact */}
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InputField
                        label="Full Name"
                        name="name"
                        autoComplete="off"
                        value={formData.name}
                        onChange={handleInputChange}
                        isEditing={isEditing}
                        icon={<User size={16} />}
                      />
                      <InputField
                        label="Email"
                        autoComplete="off"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        icon={<Mail size={16} />}
                        isEditing={isEditing}
                        readOnly={true}
                      />
                      <InputField
                        label="Phone"
                        name="phone"
                        autoComplete="off"
                        value={formData.phone}
                        onChange={handleInputChange}
                        icon={<Phone size={16} />}
                        isEditing={isEditing}
                        readOnly={true}
                      />
                    </div>
                    <div className="pt-2 space-y-4">
                      <div className="flex items-center gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                        <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                          <MapPin size={14} /> Shipping Address
                        </h4>
                        {formData.address.type && (
                          <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-[4px] uppercase border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                            {formData.address.type}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField
                          label="Receiver Name"
                          name="addressName"
                          autoComplete="off"
                          value={formData.address.name}
                          onChange={handleInputChange}
                          isEditing={isEditing}
                          icon={<User size={16} />}
                        />
                        <InputField
                          label="Contact"
                          autoComplete="off"
                          name="addressPhone"
                          value={formData.address.phone}
                          onChange={handleInputChange}
                          isEditing={isEditing}
                          icon={<Phone size={16} />}
                        />
                        <div className="md:col-span-2">
                          <InputField
                            label="Street Address"
                            autoComplete="off"
                            name="street"
                            value={formData.address.street}
                            onChange={handleInputChange}
                            isEditing={isEditing}
                          />
                        </div>
                        <InputField
                          label="City"
                          autoComplete="off"
                          name="city"
                          value={formData.address.city}
                          onChange={handleInputChange}
                          isEditing={isEditing}
                        />
                        <InputField
                          label="Pincode"
                          autoComplete="off"
                          name="pincode"
                          value={formData.address.pincode}
                          onChange={handleInputChange}
                          isEditing={isEditing}
                        />
                        <InputField
                          label="State"
                          autoComplete="off"
                          name="state"
                          value={formData.address.state}
                          onChange={handleInputChange}
                          isEditing={isEditing}
                        />
                        <InputField
                          label="Country"
                          autoComplete="off"
                          name="country"
                          value={formData.address.country}
                          onChange={handleInputChange}
                          icon={<Globe size={16} />}
                          isEditing={isEditing}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. ORDER HISTORY TAB */}
            {activeTab === "orders" && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[500px]">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Order History
                  </h3>
                  <span className="text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 px-3 py-1 rounded-full">
                    {user.orders.length} Orders Total
                  </span>
                </div>

                <div className="p-6">
                  {user.orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-full mb-4">
                        <Package
                          size={40}
                          className="text-slate-300 dark:text-slate-600"
                        />
                      </div>
                      <h4 className="text-slate-900 dark:text-white font-bold">
                        No orders found
                      </h4>
                      <p className="text-slate-500 text-sm mt-1">
                        Looks like you haven't placed any orders yet.
                      </p>
                      <Link
                        to="/"
                        className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 transition-all"
                      >
                        Start Shopping
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {user.orders.map((order) => (
                        <div
                          key={order._id}
                          className="group border border-slate-100 dark:border-slate-800 rounded-2xl p-5 hover:border-blue-200 dark:hover:border-blue-900/50 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all"
                        >
                          <div className="flex flex-col md:flex-row justify-between gap-4">
                            {/* Order Info */}
                            <div className="flex gap-4">
                              <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0">
                                <ShoppingBag
                                  size={24}
                                  className="text-slate-400"
                                />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                                    Order #{order._id.slice(-8).toUpperCase()}
                                  </span>
                                  <span
                                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                      order.status === "Delivered"
                                        ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                                        : "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
                                    }`}
                                  >
                                    {order.status}
                                  </span>
                                </div>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                  {order.orderItems.length}{" "}
                                  {order.orderItems.length === 1
                                    ? "Item"
                                    : "Items"}
                                </h4>
                                <p className="text-xs text-slate-500 mt-1">
                                  Placed on{" "}
                                  {new Date(order.createdAt).toLocaleDateString(
                                    "en-IN",
                                    {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    }
                                  )}
                                </p>
                              </div>
                            </div>

                            {/* Price & Action */}
                            <div className="flex flex-row md:flex-col justify-between md:items-end gap-2">
                              <div className="text-right">
                                <p className="text-xs text-slate-400 font-medium">
                                  Total Amount
                                </p>
                                <p className="text-lg font-black text-slate-900 dark:text-white">
                                  ₹{order.totalPrice.toLocaleString()}
                                </p>
                              </div>
                              <Link
                                to={`/order/${order._id}`}
                                className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline group-hover:gap-2 transition-all"
                              >
                                VIEW DETAILS <ChevronRight size={14} />
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. WISHLIST TAB */}
            {activeTab === "wishlist" && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[500px]">
                {/* Header - Matches Order History Style */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    My Wishlist
                  </h3>
                  <span className="text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 px-3 py-1 rounded-full">
                    {user.wishlist.length} Items Saved
                  </span>
                </div>

                <div className="p-6">
                  {user.wishlist.length === 0 ? (
                    /* Empty State - Matches Order History Style */
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-full mb-4">
                        <Heart
                          size={40}
                          className="text-slate-300 dark:text-slate-600"
                        />
                      </div>
                      <h4 className="text-slate-900 dark:text-white font-bold">
                        Your wishlist is empty
                      </h4>
                      <p className="text-slate-500 text-sm mt-1">
                        Save items you like to find them easily later.
                      </p>
                      <Link
                        to="/"
                        className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 transition-all"
                      >
                        Explore Products
                      </Link>
                    </div>
                  ) : (
                    /* Wishlist Grid */
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {user.wishlist.map((product) => (
                        <div
                          key={product._id}
                          className="group border border-slate-100 dark:border-slate-800 rounded-2xl p-4 hover:border-blue-200 dark:hover:border-blue-900/50 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all"
                        >
                          <div className="flex justify-between gap-4">
                            {/* Product Info */}
                            <div className="flex gap-4">
                              <div className="h-20 w-20 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex-shrink-0">
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                              </div>
                              <div className="flex flex-col justify-between py-1">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                                      {product.category || "Product"}
                                    </span>
                                  </div>
                                  <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                                    {product.name}
                                  </h4>
                                </div>

                                <button
                                  onClick={() =>
                                    handleRemoveFromWishlist(product._id)
                                  }
                                  className="flex items-center gap-1.5 text-[10px] font-bold text-red-500 hover:text-red-600 transition-colors uppercase tracking-tight"
                                >
                                  <Trash2 size={12} /> Remove Item
                                </button>
                              </div>
                            </div>

                            {/* Price & Action */}
                            <div className="flex flex-col justify-between items-end">
                              <div className="text-right">
                                <p className="text-xs text-slate-400 font-medium">
                                  Price
                                </p>
                                <p className="text-lg font-black text-slate-900 dark:text-white">
                                  ₹{product.price.toLocaleString()}
                                </p>
                              </div>

                              <Link
                                to={`/product/${product._id}`}
                                className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline group-hover:gap-2 transition-all"
                              >
                                BUY NOW <ChevronRight size={14} />
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 4. MANAGE ADDRESSES TAB */}
            {activeTab === "addresses" && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[500px]">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Manage Addresses
                  </h3>
                </div>
                <div className="p-6">
                  {!showAddAddress ? (
                    <button
                      onClick={handleAddNewClick}
                      className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-md p-4 flex items-center gap-3 text-blue-600 dark:text-blue-400 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm"
                    >
                      <Plus size={18} /> ADD A NEW ADDRESS
                    </button>
                  ) : (
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-md border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">
                      <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-4 text-xs uppercase tracking-wider">
                        {editingAddressId ? "Edit Address" : "Add New Address"}
                      </h4>

                      {/* 👇 "Use my current location" Button (Left Aligned & Compact) */}
                      <button
                        onClick={handleUseCurrentLocation}
                        disabled={isLocating}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-bold text-sm mb-6 shadow-sm transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {isLocating ? (
                          <Loader2 className="animate-spin" size={18} />
                        ) : (
                          <LocateFixed size={18} />
                        )}
                        {isLocating
                          ? "Fetching Location..."
                          : "Use my current location"}
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <input
                          placeholder="Receiver's Name"
                          autoComplete="off"
                          value={newAddress.name}
                          onChange={(e) =>
                            setNewAddress({
                              ...newAddress,
                              name: e.target.value,
                            })
                          }
                          className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:border-blue-500 text-sm text-slate-900 dark:text-white"
                        />
                        <input
                          placeholder="Receiver's Phone"
                          autoComplete="off"
                          value={newAddress.phone}
                          onChange={(e) =>
                            setNewAddress({
                              ...newAddress,
                              phone: e.target.value,
                            })
                          }
                          className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:border-blue-500 text-sm text-slate-900 dark:text-white"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <input
                          placeholder="Street Address"
                          autoComplete="off"
                          value={newAddress.street}
                          onChange={(e) =>
                            setNewAddress({
                              ...newAddress,
                              street: e.target.value,
                            })
                          }
                          className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:border-blue-500 text-sm md:col-span-2 text-slate-900 dark:text-white"
                        />
                        <input
                          placeholder="City"
                          autoComplete="off"
                          value={newAddress.city}
                          onChange={(e) =>
                            setNewAddress({
                              ...newAddress,
                              city: e.target.value,
                            })
                          }
                          className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:border-blue-500 text-sm text-slate-900 dark:text-white"
                        />
                        <input
                          placeholder="Pincode"
                          autoComplete="off"
                          value={newAddress.pincode}
                          onChange={(e) =>
                            setNewAddress({
                              ...newAddress,
                              pincode: e.target.value,
                            })
                          }
                          className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:border-blue-500 text-sm text-slate-900 dark:text-white"
                        />
                        <input
                          placeholder="State"
                          autoComplete="off"
                          value={newAddress.state}
                          onChange={(e) =>
                            setNewAddress({
                              ...newAddress,
                              state: e.target.value,
                            })
                          }
                          className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:border-blue-500 text-sm text-slate-900 dark:text-white"
                        />
                        <input
                          placeholder="Country"
                          autoComplete="off"
                          value={newAddress.country}
                          onChange={(e) =>
                            setNewAddress({
                              ...newAddress,
                              country: e.target.value,
                            })
                          }
                          className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:border-blue-500 text-sm text-slate-900 dark:text-white"
                        />
                      </div>
                      <div className="flex gap-4 mb-6">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-2 uppercase">
                          Type
                        </span>
                        <div className="flex gap-3">
                          <button
                            onClick={() =>
                              setNewAddress({ ...newAddress, type: "Home" })
                            }
                            className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors flex items-center gap-2 ${
                              newAddress.type === "Home"
                                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent"
                                : "border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400"
                            }`}
                          >
                            <Home size={12} /> Home
                          </button>
                          <button
                            onClick={() =>
                              setNewAddress({ ...newAddress, type: "Work" })
                            }
                            className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors flex items-center gap-2 ${
                              newAddress.type === "Work"
                                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent"
                                : "border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400"
                            }`}
                          >
                            <Briefcase size={12} /> Work
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={handleSaveAddress}
                          disabled={isAddressSaving}
                          className={`bg-blue-600 text-white px-8 py-2.5 rounded-md font-bold text-sm hover:bg-blue-700 uppercase shadow-md ${
                            isAddressSaving
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          {isAddressSaving ? (
                            <Loader2 className="animate-spin" size={16} />
                          ) : editingAddressId ? (
                            "Update"
                          ) : (
                            "Save"
                          )}
                        </button>
                        <button
                          onClick={handleCancelClick}
                          className="text-blue-600 dark:text-blue-400 px-4 py-2.5 rounded-md font-bold text-sm uppercase"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ADDRESS LIST */}
                  <div className="mt-6 space-y-4">
                    {user.addresses && user.addresses.length > 0 ? (
                      user.addresses.map((addr, index) => {
                        if (editingAddressId === addr._id) return null;
                        return (
                          <div
                            key={addr._id || index}
                            className={`border rounded-sm p-5 bg-white dark:bg-slate-900 relative hover:shadow-md transition-shadow ${
                              addr.isDefault
                                ? "border-green-500 dark:border-green-500 ring-1 ring-green-100 dark:ring-green-900/30"
                                : "border-slate-200 dark:border-slate-700"
                            }`}
                          >
                            <div className="absolute top-4 right-4">
                              <button
                                onClick={() => toggleMenu(addr._id)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              >
                                <MoreVertical size={18} />
                              </button>
                              {openMenuId === addr._id && (
                                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-md overflow-hidden z-20 min-w-[140px] animate-in zoom-in-95 duration-100">
                                  <button
                                    onClick={() => handleEditClick(addr)}
                                    className="w-full text-left px-4 py-2.5 text-xs font-medium text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 transition-colors"
                                  >
                                    <Edit2 size={12} /> Edit
                                  </button>
                                  {!addr.isDefault && (
                                    <button
                                      onClick={() => handleSetDefault(addr._id)}
                                      className="w-full text-left px-4 py-2.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 transition-colors"
                                    >
                                      <Check size={12} /> Default
                                    </button>
                                  )}
                                  <button
                                    onClick={() =>
                                      handleDeleteAddress(addr._id)
                                    }
                                    className="w-full text-left px-4 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
                                  >
                                    <Trash2 size={12} /> Delete
                                  </button>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2 mb-2">
                              <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-[3px] uppercase tracking-wide border border-slate-200 dark:border-slate-700">
                                {addr.type || "Home"}
                              </span>
                              {addr.isDefault && (
                                <span className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-[3px] uppercase tracking-wide border border-green-100 dark:border-green-800">
                                  DEFAULT
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mb-1">
                              <span className="font-bold text-slate-900 dark:text-white text-sm">
                                {addr.fullName}
                              </span>
                              <span className="font-bold text-slate-900 dark:text-white text-sm">
                                {addr.phone}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
                              {addr.addressLine}, {addr.city}, {addr.state} -{" "}
                              <span className="font-bold text-slate-900 dark:text-slate-200">
                                {addr.pincode}
                              </span>
                              <br />
                              {addr.country}
                            </p>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-12 text-slate-400">
                        <p>No addresses saved yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 5. PRIVACY & SECURITY TAB */}
            {activeTab === "security" && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[500px]">
                {/* Header - EXACT MATCH to Orders/Wishlist */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      Privacy & Security
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Manage your password and account protection
                    </p>
                  </div>
                  <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600">
                    <ShieldCheck size={20} />
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Section 1: Password Change */}
                  <div className="group border border-slate-100 dark:border-slate-800 rounded-2xl p-5 hover:border-blue-200 dark:hover:border-blue-900/50 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex gap-4">
                        <div className="h-12 w-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Lock size={20} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            Password
                          </h4>
                          {/* ✅ FIX: Force DD/MM/YYYY using en-GB */}
                          <p className="text-xs text-slate-500 mt-1">
                            Last changed:{" "}
                            {user.passwordChangedAt
                              ? new Date(
                                  user.passwordChangedAt
                                ).toLocaleDateString("en-GB")
                              : "Never"}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate("/update-password??4 ko")}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-blue-500 hover:text-white text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg transition-all active:scale-95"
                      >
                        Change Password
                        <ChevronRight size={14} />
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Ensure your account is using a long, random password to
                      stay secure.
                    </p>
                  </div>

                  {/* Section 2: Email Update */}
                  <div className="group border border-slate-100 dark:border-slate-800 rounded-2xl p-5 hover:border-blue-200 dark:hover:border-blue-900/50 transition-all">
                    <div className="flex justify-between items-center">
                      <div className="flex gap-4">
                        <div className="h-12 w-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Mail
                            size={20}
                            className="text-slate-400 group-hover:text-blue-500 transition-colors"
                          />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            Email Address
                          </h4>
                          <p className="text-xs text-slate-500 mt-1">
                            {user?.email || "Update your email address"}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate("/update-email??4 ko")}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-blue-500 hover:text-white text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg transition-all active:scale-95"
                      >
                        Change email
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Section 3: Danger Zone */}
                  <div className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <h4 className="text-xs font-black text-red-500 uppercase tracking-[0.2em] mb-4">
                      Danger Zone
                    </h4>
                    <div className="border border-red-100 dark:border-red-900/20 bg-red-50/30 dark:bg-red-900/10 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-center gap-4">
                      <div>
                        <h5 className="text-sm font-bold text-red-600 dark:text-red-400">
                          Delete Account
                        </h5>
                        <p className="text-xs text-red-500/70 mt-1">
                          Once you delete your account, there is no going back.
                          Please be certain.
                        </p>
                      </div>
                      <button className="whitespace-nowrap bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all active:scale-95 shadow-sm shadow-red-200 dark:shadow-none">
                        Deactivate
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

// ... Helper Components ...
function InputField({
  label,
  name,
  value,
  onChange,
  icon,
  error,
  isEditing,
  readOnly,
}) {
  return (
    <div className="space-y-1.5 group">
      <div className="flex justify-between items-center ml-1">
        <label
          className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${
            isEditing
              ? "text-slate-500 dark:text-slate-400"
              : "text-slate-400 dark:text-slate-600"
          }`}
        >
          {label}
        </label>
        {error && (
          <span className="text-[10px] text-red-500 font-bold flex items-center gap-1">
            <AlertCircle size={10} /> {error}
          </span>
        )}
      </div>
      <div className="relative">
        {icon && (
          <div
            className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
              error
                ? "text-red-400"
                : isEditing
                ? "text-slate-400"
                : "text-slate-300"
            }`}
          >
            {icon}
          </div>
        )}
        <input
          name={name}
          value={value || ""}
          onChange={onChange}
          disabled={!isEditing || readOnly}
          autoComplete="off"
          className={`w-full transition-all duration-200 font-medium text-sm ${
            icon ? "pl-11" : "px-4"
          } py-3 rounded-xl outline-none ${
            !isEditing
              ? "bg-transparent border-transparent text-slate-700 dark:text-slate-300 cursor-default"
              : readOnly
              ? "bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-400 cursor-not-allowed"
              : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
          } ${error ? "!border-red-400" : ""}`}
        />
      </div>
    </div>
  );
}

function PlaceholderTab({ icon, title, desc }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 shadow-sm border border-slate-200 dark:border-slate-800 text-center animate-in fade-in zoom-in duration-300">
      <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400 dark:text-slate-500">
        {icon}
      </div>
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
        {title}
      </h2>
      <p className="text-slate-500 dark:text-slate-400">{desc}</p>
    </div>
  );
}