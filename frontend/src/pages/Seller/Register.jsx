import Navbar from "../../components/Seller/SellerNavbar";
import Footer from "../../components/Seller/SellerFooter";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { showError, showSuccess } from "../../utils/toast";

// Fallback if env variable is missing
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function SellerRegister() {
  const navigate = useNavigate();
  const location = useLocation();

  // 1. GET DATA FROM STEP 1
  const stepOneData = location.state;

  const [loading, setLoading] = useState(false);
  const [loadingPincode, setLoadingPincode] = useState(false);

  // 2. FORM STATE (Business Details)
  const [form, setForm] = useState({
    businessName: "",
    businessType: "",
    gstin: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
    agree: false,
  });

  // 3. SECURITY CHECK & PRE-FILL
  useEffect(() => {
    if (!stepOneData) {
      showError("Please complete Step 1 first.");
      navigate("/Seller/signup");
    }
  }, [stepOneData, navigate]);

  // Auto-lookup City/State
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
      } else {
        showError("Invalid Pincode.");
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const {
      businessName,
      businessType,
      gstin,
      street,
      city,
      state,
      pincode,
      agree,
    } = form;

    // VALIDATION
    if (
      !businessName ||
      !businessType ||
      !gstin ||
      !street ||
      !pincode ||
      !city
    ) {
      return showError("Please fill all mandatory fields.");
    }

    // Basic GST Regex (15 chars)
    const gstRegex =
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstRegex.test(gstin.toUpperCase())) {
      return showError("Invalid GST Format (e.g., 22AAAAA0000A1Z5)");
    }

    if (!agree) {
      return showError("You must agree to the Terms & Conditions.");
    }

    setLoading(true);

    // 4. PREPARE FINAL PAYLOAD
    const fullAddress = `${street}, ${city}, ${state} - ${pincode}`;

    const registrationData = {
      ...stepOneData, // name, email, phone, password from Step 1
      businessName,
      businessType,
      gstin: gstin.toUpperCase(),
      address: fullAddress,
    };

    try {
      // 5. CALL BACKEND API
      const res = await fetch(`${API_URL}/api/sellers/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registrationData),
      });

      const data = await res.json();

      if (res.ok) {
        // 6. SUCCESS: SAVE TOKEN & REDIRECT
        // === CRITICAL FIX: USING SELLER-SPECIFIC KEYS ===
        localStorage.setItem("sellerToken", data.token);
        localStorage.setItem("sellerUser", JSON.stringify(data));

        showSuccess("Account Created Successfully!");

        // Navigate to Bank Details (Step 3) - Now Authenticated
        navigate("/Seller/bank-details");
      } else {
        showError(data.message || "Registration Failed");
      }
    } catch (error) {
      showError("Server Error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyles = `w-full border px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-400 
    transition-all duration-200 font-medium
    bg-white border-slate-200 text-slate-900 
    autofill:shadow-[inset_0_0_0px_1000px_#ffffff]
    dark:bg-slate-800 dark:border-slate-700 dark:text-white
    dark:autofill:shadow-[inset_0_0_0px_1000px_#1e293b]`;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#030712] flex flex-col transition-colors duration-300">
      <Navbar />

      <div className="flex-grow py-16 px-4">
        <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl p-8 md:p-12 border dark:border-slate-800">
          <header className="mb-10 text-center md:text-left">
            <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-2 tracking-tighter">
              Business <span className="text-orange-500">Details.</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Step 2 of 3: Tell us about your business
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section: Business Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Business Name */}
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                  Legal Business Name *
                </label>
                <input
                  type="text"
                  name="businessName"
                  value={form.businessName}
                  onChange={handleChange}
                  className={inputStyles}
                  placeholder="Enter your business name"
                />
              </div>

              {/* READ ONLY: Email from Step 1 */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                  Business Email (Verified)
                </label>
                <input
                  type="email"
                  value={stepOneData?.email || ""}
                  readOnly
                  className={`${inputStyles} opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800`}
                />
              </div>

              {/* READ ONLY: Phone from Step 1 */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                  Contact Number (Verified)
                </label>
                <input
                  type="tel"
                  value={stepOneData?.phone || ""}
                  readOnly
                  className={`${inputStyles} opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800`}
                />
              </div>

              {/* Business Type */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                  Business Type *
                </label>
                <select
                  name="businessType"
                  value={form.businessType}
                  onChange={handleChange}
                  className={`${inputStyles} appearance-none font-bold`}
                >
                  <option value="">Choose Type</option>
                  <option value="Proprietorship">Proprietorship</option>
                  <option value="Partnership">Partnership</option>
                  <option value="Private Limited">Private Limited</option>
                  <option value="Individual">Individual</option>
                </select>
              </div>

              {/* GSTIN */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                  GST Number *
                </label>
                <input
                  type="text"
                  name="gstin"
                  value={form.gstin}
                  onChange={handleChange}
                  className={`${inputStyles} uppercase`}
                  placeholder="15-digit GSTIN"
                  maxLength={15}
                />
              </div>
            </div>

            {/* Section: Address */}
            <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-black mb-6 text-slate-900 dark:text-white tracking-tight">
                Pickup Address
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pincode */}
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                    Pincode *{" "}
                    {loadingPincode && (
                      <span className="text-orange-500 text-[10px] animate-pulse lowercase font-bold ml-2">
                        (validating...)
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={form.pincode}
                    onChange={handleChange}
                    maxLength={6}
                    placeholder="6-digit Pincode"
                    className={inputStyles}
                  />
                </div>

                {/* Street */}
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    name="street"
                    value={form.street}
                    onChange={handleChange}
                    placeholder="House no, Street name, Locality"
                    className={inputStyles}
                  />
                </div>

                {/* City (Auto) */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={form.city}
                    className={`${inputStyles} bg-slate-50 dark:bg-slate-900/50 cursor-not-allowed`}
                    readOnly
                  />
                </div>

                {/* State (Auto) */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={form.state}
                    className={`${inputStyles} bg-slate-50 dark:bg-slate-900/50 cursor-not-allowed`}
                    readOnly
                  />
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-center gap-3 pt-4">
              <input
                type="checkbox"
                name="agree"
                id="agree"
                checked={form.agree}
                onChange={handleChange}
                className="w-5 h-5 accent-orange-500 rounded-lg cursor-pointer"
              />
              <label
                htmlFor="agree"
                className="text-sm text-slate-500 dark:text-slate-400 font-medium cursor-pointer"
              >
                I agree to the{" "}
                <span className="text-orange-500 font-bold underline">
                  Seller Terms & Conditions
                </span>
                .
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 dark:bg-orange-500 text-white font-black py-5 rounded-2xl hover:scale-[1.01] active:scale-95 transition-all shadow-xl shadow-orange-500/10 uppercase tracking-widest text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={20} /> Creating
                  Account...
                </span>
              ) : (
                "Save & Continue"
              )}
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}