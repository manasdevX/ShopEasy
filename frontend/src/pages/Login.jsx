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
      // credentialResponse.credential holds the Access Token passed from the hook below
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

      // --- NEW LOGIC START ---
      if (data.isNewUser) {
        // CASE 1: New User -> Redirect to Signup to finish profile
        // We pass the Google data to Signup so the user doesn't have to verify email again
        navigate("/signup", {
          state: {
            name: data.name,
            email: data.email,
            googleId: data.googleId,
          },
        });
      } else {
        // CASE 2: Existing User -> Login immediately
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/");
      }
      // --- NEW LOGIC END ---
    } catch (error) {
      console.error(error);
      setApiError("Google authentication failed");
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      // We pass the access_token to our handler
      handleGoogleSuccess({
        credential: tokenResponse.access_token,
      });
    },
    onError: () => setApiError("Google authentication failed"),
  });

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Navbar />

      <div className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center text-orange-500 mb-2">
            ShopEasy
          </h1>

          <p className="text-center text-gray-600 mb-6">
            Login to your account
          </p>

          {apiError && (
            <p className="text-center text-red-500 mb-4 bg-red-50 p-2 rounded border border-red-100">
              {apiError}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Email or Phone Number
              </label>
              <input
                type="text"
                value={identifier}
                placeholder="Enter email or phone"
                className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none transition-all"
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
              <label className="block text-sm font-medium mb-1">Password</label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  placeholder="Enter password"
                  className="w-full border px-3 py-2 pr-10 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none transition-all"
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError("");
                  }}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
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
            <div className="flex-grow h-px bg-gray-300" />
            <span className="px-3 text-sm text-gray-500">OR</span>
            <div className="flex-grow h-px bg-gray-300" />
          </div>

          <button
            type="button"
            onClick={() => googleLogin()}
            disabled={loading}
            className={`w-full flex items-center justify-center gap-3
              bg-[#e8f0fe] hover:bg-[#dfe9fd]
              text-[#1a73e8] font-medium
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

          <p className="mt-6 text-center text-sm">
            New to ShopEasy?{" "}
            <Link to="/signup" className="text-orange-500 hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>

      <AuthFooter />
    </div>
  );
}
