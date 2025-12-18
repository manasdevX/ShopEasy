import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import Navbar from "../components/Navbar";
import AuthFooter from "../components/AuthFooter";
import { useGoogleLogin } from "@react-oauth/google";

export default function Login() {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [identifierError, setIdentifierError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  // =====================
  // VALIDATIONS
  // =====================
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPhone = (phone) => /^[6-9]\d{9}$/.test(phone);
  const isValidPassword = (password) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password);

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
    } else if (!isValidPassword(password)) {
      setPasswordError(
        "Password must be at least 8 characters and include uppercase, lowercase, number & special character"
      );
      isValid = false;
    }

    if (!isValid) return;

    try {
      setLoading(true);

      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: identifier, password }),
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
  // GOOGLE LOGIN
  // =====================
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await fetch("http://localhost:5000/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: tokenResponse.access_token }),
        });

        const data = await res.json();

        if (!res.ok) {
          setApiError(data.message || "Google login failed");
          return;
        }

        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data));
        navigate("/");
      } catch {
        setApiError("Google login failed. Try again.");
      }
    },
    onError: () => setApiError("Google Sign-In failed"),
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
            <p className="text-center text-red-500 mb-4">{apiError}</p>
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
                className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-orange-400"
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  setIdentifierError("");
                }}
              />
              {identifierError && (
                <p className="text-sm text-red-500 mt-2">{identifierError}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                value={password}
                placeholder="Enter password"
                className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-orange-400"
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError("");
                }}
              />
              {passwordError && (
                <p className="text-sm text-red-500 mt-2">{passwordError}</p>
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
              className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="flex items-center my-6">
            <div className="flex-grow h-px bg-gray-300" />
            <span className="px-3 text-sm text-gray-500">OR</span>
            <div className="flex-grow h-px bg-gray-300" />
          </div>

          {/* ✅ GOOGLE BUTTON */}
          <button
            onClick={() => googleLogin()}
            className="w-full flex items-center justify-center gap-3 
                       bg-[#E8F0FE] text-[#1A73E8]
                       py-2.5 rounded-lg 
                       hover:bg-[#DDE7FD] transition font-medium"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="w-5 h-5"
            />
            Continue with Google
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
