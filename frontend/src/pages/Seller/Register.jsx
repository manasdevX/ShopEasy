import Navbar from "../../components/Seller/SellerNavbar";
import Footer from "../../components/Seller/SellerFooter";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, LocateFixed, ArrowRight, ArrowLeft } from "lucide-react";
import { showError, showSuccess } from "../../utils/toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function SellerRegister() {
  const navigate = useNavigate();

  // State for UI interactions
  const [isLocating, setIsLocating] = useState(false);
  const [loadingPincode, setLoadingPincode] = useState(false);

  // State to hold Step 1 data safely to prevent null-pointer crashes
  const [step1Data, setStep1Data] = useState({ email: "", phone: "" });

  // 1. FORM STATE (Business Details)
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

  // 2. SECURITY CHECK & PRE-FILL
  useEffect(() => {
    const rawStep1 = localStorage.getItem("seller_step1");
    if (!rawStep1) {
      showError("Please complete Step 1 first.");
      navigate("/Seller/signup");
      return;
    }

    // ✅ Safe parsing of Step 1 data for the read-only inputs
    try {
      const parsedStep1 = JSON.parse(rawStep1);
      setStep1Data({
        email: parsedStep1.email || "",
        phone: parsedStep1.phone || "",
      });
    } catch (e) {
      console.error("Step 1 parsing error", e);
    }

    // ✅ Load saved Step 2 data if available (Back Button Support)
    const rawStep2 = localStorage.getItem("seller_step2");
    if (rawStep2) {
      try {
        const parsedStep2 = JSON.parse(rawStep2);
        setForm((prev) => ({ ...prev, ...parsedStep2 }));
      } catch (e) {
        console.error("Step 2 parsing error", e);
      }
    }
  }, [navigate]);

  // Auto-lookup City/State when Pincode reaches 6 digits
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

  // ✅ DEFERRED SUBMIT: Save to LocalStorage & Move to Step 3
  const handleSubmit = (e) => {
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
      !city ||
      !state
    ) {
      return showError("Please fill all mandatory fields.");
    }

    // GST Regex
    const gstRegex =
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstRegex.test(gstin.toUpperCase())) {
      return showError("Invalid GST Format. (e.g.: 22AAAAA0000A1Z5)");
    }

    // Pincode validation
    const pincodeRegex = /^[1-9][0-9]{5}$/;
    if (!pincodeRegex.test(pincode)) {
      return showError("Invalid Pincode.");
    }

    if (!agree) {
      return showError("You must agree to the Terms & Conditions.");
    }

    // 🚀 ACTION: Save to LocalStorage (The final API call happens in Step 3 / BankDetails)
    localStorage.setItem(
      "seller_step2",
      JSON.stringify({
        ...form,
        gstin: gstin.toUpperCase(), // Ensure uppercase for backend consistency
      })
    );

    showSuccess("Business Details Saved!");
    navigate("/Seller/bank-details");
  };

  // ================= GEOLOCATION HANDLER (GOOGLE MAPS API) =================
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      showError("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const options = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_KEY}`
          );
          const data = await res.json();

          if (data.status === "OK" && data.results.length > 0) {
            const components = data.results[0].address_components;

            // Internal helper to find specific address parts
            const getComp = (type) =>
              components.find((c) => c.types.includes(type))?.long_name || "";

            // Extract values
            const streetNumber = getComp("street_number");
            const route = getComp("route");
            const sublocality = getComp("sublocality_level_1");
            const cityName =
              getComp("locality") || getComp("administrative_area_level_2");

            // Update form using your existing keys
            setForm((prev) => ({
              ...prev,
              street:
                [streetNumber, route, sublocality].filter(Boolean).join(", ") ||
                data.results[0].formatted_address.split(",")[0],
              city: cityName,
              state: getComp("administrative_area_level_1"),
              pincode: getComp("postal_code"),
            }));

            showSuccess("Location fetched successfully!");
          } else {
            showError("Could not determine precise address");
          }
        } catch (error) {
          showError("Failed to fetch address details");
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setIsLocating(false);
        showError("Location access denied. Please enable GPS.");
      },
      options
    );
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                  Legal Business Name *
                </label>
                <input
                  type="text"
                  name="businessName"
                  autoComplete="off"
                  value={form.businessName}
                  onChange={handleChange}
                  className={inputStyles}
                  placeholder="Enter your business name"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                  Business Email (Verified)
                </label>
                <input
                  type="email"
                  value={step1Data.email}
                  readOnly
                  className={`${inputStyles} opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800`}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                  Contact Number (Verified)
                </label>
                <input
                  type="tel"
                  value={step1Data.phone}
                  readOnly
                  className={`${inputStyles} opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800`}
                />
              </div>

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

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                  GST Number *
                </label>
                <input
                  type="text"
                  autoComplete="off"
                  name="gstin"
                  value={form.gstin}
                  onChange={handleChange}
                  className={`${inputStyles} uppercase`}
                  placeholder="15-digit GSTIN"
                  maxLength={15}
                />
              </div>
            </div>

            <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-black mb-6 text-slate-900 dark:text-white tracking-tight">
                Pickup Address
              </h3>

              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isLocating}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-bold text-sm mb-6 shadow-sm transition-all active:scale-95 disabled:opacity-70"
              >
                {isLocating ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <LocateFixed size={18} />
                )}
                {isLocating
                  ? "Fetching Location..."
                  : "Use my current location"}
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    autoComplete="off"
                    name="pincode"
                    value={form.pincode}
                    onChange={handleChange}
                    maxLength={6}
                    placeholder="6-digit Pincode"
                    className={inputStyles}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    autoComplete="off"
                    name="street"
                    value={form.street}
                    onChange={handleChange}
                    placeholder="House no, Street name, Locality"
                    className={inputStyles}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={form.city}
                    readOnly
                    className={`${inputStyles} bg-slate-50 dark:bg-slate-900/50 cursor-not-allowed`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={form.state}
                    readOnly
                    className={`${inputStyles} bg-slate-50 dark:bg-slate-900/50 cursor-not-allowed`}
                  />
                </div>
              </div>
            </div>

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

            <div className="flex gap-4 pt-2">
              <button
                type="button"
                onClick={() => navigate("/Seller/signup")}
                className="w-1/3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold py-4 rounded-2xl hover:bg-slate-200 transition-all flex justify-center items-center gap-2"
              >
                <ArrowLeft size={20} /> Back
              </button>

              <button
                type="submit"
                className="w-2/3 bg-slate-900 dark:bg-orange-500 text-white font-black py-4 rounded-2xl hover:scale-[1.01] active:scale-95 transition-all shadow-xl uppercase tracking-widest text-sm flex justify-center items-center gap-2"
              >
                Save & Continue <ArrowRight size={20} />
              </button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}
