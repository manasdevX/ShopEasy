import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import Navbar from "../components/Navbar";
import AuthFooter from "../components/AuthFooter";
import { useGoogleLogin } from "@react-oauth/google";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [identifierError, setIdentifierError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // =====================
  // VALIDATIONS
  // =====================
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPhone = (phone) => /^[6-9]\d{9}$/.test(phone);

  // =====================
  // EMAIL / PASSWORD LOGIN
  // =====================
  const handleSubmit = async (e) => {
    e.preventDefault();

    let isValid = true;
    setIdentifierError("");
    setPasswordError("");
    setApiError("");

    if (!identifier) {
      setIdentifierError("Email or phone number is required");
      isValid = false;
    } else if (identifier.includes("@")) {
      if (!isValidEmail(identifier)) {
        setIdentifierError("Please enter a valid email address");
        isValid = false;
      }
    } else if (!isValidPhone(identifier)) {
      setIdentifierError("Please enter a valid phone number");
      isValid = false;
    }

    if (!password) {
      setPasswordError("Password is required");
      isValid = false;
    }

    if (!isValid) return;

    try {
      setLoading(true);

      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: identifier, // Backend handles email/phone in 'email' field
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setApiError(data.message || "Login failed");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data));
      navigate("/");
    } catch {
      setApiError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // =====================
  // GOOGLE LOGIN (Hybrid Flow ✅)
  // =====================
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const accessToken = credentialResponse.credential;

      const res = await fetch("http://localhost:5000/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: accessToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        setApiError(data.message || "Google login failed");
        return;
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
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/");
      }
    } catch (error) {
      console.error(error);
      setApiError("Google authentication failed");
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      handleGoogleSuccess({
        credential: tokenResponse.access_token,
      });
    },
    onError: () => setApiError("Google authentication failed"),
  });

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-[#030712] transition-colors duration-300">
      <Navbar />

      <div className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-lg p-8 border dark:border-slate-800">
          <h1 className="text-3xl font-bold text-center text-orange-500 mb-2">
            ShopEasy
          </h1>

          <p className="text-center text-gray-600 dark:text-slate-400 mb-6">
            Login to your account
          </p>

          {apiError && (
            <p className="text-center text-red-500 mb-4 bg-red-50 dark:bg-red-500/10 p-2 rounded border border-red-100 dark:border-red-500/20">
              {apiError}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-slate-200">
                Email or Phone Number
              </label>
              <input
                type="text"
                value={identifier}
                placeholder="Enter email or phone"
                className="w-full border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none transition-all"
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  setIdentifierError("");
                }}
              />
              {identifierError && (
                <p className="text-sm text-red-500 mt-1">{identifierError}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 dark:text-slate-200">Password</label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  placeholder="Enter password"
                  className="w-full border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 pr-10 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none transition-all"
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError("");
                  }}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {passwordError && (
                <p className="text-sm text-red-500 mt-1">{passwordError}</p>
              )}
            </div>

            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-sm text-orange-500 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 disabled:opacity-60 transition-colors"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="flex items-center my-6">
            <div className="flex-grow h-px bg-gray-300 dark:bg-slate-700" />
            <span className="px-3 text-sm text-gray-500 dark:text-slate-500 font-medium">OR</span>
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

          <p className="mt-6 text-center text-sm dark:text-slate-400">
            New to ShopEasy?{" "}
            <Link to="/signup" className="text-orange-500 hover:underline font-semibold">
              Create an account
            </Link>
          </p>
        </div>
      </div>

      <AuthFooter />
    </div>
  );
}