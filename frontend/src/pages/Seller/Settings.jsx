import React, { useState, useEffect } from "react";
import {
  User, Landmark, MapPin, Edit3, Trash2, ShieldCheck, Zap, 
  CreditCard, ShieldAlert, ChevronRight, CheckCircle2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Seller/SellerNavbar";
import Footer from "../../components/Seller/SellerFooter";
import { showSuccess, showError } from "../../utils/toast";

/* ======================================================
   SUB-COMPONENT: PREMIUM FORM INPUT
====================================================== */
const FormInput = ({ label, value, onChange, disabled, type = "text", placeholder }) => (
  <div className="group space-y-2">
    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 group-focus-within:text-orange-500 transition-colors">
      {label}
    </label>
    <div className="relative">
      <input
        type={type}
        value={value || ""}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-2 rounded-xl text-sm transition-all duration-200 outline-none
          ${disabled 
            ? "border-transparent text-slate-500 cursor-not-allowed opacity-70" 
            : "border-slate-100 dark:border-slate-800 focus:border-orange-500/50 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-orange-500/5 text-slate-700 dark:text-slate-200"
          }`}
      />
      {!disabled && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-opacity">
          <Edit3 size={14} className="text-orange-500" />
        </div>
      )}
    </div>
  </div>
);

/* ======================================================
   MAIN COMPONENT: SETTINGS
====================================================== */
const Settings = () => {
  const [activeTab, setActiveTab] = useState("personal");
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [personalForm, setPersonalForm] = useState({ name: "", email: "", phone: "" });
  const [bankDetails, setBankDetails] = useState(null);
  const [addressForm, setAddressForm] = useState({ street: "", city: "", state: "", zip: "" });

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/sellers/profile", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setPersonalForm({ name: data.name, email: data.email, phone: data.phone });
        setBankDetails(data.bankDetails);
        if (data.address) {
          try { setAddressForm(JSON.parse(data.address)); } 
          catch { setAddressForm({ ...addressForm, street: data.address }); }
        }
      }
    } catch (err) {
      showError("Could not load profile");
    } finally {
      setLoading(false);
    }
  };

  const savePersonalInfo = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/sellers/profile", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          name: personalForm.name,
          phone: personalForm.phone,
          address: JSON.stringify(addressForm)
        })
      });
      if (res.ok) {
        showSuccess("Profile updated");
        setIsEditing(false);
      } else {
        const err = await res.json();
        showError(err.message);
      }
    } catch (err) {
      showError("Update failed");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/sellers/profile", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showSuccess("Account deleted");
        localStorage.clear();
        navigate("/register");
      }
    } catch (err) {
      showError("Delete failed");
    }
  };

  const navItems = [
    { id: "personal", label: "Account Info", icon: <User size={18} /> },
    { id: "business", label: "Business Details", icon: <Zap size={18} /> },
    { id: "bank", label: "Payments & Payouts", icon: <Landmark size={18} /> },
    { id: "address", label: "Store Address", icon: <MapPin size={18} /> },
  ];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
    </div>
  );

  return (
    <div className="bg-[#f8fafc] dark:bg-[#020617] min-h-screen font-sans selection:bg-orange-100 selection:text-orange-900">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-10">
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Settings</h1>
          <p className="text-slate-500 mt-2 text-lg">Manage your identity, billing, and store presence.</p>
        </header>

        <div className="flex flex-col lg:flex-row items-start gap-10">
          
          {/* STICKY SIDEBAR */}
          <aside className="lg:w-72 w-full flex-shrink-0">
            <div className="sticky top-28 space-y-6">
              <nav className="p-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); setIsEditing(false); }}
                    className={`w-full flex items-center justify-between px-4 py-3.5 text-sm font-bold rounded-2xl transition-all duration-300 ${
                      activeTab === item.id
                        ? "bg-orange-500 text-white shadow-xl shadow-orange-500/20 translate-x-1"
                        : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon} {item.label}
                    </div>
                    {activeTab === item.id && <ChevronRight size={16} />}
                  </button>
                ))}
              </nav>

              {/* DANGER ZONE */}
              <div className="p-5 bg-red-50/50 dark:bg-red-500/5 rounded-3xl border border-red-100 dark:border-red-900/20">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 mb-4">Danger Zone</h4>
                {!isConfirming ? (
                  <button 
                    onClick={() => setIsConfirming(true)} 
                    className="w-full py-3 bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/30 text-red-600 rounded-xl text-xs font-bold hover:bg-red-600 hover:text-white transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    <Trash2 size={14} /> Delete Account
                  </button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-[11px] text-red-600 font-bold text-center">Permanently delete account?</p>
                    <div className="flex gap-2">
                      <button onClick={() => setIsConfirming(false)} className="flex-1 py-2 bg-white dark:bg-slate-800 text-slate-600 text-[10px] font-bold rounded-lg border">No, Cancel</button>
                      <button onClick={handleDeleteAccount} className="flex-1 py-2 bg-red-600 text-white text-[10px] font-bold rounded-lg shadow-lg">Yes, Delete</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* MAIN CONTENT PANEL */}
          <div className="flex-grow bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-8 md:p-12">
              
              {/* ACCOUNT INFO SECTION */}
              {activeTab === "personal" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
                    <div>
                      <h2 className="text-2xl font-black dark:text-white tracking-tight">Account Information</h2>
                      <p className="text-slate-500 text-sm mt-1">Basic details used for your public profile.</p>
                    </div>
                    <button
                      onClick={() => isEditing ? savePersonalInfo() : setIsEditing(true)}
                      className={`px-8 py-3 rounded-2xl text-sm font-black transition-all ${
                        isEditing 
                          ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30 hover:bg-orange-600" 
                          : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200"
                      }`}
                    >
                      {isEditing ? "Save Changes" : "Edit Profile"}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormInput label="Full Name" value={personalForm.name} disabled={!isEditing} onChange={(val) => setPersonalForm({ ...personalForm, name: val })} />
                    <FormInput label="Phone Number" value={personalForm.phone} disabled={!isEditing} onChange={(val) => setPersonalForm({ ...personalForm, phone: val })} />
                    <div className="md:col-span-2">
                      <FormInput label="Email Address" value={personalForm.email} disabled={true} />
                      <p className="mt-2 text-[10px] text-slate-400 flex items-center gap-1">
                        <ShieldCheck size={12} /> Email is verified and locked to your account.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ADDRESS SECTION */}
              {activeTab === "address" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between mb-10">
                    <h2 className="text-2xl font-black dark:text-white tracking-tight">Store Address</h2>
                    <button onClick={() => isEditing ? savePersonalInfo() : setIsEditing(true)} className="flex items-center gap-2 text-orange-500 font-bold hover:underline">
                      <Edit3 size={18} /> {isEditing ? "Apply Changes" : "Modify"}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormInput label="Street" value={addressForm.street} disabled={!isEditing} onChange={(val) => setAddressForm({...addressForm, street: val})} />
                    <FormInput label="City" value={addressForm.city} disabled={!isEditing} onChange={(val) => setAddressForm({...addressForm, city: val})} />
                    <FormInput label="Postal Code" value={addressForm.zip} disabled={!isEditing} onChange={(val) => setAddressForm({...addressForm, zip: val})} />
                    <FormInput label="State" value={addressForm.state} disabled={!isEditing} onChange={(val) => setAddressForm({...addressForm, state: val})} />
                  </div>
                </div>
              )}

              {/* BANKING SECTION: PREMIUM CARD UI */}
              {activeTab === "bank" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10">
                   <h2 className="text-2xl font-black dark:text-white tracking-tight">Payout Methods</h2>
                   {bankDetails ? (
                     <div className="relative group max-w-sm aspect-[1.6/1] rounded-[2rem] p-8 text-white shadow-2xl transition-transform hover:scale-[1.02] duration-500 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-slate-900 to-black z-0" />
                        <div className="absolute -right-20 -top-20 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl" />
                        
                        <div className="relative z-10 h-full flex flex-col justify-between">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">Verified Seller Account</p>
                              <h3 className="text-xl font-bold tracking-tight">{bankDetails.bankName}</h3>
                            </div>
                            <Landmark size={32} className="text-orange-400/80" />
                          </div>

                          <div className="space-y-4">
                            <p className="text-2xl font-mono tracking-[0.25em] text-white/90">
                              •••• •••• {bankDetails.accountNumber?.slice(-4)}
                            </p>
                            <div className="flex justify-between items-end">
                              <div>
                                <p className="text-[9px] uppercase opacity-40 mb-1">Account Holder</p>
                                <p className="text-xs font-medium tracking-wide">{bankDetails.accountHolder}</p>
                              </div>
                              <div className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                <span className="text-[10px] font-bold tracking-tighter">ACTIVE</span>
                              </div>
                            </div>
                          </div>
                        </div>
                     </div>
                   ) : (
                     <div className="border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-16 text-center group hover:border-orange-500/30 transition-colors">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                          <CreditCard size={32} className="text-slate-300 group-hover:text-orange-500" />
                        </div>
                        <h3 className="text-lg font-bold dark:text-white">No Payout Method</h3>
                        <p className="text-slate-500 text-sm mt-2 max-w-xs mx-auto">Link your bank account to start receiving payments from your sales.</p>
                        <button className="mt-8 px-6 py-3 bg-orange-500 text-white rounded-2xl font-bold shadow-lg shadow-orange-500/20">+ Add Bank Account</button>
                     </div>
                   )}
                </div>
              )}

              {/* BUSINESS SECTION (Mirroring Registration Data) */}
{activeTab === "business" && (
  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 className="text-2xl font-black dark:text-white tracking-tight">Business Profile</h2>
        <p className="text-slate-500 text-sm mt-1">Legal and tax information associated with your store.</p>
      </div>
      <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-900/30 rounded-full">
        <ShieldCheck size={16} className="text-orange-600 dark:text-orange-400" />
        <span className="text-[10px] font-black uppercase tracking-widest text-orange-700 dark:text-orange-400">Verified Seller</span>
      </div>
    </div>

    {/* BUSINESS INFO GRID */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[
        { 
          label: "Legal Business Name", 
          value: personalForm.businessName || personalForm.name, 
          icon: <Zap size={18} /> 
        },
        { 
          label: "Business Type", 
          value: personalForm.businessType || "Not Specified", 
          icon: <User size={18} /> 
        },
        { 
          label: "GST Number", 
          value: personalForm.gstin || "Not Provided", 
          icon: <Key size={18} /> 
        },
        { 
          label: "Registered Email", 
          value: personalForm.email, 
          icon: <Mail size={18} /> 
        },
      ].map((item, idx) => (
        <div key={idx} className="p-5 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl shadow-sm text-orange-500">
            {item.icon}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{item.label}</p>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-0.5">{item.value}</p>
          </div>
        </div>
      ))}
    </div>

    {/* COMPLIANCE NOTICE */}
    <div className="p-6 bg-slate-900 dark:bg-orange-500/5 border border-slate-800 dark:border-orange-500/20 rounded-[2.5rem] relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute right-[-20px] bottom-[-20px] opacity-10 text-white dark:text-orange-500">
        <ShieldAlert size={120} />
      </div>

      <div className="relative z-10 flex items-start gap-4">
        <div className="p-3 bg-orange-500 text-white rounded-2xl shadow-lg shadow-orange-500/30">
          <ShieldAlert size={24} />
        </div>
        <div>
          <h4 className="font-bold text-white dark:text-orange-400 text-sm">Regulatory Information Locked</h4>
          <p className="text-[13px] text-slate-400 dark:text-slate-300 mt-1 leading-relaxed max-w-lg">
            Your GSTIN and Legal Name are tied to your tax profile. To modify these details, 
            you must submit a re-verification request with valid legal documentation.
          </p>
          <button className="mt-5 px-6 py-2.5 bg-white dark:bg-orange-500 text-slate-900 dark:text-white text-xs font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-transform">
            Contact Partner Support
          </button>
        </div>
      </div>
    </div>
  </div>
)}

            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Settings;