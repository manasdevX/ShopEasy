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
  ShieldCheck, // Added icon for visual polish
  LogOut, // Added icon for visual polish
} from "lucide-react";
import toast from "react-hot-toast";

export default function Account() {
  const fileInputRef = useRef(null);

  // 1. STATE: Active Tab (Default is 'profile')
  const [activeTab, setActiveTab] = useState("profile");

  const [user, setUser] = useState({
    name: "",
    email: "",
    phone: "",
    avatar: null,
    address: {
      street: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
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
          toast.error("Session expired. Please login again.");
          localStorage.removeItem("token");
          setStatus("idle");
          return;
        }

        const data = await res.json();

        if (res.ok) {
          const userData = {
            name: data.name || "",
            email: data.email || "",
            phone: data.phone || "",
            avatar:
              data.profilePicture ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                data.name || "User"
              )}&background=random&color=fff`,
            address: {
              street: data.address?.street || "",
              city: data.address?.city || "",
              state: data.address?.state || "",
              pincode: data.address?.pincode || "",
              country: data.address?.country || "India",
            },
          };

          setUser(userData);
          setFormData(userData);
        } else {
          toast.error(data.message || "Could not load profile");
        }
      } catch (err) {
        console.error("🔥 NETWORK ERROR:", err);
        toast.error("Server connection failed");
      } finally {
        setStatus("idle");
      }
    };

    fetchProfile();
  }, []);

  // ================= VALIDATION & HANDLERS =================
  const validate = () => {
    let newErrors = {};
    const phoneRegex = /^[0-9+]{10,13}$/;

    if (formData.name.trim().length < 2) newErrors.name = "Name is too short";
    if (formData.phone && !phoneRegex.test(formData.phone))
      newErrors.phone = "Invalid phone number";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));

    if (["street", "city", "state", "pincode", "country"].includes(name)) {
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
        address: formData.address,
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
          avatar: data.user ? data.user.profilePicture : formData.avatar,
        });
        setStatus("success");
        toast.success("Profile Saved!");
        setTimeout(() => setStatus("idle"), 2000);
      } else {
        toast.error(data.message || "Save failed");
        setStatus("idle");
      }
    } catch (err) {
      toast.error("Server Error");
      setStatus("idle");
    }
  };

  // ================= SIDEBAR NAVIGATION ITEMS =================
  const navItems = [
    { id: "profile", label: "Profile Settings", icon: <User size={18} /> },
    { id: "orders", label: "Order History", icon: <Package size={18} /> },
    { id: "wishlist", label: "My Wishlist", icon: <Heart size={18} /> },
    { id: "addresses", label: "Saved Addresses", icon: <MapPin size={18} /> },
    { id: "security", label: "Privacy & Security", icon: <Lock size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#030712] text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* ================= LEFT SIDEBAR ================= */}
          <aside className="w-full lg:w-80 space-y-6">
            {/* User Info Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-800 text-center transition-colors">
              <div className="relative w-32 h-32 mx-auto mb-6">
                <div className="w-full h-full rounded-full bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-900 shadow-md overflow-hidden flex items-center justify-center">
                  {formData.avatar ? (
                    <img
                      src={formData.avatar}
                      className="w-full h-full object-cover"
                      alt="Profile"
                    />
                  ) : (
                    <User
                      size={54}
                      className="text-slate-300 dark:text-slate-600"
                    />
                  )}
                </div>

                <button
                  onClick={() => fileInputRef.current.click()}
                  className="absolute bottom-1 right-1 bg-orange-600 text-white p-2 rounded-xl shadow-lg hover:bg-orange-500 transition-all active:scale-90"
                >
                  <Pencil size={14} />
                </button>

                {formData.avatar && (
                  <button
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, avatar: null }))
                    }
                    className="absolute top-1 right-1 bg-white dark:bg-slate-800 text-red-500 p-1.5 rounded-full shadow-md border border-slate-100 dark:border-slate-700 hover:scale-110 transition-transform"
                  >
                    <X size={14} />
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

              <h2 className="text-xl font-bold text-slate-900 dark:text-white truncate">
                {user.name || "User"}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 truncate">
                {user.email || ""}
              </p>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] font-bold uppercase tracking-widest">
                <ShieldCheck size={12} /> Verified Account
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)} // 👈 Switches the Tab
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all duration-200 group ${
                    activeTab === item.id
                      ? "bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 shadow-sm ring-1 ring-orange-200 dark:ring-orange-900"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <div className="flex items-center gap-3 font-semibold text-sm">
                    {item.icon} {item.label}
                  </div>
                  <ChevronRight
                    size={16}
                    className={`transition-colors ${
                      activeTab === item.id
                        ? "text-orange-500"
                        : "text-slate-300 dark:text-slate-700 group-hover:text-slate-500"
                    }`}
                  />
                </button>
              ))}
            </nav>
          </aside>

          {/* ================= MAIN CONTENT AREA ================= */}
          <div className="flex-1">
            {/* 1. PROFILE SETTINGS TAB */}
            {activeTab === "profile" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
                  <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      Profile Settings
                    </h3>

                    <button
                      onClick={handleSave}
                      disabled={
                        status === "saving" ||
                        status === "success" ||
                        status === "loading"
                      }
                      className={`relative flex items-center justify-center gap-2 px-8 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 active:scale-95 min-w-[140px] ${
                        status === "idle"
                          ? "bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-200 dark:shadow-none"
                          : status === "saving" || status === "loading"
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border dark:border-slate-700"
                          : "bg-green-500 text-white shadow-lg shadow-green-200 dark:shadow-none"
                      }`}
                    >
                      {status === "idle" && <span>Save Changes</span>}
                      {(status === "saving" || status === "loading") && (
                        <span className="flex items-center gap-2">
                          <Loader2 className="animate-spin" size={16} />
                          {status === "loading" ? "Loading..." : "Saving..."}
                        </span>
                      )}
                      {status === "success" && (
                        <span className="flex items-center gap-2 animate-in zoom-in duration-300">
                          <Check size={18} />
                          Saved!
                        </span>
                      )}
                    </button>
                  </div>

                  <div className="p-8 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InputField
                        label="Full Name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        error={errors.name}
                      />
                      <InputField
                        label="Email Address"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        icon={<Mail size={16} />}
                        disabled={true}
                      />
                      <InputField
                        label="Phone Number"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        icon={<Phone size={16} />}
                        disabled={true}
                        error={errors.phone}
                      />
                    </div>

                    <div className="pt-4 space-y-6">
                      <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <MapPin size={14} /> Shipping Address
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                          <InputField
                            label="Street Address"
                            name="street"
                            value={formData.address.street}
                            onChange={handleInputChange}
                          />
                        </div>
                        <InputField
                          label="City"
                          name="city"
                          value={formData.address.city}
                          onChange={handleInputChange}
                        />
                        <InputField
                          label="Pincode"
                          name="pincode"
                          value={formData.address.pincode}
                          onChange={handleInputChange}
                        />
                        <InputField
                          label="State"
                          name="state"
                          value={formData.address.state}
                          onChange={handleInputChange}
                        />
                        <InputField
                          label="Country"
                          name="country"
                          value={formData.address.country}
                          onChange={handleInputChange}
                          icon={<Globe size={16} />}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. ORDERS TAB (Placeholder) */}
            {activeTab === "orders" && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 shadow-sm border border-slate-200 dark:border-slate-800 text-center animate-in fade-in zoom-in duration-300">
                <div className="w-20 h-20 bg-orange-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-500">
                  <Package size={40} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  No Orders Yet
                </h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-8">
                  Looks like you haven't bought anything yet. Go ahead and
                  explore our products!
                </p>
                <button className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity">
                  Start Shopping
                </button>
              </div>
            )}

            {/* 3. WISHLIST TAB (Placeholder) */}
            {activeTab === "wishlist" && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 shadow-sm border border-slate-200 dark:border-slate-800 text-center animate-in fade-in zoom-in duration-300">
                <div className="w-20 h-20 bg-pink-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-pink-500">
                  <Heart size={40} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Your Wishlist is Empty
                </h2>
                <p className="text-slate-500 dark:text-slate-400">
                  Save items you love here to buy them later.
                </p>
              </div>
            )}

            {/* 4. ADDRESSES TAB (Placeholder) */}
            {activeTab === "addresses" && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 shadow-sm border border-slate-200 dark:border-slate-800 text-center animate-in fade-in zoom-in duration-300">
                <div className="w-20 h-20 bg-blue-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-500">
                  <MapPin size={40} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Manage Addresses
                </h2>
                <p className="text-slate-500 dark:text-slate-400">
                  You can edit your primary address in the{" "}
                  <b>Profile Settings</b> tab. <br /> Multiple address support
                  is coming soon!
                </p>
              </div>
            )}

            {/* 5. SECURITY TAB (Placeholder) */}
            {activeTab === "security" && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-300">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                  Security Settings
                </h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                    <div className="flex items-center gap-4">
                      <div className="bg-white dark:bg-slate-700 p-3 rounded-full text-slate-900 dark:text-white">
                        <Lock size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">
                          Password
                        </h4>
                        <p className="text-xs text-slate-500">
                          Last changed 3 months ago
                        </p>
                      </div>
                    </div>
                    <button className="text-sm font-bold text-orange-600 bg-white dark:bg-slate-900 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors">
                      Change
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                    <div className="flex items-center gap-4">
                      <div className="bg-white dark:bg-slate-700 p-3 rounded-full text-slate-900 dark:text-white">
                        <LogOut size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">
                          Active Sessions
                        </h4>
                        <p className="text-xs text-slate-500">
                          Windows PC - Chrome - Noida, India
                        </p>
                      </div>
                    </div>
                    <button className="text-sm font-bold text-red-600 bg-white dark:bg-slate-900 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-red-50 transition-colors">
                      Sign Out All
                    </button>
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

// --- HELPER COMPONENT FOR INPUTS ---
function InputField({ label, name, value, onChange, icon, error, disabled }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center ml-1">
        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {label}
        </label>
        {error && (
          <span className="text-[10px] text-red-500 font-bold flex items-center gap-1 animate-in fade-in slide-in-from-right-1">
            <AlertCircle size={10} /> {error}
          </span>
        )}
      </div>
      <div className="relative">
        {icon && (
          <div
            className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
              error ? "text-red-400" : "text-slate-300 dark:text-slate-600"
            }`}
          >
            {icon}
          </div>
        )}
        <input
          name={name}
          value={value || ""}
          onChange={onChange}
          disabled={disabled}
          autoComplete="off"
          className={`w-full bg-slate-50 dark:bg-slate-800/50 border rounded-2xl px-4 py-3.5 outline-none transition-all font-medium text-slate-900 dark:text-slate-100 
            ${icon ? "pl-11" : ""} 
            ${
              disabled
                ? "opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800"
                : ""
            }
            ${
              error
                ? "border-red-400 focus:border-red-500"
                : "border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:border-orange-500"
            }`}
        />
      </div>
    </div>
  );
}
