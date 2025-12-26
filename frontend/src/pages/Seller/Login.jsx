import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import SellerNavbar from "../../components/Seller/SellerNavbar";
import SellerFooter from "../../components/Seller/SellerFooter";
import { useGoogleLogin } from "@react-oauth/google";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { showSuccess, showError } from "../../utils/toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Login() {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [identifierError, setIdentifierError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const inputBase = `w-full border px-4 py-2.5 rounded-lg outline-none transition-all duration-200 
    bg-white dark:bg-slate-800 text-slate-900 dark:text-white
    autofill:shadow-[inset_0_0_0px_1000px_#ffffff] dark:autofill:shadow-[inset_0_0_0px_1000px_#1e293b]
    autofill:text-fill-slate-900 dark:autofill:text-fill-white border-gray-300 dark:border-slate-700`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    let isValid = true;

    // Validation Logic
    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const isValidPhone = (phone) => /^[0-9]{10}$/.test(phone);

    if (!identifier) {
      showError("Email or phone is required");
      return;
    }

    if (identifier.includes("@")) {
      if (!isValidEmail(identifier)) {
        showError("Please enter a valid email address");
        return;
      }
    } else {
      const cleanPhone = identifier.replace(/\D/g, "");
      if (!isValidPhone(cleanPhone)) {
        showError("Phone number must be exactly 10 digits");
        return;
      }
    }

    if (!isValid) return;

    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/api/sellers/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: identifier, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        showError(data.message || "Login failed");
        return;
      }

      // === SELLER-SPECIFIC KEYS ===
      localStorage.setItem("sellerToken", data.token);
      localStorage.setItem("sellerUser", JSON.stringify(data));

      showSuccess("Login successful!");
      navigate("/Seller/Dashboard");
    } catch (error) {
      console.error("Login Error:", error);
      showError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await fetch(`${API_URL}/api/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // === CRITICAL FIX: Add role: "seller" ===
          body: JSON.stringify({
            token: tokenResponse.access_token,
            role: "seller",
          }),
        });
        const data = await res.json();

        if (res.ok) {
          if (data.isNewUser) {
            // New user flow: Send to Signup page with pre-filled data
            navigate("/Seller/signup", {
              state: {
                name: data.name,
                email: data.email,
                googleId: data.googleId,
              },
            });
          } else {
            // Existing user flow: Save token and redirect
            localStorage.setItem("sellerToken", data.token);
            // Ensure we save the user object correctly (some backends return it inside .user, others at root)
            localStorage.setItem(
              "sellerUser",
              JSON.stringify(data.user || data)
            );

            showSuccess("Login successful!");
            navigate("/Seller/Dashboard");
          }
        } else {
          showError(data.message || "Google Login Failed");
        }
      } catch {
        showError("Google Login Connection Failed");
      }
    },
  });

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-[#030712] transition-colors duration-300 font-sans">
      <SellerNavbar />

      <div className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 border dark:border-slate-800">
          <h1 className="text-4xl font-black text-center text-orange-500 mb-2 tracking-tight">
            ShopEasy
          </h1>
          <p className="text-center text-gray-500 dark:text-slate-400 mb-8 font-medium">
            Login to your account
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <input
                type="text"
                autoComplete="off"
                placeholder="Email or Phone Number"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  setIdentifierError("");
                }}
                className={`${inputBase} ${
                  identifierError
                    ? "border-red-500"
                    : "focus:ring-2 focus:ring-orange-400"
                }`}
              />
              {identifierError && (
                <p className="text-red-500 text-xs mt-1 ml-1">
                  {identifierError}
                </p>
              )}
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                autoComplete="off"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError("");
                }}
                className={`${inputBase} pr-12 ${
                  passwordError
                    ? "border-red-500"
                    : "focus:ring-2 focus:ring-orange-400"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="text-right">
              <Link
                to="/Seller/forgot-password"
                className="text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors uppercase tracking-wider"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed font-bold shadow-lg shadow-orange-500/20"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={20} /> Processing...
                </span>
              ) : (
                "Login"
              )}
            </button>
          </form>

          <div className="flex items-center my-6">
            <div className="flex-grow h-px bg-gray-300 dark:bg-slate-700" />
            <span className="px-3 text-sm text-gray-500 dark:text-slate-500 font-medium">
              OR
            </span>
            <div className="flex-grow h-px bg-gray-300 dark:bg-slate-700" />
          </div>

          <button
            type="button"
            onClick={() => googleLogin()}
            disabled={loading}
            className={`w-full flex items-center justify-center gap-3 
              bg-[#e8f0fe] dark:bg-slate-800 hover:bg-[#dfe9fd] dark:hover:bg-slate-700
              text-[#1a73e8] dark:text-blue-400 font-medium 
              py-3 rounded-lg transition
              ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            <img
              src="https://developers.google.com/identity/images/g-logo.png"
              alt="Google"
              className="w-5 h-5"
            />
            <span>Continue with Google</span>
          </button>

          <p className="mt-8 text-center text-sm text-gray-500 dark:text-slate-400">
            New to ShopEasy?{" "}
            <Link
              to="/Seller/signup"
              className="text-orange-500 hover:text-orange-600 font-bold transition-colors"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
      <SellerFooter />
    </div>
  );
}
