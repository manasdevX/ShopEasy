import React, { useState } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import {
  Mail,
  ArrowLeft,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { showError, showSuccess } from "../utils/toast";

// COMPONENTS IMPORT
import Navbar from "../components/Navbar";
import AuthFooter from "../components/AuthFooter";

export default function UpdateEmail() {
  const navigate = useNavigate();
  const { state } = useLocation();

  // Fallback to localStorage so the page doesn't break on refresh
  const user = state?.user || JSON.parse(localStorage.getItem("user"));

  const [loading, setLoading] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // --- NEW OTP STATES ---
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [timer, setTimer] = useState(0);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Timer Effect
  React.useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Send OTP Function
  const sendOtp = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) return showError("Invalid email address");
    if (newEmail === user.email)
      return showError("New email cannot be the same as current");

    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/send-email-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: newEmail }),
        }
      );
      if (res.ok) {
        setIsOtpSent(true);
        setTimer(30);
        showSuccess("OTP sent to your new email!");
      } else {
        const data = await res.json();
        showError(data.message || "Failed to send OTP");
      }
    } catch (err) {
      showError("Connection error");
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP Function
  const verifyOtp = async () => {
    if (otp.length < 4) return showError("Enter a valid OTP");
    setVerifyingOtp(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/check-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: newEmail, otp }),
        }
      );
      if (res.ok) {
        setIsVerified(true);
        showSuccess("Email verified successfully!");
      } else {
        showError("Invalid OTP");
      }
    } catch (err) {
      showError("Verification failed");
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Redirect if no user is found at all
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handlePreventPaste = (e) => {
    e.preventDefault();
    showError("Pasting is disabled for security.");
  };
  const handlePreventCopy = (e) => {
    e.preventDefault();
    showError("Copying is disabled for security.");
  };

  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) return showError("Invalid email address");

    if (!newEmail || !currentPassword) {
      showError("Please fill in all fields");
      return;
    }

    if(!isVerified) {
      return showError("Verify your new email first.");
    }

    setLoading(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/user/update-email`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          // ✅ FIX: Map 'currentPassword' to 'password' to match Backend Controller
          body: JSON.stringify({
            newEmail,
            password: currentPassword,
          }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        // Update local storage so Navbar and other components reflect the change
        const updatedUser = { ...user, email: newEmail };
        localStorage.setItem("user", JSON.stringify(updatedUser));

        // Dispatch event to update Navbar immediately
        window.dispatchEvent(new Event("user-info-updated"));

        showSuccess("Email updated successfully!");
        navigate("/account");
      } else {
        showError(data.message || "Failed to update email");
      }
    } catch (err) {
      console.error(err);
      showError("Server connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#030712]">
      {/* RENDER NAVBAR */}
      <Navbar />

      {/* MAIN CONTENT AREA */}
      <main className="flex-grow flex items-center justify-center p-6 py-12">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {/* HEADER */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <ArrowLeft
                size={20}
                className="text-slate-600 dark:text-slate-400"
              />
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Change Email
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Update your primary login email
              </p>
            </div>
          </div>

          <form onSubmit={handleUpdateEmail} className="p-6 space-y-5">
            {/* CURRENT EMAIL (READ ONLY) */}
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">
                Current Email
              </label>
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-500 text-sm font-medium">
                {user?.email}
              </div>
            </div>

            {/* NEW EMAIL INPUT WITH VERIFY BUTTON */}
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">
                New Email Address
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-4 text-slate-400" size={18} />
                <input
                  required
                  type="email"
                  value={newEmail}
                  disabled={isVerified}
                  onChange={(e) => {
                    setNewEmail(e.target.value);
                    setIsOtpSent(false); // Reset if email changes
                  }}
                  placeholder="Enter new email"
                  className={`w-full pl-12 pr-24 py-3 bg-white dark:bg-slate-900 border ${
                    isVerified
                      ? "border-green-500"
                      : "border-slate-200 dark:border-slate-800"
                  } rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all dark:text-white`}
                />
                <button
                  type="button"
                  disabled={isVerified || timer > 0 || loading || !newEmail}
                  onClick={sendOtp}
                  className="absolute right-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg hover:bg-blue-200 disabled:opacity-50"
                >
                  {isVerified ? (
                    <CheckCircle className="text-green-500" size={20} />
                  ) : timer > 0 ? (
                    `${timer}s`
                  ) : isOtpSent ? (
                    "Resend"
                  ) : (
                    "Verify"
                  )}
                </button>
              </div>
            </div>

            {/* OTP INPUT (Visible only after sending) */}
            {isOtpSent && !isVerified && (
              <div className="flex gap-2 animate-in slide-in-from-top-2 duration-300">
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  maxLength={6}
                  onChange={(e) => setOtp(e.target.value)}
                  className="flex-grow px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-sm dark:text-white"
                />
                <button
                  type="button"
                  onClick={verifyOtp}
                  disabled={verifyingOtp}
                  className="px-6 bg-green-600 text-white font-bold rounded-xl text-xs uppercase hover:bg-green-700 transition-colors"
                >
                  {verifyingOtp ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    "Confirm"
                  )}
                </button>
              </div>
            )}

            {/* PASSWORD CONFIRMATION */}
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">
                Confirm Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  required
                  // Logic: If showPassword is true, type is "text", else "password"
                  type={showPassword ? "text" : "password"}
                  value={currentPassword}
                  onPaste={handlePreventPaste}
                  onCopy={handlePreventCopy}
                  onContextMenu={(e) => e.preventDefault()}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter password to confirm"
                  className="w-full pl-12 pr-12 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all dark:text-white placeholder:text-slate-500"
                />
                {/* Visibility Toggle Button */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  placeholder="Enter password to confirm"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white py-4 rounded-xl font-bold text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                "Update Email"
              )}
            </button>
          </form>
        </div>
      </main>

      {/* RENDER FOOTER */}
      <AuthFooter />
    </div>
  );
}
