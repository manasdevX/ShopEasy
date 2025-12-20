import { useState, useRef } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { 
  User, Mail, Phone, MapPin, 
  Camera, ShieldCheck, Pencil,
  ChevronRight, Package, Heart, Lock, 
  Globe, X, Check, AlertCircle
} from "lucide-react";

export default function Account() {
  const fileInputRef = useRef(null);
  
  const [user, setUser] = useState({
    name: "Shourya Shivhare",
    email: "shourya@gmail.com",
    phone: "9876543210",
    avatar: null,
    address: {
      addressLine: "B-24, Sector 62",
      city: "Noida",
      state: "Uttar Pradesh",
      pincode: "201301",
      country: "India"
    }
  });

  const [formData, setFormData] = useState({ ...user });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");

  // Validation Logic
  const validate = () => {
    let newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[6-9]\d{9}$/; 

    if (!emailRegex.test(formData.email)) newErrors.email = "Invalid email address";
    if (!phoneRegex.test(formData.phone)) newErrors.phone = "Invalid 10-digit number";
    if (formData.name.trim().length < 2) newErrors.name = "Name is too short";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));

    if (['addressLine', 'city', 'state', 'pincode', 'country'].includes(name)) {
      setFormData(prev => ({
        ...prev,
        address: { ...prev.address, [name]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUser(prev => ({ ...prev, avatar: reader.result }));
        setFormData(prev => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!validate()) return;
    setStatus("loading");
    setTimeout(() => {
      setUser({ ...formData });
      setStatus("success");
      setTimeout(() => setStatus("idle"), 2000);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#030712] text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* --- LEFT SIDEBAR (Clean UI Restored) --- */}
          <aside className="w-full lg:w-80 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-800 text-center transition-colors">
              
              <div className="relative w-32 h-32 mx-auto mb-6">
                {/* Main Avatar Circle */}
                <div className="w-full h-full rounded-full bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-900 shadow-md overflow-hidden flex items-center justify-center">
                  {user.avatar ? (
                    <img src={user.avatar} className="w-full h-full object-cover" alt="Profile" />
                  ) : (
                    <User size={54} className="text-slate-300 dark:text-slate-600" />
                  )}
                </div>

                {/* Pencil Button (Upload) */}
                <button 
                  onClick={() => fileInputRef.current.click()} 
                  className="absolute bottom-1 right-1 bg-orange-600 text-white p-2 rounded-xl shadow-lg hover:bg-orange-500 transition-all active:scale-90"
                >
                  <Pencil size={14} />
                </button>
                
                {/* X Button (Remove) */}
                {user.avatar && (
                  <button 
                    onClick={() => {
                        setUser(prev => ({ ...prev, avatar: null }));
                        setFormData(prev => ({ ...prev, avatar: null }));
                    }} 
                    className="absolute top-1 right-1 bg-white dark:bg-slate-800 text-red-500 p-1.5 rounded-full shadow-md border border-slate-100 dark:border-slate-700 hover:scale-110 transition-transform"
                  >
                    <X size={14} />
                  </button>
                )}

                <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
              </div>

              <h2 className="text-xl font-bold text-slate-900 dark:text-white truncate">{user.name}</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 truncate">{user.email}</p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] font-bold uppercase tracking-widest">
                <ShieldCheck size={12}/> Verified Account
              </div>
            </div>

            <nav className="bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
              {[
                { icon: <Package size={18}/>, label: "Order History" },
                { icon: <Heart size={18}/>, label: "My Wishlist" },
                { icon: <MapPin size={18}/>, label: "Saved Addresses" },
                { icon: <Lock size={18}/>, label: "Privacy & Security" },
              ].map((item) => (
                <button key={item.label} className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 group-hover:text-orange-600 dark:group-hover:text-orange-400 font-semibold text-sm">
                    {item.icon} {item.label}
                  </div>
                  <ChevronRight size={16} className="text-slate-300 dark:text-slate-700 group-hover:text-orange-400" />
                </button>
              ))}
            </nav>
          </aside>

          {/* --- MAIN CONTENT (Form with Validation) --- */}
          <div className="flex-1 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
              
              <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Profile Settings</h3>
                
                <button 
                  onClick={handleSave}
                  disabled={status !== "idle"}
                  className={`relative flex items-center justify-center gap-2 px-8 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 active:scale-95 min-w-[140px] ${
                    status === "idle" 
                      ? "bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-200 dark:shadow-none" 
                      : status === "loading"
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border dark:border-slate-700"
                      : "bg-green-500 text-white shadow-lg shadow-green-200 dark:shadow-none"
                  }`}
                >
                  {status === "idle" && <span>Save Changes</span>}
                  {status === "loading" && (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                      Saving...
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
                  <InputField label="Full Name" name="name" value={formData.name} onChange={handleInputChange} error={errors.name} />
                  <InputField label="Email Address" name="email" value={formData.email} onChange={handleInputChange} icon={<Mail size={16}/>} error={errors.email} />
                  <InputField label="Phone Number" name="phone" value={formData.phone} onChange={handleInputChange} icon={<Phone size={16}/>} error={errors.phone} />
                </div>

                <div className="pt-4 space-y-6">
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <MapPin size={14}/> Shipping Address
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <InputField label="Street Address" name="addressLine" value={formData.address.addressLine} onChange={handleInputChange} />
                    </div>
                    <InputField label="City" name="city" value={formData.address.city} onChange={handleInputChange} />
                    <InputField label="Pincode" name="pincode" value={formData.address.pincode} onChange={handleInputChange} />
                    <InputField label="State" name="state" value={formData.address.state} onChange={handleInputChange} />
                    <InputField label="Country" name="country" value={formData.address.country} onChange={handleInputChange} icon={<Globe size={16}/>} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function InputField({ label, name, value, onChange, icon, error }) {
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
          <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${error ? 'text-red-400' : 'text-slate-300 dark:text-slate-600'}`}>
            {icon}
          </div>
        )}
        <input 
          name={name} 
          value={value} 
          onChange={onChange}
          autoComplete="off"
          className={`w-full bg-slate-50 dark:bg-slate-800/50 border rounded-2xl px-4 py-3.5 outline-none transition-all font-medium text-slate-900 dark:text-slate-100 
            ${icon ? 'pl-11' : ''} 
            ${error ? 'border-red-400 focus:border-red-500' : 'border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:border-orange-500'}`}
        />
      </div>
    </div>
  );
}