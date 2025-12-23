import Navbar from "../../components/Seller/SellerNavbar";
import Footer from "../../components/Seller/SellerFooter";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { showError, showSuccess } from "../../utils/toast";

export default function SellerRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    sellerName: "",
    email: "",
    phone: "",
    businessType: "",
    gst: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
    agree: false,
  });

  const [error, setError] = useState("");
  const [loadingPincode, setLoadingPincode] = useState(false);

  // Auto-lookup City and State when Pincode reaches 6 digits
  useEffect(() => {
    if (form.pincode.length === 6) {
      fetchLocation(form.pincode);
    }
  }, [form.pincode]);

  const fetchLocation = async (pin) => {
    setLoadingPincode(true);
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const data = await res.json();
      if (data[0].Status === "Success") {
        const { District, State } = data[0].PostOffice[0];
        setForm((prev) => ({ ...prev, city: District, state: State }));
        setError("");
      } else {
        showError("Invalid Pincode. Please check again.");
      }
    } catch (err) {
      console.error("Pincode fetch error:", err);
    } finally {
      setLoadingPincode(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    const { sellerName, email, phone, businessType, gst, street, pincode, agree } = form;
    
    // Validations
    if (!sellerName || !email || !phone || !businessType || !gst || !street || !pincode) {
      showError("All fields marked with * are mandatory.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showError("Please enter a valid email address.");
      return;
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      showError("Please enter a valid 10-digit mobile number.");
      return;
    }

    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstRegex.test(gst.toUpperCase())) {
      showError("Invalid GST format. (Ex: 22AAAAA0000A1Z5)");
      return;
    }

    if (!agree) {
      showError("You must agree to the terms and conditions.");
      return;
    }

    showSuccess("Application submitted successfully!");
    navigate("/Seller/bank-details");
  };

  const inputStyles = `w-full border px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-400 
    transition-all duration-200 font-medium
    /* Light Mode */
    bg-white border-slate-200 text-slate-900 
    autofill:shadow-[inset_0_0_0px_1000px_#ffffff]
    /* Dark Mode */
    dark:bg-slate-800 dark:border-slate-700 dark:text-white
    dark:autofill:shadow-[inset_0_0_0px_1000px_#1e293b]`;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#030712] flex flex-col transition-colors duration-300">
      <Navbar />
      
      <div className="flex-grow py-16 px-4">
        <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl p-8 md:p-12 border dark:border-slate-800">
          <header className="mb-10 text-center md:text-left">
            <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-2 tracking-tighter">
              Register as a <span className="text-orange-500">Seller.</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Complete your business profile to start selling on ShopEasy.
            </p>
          </header>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 mb-8 rounded-2xl text-sm border border-red-100 dark:border-red-800/30 font-bold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section: Business Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Legal Business Name *</label>
                <input type="text" name="sellerName" value={form.sellerName} onChange={handleChange} className={inputStyles} placeholder="Enter your business name" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Business Email *</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} className={inputStyles} placeholder="email@business.com" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Contact Number *</label>
                <input type="tel" name="phone" value={form.phone} onChange={handleChange} className={inputStyles} placeholder="+91 00000 00000" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Business Type *</label>
                <select name="businessType" value={form.businessType} onChange={handleChange} className={`${inputStyles} appearance-none font-bold`}>
                  <option value="">Choose Type</option>
                  <option value="Proprietorship">Proprietorship</option>
                  <option value="Partnership">Partnership</option>
                  <option value="Private Limited">Private Limited</option>
                  <option value="Individual">Individual</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">GST Number *</label>
                <input type="text" name="gst" value={form.gst} onChange={handleChange} className={`${inputStyles} uppercase`} placeholder="15-digit GSTIN" maxLength={15} />
              </div>
            </div>

            {/* Section: Address */}
            <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-black mb-6 text-slate-900 dark:text-white tracking-tight">Pickup Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                    Pincode * {loadingPincode && <span className="text-orange-500 text-[10px] animate-pulse lowercase font-bold ml-2">(validating...)</span>}
                  </label>
                  <input type="text" name="pincode" value={form.pincode} onChange={handleChange} maxLength={6} placeholder="6-digit Pincode" className={inputStyles} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Street Address *</label>
                  <input type="text" name="street" value={form.street} onChange={handleChange} placeholder="House no, Street name, Locality" className={inputStyles} />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">City</label>
                  <input type="text" name="city" value={form.city} className={`${inputStyles} bg-slate-50 dark:bg-slate-900/50 cursor-not-allowed`} readOnly />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">State</label>
                  <input type="text" name="state" value={form.state} className={`${inputStyles} bg-slate-50 dark:bg-slate-900/50 cursor-not-allowed`} readOnly />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <input type="checkbox" name="agree" id="agree" checked={form.agree} onChange={handleChange} className="w-5 h-5 accent-orange-500 rounded-lg cursor-pointer" />
              <label htmlFor="agree" className="text-sm text-slate-500 dark:text-slate-400 font-medium cursor-pointer">
                I agree to the <span className="text-orange-500 font-bold underline">Seller Terms & Conditions</span>.
              </label>
            </div>

            <button type="submit" className="w-full bg-slate-900 dark:bg-orange-500 text-white font-black py-5 rounded-2xl hover:scale-[1.01] active:scale-95 transition-all shadow-xl shadow-orange-500/10 uppercase tracking-widest text-sm">
              Submit Application
            </button>
          </form>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}