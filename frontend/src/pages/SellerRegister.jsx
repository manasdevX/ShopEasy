import Navbar from "../components/Navbar";
import AuthFooter from "../components/AuthFooter";
import { useState } from "react";

export default function SellerRegister() {
  const [form, setForm] = useState({
    sellerName: "",
    email: "",
    phone: "",
    businessType: "",
    gst: "",
    address: "",
    agree: false,
  });

  const [error, setError] = useState("");

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

    if (
      !form.sellerName ||
      !form.email ||
      !form.phone ||
      !form.businessType ||
      !form.address
    ) {
      setError("Please fill all required fields");
      return;
    }

    if (!form.agree) {
      setError("You must agree to the seller terms");
      return;
    }

    console.log("Seller Registration Data:", form);
    alert("Seller registration submitted (frontend only)");
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
      <Navbar />

      <div className="flex-grow py-12 px-4">
        <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Register as a Seller
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Start selling on ShopEasy and reach millions of customers
          </p>

          {error && (
            <p className="text-red-500 mb-4 font-medium">{error}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Seller Name */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Seller / Business Name *
              </label>
              <input
                type="text"
                name="sellerName"
                value={form.sellerName}
                onChange={handleChange}
                className="w-full border px-4 py-2 rounded-lg
                           bg-white dark:bg-gray-700
                           border-gray-300 dark:border-gray-600"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full border px-4 py-2 rounded-lg
                           bg-white dark:bg-gray-700
                           border-gray-300 dark:border-gray-600"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full border px-4 py-2 rounded-lg
                           bg-white dark:bg-gray-700
                           border-gray-300 dark:border-gray-600"
              />
            </div>

            {/* Business Type */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Business Type *
              </label>
              <select
                name="businessType"
                value={form.businessType}
                onChange={handleChange}
                className="w-full border px-4 py-2 rounded-lg
                           bg-white dark:bg-gray-700
                           border-gray-300 dark:border-gray-600"
              >
                <option value="">Select business type</option>
                <option value="Individual">Individual</option>
                <option value="Proprietorship">Proprietorship</option>
                <option value="Partnership">Partnership</option>
                <option value="Private Limited">Private Limited</option>
              </select>
            </div>

            {/* GST */}
            <div>
              <label className="block text-sm font-medium mb-1">
                GST Number (Optional)
              </label>
              <input
                type="text"
                name="gst"
                value={form.gst}
                onChange={handleChange}
                placeholder="Optional"
                className="w-full border px-4 py-2 rounded-lg
                           bg-white dark:bg-gray-700
                           border-gray-300 dark:border-gray-600"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Pickup Address *
              </label>
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                rows={3}
                className="w-full border px-4 py-2 rounded-lg
                           bg-white dark:bg-gray-700
                           border-gray-300 dark:border-gray-600"
              />
            </div>

            {/* Agreement */}
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                name="agree"
                checked={form.agree}
                onChange={handleChange}
                className="mt-1"
              />
              <p className="text-sm text-gray-600 dark:text-gray-300">
                I agree to ShopEasy seller terms & conditions
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full bg-orange-500 text-white
                         py-3 rounded-lg
                         hover:bg-orange-600 transition"
            >
              Submit Application
            </button>
          </form>
        </div>
      </div>

      <AuthFooter />
    </div>
  );
}
