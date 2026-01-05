import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import AuthFooter from "../components/AuthFooter";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { showSuccess, showError } from "../utils/toast";
import { useGoogleLogin } from "@react-oauth/google";

const API_URL = import.meta.env.VITE_API_URL;

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  /**
   * PRODUCTION HELPER: Sync Guest Cart to Database
   * Extracts LocalStorage items and pushes them to the /api/cart/sync endpoint
   */
  const syncGuestCart = async (token) => {
    try {
      const localCart = JSON.parse(localStorage.getItem("cart")) || [];
      if (localCart.length === 0) return;

      // Map local cart to match the Backend Schema: { product: id, quantity: num }
      const localItems = localCart.map((item) => ({
        product: item._id,
        quantity: item.quantity,
      }));

      const res = await fetch(`${API_URL}/api/cart/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include", // ✅ Good practice for consistent session handling
        body: JSON.stringify({ localItems }),
      });

      if (res.ok) {
        // Clear local storage after successful sync to prevent duplicate merges
        localStorage.removeItem("cart");
      }
    } catch (err) {
      console.error("Cart Sync Error:", err);
    }
  };

  /* ================= EMAIL / PASSWORD LOGIN ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      return showError("Email/Phone and password required");
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ✅ CRITICAL: Required to accept the HttpOnly Cookie from Backend
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return showError(data.message || "Login failed");
      }

      // 1. Save Auth State
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // 2. PRODUCTION STEP: Sync Guest Cart to MongoDB
      await syncGuestCart(data.token);

      showSuccess("Login successful!");
      navigate(from);
    } catch (err) {
      console.error("Login Error:", err);
      showError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ================= GOOGLE LOGIN ================= */
  const googleLogin = useGoogleLogin({
    flow: "implicit",
    scope: "openid profile email",
    onSuccess: async (tokenResponse) => {
      try {
        const res = await fetch(`${API_URL}/api/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include", // ✅ CRITICAL: Required to accept the HttpOnly Cookie from Backend
          body: JSON.stringify({
            token: tokenResponse.access_token,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          return showError(data.message || "Google login failed");
        }

        if (data.isNewUser) {
          navigate("/signup", {
            state: {
              name: data.name,
              email: data.email,
              googleId: data.googleId,
            },
          });
        } else {
          // 1. Save Auth State
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));

          // 2. PRODUCTION STEP: Sync Guest Cart to MongoDB
          await syncGuestCart(data.token);

          showSuccess("Login successful!");
          navigate(from);
        }
      } catch (err) {
        console.error("Google Login Error:", err);
        showError("Google login failed");
      }
    },
    onError: () => showError("Google login failed"),
  });

  const inputBase =
    "w-full border px-4 py-3 rounded-lg outline-none transition bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-gray-300 dark:border-slate-700 focus:ring-2 focus:ring-orange-400";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-[#030712]">
      <Navbar />

      <div className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 border dark:border-slate-800">
          <h1 className="text-4xl font-black text-center text-orange-500 mb-2">
            ShopEasy
          </h1>
          <p className="text-center text-gray-500 dark:text-slate-400 mb-8">
            Login to your account
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <input
              type="text"
              autoComplete="off"
              placeholder="Email or Phone Number"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputBase}
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="off"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputBase} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-sm text-orange-500 font-bold"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 text-white py-3 rounded-lg font-bold hover:bg-orange-600 transition disabled:opacity-50"
            >
              {loading ? (
                <span className="flex justify-center gap-2">
                  <Loader2 className="animate-spin" /> Logging in...
                </span>
              ) : (
                "Login"
              )}
            </button>
          </form>

          <div className="flex items-center my-6">
            <div className="flex-grow h-px bg-gray-300 dark:bg-slate-700" />
            <span className="px-3 text-sm text-gray-500">OR</span>
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

          <p className="mt-8 text-center text-sm text-gray-500">
            Don’t have an account?{" "}
            <Link to="/signup" className="text-orange-500 font-bold">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      <AuthFooter />
    </div>
  );
}
