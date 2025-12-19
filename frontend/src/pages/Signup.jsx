import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react"; // Added useEffect
import Navbar from "../components/Navbar";
import AuthFooter from "../components/AuthFooter";
import { useGoogleLogin } from "@react-oauth/google";
import { Eye, EyeOff, CheckCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function Signup() {
  const navigate = useNavigate();

  // ================= STATE =================
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const [emailOtp, setEmailOtp] = useState("");
  const [mobileOtp, setMobileOtp] = useState("");

  // Verification Flags
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isMobileSent, setIsMobileSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isMobileVerified, setIsMobileVerified] = useState(false);

  // TIMERS (New)
  const [emailTimer, setEmailTimer] = useState(0);
  const [mobileTimer, setMobileTimer] = useState(0);

  // Loading States
  const [loading, setLoading] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [verifyingMobile, setVerifyingMobile] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ================= TIMER LOGIC (New) =================
  useEffect(() => {
    let interval;
    if (emailTimer > 0) {
      interval = setInterval(() => setEmailTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [emailTimer]);

  useEffect(() => {
    let interval;
    if (mobileTimer > 0) {
      interval = setInterval(() => setMobileTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [mobileTimer]);

  // ================= HANDLERS =================

  // Update Form Data
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });

    // Reset verification if user changes email/phone after verifying
    if (e.target.name === "email") {
      setIsEmailVerified(false);
      setIsEmailSent(false);
      setEmailOtp("");
      setEmailTimer(0); // Reset timer
    }
    if (e.target.name === "phone") {
      setIsMobileVerified(false);
      setIsMobileSent(false);
      setMobileOtp("");
      setMobileTimer(0); // Reset timer
    }
  };

  // --- EMAIL FLOW ---
  const sendEmailOtp = async () => {
    // 1. Strict Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return toast.error("Please enter a valid email address");
    }

    if (formData.email.endsWith("@gmail.co")) {
      return toast.error("Did you mean @gmail.com?");
    }

    setVerifyingEmail(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/send-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsEmailSent(true);
        setEmailTimer(30); // 🕒 Start 30s Timer
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Failed to send OTP");
    } finally {
      setVerifyingEmail(false);
    }
  };

  const verifyEmailOtp = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/auth/check-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: formData.email, otp: emailOtp }),
      });
      if (res.ok) {
        setIsEmailVerified(true);
        toast.success("Email Verified!");
      } else {
        toast.error("Invalid Email OTP");
      }
    } catch (error) {
      toast.error("Verification failed");
    }
  };

  // --- MOBILE FLOW ---
  const sendMobileOtp = async () => {
    if (!formData.phone) return toast.error("Please enter phone first");
    setVerifyingMobile(true);
    try {
      const res = await fetch(
        "http://localhost:5000/api/auth/send-mobile-otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: formData.phone }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        setIsMobileSent(true);
        setMobileTimer(30); // 🕒 Start 30s Timer
        toast.success("OTP sent to Mobile!");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Server Error");
    } finally {
      setVerifyingMobile(false);
    }
  };

  const verifyMobileOtp = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/auth/check-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: formData.phone, otp: mobileOtp }),
      });
      if (res.ok) {
        setIsMobileVerified(true);
        toast.success("Mobile Verified!");
      } else {
        toast.error("Invalid Mobile OTP");
      }
    } catch (error) {
      toast.error("Verification failed");
    }
  };

  // --- FINAL SUBMIT ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isEmailVerified || !isMobileVerified) {
      return toast.error("Please verify both Email and Phone to continue.");
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          emailOtp,
          mobileOtp,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data));
        toast.success("Welcome to ShopEasy!");
        navigate("/");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Registration Failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // Google Login Hook
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await fetch("http://localhost:5000/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: tokenResponse.access_token }),
        });
        const data = await res.json();
        if (res.ok) {
          localStorage.setItem("token", data.token);
          navigate("/");
        }
      } catch (err) {
        toast.error("Google Login Failed");
      }
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* NAME */}
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded-lg"
              required
            />

            {/* EMAIL VERIFICATION BLOCK */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`flex-grow border px-3 py-2 rounded-lg ${
                    isEmailVerified ? "border-green-500 bg-green-50" : ""
                  }`}
                  disabled={isEmailVerified}
                  required
                />
                {!isEmailVerified ? (
                  <button
                    type="button"
                    onClick={sendEmailOtp}
                    // ✅ FIXED: Only disable if verifying OR if timer is running
                    disabled={verifyingEmail || emailTimer > 0}
                    className="bg-orange-500 text-white px-3 py-2 rounded-lg text-sm font-medium w-24 min-w-[96px]"
                  >
                    {verifyingEmail ? (
                      <Loader2 className="animate-spin mx-auto" size={18} />
                    ) : emailTimer > 0 ? (
                      `Resend (${emailTimer}s)`
                    ) : isEmailSent ? (
                      "Resend"
                    ) : (
                      "Verify"
                    )}
                  </button>
                ) : (
                  <CheckCircle className="text-green-500 mt-2" />
                )}
              </div>

              {/* Email OTP Input */}
              {isEmailSent && !isEmailVerified && (
                <div className="flex gap-2 animate-in fade-in slide-in-from-top-1">
                  <input
                    type="text"
                    placeholder="Enter Email OTP"
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value)}
                    className="flex-grow border px-3 py-2 rounded-lg text-sm"
                  />
                  <button
                    type="button"
                    onClick={verifyEmailOtp}
                    className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm w-24"
                  >
                    Check
                  </button>
                </div>
              )}
            </div>

            {/* PHONE VERIFICATION BLOCK */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  name="phone"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`flex-grow border px-3 py-2 rounded-lg ${
                    isMobileVerified ? "border-green-500 bg-green-50" : ""
                  }`}
                  disabled={isMobileVerified}
                  required
                />
                {!isMobileVerified ? (
                  <button
                    type="button"
                    onClick={sendMobileOtp}
                    // ✅ FIXED: Only disable if verifying OR if timer is running
                    disabled={verifyingMobile || mobileTimer > 0}
                    className="bg-orange-500 text-white px-3 py-2 rounded-lg text-sm font-medium w-24 min-w-[96px]"
                  >
                    {verifyingMobile ? (
                      <Loader2 className="animate-spin mx-auto" size={18} />
                    ) : mobileTimer > 0 ? (
                      `Resend (${mobileTimer}s)`
                    ) : isMobileSent ? (
                      "Resend"
                    ) : (
                      "Verify"
                    )}
                  </button>
                ) : (
                  <CheckCircle className="text-green-500 mt-2" />
                )}
              </div>

              {/* Mobile OTP Input */}
              {isMobileSent && !isMobileVerified && (
                <div className="flex gap-2 animate-in fade-in slide-in-from-top-1">
                  <input
                    type="text"
                    placeholder="Enter Mobile OTP"
                    value={mobileOtp}
                    onChange={(e) => setMobileOtp(e.target.value)}
                    className="flex-grow border px-3 py-2 rounded-lg text-sm"
                  />
                  <button
                    type="button"
                    onClick={verifyMobileOtp}
                    className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm w-24"
                  >
                    Check
                  </button>
                </div>
              )}
            </div>

            {/* PASSWORD */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className="w-full border px-3 py-2 pr-10 rounded-lg"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading || !isEmailVerified || !isMobileVerified}
              className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          {/* GOOGLE & FOOTER */}
          <div className="flex items-center my-6">
            <div className="flex-grow h-px bg-gray-300" />
            <span className="px-3 text-sm text-gray-500">OR</span>
            <div className="flex-grow h-px bg-gray-300" />
          </div>

          <button
            type="button"
            onClick={() => googleLogin()}
            className="w-full flex items-center justify-center gap-3 bg-[#e8f0fe] hover:bg-[#dfe9fd] text-[#1a73e8] font-medium py-3 rounded-lg transition"
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
