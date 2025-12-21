import { useState, useRef, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Pencil,
  ChevronRight,
  Package,
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
} from "lucide-react";
import toast from "react-hot-toast";

// 1. CUSTOM PREMIUM TOAST COMPONENT
const notify = (type, message) => {
  toast.custom((t) => (
    <div
      className={`${t.visible ? "animate-enter" : "animate-leave"} 
      max-w-sm w-full bg-white dark:bg-[#1e293b] shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 dark:ring-white/10 overflow-hidden transform transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]`}
    >
      <div className="flex-1 w-0 p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0 pt-0.5">
            {type === "success" ? (
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <Check className="h-5 w-5 text-green-500" strokeWidth={3} />
              </div>
            ) : (
              <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-500" strokeWidth={3} />
              </div>
            )}
          </div>
          <div className="ml-4 flex-1">
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {type === "success" ? "Success" : "Attention"}
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 font-medium">
              {message}
            </p>
          </div>
        </div>
      </div>
      <div className="flex border-l border-slate-100 dark:border-slate-700">
        <button
          onClick={() => toast.dismiss(t.id)}
          className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  ));
};

export default function Account() {
  const fileInputRef = useRef(null);

  // STATE
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);

  // Address State
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  // 👇 New loading state to prevent double submissions
  const [isAddressSaving, setIsAddressSaving] = useState(false);

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

        const res = await fetch("http://localhost:5000/api/user/profile", {
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
            phone: data.phone || "",
            avatar:
              data.profilePicture ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                data.name || "User"
              )}&background=random&color=fff`,
            addresses: allAddresses,
            address: {
              name: data.address?.name || primaryAddr.fullName || data.name,
              phone: data.address?.phone || primaryAddr.phone || data.phone,
              street: data.address?.street || primaryAddr.addressLine || "",
              city: data.address?.city || primaryAddr.city || "",
              state: data.address?.state || primaryAddr.state || "",
              pincode: data.address?.pincode || primaryAddr.pincode || "",
              country: data.address?.country || primaryAddr.country || "India",
              type: data.address?.type || primaryAddr.type || "Home",
            },
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

  // ================= ADDRESS HANDLERS =================

  const handleSetDefault = async (id) => {
    setOpenMenuId(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:5000/api/user/address/${id}/default`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const updatedAddresses = await res.json();

      if (res.ok) {
        setUser((prev) => ({ ...prev, addresses: updatedAddresses }));

        // Update Profile Settings Form to reflect the new default address
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
        notify("success", "Default Address Updated");
      }
    } catch (err) {
      notify("error", "Failed to update default address");
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
      notify("error", "Please fill all required fields");
      return;
    }

    // 👇 Prevent duplicate submissions
    setIsAddressSaving(true);

    try {
      const token = localStorage.getItem("token");
      let url = "http://localhost:5000/api/user/address";
      let method = "POST";

      if (editingAddressId) {
        url = `http://localhost:5000/api/user/address/${editingAddressId}`;
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

        // Check if we edited the default/primary address
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
        notify(
          "success",
          editingAddressId ? "Address Updated!" : "Address Added!"
        );
      } else {
        notify("error", updatedAddresses.message || "Failed to save address");
      }
    } catch (err) {
      notify("error", "Network Error");
    } finally {
      // 👇 Re-enable button
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
    // Pre-fill Name/Phone from main profile but allow edits
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
      const res = await fetch(`http://localhost:5000/api/user/address/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const updatedAddresses = await res.json();
      if (res.ok) {
        setUser((prev) => ({ ...prev, addresses: updatedAddresses }));
        // Recalculate profile address in case default was deleted
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
        notify("success", "Address Deleted");
      }
    } catch (err) {
      notify("error", "Failed to delete");
    }
  };

  const toggleMenu = (id) => {
    if (openMenuId === id) setOpenMenuId(null);
    else setOpenMenuId(id);
  };

  // ================= PROFILE HANDLERS =================
  const validate = () => {
    let newErrors = {};
    if (formData.name.trim().length < 2) newErrors.name = "Name is too short";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
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

  const handleSave = async () => {
    if (!validate()) return;
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
      const res = await fetch("http://localhost:5000/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setUser({
          ...formData,
          avatar: data.profilePicture,
          addresses: data.addresses,
        });
        // Sync form data with returned data to ensure consistency
        setFormData((prev) => ({
          ...prev,
          addresses: data.addresses,
          address: data.address,
        }));

        setIsEditing(false);
        notify("success", "Profile Updated Successfully!");
        setTimeout(() => setStatus("idle"), 2000);
      } else {
        notify("error", data.message || "Save failed");
        setStatus("idle");
      }
    } catch (err) {
      notify("error", "Server Error");
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

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* SIDEBAR */}
          <aside className="w-full lg:w-80 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-800 text-center transition-colors">
              <div className="relative w-32 h-32 mx-auto mb-6">
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
                  <button
                    onClick={() => fileInputRef.current.click()}
                    className="absolute bottom-1 right-1 bg-orange-600 text-white p-2.5 rounded-xl shadow-lg hover:bg-orange-500 transition-all active:scale-90 z-10"
                  >
                    <Pencil size={16} />
                  </button>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className="hidden"
                  accept="image/*"
                />
              </div>
              <h2 className="text-xl font-bold">{user.name}</h2>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] font-bold uppercase tracking-widest mt-2">
                <ShieldCheck size={12} /> Verified Account
              </div>
            </div>
            <nav className="bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all duration-200 group ${
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
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden relative">
                  <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-10">
                    <div>
                      <h3 className="text-lg font-bold">Profile Settings</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {isEditing
                          ? "Update your details"
                          : "View profile info"}
                      </p>
                    </div>
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 shadow-lg"
                      >
                        <Edit2 size={16} /> Edit Profile
                      </button>
                    ) : (
                      <button
                        onClick={handleSave}
                        disabled={status === "saving"}
                        className="flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold text-sm bg-orange-500 text-white shadow-lg hover:bg-orange-600 transition-all"
                      >
                        {status === "saving" ? (
                          <Loader2 className="animate-spin" size={16} />
                        ) : (
                          <Check size={18} />
                        )}{" "}
                        Save Changes
                      </button>
                    )}
                  </div>
                  <div className="p-8 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InputField
                        label="Full Name (Account)"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        isEditing={isEditing}
                        icon={<User size={16} />}
                      />
                      <InputField
                        label="Email (Account)"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        icon={<Mail size={16} />}
                        isEditing={isEditing}
                        readOnly={true}
                      />
                      <InputField
                        label="Phone (Account)"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        icon={<Phone size={16} />}
                        isEditing={isEditing}
                        readOnly={true}
                      />
                    </div>
                    <div className="pt-4 space-y-6">
                      <div className="flex items-center gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                        <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                          <MapPin size={14} /> Shipping Address
                        </h4>
                        {formData.address.type && (
                          <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-[4px] uppercase border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                            {formData.address.type === "Home" ? (
                              <Home size={10} />
                            ) : (
                              <Briefcase size={10} />
                            )}
                            {formData.address.type}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField
                          label="Receiver Name"
                          name="addressName"
                          value={formData.address.name}
                          onChange={handleInputChange}
                          isEditing={isEditing}
                          icon={<User size={16} />}
                        />
                        <InputField
                          label="Contact Number"
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

            {/* 2. MANAGE ADDRESSES TAB */}
            {activeTab === "addresses" && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[500px]">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Manage Addresses
                  </h3>
                </div>

                <div className="p-6">
                  {/* ADD/EDIT FORM */}
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
                          Address Type
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
                        {/* 👇 Save button now uses `isAddressSaving` to prevent double-clicks */}
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
                            className={`border rounded-sm p-6 bg-white dark:bg-slate-900 relative hover:shadow-md transition-shadow ${
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

                              {/* Kebab Dropdown */}
                              {openMenuId === addr._id && (
                                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-md overflow-hidden z-20 min-w-[160px] animate-in zoom-in-95 duration-100">
                                  <button
                                    onClick={() => handleEditClick(addr)}
                                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 transition-colors"
                                  >
                                    <Edit2 size={14} /> Edit
                                  </button>
                                  {!addr.isDefault && (
                                    <button
                                      onClick={() => handleSetDefault(addr._id)}
                                      className="w-full text-left px-4 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 transition-colors"
                                    >
                                      <Star size={14} /> Set as Default
                                    </button>
                                  )}
                                  <button
                                    onClick={() =>
                                      handleDeleteAddress(addr._id)
                                    }
                                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
                                  >
                                    <Trash2 size={14} /> Delete
                                  </button>
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2">
                              <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-[3px] uppercase tracking-wide border border-slate-200 dark:border-slate-700">
                                {addr.type || "Home"}
                              </span>
                              {addr.isDefault && (
                                <span className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-[3px] uppercase tracking-wide border border-green-100 dark:border-green-800">
                                  DEFAULT
                                </span>
                              )}
                            </div>

                            {/* Display Specific Address Name & Phone */}
                            <div className="mt-3 flex items-center gap-4">
                              <span className="font-bold text-slate-900 dark:text-white text-sm">
                                {addr.fullName}
                              </span>
                              <span className="font-bold text-slate-900 dark:text-white text-sm">
                                {addr.phone}
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
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

            {/* Other Tabs */}
            {activeTab === "orders" && (
              <PlaceholderTab
                icon={<Package size={40} />}
                title="No Orders Yet"
                desc="Start shopping to see your orders here."
              />
            )}
            {activeTab === "wishlist" && (
              <PlaceholderTab
                icon={<Heart size={40} />}
                title="Wishlist Empty"
                desc="Save items you love here."
              />
            )}
            {activeTab === "security" && (
              <PlaceholderTab
                icon={<Lock size={40} />}
                title="Security"
                desc="Password settings coming soon."
              />
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
    <div className="space-y-2 group">
      <div className="flex justify-between items-center ml-1">
        <label
          className={`text-[11px] font-bold uppercase tracking-wider transition-colors ${
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
          className={`w-full transition-all duration-200 font-medium ${
            icon ? "pl-11" : "px-4"
          } py-3.5 rounded-2xl outline-none ${
            !isEditing
              ? "bg-transparent border-transparent text-slate-700 dark:text-slate-300 cursor-default"
              : readOnly
              ? "bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-400 cursor-not-allowed"
              : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
          } ${error ? "!border-red-400" : ""}`}
        />
        {isEditing && readOnly && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
            <Lock size={14} />
          </div>
        )}
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
