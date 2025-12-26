import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { showSuccess, showError } from "../../utils/toast";
import SellerFooter from "../../components/Seller/SellerFooter";
import SellerNavbar from "../../components/Seller/SellerNavbar";

// Get API URL from environment variables or fallback to localhost
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [timeLeft, setTimeLeft] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const inputBase = `w-full border px-4 py-2.5 rounded-lg outline-none transition-all duration-200 
    bg-white dark:bg-slate-800 text-slate-900 dark:text-white
    autofill:shadow-[inset_0_0_0px_1000px_#ffffff] dark:autofill:shadow-[inset_0_0_0px_1000px_#1e293b]
    border-gray-300 dark:border-slate-700 focus:ring-2 focus:ring-orange-400`;

  useEffect(() => {
    if (step === 2 && timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    } else if (timeLeft === 0) {
      setCanResend(true);
    }
  }, [step, timeLeft]);

  const validatePassword = (pass) => {
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?#&])[A-Za-z\d@$!%*?#&]{8,}$/;
    return regex.test(pass);
  };

  const sendOtpApi = async () => {
    setLoading(true);
    try {
      // ✅ UPDATED: Points to Seller Route
      const res = await fetch(`${API_URL}/api/sellers/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      showSuccess(data.message || "OTP sent successfully!");

      if (step === 2) {
        setCanResend(false);
        setTimeLeft(30);
      } else {
        setStep(2);
      }
    } catch (err) {
      showError(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleInitialSubmit = (e) => {
    e.preventDefault();
    sendOtpApi();
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      return showError("Passwords do not match");
    }

    if (!validatePassword(password)) {
      return showError(
        "Password must be 8+ chars with uppercase, lowercase, number & symbol."
      );
    }

    setLoading(true);
    try {
      // ✅ UPDATED: Points to Seller Route
      const res = await fetch(`${API_URL}/api/sellers/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, otp, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      showSuccess("Password Reset Successful!");
      setTimeout(() => navigate("/Seller/login"), 2000); // Redirect to Seller Login
    } catch (err) {
      showError(err.message || "Reset failed. Check your OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#030712] flex flex-col transition-colors duration-300 font-sans">
      <SellerNavbar />
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl w-full max-w-md border dark:border-slate-800">
          <h2 className="text-4xl font-black text-center mb-2 text-orange-500 tracking-tight">
            Forgot Password
          </h2>
          <p className="text-center text-gray-500 dark:text-slate-400 mb-8 font-medium">
            {step === 1 ? "Recover your account access" : "Secure your account"}
          </p>

          {step === 1 ? (
            <form onSubmit={handleInitialSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  autoComplete="off"
                  required
                  className={inputBase}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Email Address or Phone"
                />
              </div>
              <button
                disabled={loading}
                className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-all font-bold shadow-lg shadow-orange-500/20 active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={20} /> Processing...
                  </span>
                ) : (
                  "Send Reset Code"
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <input
                type="text"
                required
                autoComplete="off"
                className={inputBase}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="6-Digit OTP"
                maxLength={6}
              />

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className={inputBase}
                  autoComplete="off"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  autoComplete="off"
                  className={inputBase}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm New Password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>

              <button
                disabled={loading}
                className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-all font-bold shadow-lg shadow-orange-500/20 active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={20} /> Updating...
                  </span>
                ) : (
                  "Reset Password"
                )}
              </button>

              <div className="text-center mt-4">
                {canResend ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (canResend) sendOtpApi();
                    }}
                    className="text-sm text-orange-500 hover:text-orange-600 font-bold underline underline-offset-4"
                  >
                    Resend Code
                  </button>
                ) : (
                  <p className="text-sm text-gray-400 dark:text-slate-500 font-medium">
                    Resend code in{" "}
                    <span className="text-orange-500">{timeLeft}s</span>
                  </p>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
