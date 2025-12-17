import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import Navbar from "../components/Navbar";
import AuthFooter from "../components/AuthFooter";
import { GoogleLogin } from "@react-oauth/google";

export default function Login() {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [identifierError, setIdentifierError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Email
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Indian phone number
  const isValidPhone = (phone) => /^[6-9]\d{9}$/.test(phone);

  // Password:
  // • Min 8 chars
  // • 1 uppercase
  // • 1 lowercase
  // • 1 number
  // • 1 special char
  const isValidPassword = (password) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
      password
    );

  const handleSubmit = (e) => {
    e.preventDefault();

    let isValid = true;

    // Reset errors
    setIdentifierError("");
    setPasswordError("");

    // Identifier validation
    if (!identifier) {
      setIdentifierError("Email or phone number is required");
      isValid = false;
    } else if (identifier.includes("@")) {
      if (!isValidEmail(identifier)) {
        setIdentifierError("Please enter a valid email address");
        isValid = false;
      }
    } else {
      if (!isValidPhone(identifier)) {
        setIdentifierError("Please enter a valid phone number");
        isValid = false;
      }
    }

    // Password validation
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

    // ✅ All checks passed
    navigate("/");
  };

  const handleGoogleSuccess = (credentialResponse) => {
    const googleToken = credentialResponse.credential;

    // 🔴 FRONTEND ONLY (TEMP)
    console.log("Google Token:", googleToken);

    // ✅ Later send this token to backend
    navigate("/");
  };

  const handleGoogleError = () => {
    alert("Google Sign-In failed. Please try again.");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <Navbar />

      {/* Login Section */}
      <div className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center text-orange-500 mb-2">
            ShopEasy
          </h1>
          <p className="text-center text-gray-600 mb-6">
            Login to your account
          </p>

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

            <button className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600">
              Login
            </button>
          </form>

          <div className="flex items-center my-6">
            <div className="flex-grow h-px bg-gray-300" />
            <span className="px-3 text-sm text-gray-500">OR</span>
            <div className="flex-grow h-px bg-gray-300" />
          </div>

          <button className="w-full border py-2 rounded-lg hover:bg-gray-100">
            Login with OTP
          </button>

          <div className="flex items-center my-6">
            <div className="flex-grow h-px bg-gray-300" />
            <span className="px-3 text-sm text-gray-500">OR</span>
            <div className="flex-grow h-px bg-gray-300" />
          </div>

          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
          />

          <p className="mt-6 text-center text-sm">
            New to ShopEasy?{" "}
            <Link to="/signup" className="text-orange-500 hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>

      {/* Footer */}
      <AuthFooter />
    </div>
  );
}
