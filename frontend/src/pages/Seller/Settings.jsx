import React, { useState } from 'react';
import { 
  User, Package, ShieldCheck, Landmark, 
  MapPin, Bell, LogOut, ChevronRight, 
  Edit3, ExternalLink, Smartphone, Mail,
  CreditCard, ShieldAlert, Zap ,Trash2
} from 'lucide-react';

// Imported Components
import Navbar from '../../components/Seller/SellerNavbar';
import Footer from '../../components/Seller/SellerFooter';


const RedesignedSettings = () => {
  const [activeView, setActiveView] = useState("menu"); // menu, personal, business, bank, privacy
  const [isEditing, setIsEditing] = useState(false);

  // Mock data
  const profile = {
    name: "Alex Thompson",
    email: "alex.t@design.com",
    phone: "+1 234 567 890",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
    level: "Plus Member"
  };

  // Main navigation tiles (Amazon Style)
  const menuTiles = [
    { id: "personal", title: "Personal Info", desc: "Edit name, email, and mobile number", icon: <User className="text-blue-500" /> },
    { id: "business", title: "Business Profile", desc: "Manage tax IDs and company details", icon: <Zap className="text-orange-500" /> },
    { id: "bank", title: "Payments & Bank", desc: "Saved cards, UPI, and bank accounts", icon: <Landmark className="text-emerald-500" /> },
    { id: "privacy", title: "Login & Security", icon: <ShieldCheck className="text-red-500" />, desc: "Edit password and 2FA settings" },
    { id: "addresses", title: "Your Addresses", icon: <MapPin className="text-purple-500" />, desc: "Set default shipping address" },
    { id: "orders", title: "Your Orders", icon: <Package className="text-amber-600" />, desc: "Track, return, or buy things again" },
  ];

  return (
    <div className="bg-[#f1f3f6] dark:bg-[#030712] min-h-screen transition-colors duration-300 font-sans text-slate-900 dark:text-white">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8">
        
        {/* --- BREADCRUMBS --- */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6 px-2">
          <button onClick={() => setActiveView("menu")} className="hover:text-orange-500 transition-colors">Your Account</button>
          {activeView !== "menu" && (
            <>
              <ChevronRight size={14} />
              <span className="text-orange-500 font-semibold capitalize">{activeView}</span>
            </>
          )}
        </nav>

        {/* --- MAIN CONTENT AREA --- */}
        {activeView === "menu" ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-2xl font-bold mb-8 px-2 uppercase tracking-tight">Settings</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuTiles.map((tile) => (
                <button
                  key={tile.id}
                  onClick={() => setActiveView(tile.id)}
                  className="flex items-start gap-5 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all text-left group shadow-sm"
                >
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-full group-hover:scale-110 transition-transform">
                    {tile.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">{tile.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-snug">{tile.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* --- DANGER ZONE SECTION --- */}
<div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 bg-red-50/50 dark:bg-red-500/5 border border-red-100 dark:border-red-900/20 rounded-2xl">
    <div>
      <h4 className="text-sm font-black uppercase tracking-wider text-red-600 dark:text-red-500 flex items-center gap-2">
        <Trash2 size={16} /> Delete Account
      </h4>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
        Permanently remove your account data, history, and active sessions. This action is irreversible.
      </p>
    </div>
    
    <button
      onClick={() => {
        if(window.confirm("Are you sure? This will permanently delete your account.")) {
          // Add your delete logic here
        }
      }}
      className="flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/40 text-red-600 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-sm"
    >
      Close Account
    </button>
  </div>
</div>
          </div>
        ) : (
          /* --- DETAILED SUB-PAGES (Flipkart Style) --- */
          <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
            
            {/* Left Mini Sidebar */}
            <div className="lg:w-1/4 space-y-4">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-lg flex items-center gap-4 border border-slate-200 dark:border-slate-800">
                <img src={profile.avatar} className="w-12 h-12 rounded-full" alt="User" />
                <div>
                    <p className="text-xs text-slate-500">Hello,</p>
                    <p className="font-bold">{profile.name}</p>
                </div>
              </div>
              
              <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                <button onClick={() => setActiveView("menu")} className="w-full text-left px-6 py-4 border-b border-slate-100 dark:border-slate-800 text-sm font-bold text-orange-500 hover:bg-slate-50 dark:hover:bg-slate-800">
                   Back to Account Menu
                </button>
                {['Personal Info', 'Payments', 'Security'].map((item) => (
                    <button key={item} className="w-full text-left px-6 py-4 border-b border-slate-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">
                        {item}
                    </button>
                ))}
              </div>
            </div>

            {/* Right Detailed Panel */}
            <div className="lg:w-3/4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-6 md:p-10">
                <div className="flex items-center justify-between mb-10 border-b border-slate-100 dark:border-slate-800 pb-6">
                    <h2 className="text-xl font-bold uppercase tracking-wide">
                        {activeView === 'personal' ? 'Personal Information' : 'Section Details'}
                    </h2>
                    <button 
                        onClick={() => setIsEditing(!isEditing)}
                        className="text-orange-500 text-sm font-bold hover:underline underline-offset-4"
                    >
                        {isEditing ? 'Cancel' : 'Edit'}
                    </button>
                </div>

                {activeView === 'personal' && (
                  <div className="space-y-8 max-w-2xl">
                    <SimpleInput label="Full Name" value={profile.name} isEditing={isEditing} />
                    <SimpleInput label="Email Address" value={profile.email} isEditing={false} />
                    <SimpleInput label="Mobile Number" value={profile.phone} isEditing={isEditing} />
                    
                    {isEditing && (
                        <button className="bg-orange-500 text-white px-10 py-3 rounded-md font-bold text-sm shadow-md hover:bg-orange-600 transition-all">
                            SAVE CHANGES
                        </button>
                    )}
                  </div>
                )}

                {activeView === 'bank' && (
                   <div className="space-y-6">
                      <div className="p-6 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <CreditCard className="text-slate-400" />
                            <div>
                                <p className="font-bold">HDFC Bank Card</p>
                                <p className="text-xs text-slate-500">Ending in 8829</p>
                            </div>
                         </div>
                         <button className="text-red-500 text-xs font-bold uppercase">Remove</button>
                      </div>
                      <button className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 font-bold hover:border-orange-500 hover:text-orange-500 transition-all">
                        + Add New Payment Method
                      </button>
                   </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

const SimpleInput = ({ label, value, isEditing }) => (
  <div className="flex flex-col gap-2">
    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{label}</label>
    <input 
      disabled={!isEditing}
      defaultValue={value}
      className={`p-3 rounded-lg border text-sm font-medium transition-all ${
        isEditing 
        ? "border-orange-500 ring-4 ring-orange-500/5 bg-white dark:bg-slate-900" 
        : "border-transparent bg-slate-50 dark:bg-slate-800/50 cursor-not-allowed text-slate-500"
      }`}
    />
  </div>
);

export default RedesignedSettings;