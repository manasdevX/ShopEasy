import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import Navbar from "../components/Navbar";
import AuthFooter from "../components/AuthFooter";
import { useGoogleLogin } from "@react-oauth/google";
import { Eye, EyeOff } from "lucide-react";

export default function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [nameError, setNameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [apiError, setApiError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // =====================
  // VALIDATIONS
  // =====================
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const isValidPhone = (phone) => /^[6-9]\d{9}$/.test(phone);

  const isValidPassword = (password) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/.test(
      password
    );
  };

  // ======================
  // NORMAL SIGNUP
  // ======================
  const handleSubmit = async (e) => {
    e.preventDefault();

    let isValid = true;

    // Reset errors
    setEmailError("");
    setPhoneError("");
    setPasswordError("");
    setApiError("");
    setNameError("");
    setError("");

    // 🔹 Name validation
    if (!name.trim()) {
      setNameError("Full name is required");
      isValid = false;
    }

    // 🔹 Email validation
    if (!email) {
      setEmailError("Email is required");
      isValid = false;
    } else if (!isValidEmail(email)) {
      setEmailError("Please enter a valid email address");
      isValid = false;
    }

    // 🔹 Phone validation
    if (!phone) {
      setPhoneError("Phone number is required");
      isValid = false;
    } else if (!isValidPhone(phone)) {
      setPhoneError("Please enter a valid phone number");
      isValid = false;
    }

    // 🔹 Password validation (SIGNUP → strength check)
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

      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setApiError(data.message || "Signup failed");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data));
      navigate("/");
    } catch (err) {
      setApiError("Server error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // ======================
  // GOOGLE SIGNUP (ID TOKEN)
  // ======================
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const idToken = credentialResponse.credential; // ✅ JWT

      const res = await fetch("http://localhost:5000/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: idToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Google signup failed");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data));
      navigate("/");
    } catch {
      setError("Google authentication failed");
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      // Adapt tokenResponse → credentialResponse shape
      handleGoogleSuccess({
        credential: tokenResponse.access_token,
      });
    },
    onError: () => {
      setError("Google authentication failed");
    },
  });

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Navbar />

      <div className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center text-orange-500 mb-2">
            ShopEasy
          </h1>
          <p className="text-center text-gray-600 mb-6">Create your account</p>

          {error && <p className="text-center text-red-500 mb-4">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {apiError && (
              <p className="text-center text-red-500 mt-4">{apiError}</p>
            )}

            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNameError("");
              }}
              className="w-full border px-3 py-2 rounded-lg"
            />

            {nameError && (
              <p className="text-sm text-red-500 mt-1">{nameError}</p>
            )}

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError("");
              }}
              className="w-full border px-3 py-2 rounded-lg"
            />
            {emailError && (
              <p className="text-sm text-red-500 mt-1">{emailError}</p>
            )}

            <input
              type="phone"
              placeholder="Phone Number"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setPhoneError("");
              }}
              className="w-full border px-3 py-2 rounded-lg"
            />
            {phoneError && (
              <p className="text-sm text-red-500 mt-1">{phoneError}</p>
            )}

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError("");
                }}
                className="w-full border px-3 py-2 pr-10 rounded-lg"
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600"
            >
              {loading ? "Creating account..." : "Sign Up"}
            </button>
          </form>

          {/* OR */}
          <div className="flex items-center my-6">
            <div className="flex-grow h-px bg-gray-300" />
            <span className="px-3 text-sm text-gray-500">OR</span>
            <div className="flex-grow h-px bg-gray-300" />
          </div>

          <button
            type="button"
            onClick={() => googleLogin()}
            className="w-full flex items-center justify-center gap-3
             bg-[#e8f0fe] hover:bg-[#dfe9fd]
             text-[#1a73e8] font-medium
             py-3 rounded-lg transition"
          >
            <img
              src="https://developers.google.com/identity/images/g-logo.png"
              alt="Google"
              className="w-5 h-5"
            />
            <span>Continue with Google</span>
          </button>

          <p className="mt-6 text-center text-sm">
            Already have an account?{" "}
            <Link to="/login" className="text-orange-500 hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>

      <AuthFooter />
    </div>
  );
}
