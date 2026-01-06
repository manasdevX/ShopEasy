import React, { useState, useEffect } from "react";
import {
  User,
  Landmark,
  MapPin,
  Edit3,
  ShieldCheck,
  Zap,
  ChevronRight,
  CheckCircle2,
  Key,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../../components/Seller/SellerNavbar";
import Footer from "../../components/Seller/SellerFooter";
import { showSuccess, showError } from "../../utils/toast";

/* ======================================================
   SUB-COMPONENT: FORM INPUT
====================================================== */
const FormInput = ({ label, value, onChange, disabled, type = "text" }) => (
  <div className="group space-y-2">
    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
      {label}
    </label>
    <div className="relative">
      <input
        type={type}
        value={value || ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-2 rounded-xl text-sm transition-all duration-200 outline-none
          ${
            disabled
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

const Settings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "personal";
  const [isEditing, setIsEditing] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // --- STATES ---
  const [personalForm, setPersonalForm] = useState({
    name: "",
    email: "",
    phone: "",
    businessName: "",
    businessType: "",
    gstin: "",
    isOnboardingComplete: false,
  });

  const [bankDetails, setBankDetails] = useState({
    bankName: "",
    accountNumber: "",
    accountHolder: "",
    ifscCode: "",
    isVerified: false,
  });

  const [addressForm, setAddressForm] = useState({
    street: "",
    city: "",
    state: "",
    zip: "",
  });

  const [loadingProfile, setLoadingProfile] = useState(true);

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
    setIsEditing(false);
  };

  // --- 1. FETCH & PARSE PROFILE ---
  const fetchProfile = async () => {
    const token = localStorage.getItem("sellerToken");
    if (!token) {
      setLoadingProfile(false);
      return;
    }

    try {
      setLoadingProfile(true);
      const res = await fetch(`${API_URL}/api/sellers/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch profile");

      const data = await res.json();
      console.log("🔥 FETCHED SELLER DATA:", data);

      setPersonalForm((prev) => ({
        ...prev,
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        businessName: data.businessName || "",
        businessType: data.businessType || "",
        gstin: data.gstin || "",
        isOnboardingComplete: !!data.isOnboardingComplete,
      }));

      setBankDetails((prev) => ({
        ...prev,
        bankName: data.bankDetails?.bankName || "",
        accountNumber: data.bankDetails?.accountNumber || "",
        accountHolder: data.bankDetails?.accountHolder || "",
        ifscCode: data.bankDetails?.ifscCode || "",
        isVerified: !!data.bankDetails?.isVerified,
      }));

      // ✅ FIX: Read the clean object directly from backend
      // The backend now sends 'addressObject' which handles JSON parsing
      if (data.addressObject) {
        setAddressForm({
          street: data.addressObject.street || "",
          city: data.addressObject.city || "",
          state: data.addressObject.state || "",
          zip: data.addressObject.zip || "",
        });
      } else if (
        typeof data.address === "string" &&
        data.address.trim() !== ""
      ) {
        // Fallback for very old data (comma separated)
        const parts = data.address.split(",").map((s) => s.trim());
        // Basic legacy fill
        setAddressForm({
          street: parts[0] || "",
          city: parts[1] || "",
          state: parts[2] || "",
          zip: parts[3] || "",
        });
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      showError("Could not load profile");
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // --- 2. SAVE PERSONAL INFO ---
  const savePersonal = async () => {
    const token = localStorage.getItem("sellerToken");
    try {
      const res = await fetch(`${API_URL}/api/sellers/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: personalForm.name,
          phone: personalForm.phone,
        }),
      });

      if (!res.ok) throw new Error("Update failed");

      showSuccess("Personal info updated");
      setIsEditing(false);
    } catch (err) {
      showError("Unable to update personal info");
    }
  };

  // --- 3. SAVE ADDRESS (Fix for Shifting Data) ---
  const saveAddress = async () => {
    const token = localStorage.getItem("sellerToken");

    try {
      if (!addressForm.street) {
        return showError("Please enter at least a street address");
      }

      // ✅ CRITICAL FIX: Send the OBJECT directly.
      // Do NOT join with commas. This lets the backend store it as a robust JSON string.
      const res = await fetch(`${API_URL}/api/sellers/profile/address`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ address: addressForm }), // Sending { street: "...", city: "..." }
      });

      if (!res.ok) throw new Error("Update failed");

      showSuccess("Address updated");
      setIsEditing(false);
      fetchProfile(); // Re-fetch to ensure UI syncs with DB
    } catch (err) {
      showError("Unable to update address");
    }
  };

  const navItems = [
    { id: "personal", label: "Account Info", icon: <User size={18} /> },
    { id: "business", label: "Business Details", icon: <Zap size={18} /> },
    { id: "bank", label: "Payments & Payouts", icon: <Landmark size={18} /> },
    { id: "address", label: "Store Address", icon: <MapPin size={18} /> },
  ];

  return (
    <div className="bg-[#f8fafc] dark:bg-[#020617] min-h-screen font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-10">
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Settings
          </h1>
          <p className="text-slate-500 mt-2 text-lg tracking-tight">
            Manage your store identity and preferences.
          </p>
        </header>

        <div className="flex flex-col lg:flex-row items-start gap-10">
          {/* SIDEBAR */}
          <aside className="lg:w-72 w-full flex-shrink-0">
            <nav className="p-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
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
          </aside>

          {/* MAIN CONTENT AREA */}
          <div className="flex-grow bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden min-h-[500px]">
            <div
              key={activeTab}
              className="p-8 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              {loadingProfile && (
                <div className="py-24 flex items-center justify-center">
                  <p className="text-slate-500">Loading profile…</p>
                </div>
              )}

              {/* ACCOUNT INFO SECTION */}
              {activeTab === "personal" && (
                <div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
                    <div>
                      <h2 className="text-2xl font-black dark:text-white tracking-tight">
                        Account Information
                      </h2>
                      <p className="text-slate-500 text-sm mt-1">
                        Details used for your public profile.
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        isEditing ? savePersonal() : setIsEditing(true)
                      }
                      className={`px-8 py-3 rounded-2xl text-sm font-black transition-all ${
                        isEditing
                          ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                      }`}
                    >
                      {isEditing ? "Save Changes" : "Edit Profile"}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormInput
                      label="Full Name"
                      value={personalForm.name}
                      disabled={!isEditing}
                      onChange={(val) =>
                        setPersonalForm({ ...personalForm, name: val })
                      }
                    />
                    <FormInput
                      label="Phone Number"
                      value={personalForm.phone}
                      disabled={!isEditing}
                      onChange={(val) =>
                        setPersonalForm({ ...personalForm, phone: val })
                      }
                    />
                    <div className="md:col-span-2">
                      <FormInput
                        label="Email Address"
                        value={personalForm.email}
                        disabled={true}
                      />
                      <p className="mt-2 text-[10px] text-slate-400 flex items-center gap-1">
                        <ShieldCheck size={12} className="text-green-500" />{" "}
                        This email is verified.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* BUSINESS SECTION */}
              {activeTab === "business" && (
                <div className="space-y-8">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-black dark:text-white tracking-tight">
                      Business Profile
                    </h2>
                    <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-900/30 rounded-full">
                      <ShieldCheck size={14} className="text-orange-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-orange-600">
                        Verified Seller
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      {
                        label: "Business Name",
                        value: personalForm.businessName || "Not set",
                        icon: <Zap size={18} />,
                      },
                      {
                        label: "Entity Type",
                        value: personalForm.businessType || "Not set",
                        icon: <User size={18} />,
                      },
                      {
                        label: "GSTIN",
                        value: personalForm.gstin || "Not set",
                        icon: <Key size={18} />,
                      },
                      {
                        label: "Status",
                        value: personalForm.isOnboardingComplete
                          ? "Completed"
                          : "Action Needed",
                        icon: <CheckCircle2 size={18} />,
                      },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="p-5 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center gap-4"
                      >
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl text-orange-500 shadow-sm">
                          {item.icon}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {item.label}
                          </p>
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                            {item.value}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* BANKING SECTION */}
              {activeTab === "bank" && (
                <div className="space-y-10">
                  <h2 className="text-2xl font-black dark:text-white tracking-tight">
                    Payout Methods
                  </h2>
                  <div className="relative group max-w-sm aspect-[1.6/1] rounded-[2rem] p-8 text-white shadow-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 via-slate-900 to-black" />
                    <div className="relative z-10 h-full flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 mb-1">
                            Store Card
                          </p>
                          <h3 className="text-xl font-bold tracking-tight">
                            {bankDetails.bankName || "No Bank"}
                          </h3>
                        </div>
                        <Landmark size={32} className="text-orange-400/80" />
                      </div>
                      <div className="space-y-4">
                        <p className="text-2xl font-mono tracking-[0.25em] text-white/90">
                          •••• ••••{" "}
                          {bankDetails.accountNumber
                            ? bankDetails.accountNumber.slice(-4)
                            : "0000"}
                        </p>
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-[9px] uppercase opacity-40 mb-1">
                              Account Holder
                            </p>
                            <p className="text-xs font-medium tracking-wide">
                              {bankDetails.accountHolder || "Not Set"}
                            </p>
                          </div>
                          {bankDetails.isVerified && (
                            <div className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                              <span className="text-[10px] font-bold">
                                ACTIVE
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ADDRESS SECTION */}
              {activeTab === "address" && (
                <div>
                  <div className="flex items-center justify-between mb-10">
                    <h2 className="text-2xl font-black dark:text-white tracking-tight">
                      Store Address
                    </h2>
                    <button
                      onClick={() =>
                        isEditing ? saveAddress() : setIsEditing(true)
                      }
                      className="flex items-center gap-2 text-orange-500 font-bold hover:underline transition-all"
                    >
                      <Edit3 size={18} />{" "}
                      {isEditing ? "Apply Changes" : "Modify Address"}
                    </button>
                  </div>

                  {isEditing ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
                      <FormInput
                        label="Street Address"
                        value={addressForm.street}
                        disabled={false}
                        onChange={(val) =>
                          setAddressForm({ ...addressForm, street: val })
                        }
                      />
                      <FormInput
                        label="City"
                        value={addressForm.city}
                        disabled={false}
                        onChange={(val) =>
                          setAddressForm({ ...addressForm, city: val })
                        }
                      />
                      <FormInput
                        label="Postal Code"
                        value={addressForm.zip}
                        disabled={false}
                        onChange={(val) =>
                          setAddressForm({ ...addressForm, zip: val })
                        }
                      />
                      <FormInput
                        label="State"
                        value={addressForm.state}
                        disabled={false}
                        onChange={(val) =>
                          setAddressForm({ ...addressForm, state: val })
                        }
                      />
                      <div className="md:col-span-2 mt-2">
                        <p className="text-[11px] text-slate-500">
                          Edit the address fields above and click{" "}
                          <span className="font-bold">Apply Changes</span> to
                          save.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
                      <div className="p-5 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-2xl">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Street Address
                        </p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                          {addressForm.street || "Not set"}
                        </p>
                      </div>

                      <div className="p-5 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-2xl">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          City
                        </p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                          {addressForm.city || "Not set"}
                        </p>
                      </div>

                      <div className="p-5 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-2xl">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Postal Code
                        </p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                          {addressForm.zip || "Not set"}
                        </p>
                      </div>

                      <div className="p-5 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-2xl">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          State
                        </p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                          {addressForm.state || "Not set"}
                        </p>
                      </div>
                    </div>
                  )}
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
