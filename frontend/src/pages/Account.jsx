import { useState, useRef, useEffect } from "react";
import {
  Link,
  useNavigate,
  useLocation,
  useSearchParams,
} from "react-router-dom";
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
  LocateFixed,
  Package,
} from "lucide-react";

export default function Account() {
  const fileInputRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  // State for Confirmation Buttons (Cancel/Return)
  const [actionConfirm, setActionConfirm] = useState({ id: null, type: null });

  // ✅ 1. SETUP URL PARAMS
  const [searchParams, setSearchParams] = useSearchParams();

  // ✅ 2. INITIALIZE STATE
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || location.state?.activeTab || "profile"
  );

  const [isEditing, setIsEditing] = useState(false);

  // Address State
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [isAddressSaving, setIsAddressSaving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [isAvatarRemoved, setIsAvatarRemoved] = useState(false);

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
    passwordChangedAt: null,
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
    wishlist: [],
  });

  const [formData, setFormData] = useState({ ...user });
  const [status, setStatus] = useState("loading");

  // ✅ 3. EFFECT: SYNC URL WHEN TAB CHANGES
  useEffect(() => {
    setSearchParams({ tab: activeTab }, { replace: true });
  }, [activeTab, setSearchParams]);

  // ✅ 4. EFFECT: HANDLE EXTERNAL REDIRECTS
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  // ================= UTILS =================
  const getImageUrl = (imagePath) => {
    if (!imagePath) return "https://via.placeholder.com/150?text=No+Image";
    if (imagePath.startsWith("data:") || imagePath.startsWith("http"))
      return imagePath;
    const cleanPath = imagePath.startsWith("/")
      ? imagePath.substring(1)
      : imagePath;
    return `${API_URL}/${cleanPath}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Delivered":
        return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-500 dark:border-emerald-500/20";
      case "Shipped":
        return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-500 dark:border-blue-500/20";
      case "Cancelled":
        return "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-500 dark:border-rose-500/20";

      // ✅ FIXED: Both Return statuses use Purple
      case "Return Initiated":
      case "Returned":
        return "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-500 dark:border-purple-500/20";

      case "Return Requested":
        return "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-500 dark:border-orange-500/20";
      
      case "Processing":
      default:
        return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-500 dark:border-amber-500/20";
    }
  };

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
            wishlist: data.wishlist || [],
          };

          setUser((prev) => ({ ...prev, ...userData }));
          setFormData((prev) => ({ ...prev, ...userData }));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setStatus("idle");
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    if (activeTab === "orders") {
      const fetchOrders = async () => {
        setOrdersLoading(true);
        try {
          const token = localStorage.getItem("token");
          const res = await fetch(`${API_URL}/api/orders/myorders`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (res.ok) {
            setUser((prev) => ({ ...prev, orders: data }));
          }
        } catch (err) {
          console.error("Order fetch error:", err);
        } finally {
          setOrdersLoading(false);
        }
      };
      fetchOrders();
    }
  }, [activeTab]);

  // ================= ORDER ACTION HANDLERS =================
  const handleCancelOrder = async (orderId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/orders/${orderId}/cancel`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (res.ok) {
        showSuccess("Order cancelled successfully");
        setUser((prev) => ({
          ...prev,
          orders: prev.orders.map((o) =>
            o._id === orderId ? { ...o, status: "Cancelled" } : o
          ),
        }));
      } else {
        showError(data.message || "Failed to cancel order");
      }
    } catch (err) {
      showError("Server Error");
    }
  };

  const handleReturnOrder = async (orderId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/orders/${orderId}/return`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (res.ok) {
        showSuccess("Return initiated successfully");
        // ✅ CRITICAL FIX: Instantly set status to "Return Initiated" (Purple)
        setUser((prev) => ({
          ...prev,
          orders: prev.orders.map((o) =>
            o._id === orderId ? { ...o, status: "Return Initiated" } : o
          ),
        }));
      } else {
        showError(data.message || "Failed to request return");
      }
    } catch (err) {
      showError("Server Error");
    }
  };

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

        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        storedUser.wishlist = updatedWishlist;
        localStorage.setItem("user", JSON.stringify(storedUser));

        window.dispatchEvent(new Event("wishlistUpdated"));
        showSuccess("Item removed from wishlist");
      } else {
        showError("Failed to remove item");
      }
    } catch (err) {
      showError("Server error");
    }
  };

  const [isConfirming, setIsConfirming] = useState(false);

  const handleDeactivate = async () => {
    if (!isConfirming) {
      setIsConfirming(true);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/user/profile`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        showSuccess("Account successfully deactivated.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("cart");

        navigate("/");
        window.location.reload();
      } else {
        showError("Failed to deactivate account.");
      }
    } catch (err) {
      showError("Network error. Please try again later.");
    }
  };

  // ================= GEOLOCATION HANDLER =================
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      showError("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    const options = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();

          if (data && data.address) {
            const addr = data.address;
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

            const uniqueStreetComponents = [...new Set(streetComponents)];
            const fullStreet = uniqueStreetComponents.join(", ");
            const city = addr.city || addr.town || addr.municipality || "";

            setNewAddress((prev) => ({
              ...prev,
              street: fullStreet || addr.display_name.split(",")[0],
              city: city,
              state: addr.state || "",
              pincode: addr.postcode || "",
              country: addr.country || "India",
            }));
            showSuccess("Location fetched successfully!");
          }
        } catch (error) {
          showError("Failed to fetch address details");
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setIsLocating(false);
        showError("Location access denied.");
      },
      options
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
        showSuccess("Default Address Updated");
      }
    } catch (err) {
      showError("Failed to update default address");
    }
  };

  const handleSaveAddress = async () => {
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
        setShowAddAddress(false);
        setEditingAddressId(null);
        showSuccess("Address Saved!");
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
        showSuccess("Address Deleted");
      }
    } catch (err) {
      showError("Failed to delete");
    }
  };

  const toggleMenu = (id) => {
    setOpenMenuId(openMenuId === id ? null : id);
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
      setSelectedFile(file);
      setIsAvatarRemoved(false);

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, avatar: reader.result }));
        setIsEditing(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImg = () => {
    const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
      user.name || "User"
    )}&background=random&color=fff`;

    setFormData((prev) => ({
      ...prev,
      avatar: fallbackUrl,
    }));

    setSelectedFile(null);
    setIsAvatarRemoved(true);
    setIsEditing(true);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async () => {
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(formData.phone)) {
      showError("Please enter a valid 10-digit profile phone number");
      return;
    }
    setStatus("saving");

    try {
      const token = localStorage.getItem("token");

      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("phone", formData.phone);
      formDataToSend.append("address", JSON.stringify(formData.address));

      if (selectedFile) {
        formDataToSend.append("profilePicture", selectedFile);
      } else if (isAvatarRemoved) {
        formDataToSend.append("removeProfilePicture", "true");
      }

      const res = await fetch(`${API_URL}/api/user/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      const data = await res.json();
      if (res.ok) {
        setUser((prev) => ({
          ...prev,
          ...data,
          avatar: data.profilePicture || formData.avatar,
        }));
        setFormData((prev) => ({
          ...prev,
          addresses: data.addresses,
          address: data.address,
        }));
        localStorage.setItem(
          "user",
          JSON.stringify({
            ...JSON.parse(localStorage.getItem("user") || "{}"),
            name: formData.name,
            profilePicture: data.profilePicture || formData.avatar,
          })
        );
        window.dispatchEvent(new Event("user-info-updated"));
        setIsEditing(false);
        setSelectedFile(null);
        setIsAvatarRemoved(false);
        showSuccess("Profile Updated Successfully!");
      } else {
        showError("Save failed");
      }
    } catch (err) {
      console.error(err);
      showError("Server Error");
    } finally {
      setStatus("idle");
    }
  };

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

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* SIDEBAR */}
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
                      {!isEditing ? (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-xs bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 shadow-lg transition-all active:scale-95"
                        >
                          <Edit2 size={14} /> Edit
                        </button>
                      ) : (
                        <button
                          onClick={handleSave}
                          disabled={status === "saving"}
                          className="flex items-center gap-2 px-6 py-2 rounded-xl font-bold text-xs bg-orange-500 text-white shadow-lg hover:bg-orange-600 transition-all disabled:opacity-50 active:scale-95"
                        >
                          {status === "saving" ? (
                            <Loader2 className="animate-spin" size={14} />
                          ) : (
                            <Check size={16} />
                          )}{" "}
                          Save
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InputField
                        label="Full Name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        isEditing={isEditing}
                        icon={<User size={16} />}
                      />
                      <InputField
                        label="Email"
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
                          value={formData.address.name}
                          onChange={handleInputChange}
                          isEditing={isEditing}
                          icon={<User size={16} />}
                        />
                        <InputField
                          label="Contact"
                          name="addressPhone"
                          value={formData.address.phone}
                          onChange={handleInputChange}
                          isEditing={isEditing}
                          icon={<Phone size={16} />}
                        />
                        <div className="md:col-span-2">
                          <InputField
                            label="Street Address"
                            name="street"
                            value={formData.address.street}
                            onChange={handleInputChange}
                            isEditing={isEditing}
                          />
                        </div>
                        <InputField
                          label="City"
                          name="city"
                          value={formData.address.city}
                          onChange={handleInputChange}
                          isEditing={isEditing}
                        />
                        <InputField
                          label="Pincode"
                          name="pincode"
                          value={formData.address.pincode}
                          onChange={handleInputChange}
                          isEditing={isEditing}
                        />
                        <InputField
                          label="State"
                          name="state"
                          value={formData.address.state}
                          onChange={handleInputChange}
                          isEditing={isEditing}
                        />
                        <InputField
                          label="Country"
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
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      Order History
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Track and manage your recent purchases
                    </p>
                  </div>
                  <span className="text-xs font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-800">
                    {user.orders.length} Orders
                  </span>
                </div>

                <div className="p-6">
                  {ordersLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <Loader2
                        className="animate-spin text-blue-500 mb-2"
                        size={32}
                      />
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Loading orders...
                      </p>
                    </div>
                  ) : user.orders.length === 0 ? (
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
                        className="mt-6 bg-blue-600 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                      >
                        Start Shopping
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {user.orders.map((order) => {
                        // Logic for Return Window (14 Days)
                        const deliveredDate = new Date(
                          order.deliveredAt || order.updatedAt
                        );
                        const currentDate = new Date();
                        const diffTime = Math.abs(currentDate - deliveredDate);
                        const diffDays = Math.ceil(
                          diffTime / (1000 * 60 * 60 * 24)
                        );
                        const isWithinReturnWindow = diffDays <= 14;

                        return (
                          <div
                            key={order._id}
                            className="group border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-blue-200 dark:hover:border-blue-900/50 transition-all shadow-sm"
                          >
                            <div className="bg-slate-50/50 dark:bg-slate-800/30 px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-wrap justify-between items-center gap-4">
                              <div className="flex items-center gap-4">
                                <div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Order ID
                                  </p>
                                  <p className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono">
                                    #{order._id.slice(-8).toUpperCase()}
                                  </p>
                                </div>
                                <div className="h-8 w-[1px] bg-slate-200 dark:border-slate-700 hidden sm:block"></div>
                                <div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Date Placed
                                  </p>
                                  <p className="text-xs font-bold dark:text-slate-300">
                                    {new Date(
                                      order.createdAt
                                    ).toLocaleDateString("en-IN", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    })}
                                  </p>
                                </div>
                              </div>
                              <div
                                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${getStatusColor(
                                  order.status
                                )}`}
                              >
                                {order.status}
                              </div>
                            </div>

                            <div className="p-5 space-y-4">
                              {order.orderItems.map((item, idx) => (
                                <Link
                                  key={idx}
                                  to={`/product/${item.product}`}
                                  className="flex items-center justify-between gap-4 group/item p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
                                >
                                  <div className="flex items-center gap-4">
                                    <div className="h-14 w-14 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 flex-shrink-0 group-hover/item:border-orange-500 transition-colors">
                                      <img
                                        src={getImageUrl(item.image)}
                                        alt={item.name}
                                        className="h-full w-full object-cover group-hover/item:scale-110 transition-transform duration-300"
                                      />
                                    </div>
                                    <div>
                                      <h5 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1 group-hover/item:text-orange-500 transition-colors">
                                        {item.name}
                                      </h5>
                                      <p className="text-xs text-slate-500 font-medium">
                                        Qty: {item.qty} • ₹
                                        {item.price.toLocaleString()}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="p-2 text-slate-400 group-hover/item:text-orange-500 group-hover/item:translate-x-1 transition-all">
                                    <ChevronRight size={18} />
                                  </div>
                                </Link>
                              ))}
                            </div>

                            <div className="px-5 py-4 bg-white dark:bg-slate-900 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center">
                              <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                  Total Payable
                                </p>
                                <p className="text-lg font-black text-slate-900 dark:text-white">
                                  ₹{order.totalPrice.toLocaleString()}
                                </p>
                              </div>

                              <div className="flex items-center gap-3">
                                {actionConfirm.id === order._id ? (
                                  /* --- NEW CONFIRMATION STATE --- */
                                  <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-300">
                                    <p className="text-[10px] font-black text-slate-500 uppercase mr-1">
                                      Are you sure?
                                    </p>
                                    <button
                                      onClick={() => {
                                        if (actionConfirm.type === "cancel")
                                          handleCancelOrder(order._id);
                                        if (actionConfirm.type === "return")
                                          handleReturnOrder(order._id);
                                        setActionConfirm({
                                          id: null,
                                          type: null,
                                        });
                                      }}
                                      className="px-3 py-2 bg-green-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-green-700 transition-all shadow-sm shadow-green-500/20"
                                    >
                                      Confirm
                                    </button>
                                    <button
                                      onClick={() =>
                                        setActionConfirm({
                                          id: null,
                                          type: null,
                                        })
                                      }
                                      className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  /* --- ORIGINAL BUTTONS STATE --- */
                                  <>
                                    {(order.status === "Processing" ||
                                      order.status === "Pending" ||
                                      order.status === "Shipped") && (
                                      <button
                                        onClick={() =>
                                          setActionConfirm({
                                            id: order._id,
                                            type: "cancel",
                                          })
                                        }
                                        className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition-all border border-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
                                      >
                                        Cancel Order
                                      </button>
                                    )}

                                    {order.status === "Delivered" &&
                                      isWithinReturnWindow && (
                                        <button
                                          onClick={() =>
                                            setActionConfirm({
                                              id: order._id,
                                              type: "return",
                                            })
                                          }
                                          className="px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-600 text-xs font-bold rounded-xl transition-all border border-orange-100 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400"
                                        >
                                          Return Items
                                        </button>
                                      )}

                                    <Link
                                      to={`/OrderSummary`}
                                      state={{ order }}
                                      className="px-5 py-2 bg-slate-900 dark:bg-white dark:text-slate-900 text-white text-xs font-bold rounded-xl hover:opacity-90 transition-all active:scale-95 flex items-center gap-2"
                                    >
                                      View Details
                                    </Link>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. WISHLIST TAB */}
            {activeTab === "wishlist" && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[500px]">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      My Wishlist
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Items you've saved for later
                    </p>
                  </div>
                  <span className="text-xs font-bold bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 px-3 py-1 rounded-full border border-pink-100 dark:border-pink-800">
                    {user.wishlist.length} Items Saved
                  </span>
                </div>
                <div className="p-6">
                  {user.wishlist.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <Heart
                        size={40}
                        className="text-slate-300 dark:text-slate-600"
                      />
                      <h4 className="text-slate-900 dark:text-white font-bold">
                        Your wishlist is empty
                      </h4>
                      <p className="text-slate-500 text-sm mt-1">
                        Save items you like to find them easily later.
                      </p>
                      <Link
                        to="/"
                        className="mt-6 bg-blue-600 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                      >
                        Explore Products
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {user.wishlist.map((product) => (
                        <div
                          key={product._id}
                          className="group border border-slate-100 dark:border-slate-800 rounded-2xl p-4 hover:border-blue-200 dark:hover:border-blue-900/50 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all shadow-sm"
                        >
                          <div className="flex justify-between gap-4">
                            <Link
                              to={`/product/${product._id}`}
                              className="h-24 w-24 bg-white dark:bg-slate-800 rounded-xl overflow-hidden flex-shrink-0 border border-slate-100 dark:border-slate-700 group-hover:border-blue-300 transition-colors"
                            >
                              <img
                                src={getImageUrl(
                                  product.thumbnail ||
                                    (product.images && product.images[0])
                                )}
                                alt={product.name}
                                className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                                onError={(e) => {
                                  e.target.src =
                                    "https://via.placeholder.com/150?text=No+Image";
                                }}
                              />
                            </Link>
                            <div className="flex flex-col justify-between py-1 flex-1 min-w-0">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 truncate">
                                    {product.category || "Premium Collection"}
                                  </span>
                                </div>
                                <Link to={`/product/${product._id}`}>
                                  <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 hover:text-blue-600 transition-colors">
                                    {product.name}
                                  </h4>
                                </Link>
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
                            <div className="flex flex-col justify-between items-end shrink-0">
                              <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                  Price
                                </p>
                                <p className="text-lg font-black text-slate-900 dark:text-white">
                                  ₹{product.price.toLocaleString()}
                                </p>
                              </div>
                              <Link
                                to={`/product/${product._id}`}
                                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-all active:scale-90 shadow-md shadow-blue-500/10"
                              >
                                <ChevronRight size={18} />
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
                      <button
                        onClick={handleUseCurrentLocation}
                        disabled={isLocating}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-bold text-sm mb-6 shadow-sm transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {isLocating ? (
                          <Loader2 className="animate-spin" size={18} />
                        ) : (
                          <LocateFixed size={18} />
                        )}{" "}
                        {isLocating
                          ? "Fetching Location..."
                          : "Use my current location"}
                      </button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <input
                          placeholder="Receiver's Name"
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
                                      className="w-full text-left px-4 py-2.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-green-900/20 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 transition-colors"
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
                  <div className="group border border-slate-100 dark:border-slate-800 rounded-2xl p-5 hover:border-blue-200 dark:hover:border-blue-900/50 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex gap-4">
                        <div className="h-12 w-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Lock
                            size={20}
                            className="text-slate-400 group-hover:text-blue-500 transition-colors"
                          />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            Password
                          </h4>
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
                        onClick={() => navigate("/update-password")}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-blue-500 hover:text-white text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg transition-all active:scale-95"
                      >
                        Change Password <ChevronRight size={14} />
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Ensure your account is using a long, random password to
                      stay secure.
                    </p>
                  </div>
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
                        onClick={() => navigate("/update-email")}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-blue-500 hover:text-white text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg transition-all active:scale-95"
                      >
                        Change email <ChevronRight size={14} />
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed mt-4">
                      Use a verified email address to receive order updates,
                      security alerts, and exclusive offers.
                    </p>
                  </div>
                  <div className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <h4 className="text-xs font-black text-red-500 uppercase tracking-[0.2em] mb-4">
                      Danger Zone
                    </h4>
                    <div className="border border-red-100 dark:border-red-900/20 bg-red-50/30 dark:bg-red-900/10 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-center gap-4">
                      <div>
                        <h5 className="text-sm font-bold text-red-600 dark:text-red-400">
                          {isConfirming ? "Confirm Deletion" : "Delete Account"}
                        </h5>
                        <p className="text-xs text-red-500/70 mt-1">
                          {isConfirming
                            ? "Are you absolutely sure? All data will be lost."
                            : "Once you delete your account, there is no going back. Please be certain."}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        {isConfirming ? (
                          <>
                            {/* CANCEL BUTTON */}
                            <button
                              onClick={() => setIsConfirming(false)}
                              className="whitespace-nowrap bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all active:scale-95"
                            >
                              Cancel
                            </button>
                            {/* FINAL DELETE BUTTON */}
                            <button
                              onClick={handleDeactivate}
                              className="whitespace-nowrap bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all active:scale-95 shadow-sm shadow-red-200 dark:shadow-none"
                            >
                              Confirm
                            </button>
                          </>
                        ) : (
                          /* INITIAL DEACTIVATE BUTTON */
                          <button
                            onClick={handleDeactivate}
                            className="whitespace-nowrap bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all active:scale-95 shadow-sm shadow-red-200 dark:shadow-none"
                          >
                            Deactivate
                          </button>
                        )}
                      </div>
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
              : "bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
          } ${error ? "!border-red-400" : ""}`}
        />
      </div>
    </div>
  );
}
