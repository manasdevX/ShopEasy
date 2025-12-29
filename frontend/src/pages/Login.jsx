import { useState } from "react";
import { Link, useNavigate , useLocation } from "react-router-dom";
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
              placeholder="Email or Phone"
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
              text-[#1a73e8] dark:text-blue-400 font-medium 
              py-3 rounded-lg transition
              ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            <img
              src="https://developers.google.com/identity/images/g-logo.png"
              className="w-5 h-5"
              alt="Google"
            />
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
