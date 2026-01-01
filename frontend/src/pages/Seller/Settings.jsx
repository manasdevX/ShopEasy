import React, { useState, useEffect } from "react";
import {
  User,
  Package,
  ShieldCheck,
  Landmark,
  MapPin,
  LogOut,
  ChevronRight,
  Edit3,
  Smartphone,
  Mail,
  CreditCard,
  ShieldAlert,
  Zap,
  Trash2,
  Plus,
  Key,
  Globe,
} from "lucide-react";

// Imported Components
import Navbar from "../../components/Seller/SellerNavbar";
import Footer from "../../components/Seller/SellerFooter";
import { useNavigate } from "react-router-dom";
import { showSuccess, showError } from "../../utils/toast";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("personal");
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  // Seller profile state
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Seller",
  });

  const [addressForm, setAddressForm] = useState({
    street: "",
    city: "",
    state: "",
    zip: "",
  });

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [bankDetails, setBankDetails] = useState(null);

  const [personalForm, setPersonalForm] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
  });

  const navigate = useNavigate();


  // Sidebar Items
  const navItems = [
    { id: "personal", label: "Account Info", icon: <User size={18} /> },
    { id: "business", label: "Business Details", icon: <Zap size={18} /> },
    { id: "bank", label: "Payments & Payouts", icon: <Landmark size={18} /> },
    { id: "address", label: "Store Address", icon: <MapPin size={18} /> },
  ];

  return (
    <div className="bg-[#f8fafc] dark:bg-[#020617] min-h-screen font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Settings
          </h1>
          <p className="text-slate-500 text-sm">
            Manage your store presence and account security.
          </p>
        </header>

        <div className="flex flex-col lg:flex-row items-start gap-12">
          {/* LEFT SIDEBAR NAVIGATION */}
          <aside className="lg:w-64 flex-shrink-0">
            <nav className="space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                    activeTab === item.id
                      ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
              <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                {/* Dynamic Delete Section */}
                {!isConfirming ? (
                  <button
                    onClick={() => setIsConfirming(true)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all animate-in fade-in duration-200"
                  >
                    <Trash2 size={18} />
                    Delete Account
                  </button>
                ) : (
                  <div className="flex flex-col gap-2 p-2 bg-red-50/50 dark:bg-red-500/5 rounded-xl border border-red-100 dark:border-red-900/20 animate-in zoom-in-95 duration-200">
                    <p className="text-[10px] font-bold text-red-600 uppercase tracking-tight text-center mb-1">
                      Are you sure?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsConfirming(false)}
                        className="flex-1 px-2 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
  onClick={handleDeleteAccount} // <-- Simply call the function here
  className="flex-1 px-2 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors shadow-sm"
>
  Confirm
</button>
                    </div>
                  </div>
                )}
              </div>
            </nav>
          </aside>

          {/* RIGHT CONTENT PANEL */}
          <div className="flex-grow bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-6 md:p-8">
              {/* PERSONAL INFO SECTION */}
              {activeTab === "personal" && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-xl font-bold">Account Information</h2>
                      <p className="text-sm text-slate-500">
                        Update your personal identification details.
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        isEditing ? savePersonalInfo() : setIsEditing(true)
                      }
                      className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-bold transition-all flex items-center gap-2"
                    >
                      {savingPersonal
                        ? "Saving..."
                        : isEditing
                        ? "Save Changes"
                        : "Edit Profile"}
                    </button>
                  </div>

                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow">
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
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* BUSINESS SECTION */}
              {activeTab === "business" && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
                  <div>
                    <h2 className="text-xl font-bold">Business Profile</h2>
                    <p className="text-sm text-slate-500">
                      Manage your tax and legal business entity details.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormInput
                      label="Legal Entity Name"
                      value="Thompson Digital Ltd."
                      disabled
                    />
                    <FormInput
                      label="GSTIN / TAX ID"
                      value="22AAAAA0000A1Z5"
                      disabled
                    />
                    <div className="md:col-span-2">
                      <FormInput
                        label="Registered Address"
                        value="102 Business Hub, Silicon Valley, CA"
                        disabled
                      />
                    </div>
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/20 rounded-xl flex gap-3 text-blue-600 dark:text-blue-400 text-sm">
                    <ShieldAlert size={20} className="flex-shrink-0" />
                    <p>
                      To change business details, please contact seller support
                      for verification.
                    </p>
                  </div>
                </div>
              )}

              {/* BANK SECTION */}
              {activeTab === "bank" && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8">
                  <div>
                    <h2 className="text-xl font-bold">Payout Methods</h2>
                    <p className="text-sm text-slate-500">
                      Manage where you receive your earnings.
                    </p>
                  </div>

                  {bankDetails ? (
                    <div className="max-w-md p-6 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 text-white shadow-xl relative overflow-hidden group">
                      <div className="relative z-10 space-y-6">
                        <div className="flex justify-between items-start">
                          <Landmark size={28} className="text-orange-400" />
                          <button className="text-slate-400 hover:text-white transition-colors">
                            <Trash2 size={18} />
                          </button>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-widest opacity-60">
                            Primary Bank Account
                          </p>
                          <h3 className="text-lg font-semibold">
                            {bankDetails.bankName || "Global Settlement Bank"}
                          </h3>
                        </div>
                        <p className="font-mono text-xl tracking-widest">
                          **** **** ****{" "}
                          {bankDetails.accountNumber?.slice(-4) || "4421"}
                        </p>
                      </div>
                      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all" />
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center">
                      <CreditCard
                        size={40}
                        className="mx-auto text-slate-300 mb-4"
                      />
                      <p className="text-slate-500 text-sm font-medium">
                        No bank account linked
                      </p>
                      <button className="mt-4 text-orange-500 font-bold text-sm hover:underline flex items-center gap-1 mx-auto">
                        <Plus size={16} /> Link New Account
                      </button>
                    </div>
                  )}
                </div>
              )}
              {/* ADDRESS SECTION */}
              {activeTab === "address" && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        Registered Store Address
                      </h2>
                      <p className="text-sm text-slate-500">
                        This is your official business location used for
                        logistics and tax invoices.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-bold transition-all flex items-center gap-2"
                    >
                      <Edit3 size={16} />
                      {isEditing ? "Save Address" : "Edit Address"}
                    </button>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 md:p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Left Column: Address Details */}
                      <div className="space-y-6">
                        <div className="flex gap-4">
                          <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 h-fit">
                            <MapPin className="text-orange-500" size={24} />
                          </div>
                          <div className="space-y-4 flex-grow">
                            <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Street Address
                              </label>
                              {isEditing ? (
                                <input
                                  className="..."
                                  value={addressForm.street}
                                  onChange={(e) =>
                                    setAddressForm({
                                      ...addressForm,
                                      street: e.target.value,
                                    })
                                  }
                                />
                              ) : (
                                <p className="...">
                                  {addressForm.street || "No street added"}
                                </p>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                  City
                                </label>
                                {isEditing ? (
                                  <input
                                    className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none"
                                    defaultValue="San Jose"
                                  />
                                ) : (
                                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                    San Jose
                                  </p>
                                )}
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                  Postal Code
                                </label>
                                {isEditing ? (
                                  <input
                                    className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none"
                                    defaultValue="94027"
                                  />
                                ) : (
                                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                    94027
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                State / Province
                              </label>
                              {isEditing ? (
                                <input
                                  className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none"
                                  defaultValue="California"
                                />
                              ) : (
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                  California, USA
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Column: Visual Verification */}
                      <div className="flex flex-col justify-center items-center border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-700 pt-8 md:pt-0 md:pl-8 text-center">
                        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                          <ShieldCheck size={32} />
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-white">
                          Verified Location
                        </h4>
                        <p className="text-xs text-slate-500 mt-2 max-w-[200px]">
                          This address has been verified against your business
                          GSTIN/Tax documents.
                        </p>
                        <button className="mt-4 text-[10px] font-black uppercase tracking-widest text-orange-500 hover:underline">
                          Request Re-verification
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-500/5 rounded-xl border border-blue-100 dark:border-blue-500/20 flex gap-3 text-blue-600 dark:text-blue-400 text-sm">
                    <Smartphone size={20} className="flex-shrink-0" />
                    <p>
                      <strong>Note:</strong> Pickup services are currently
                      active for this location. Changing this address may affect
                      your shipping eligibility in certain regions.
                    </p>
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
