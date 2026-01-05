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
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const inputBase = `w-full border px-4 py-2.5 rounded-lg outline-none transition-all duration-200 
    bg-white dark:bg-slate-800 text-slate-900 dark:text-white
    autofill:shadow-[inset_0_0_0px_1000px_#ffffff] dark:autofill:shadow-[inset_0_0_0px_1000px_#1e293b]
    autofill:text-fill-slate-900 dark:autofill:text-fill-white border-gray-300 dark:border-slate-700`;

  const handleLoginSuccess = (data) => {
    // 1. Store the JWT token for API headers
    localStorage.setItem("sellerToken", data.token);

    // 2. Store user profile for UI state
    const userProfile = {
      _id: data._id || data.user?._id,
      name: data.name || data.user?.name,
      email: data.email || data.user?.email,
      businessName: data.businessName || data.user?.businessName,
      role: data.role || data.user?.role || "seller",
    };
    localStorage.setItem("sellerUser", JSON.stringify(userProfile));

    showSuccess("Login successful!");

    // 3. Small delay (400ms) to ensure browser cookie-store and
    // localStorage are fully synchronized before Dashboard mounts
    setTimeout(() => {
      navigate("/Seller/Dashboard");
    }, 400);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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

    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/api/sellers/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ✅ Required for shopeasy.sid session cookie
        body: JSON.stringify({ email: identifier, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        showError(data.message || "Login failed");
        return;
      }

      handleLoginSuccess(data);
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
        setLoading(true);
        const res = await fetch(`${API_URL}/api/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include", // ✅ Required for session persistence
          body: JSON.stringify({
            token: tokenResponse.access_token,
            role: "seller",
          }),
        });

        const data = await res.json();

        if (res.ok) {
          if (data.isNewUser) {
            navigate("/Seller/signup", {
              state: {
                name: data.name,
                email: data.email,
                googleId: data.googleId,
              },
            });
          } else {
            handleLoginSuccess(data);
          }
        } else {
          showError(data.message || "Google Login Failed");
        }
      } catch (error) {
        console.error("Google Login Error:", error);
        showError("Google Login Connection Failed");
      } finally {
        setLoading(false);
      }
    },
    onError: () => showError("Google login failed"),
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
            Seller Login
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <input
                type="text"
                autoComplete="email"
                placeholder="Email or Phone Number"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className={`${inputBase} focus:ring-2 focus:ring-orange-400`}
              />
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputBase} pr-12 focus:ring-2 focus:ring-orange-400`}
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
  onClick={() => googleLogin()}
  disabled={loading}
  className={`w-full flex items-center justify-center gap-3 
    bg-[#e8f0fe] dark:bg-slate-800 hover:bg-[#dfe9fd] dark:hover:bg-slate-700
    text-[#1a73e8] dark:text-blue-400 font-bold 
    py-3 rounded-lg transition-all active:scale-[0.98] border border-transparent dark:border-slate-700
    ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
>
  {/* Official Google SVG - Transparent Background */}
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    className="shrink-0"
  >
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
  Continue with Google
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
