import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import {
  Lock,
  Eye,
  EyeOff,
  Check,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { showError, showSuccess } from "../utils/toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function UpdatePassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  // 1. Track visibility for multiple fields
  const [showPass, setShowPass] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const isValidPassword = (pass) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
      pass
    );

  // --- STEP 1: VERIFY OLD PASSWORD ---
  const handleVerify = async (e) => {
    e.preventDefault();
    if (!formData.currentPassword) {
      showError("Please enter your current password");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      // Call the verify endpoint we just fixed
      const res = await fetch(`${API_URL}/api/user/verify-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: formData.currentPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        showSuccess("Identity Verified");
        setStep(2); // Move to Next Step
      } else {
        showError(data.message || "Incorrect password");
      }
    } catch (error) {
      showError("Server connection failed");
    } finally {
      setLoading(false);
    }
  };

  // --- STEP 2: UPDATE NEW PASSWORD ---
  const handleUpdate = async (e) => {
    e.preventDefault();

    // USING YOUR PROVIDED CHECK
    if (!isValidPassword(formData.newPassword)) {
      showError(
        "Password must be 8+ characters with uppercase, lowercase, number, and special char."
      );
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      showError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      // 2. Call Update Endpoint
      // Note: We send currentPassword again because the backend requires it for the final double-check
      const res = await fetch(`${API_URL}/api/user/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        showSuccess("Password Updated Successfully!");
        // 3. ✅ REDIRECT TO PROFILE
        navigate("/account");
      } else {
        showError(data.message || "Failed to update password");
      }
    } catch (error) {
      showError("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-white font-sans selection:bg-orange-500/30">
      <Navbar />

      <main className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4">
        <div className="w-full max-w-md">
          {/* Stepper Header */}
          <div className="flex items-center justify-between mb-8 px-4">
            <div
              className={`flex items-center gap-2 ${
                step >= 1 ? "text-orange-500" : "text-slate-700"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                  step >= 1
                    ? "border-orange-500 bg-orange-500/10"
                    : "border-slate-800 bg-slate-900"
                }`}
              >
                {step > 1 ? <Check size={14} /> : "1"}
              </div>
            </div>
            <div
              className={`h-0.5 flex-1 mx-4 transition-colors duration-500 ${
                step > 1 ? "bg-orange-500" : "bg-slate-800"
              }`}
            />
            <div
              className={`flex items-center gap-2 ${
                step >= 2 ? "text-orange-500" : "text-slate-700"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                  step >= 2
                    ? "border-orange-500 bg-orange-500/10"
                    : "border-slate-800 bg-slate-900"
                }`}
              >
                2
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl backdrop-blur-sm shadow-xl">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-black tracking-tight mb-2">
                {step === 1 ? "Update Security" : "Set New Password"}
              </h1>
              <p className="text-slate-400 text-sm">
                {step === 1
                  ? "Verify your current password to continue"
                  : "Create a strong password for your account"}
              </p>
            </div>

            <form
              onSubmit={step === 1 ? handleVerify : handleUpdate}
              className="space-y-6"
            >
              {step === 1 ? (
                /* STEP 1: Current Password */
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                      Current Password
                    </label>
                    <div className="relative group">
                      <Lock
                        className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-orange-500 transition-colors"
                        size={18}
                      />
                      <input
                        type={showPass.current ? "text" : "password"} // Logic fixed here
                        className="w-full bg-black/40 border border-slate-800 rounded-xl py-3.5 pl-12 pr-12 text-sm font-medium outline-none focus:border-orange-500 transition-all"
                        placeholder="••••••••"
                        value={formData.currentPassword}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            currentPassword: e.target.value,
                          })
                        }
                        // Prevent Pasting
                        onPaste={(e) => {
                          e.preventDefault();
                          showError(
                            "Pasting is disabled for security reasons."
                          );
                        }}
                        // Optional: Prevent Copying from the field as well
                        onCopy={(e) => {
                          e.preventDefault();
                          showError("Copying is disabled for this field.");
                        }}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPass({
                            ...showPass,
                            current: !showPass.current,
                          })
                        } // Logic fixed here
                        className="absolute right-4 top-3.5 text-slate-500 hover:text-white transition-colors"
                      >
                        {showPass.current ? (
                          <Eye size={18} />
                        ) : (
                          <EyeOff size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* STEP 2: New & Confirm Passwords */
                <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-300">
                  {/* New Password Field */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPass.new ? "text" : "password"} // Logic fixed here
                        className="w-full bg-black/40 border border-slate-800 rounded-xl py-3.5 px-4 pr-12 text-sm font-medium outline-none focus:border-orange-500 transition-all"
                        placeholder="••••••••"
                        value={formData.newPassword}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            newPassword: e.target.value,
                          })
                        }
                        // Prevent Pasting
                        onPaste={(e) => {
                          e.preventDefault();
                          showError(
                            "Pasting is disabled for security reasons."
                          );
                        }}
                        // Optional: Prevent Copying from the field as well
                        onCopy={(e) => {
                          e.preventDefault();
                          showError("Copying is disabled for this field.");
                        }}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPass({ ...showPass, new: !showPass.new })
                        } // Logic fixed here
                        className="absolute right-4 top-3.5 text-slate-500 hover:text-white"
                      >
                        {showPass.new ? (
                          <Eye size={18} />
                        ) : (
                          <EyeOff size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password Field */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPass.confirm ? "text" : "password"} // Logic fixed here
                        className="w-full bg-black/40 border border-slate-800 rounded-xl py-3.5 px-4 pr-12 text-sm font-medium outline-none focus:border-orange-500 transition-all"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            confirmPassword: e.target.value,
                          })
                        }
                        // Prevent Pasting
                        onPaste={(e) => {
                          e.preventDefault();
                          showError(
                            "Pasting is disabled for security reasons."
                          );
                        }}
                        // Optional: Prevent Copying from the field as well
                        onCopy={(e) => {
                          e.preventDefault();
                          showError("Copying is disabled for this field.");
                        }}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPass({
                            ...showPass,
                            confirm: !showPass.confirm,
                          })
                        } // Logic fixed here
                        className="absolute right-4 top-3.5 text-slate-500 hover:text-white"
                      >
                        {showPass.confirm ? (
                          <Eye size={18} />
                        ) : (
                          <EyeOff size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : step === 1 ? (
                  "Verify Identity"
                ) : (
                  "Update Password"
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-slate-500 text-xs mt-8">
            © 2025 ShopEasy. All rights reserved.
          </p>
        </div>
      </main>
    </div>
  );
}
