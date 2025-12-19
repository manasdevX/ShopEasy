import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { Eye, EyeOff } from "lucide-react";

export default function ForgotPassword() {
  const navigate = useNavigate();

  // Steps: 1 = Email/Phone, 2 = OTP & New Password
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  // We renamed 'email' to 'identifier' to support both Email & Phone
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI Messages
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Visibility State
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Timer State for Resend OTP
  const [timeLeft, setTimeLeft] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // Timer Logic
  useEffect(() => {
    if (step === 2 && timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    } else if (timeLeft === 0) {
      setCanResend(true);
    }
  }, [step, timeLeft]);

  // Helper: Strong Password Validator
  const validatePassword = (pass) => {
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?#&])[A-Za-z\d@$!%*?#&]{8,}$/;
    return regex.test(pass);
  };

  // Action: Send OTP (Used for Step 1 AND Resend)
  const sendOtpApi = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(
        "http://localhost:5000/api/auth/forgot-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // Sending 'identifier' instead of just email
          body: JSON.stringify({ identifier }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setMessage(data.message || "OTP sent successfully!");

      // If we are already on step 2, just reset the timer
      if (step === 2) {
        setCanResend(false);
        setTimeLeft(30);
      } else {
        setStep(2);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handler for Initial Submit
  const handleInitialSubmit = (e) => {
    e.preventDefault();
    sendOtpApi();
  };

  // Handler for Resend Click
  const handleResendClick = () => {
    if (canResend) {
      sendOtpApi();
    }
  };

  // Handler for Final Reset
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password !== confirmPassword) {
      return setError("Passwords do not match");
    }

    if (!validatePassword(password)) {
      return setError(
        "Password must be at least 8 chars long and include 1 uppercase, 1 lowercase, 1 number, and 1 special symbol."
      );
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Sending identifier, otp, and new password
        body: JSON.stringify({ identifier, otp, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setMessage("Password Reset Successful! Redirecting to login...");

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-2xl font-bold text-center mb-6 text-orange-500">
            {step === 1 ? "Forgot Password" : "Reset Password"}
          </h2>

          {error && (
            <div className="bg-red-100 text-red-600 p-3 mb-4 rounded text-sm text-center">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-green-100 text-green-600 p-3 mb-4 rounded text-sm text-center font-medium">
              {message}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleInitialSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Email Address or Phone Number
                </label>
                <input
                  type="text" // Changed to text to accept both email and phone
                  required
                  className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-orange-400"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter email or phone number"
                />
              </div>
              <button
                disabled={loading}
                className="w-full bg-orange-500 text-white py-2 rounded hover:bg-orange-600 disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send OTP"}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">OTP</label>
                <input
                  type="text"
                  required
                  className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-orange-400"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                />
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    className="w-full border px-3 py-2 pr-10 rounded focus:ring-2 focus:ring-orange-400"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Must be 8+ chars with uppercase, lowercase, number & symbol.
                </p>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    className="w-full border px-3 py-2 pr-10 rounded focus:ring-2 focus:ring-orange-400"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              <button
                disabled={loading}
                className="w-full bg-orange-500 text-white py-2 rounded hover:bg-orange-600 disabled:opacity-50"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>

              {/* Resend OTP Timer Logic */}
              <div className="text-center mt-4">
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResendClick}
                    className="text-sm text-orange-500 hover:underline font-medium"
                  >
                    Resend OTP
                  </button>
                ) : (
                  <p className="text-sm text-gray-400">
                    Resend OTP in {timeLeft}s
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
