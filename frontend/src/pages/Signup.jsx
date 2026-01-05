import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import Navbar from "../components/Navbar";
import AuthFooter from "../components/AuthFooter";
import { useGoogleLogin } from "@react-oauth/google";
import { Eye, EyeOff, CheckCircle, Loader2 } from "lucide-react";
import { showSuccess, showError } from "../utils/toast";

const API_URL = import.meta.env.VITE_API_URL;

export default function Signup() {
  const navigate = useNavigate();
  const location = useLocation();
  const previousPath = location.state?.from || "/";

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
  const phoneRegex = /^[6-9]\d{9}$/;

  // ================= PRODUCTION HELPER: CART SYNC =================
  /**
   * Syncs the LocalStorage guest cart to MongoDB immediately after registration.
   */
  const syncGuestCart = async (token) => {
    try {
      const localCart = JSON.parse(localStorage.getItem("cart")) || [];
      if (localCart.length === 0) return;

      const localItems = localCart.map((item) => ({
        product: item._id, // Matches MongoDB ID
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
        localStorage.removeItem("cart"); // Clear local after successful cloud sync
      }
    } catch (err) {
      console.error("Signup Cart Sync Error:", err);
    }
  };

  // ================= AUTOFILL LOGIC =================
  useEffect(() => {
    if (location.state) {
      const { name, email, googleId } = location.state;
      if (email && googleId && !hasShownToast.current) {
        hasShownToast.current = true;
        setFormData((prev) => ({ ...prev, name, email }));
        setGoogleId(googleId);
        setIsEmailVerified(true);
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

  const sendEmailOtp = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email))
      return showError("Invalid email address");

    setVerifyingEmail(true);
    setEmailError("");
    try {
      const res = await fetch(`${API_URL}/api/auth/send-email-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsEmailSent(true);
        setEmailTimer(30);
        showSuccess(isEmailSent ? "OTP Resent!" : "OTP sent!");
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

  const sendMobileOtp = async () => {
    if (!phoneRegex.test(formData.phone))
      return showError("Invalid phone number");
    setVerifyingMobile(true);
    setPhoneError("");
    try {
      const res = await fetch(`${API_URL}/api/auth/send-mobile-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formData.phone }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsMobileSent(true);
        setMobileTimer(30);
        showSuccess("OTP sent to Mobile!");
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isEmailVerified)
      return showError("Please verify your email address first");
    if (!isMobileVerified)
      return showError("Please verify your phone number first");

    const password = formData.password;
    const isValidPassword = (pass) =>
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
        pass
      );

    if (!isValidPassword(password)) {
      return showError(
        "Password must be 8+ characters with uppercase, lowercase, number, and special char."
      );
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ✅ CRITICAL: Accepts the HTTP-Only cookie from Register
        body: JSON.stringify({ ...formData, emailOtp, mobileOtp, googleId }),
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        // ✅ PRODUCTION: Sync guest cart items to the new account
        await syncGuestCart(data.token);

        showSuccess("Registration complete!");
        navigate(previousPath);
      } else {
        showError(data.message || "Registration failed");
      }
    } catch {
      showError("Network Error: Registration Failed");
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await fetch(`${API_URL}/api/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include", // ✅ CRITICAL: Accepts the HTTP-Only cookie from Google Auth
          body: JSON.stringify({ token: tokenResponse.access_token }),
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
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            // ✅ PRODUCTION: Sync cart for Google Login
            await syncGuestCart(data.token);

            showSuccess("Login successful!");
            navigate(previousPath);
          }
        } else {
          showError(data.message);
        }
      } catch {
        showError("Google Login Failed");
      }
    },
  });

  const inputBase = `w-full border px-4 py-2.5 rounded-lg outline-none transition-all duration-200 
    bg-white dark:bg-slate-800 text-slate-900 dark:text-white
    autofill:shadow-[inset_0_0_0px_1000px_#ffffff] dark:autofill:shadow-[inset_0_0_0px_1000px_#1e293b]
    border-gray-300 dark:border-slate-700`;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-[#030712] transition-colors duration-300 font-sans">
      <Navbar />
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
              autoComplete="off"
              name="name"
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
                        <span className="text-orange-600 dark:text-orange-400 font-black">
                          {emailTimer}s
                        </span>
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
              {emailError && (
                <p className="text-red-500 text-xs font-medium ml-1">
                  {emailError}
                </p>
              )}
              {isEmailSent && !isEmailVerified && !googleId && (
                <div className="flex gap-2 p-2 bg-gray-50 dark:bg-slate-800/50 rounded-lg dark:border-slate-700 animate-in zoom-in-95">
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
                    className="bg-green-600 text-white px-4 py-1.5 rounded-md text-xs font-bold hover:bg-green-700"
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
                        <Loader2
                          className="text-orange-500 animate-spin"
                          size={16}
                        />
                      ) : mobileTimer > 0 ? (
                        <span className="text-orange-600 dark:text-orange-400 font-black">
                          {mobileTimer}s
                        </span>
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
                <div className="flex gap-2 p-2 bg-gray-50 dark:bg-slate-800/50 rounded-lg dark:border-slate-700 animate-in zoom-in-95">
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
                    className="bg-green-600 text-white px-4 py-1.5 rounded-md text-xs font-bold hover:bg-green-700"
                  >
                    CONFIRM
                  </button>
                </div>
              )}
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="off"
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
                className="absolute inset-y-0 right-3 flex items-center text-gray-400"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-all font-bold shadow-lg disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin mx-auto" size={20} />
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="flex items-center my-6">
            <div className="flex-grow h-px bg-gray-300 dark:bg-slate-700" />
            <span className="px-3 text-sm text-gray-500 font-medium">OR</span>
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
            Already have an account?{" "}
            <Link
              to="/login"
              state={{ from: previousPath }}
              className="text-orange-500 font-bold"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
      <AuthFooter />
    </div>
  );
}
