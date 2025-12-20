import { useState, useRef } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { 
  User, Mail, Phone, MapPin, 
  Camera, ShieldCheck, Check, Pencil,
  ChevronRight, Package, Heart, Lock, 
  Globe, Building, Navigation, X
} from "lucide-react";

export default function Account() {
  const fileInputRef = useRef(null);
  
  // 1. Permanent State (Database Source of Truth)
  const [userDb, setUserDb] = useState({
    name: "Shourya Shivhare",
    email: "shourya@gmail.com",
    phone: "9876543210",
    avatar: null, // Stores the permanent image URL/Base64
    address: {
      addressLine: "B-24, Sector 62",
      city: "Noida",
      state: "Uttar Pradesh",
      pincode: "201301",
      country: "India"
    }
  });

  // 2. Draft State (What the user sees while typing)
  const [formData, setFormData] = useState({ ...userDb });
  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
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
        setFormData(prev => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API logic
    setTimeout(() => {
      setUserDb({ ...formData }); // Sidebar/Navbar updates ONLY here
      setIsSaving(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* --- LEFT SIDEBAR (Synced only on Save) --- */}
          <aside className="w-full lg:w-80 space-y-6">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 text-center">
              <div className="relative w-28 h-28 mx-auto mb-4 group">
                <div className="w-full h-full rounded-full bg-slate-100 border-4 border-white shadow-md overflow-hidden flex items-center justify-center">
                  {userDb.avatar ? (
                    <img src={userDb.avatar} className="w-full h-full object-cover" alt="Profile" />
                  ) : (
                    <User size={48} className="text-slate-300" />
                  )}
                </div>
              </div>
              <h2 className="text-xl font-bold text-slate-900">{userDb.name}</h2>
              <p className="text-slate-500 text-sm mb-4">{userDb.email}</p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-600 text-[10px] font-bold uppercase tracking-widest">
                <ShieldCheck size={12}/> Verified Account
              </div>
            </div>

            <nav className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200">
              {[
                { icon: <Package size={18}/>, label: "Order History" },
                { icon: <Heart size={18}/>, label: "My Wishlist" },
                { icon: <MapPin size={18}/>, label: "Saved Addresses" },
                { icon: <Lock size={18}/>, label: "Privacy & Security" },
              ].map((item) => (
                <button key={item.label} className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center gap-3 text-slate-600 group-hover:text-orange-600 font-semibold text-sm">
                    {item.icon} {item.label}
                  </div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-orange-400" />
                </button>
              ))}
            </nav>
          </aside>

          {/* --- MAIN CONTENT --- */}
          <div className="flex-1 space-y-6">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Manage Profile</h3>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 ${
                    isSaving ? 'bg-slate-100 text-slate-400' : 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-200'
                  }`}
                >
                  {isSaving ? "Saving..." : <><Check size={18}/> Save Changes</>}
                </button>
              </div>

              <div className="p-8 space-y-10">
                
                {/* 📸 PHOTO UPLOAD AREA */}
                <div className="flex flex-col md:flex-row items-center gap-8 pb-8 border-b border-slate-50">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden flex items-center justify-center">
                      {formData.avatar ? (
                        <img src={formData.avatar} className="w-full h-full object-cover" />
                      ) : (
                        <Camera size={24} className="text-slate-300" />
                      )}
                    </div>
                    <button 
                      onClick={() => fileInputRef.current.click()}
                      className="absolute -bottom-2 -right-2 bg-slate-900 text-white p-2 rounded-lg shadow-xl hover:bg-orange-500 transition-colors"
                    >
                      <Pencil size={12} />
                    </button>
                    {formData.avatar && (
                      <button 
                        onClick={() => setFormData(prev => ({ ...prev, avatar: null }))}
                        className="absolute -top-2 -right-2 bg-white text-red-500 p-1 rounded-full shadow-md border border-slate-100"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Profile Photo</h4>
                    <p className="text-sm text-slate-500 mb-3">Upload a new photo for your public profile.</p>
                    <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
                    <button 
                      onClick={() => fileInputRef.current.click()}
                      className="text-xs font-bold text-orange-600 uppercase tracking-widest hover:text-orange-700"
                    >
                      UPLOAD Image
                    </button>
                  </div>
                </div>

                {/* 👤 BASIC INFORMATION (Added Email Field) */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <User size={14}/> Basic Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
                      <input 
                        name="name" value={formData.name} onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 outline-none focus:bg-white focus:border-orange-500 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                        <input 
                          name="email" value={formData.email} onChange={handleInputChange}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3.5 outline-none focus:bg-white focus:border-orange-500 transition-all font-medium"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Phone Number</label>
                      <div className="relative">
                        <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                        <input 
                          name="phone" value={formData.phone} onChange={handleInputChange}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3.5 outline-none focus:bg-white focus:border-orange-500 transition-all font-medium"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 📍 SHIPPING ADDRESS (Schema Fields) */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <MapPin size={14}/> Shipping Address
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Street Address</label>
                      <input 
                        name="addressLine" value={formData.address.addressLine} onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 outline-none focus:bg-white focus:border-orange-500 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">City</label>
                      <input 
                        name="city" value={formData.address.city} onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 outline-none focus:bg-white focus:border-orange-500 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Pincode</label>
                      <input 
                        name="pincode" value={formData.address.pincode} onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 outline-none focus:bg-white focus:border-orange-500 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">State</label>
                      <input 
                        name="state" value={formData.address.state} onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 outline-none focus:bg-white focus:border-orange-500 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Country</label>
                      <div className="relative">
                        <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                        <input 
                          name="country" value={formData.address.country} onChange={handleInputChange}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3.5 outline-none focus:bg-white focus:border-orange-500 transition-all font-medium"
                        />
                      </div>
                    </div>
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