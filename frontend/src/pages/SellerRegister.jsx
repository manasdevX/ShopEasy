import Navbar from "../components/Navbar";
import AuthFooter from "../components/AuthFooter";
import { useState, useEffect } from "react";

export default function SellerRegister() {
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
        setError("Invalid Pincode. Please check again.");
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

    // 1. Required Fields Check
    const { sellerName, email, phone, businessType, gst, street, city, state, pincode, agree } = form;
    if (!sellerName || !email || !phone || !businessType || !gst || !street || !pincode) {
      setError("All fields marked with * are mandatory.");
      return;
    }

    // 2. Email Format Check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    // 3. Phone Format Check (10 digits)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    // 4. GST Format Check (15 characters alphanumeric)
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstRegex.test(gst.toUpperCase())) {
      setError("Invalid GST format. (Ex: 22AAAAA0000A1Z5)");
      return;
    }

    // 5. Agreement Check
    if (!agree) {
      setError("You must agree to the terms and conditions.");
      return;
    }

    alert("Application submitted successfully!");
  };

  /**
   * THE PROFESSIONAL FIX:
   * Dynamic Background & Text color for Autofill
   */
  const inputStyles = `w-full border px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-orange-400 
    transition-all duration-200
    
    /* Light Mode */
    bg-white border-gray-300 text-gray-900 
    autofill:shadow-[inset_0_0_0px_1000px_#ffffff]
    autofill:text-fill-gray-900
    
    /* Dark Mode */
    dark:bg-slate-800 dark:border-slate-700 dark:text-white
    dark:autofill:shadow-[inset_0_0_0px_1000px_#1e293b] 
    dark:autofill:text-fill-white`;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#030712] flex flex-col transition-colors duration-300">
      <Navbar />
      <div className="flex-grow py-12 px-4">
        <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-xl shadow-lg p-8 border dark:border-slate-800">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Register as a Seller</h2>
          <p className="text-gray-600 dark:text-slate-400 mb-6">Reach millions of customers across India.</p>

          {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 mb-4 rounded-lg text-sm border dark:border-red-800 font-medium">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Seller / Business Name *</label>
                <input type="text" name="sellerName" value={form.sellerName} onChange={handleChange} className={inputStyles} placeholder="Legal Business Name" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Email *</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} className={inputStyles} placeholder="email@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Phone *</label>
                <input type="tel" name="phone" value={form.phone} onChange={handleChange} className={inputStyles} placeholder="10-digit Mobile Number" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Business Type *</label>
                <select name="businessType" value={form.businessType} onChange={handleChange} className={inputStyles}>
                  <option value="">Select Business Type</option>
                  <option value="Proprietorship">Proprietorship</option>
                  <option value="Partnership">Partnership</option>
                  <option value="Private Limited">Private Limited</option>
                  <option value="Individual">Individual</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">GST Number *</label>
                <input type="text" name="gst" value={form.gst} onChange={handleChange} className={`${inputStyles} uppercase`} placeholder="15-digit GSTIN" maxLength={15} />
              </div>
            </div>

            <div className="border-t dark:border-slate-800 pt-6 mt-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Pickup Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1 dark:text-slate-300">Pincode * {loadingPincode && <span className="text-orange-500 text-xs animate-pulse ml-2">Fetching location...</span>}</label>
                  <input type="text" name="pincode" value={form.pincode} onChange={handleChange} maxLength={6} placeholder="6-digit Pincode" className={inputStyles} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1 dark:text-slate-300">Street Address *</label>
                  <input type="text" name="street" value={form.street} onChange={handleChange} placeholder="Building, Area, Street" className={inputStyles} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-slate-300">City *</label>
                  <input type="text" name="city" value={form.city} onChange={handleChange} className={`${inputStyles} bg-gray-50 dark:bg-slate-900/50`} readOnly />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-slate-300">State *</label>
                  <input type="text" name="state" value={form.state} onChange={handleChange} className={`${inputStyles} bg-gray-50 dark:bg-slate-900/50`} readOnly />
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-2">
              <input type="checkbox" name="agree" id="agree" checked={form.agree} onChange={handleChange} className="mt-1 w-4 h-4 accent-orange-500 rounded cursor-pointer" />
              <label htmlFor="agree" className="text-sm text-gray-600 dark:text-slate-400 cursor-pointer">I agree to the Seller Terms & Conditions.</label>
            </div>

            <button type="submit" className="w-full bg-orange-500 text-white font-bold py-3 rounded-lg hover:bg-orange-600 transition-all shadow-lg active:scale-[0.98]">
              Submit Application
            </button>
          </form>
        </div>
      </div>
      <AuthFooter />
    </div>
  );
}