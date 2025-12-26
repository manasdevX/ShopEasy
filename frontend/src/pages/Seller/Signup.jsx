import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { Eye, EyeOff, CheckCircle, Loader2 } from "lucide-react";
import { showSuccess, showError } from "../../utils/toast";
import SellerFooter from "../../components/Seller/SellerFooter";
import SellerNavbar from "../../components/Seller/SellerNavbar";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Signup() {
  const navigate = useNavigate();
  const location = useLocation();

  // ================= STATE =================
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const [emailOtp, setEmailOtp] = useState("");
  const [mobileOtp, setMobileOtp] = useState("");
  const [googleId, setGoogleId] = useState(null);

  const [phoneError, setPhoneError] = useState("");
  const [emailError, setEmailError] = useState("");

  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isMobileSent, setIsMobileSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isMobileVerified, setIsMobileVerified] = useState(false);

  const [emailTimer, setEmailTimer] = useState(0);
  const [mobileTimer, setMobileTimer] = useState(0);

  const [loading, setLoading] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [verifyingMobile, setVerifyingMobile] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const hasShownToast = useRef(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[6-9]\d{9}$/; // Indian standard: starts with 6-9, 10 digits

  // ================= AUTOFILL LOGIC =================
  useEffect(() => {
    if (location.state) {
      const { name, email, googleId } = location.state;
      if (email && googleId && !hasShownToast.current) {
        hasShownToast.current = true;

        setFormData((prev) => ({ ...prev, name, email }));
        setGoogleId(googleId);
        setIsEmailVerified(true);
        // TOAST: Triggered only on Google Redirect
        showSuccess("Email Verified!");

        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state]);

  // ================= TIMER LOGIC =================
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });

    if (e.target.name === "email" && !googleId) {
      setIsEmailVerified(false);
      setIsEmailSent(false);
      setEmailOtp("");
      setEmailTimer(0);
      setEmailError("");
    }
    if (e.target.name === "phone") {
      setIsMobileVerified(false);
      setIsMobileSent(false);
      setMobileOtp("");
      setMobileTimer(0);
      setPhoneError("");
    }
  };

  // --- EMAIL FLOW ---
  const sendEmailOtp = async () => {
    if (!emailRegex.test(formData.email))
      return showError("Invalid email address");

    setVerifyingEmail(true);
    setEmailError("");

    try {
      const res = await fetch(`${API_URL}/api/auth/send-email-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // UPDATED: Added type: 'seller' to isolate from User DB
        body: JSON.stringify({ email: formData.email, type: "seller" }),
      });
      const data = await res.json();

      if (res.ok) {
        setIsEmailSent(true);
        setEmailTimer(30);
        showSuccess(
          isEmailSent ? "OTP Resent to Email!" : "OTP sent to Email!"
        );
      } else {
        setEmailError(data.message);
        showError(data.message);
      }
    } catch {
      showError("Failed to send Email OTP");
    } finally {
      setVerifyingEmail(false);
    }
  };

  const verifyEmailOtp = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/check-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: formData.email, otp: emailOtp }),
      });
      if (res.ok) {
        setIsEmailVerified(true);
        showSuccess("Email Verified!");
      } else {
        showError("Invalid Email OTP");
      }
    } catch {
      showError("Verification failed");
    }
  };

  // --- MOBILE FLOW ---
  const sendMobileOtp = async () => {
    if (!phoneRegex.test(formData.phone))
      return showError("Invalid phone number");

    if (!formData.phone) return showError("Please enter phone first");

    if (isMobileVerified) return showSuccess("Phone already verified!");

    setVerifyingMobile(true);
    setPhoneError("");

    try {
      const res = await fetch(`${API_URL}/api/auth/send-mobile-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // UPDATED: Added type: 'seller' to isolate from User DB
        body: JSON.stringify({ phone: formData.phone, type: "seller" }),
      });
      const data = await res.json();

      if (res.ok) {
        setIsMobileSent(true);
        setMobileTimer(30);
        showSuccess(
          isMobileSent ? "OTP Resent to Mobile!" : "OTP sent to Mobile!"
        );
      } else {
        setPhoneError(data.message);
        showError(data.message);
      }
    } catch {
      showError("Server Error while sending mobile OTP");
    } finally {
      setVerifyingMobile(false);
    }
  };

  const verifyMobileOtp = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/check-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: formData.phone, otp: mobileOtp }),
      });
      if (res.ok) {
        setIsMobileVerified(true);
        showSuccess("Mobile Verified!");
      } else {
        showError("Invalid Mobile OTP");
      }
    } catch {
      showError("Mobile verification failed");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // 1. Password Validation
    const password = formData.password;
    const isValidPassword = (pass) =>
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
        pass
      );

    if (!isValidPassword(password)) {
      return showError(
        "Password must be 8+ chars (Uppercase, Lowercase, Number, Special Char)"
      );
    }

    // 2. OTP Validation
    if (!isEmailVerified)
      return showError("Please verify your email address first");
    if (!isMobileVerified)
      return showError("Please verify your phone number first");

    // 3. Move to Step 2 (Don't call API yet)
    navigate("/Seller/register", {
      state: {
        ...formData,
        googleId,
      },
    });
  };

  // --- GOOGLE LOGIN ---
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
            setFormData((prev) => ({
              ...prev,
              name: data.name,
              email: data.email,
            }));
            setGoogleId(data.googleId);
            setIsEmailVerified(true);
            showSuccess("Email Verified!");
          } else {
            // Existing seller login via Google
            localStorage.setItem("sellerToken", data.token);
            // Ensure we save the user object correctly (handles both wrapped and unwrapped responses)
            localStorage.setItem(
              "sellerUser",
              JSON.stringify(data.user || data)
            );
            showSuccess("Login successful!");
            navigate("/Seller/Dashboard");
          }
        } else {
          showError(data.message);
        }
      } catch (err) {
        showError("Google Login Failed");
      }
    },
  });

  const inputBase = `w-full border px-4 py-2.5 rounded-lg outline-none transition-all duration-200 
    bg-white dark:bg-slate-800 text-slate-900 dark:text-white
    autofill:shadow-[inset_0_0_0px_1000px_#ffffff] dark:autofill:shadow-[inset_0_0_0px_1000px_#1e293b]
    autofill:text-fill-slate-900 dark:autofill:text-fill-white border-gray-300 dark:border-slate-700`;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-[#030712] transition-colors duration-300 font-sans">
      <SellerNavbar />
      <div className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 border dark:border-slate-800">
          <h1 className="text-4xl font-black text-center text-orange-500 mb-2 tracking-tight">
            ShopEasy
          </h1>
          <p className="text-center text-gray-500 dark:text-slate-400 mb-8 font-medium">
            Create your account
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <input
              type="text"
              name="name"
              autoComplete="off"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              className={`${inputBase} focus:ring-2 focus:ring-orange-400`}
              required
            />

            {/* EMAIL INPUT */}
            <div className="space-y-3">
              <div className="relative flex items-center">
                <input
                  type="email"
                  name="email"
                  autoComplete="off"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isEmailVerified || !!googleId}
                  className={`${inputBase} pr-24 ${
                    isEmailVerified
                      ? "border-green-500 ring-1 ring-green-500/20"
                      : "focus:ring-2 focus:ring-orange-400"
                  } ${emailError ? "border-red-500" : ""}`}
                  required
                />
                <div className="absolute right-2 flex items-center">
                  {!isEmailVerified ? (
                    <button
                      type="button"
                      onClick={sendEmailOtp}
                      disabled={verifyingEmail || emailTimer > 0}
                      className="text-xs font-bold text-orange-500 hover:text-orange-600 disabled:text-gray-400 uppercase tracking-wider px-2"
                    >
                      {verifyingEmail ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : emailTimer > 0 ? (
                        `${emailTimer}s`
                      ) : isEmailSent ? (
                        "Resend"
                      ) : (
                        "Verify"
                      )}
                    </button>
                  ) : (
                    <CheckCircle className="text-green-500 mr-2" size={20} />
                  )}
                </div>
              </div>
              {/* Error Message */}
              {emailError && (
                <p className="text-red-500 text-xs font-medium ml-1">
                  {emailError}
                </p>
              )}
              {/* OTP Input */}
              {isEmailSent && !isEmailVerified && !googleId && (
                <div className="flex gap-2 p-2 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-dashed dark:border-slate-700 animate-in zoom-in-95">
                  <input
                    autoComplete="off"
                    type="text"
                    placeholder="Email OTP"
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value)}
                    className="flex-grow bg-white dark:bg-slate-800 border dark:border-slate-700 px-3 py-1.5 rounded-md text-sm outline-none focus:ring-2 focus:ring-green-400"
                  />
                  <button
                    type="button"
                    onClick={verifyEmailOtp}
                    className="bg-green-600 text-white px-4 py-1.5 rounded-md text-xs font-bold hover:bg-green-700 transition-colors"
                  >
                    CONFIRM
                  </button>
                </div>
              )}
            </div>

            {/* PHONE INPUT */}
            <div className="space-y-3">
              <div className="relative flex items-center">
                <input
                  autoComplete="off"
                  type="text"
                  name="phone"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={isMobileVerified}
                  className={`${inputBase} pr-24 ${
                    isMobileVerified
                      ? "border-green-500 ring-1 ring-green-500/20"
                      : "focus:ring-2 focus:ring-orange-400"
                  } ${phoneError ? "border-red-500" : ""}`}
                  required
                />
                <div className="absolute right-2 flex items-center">
                  {!isMobileVerified ? (
                    <button
                      type="button"
                      onClick={sendMobileOtp}
                      disabled={verifyingMobile || mobileTimer > 0}
                      className="text-xs font-bold text-orange-500 hover:text-orange-600 disabled:text-gray-400 uppercase tracking-wider px-2"
                    >
                      {verifyingMobile ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : mobileTimer > 0 ? (
                        `${mobileTimer}s`
                      ) : isMobileSent ? (
                        "Resend"
                      ) : (
                        "Verify"
                      )}
                    </button>
                  ) : (
                    <CheckCircle className="text-green-500 mr-2" size={20} />
                  )}
                </div>
              </div>
              {phoneError && (
                <p className="text-red-500 text-xs font-medium ml-1">
                  {phoneError}
                </p>
              )}
              {isMobileSent && !isMobileVerified && (
                <div className="flex gap-2 p-2 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-dashed dark:border-slate-700 animate-in zoom-in-95">
                  <input
                    autoComplete="off"
                    type="text"
                    placeholder="Mobile OTP"
                    value={mobileOtp}
                    onChange={(e) => setMobileOtp(e.target.value)}
                    className="flex-grow bg-white dark:bg-slate-800 border dark:border-slate-700 px-3 py-1.5 rounded-md text-sm outline-none focus:ring-2 focus:ring-green-400"
                  />
                  <button
                    type="button"
                    onClick={verifyMobileOtp}
                    className="bg-green-600 text-white px-4 py-1.5 rounded-md text-xs font-bold hover:bg-green-700 transition-colors"
                  >
                    CONFIRM
                  </button>
                </div>
              )}
            </div>

            {/* PASSWORD INPUT */}
            <div className="relative">
              <input
                autoComplete="off"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Secure Password"
                value={formData.password}
                onChange={handleChange}
                className={`${inputBase} pr-12 focus:ring-2 focus:ring-orange-400`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || !isEmailVerified || !isMobileVerified}
              className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed font-bold shadow-lg shadow-orange-500/20"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={20} /> Processing...
                </span>
              ) : (
                "Create Account"
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
            Already have an account?{" "}
            <Link
              to="/Seller/login"
              className="text-orange-500 hover:text-orange-600 font-bold transition-colors"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
      <SellerFooter />
    </div>
  );
}
