import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import AuthFooter from "../components/AuthFooter";
import {
  Lock,
  ShieldCheck,
  Eye,
  EyeOff,
  Loader2,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import { showError, showSuccess } from "../utils/toast";

const API_URL = import.meta.env.VITE_API_URL;

export default function UpdatePassword() {
  const navigate = useNavigate();

  // States
  const [step, setStep] = useState(1); // 1: Old Pass, 2: New Pass
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Handle Input Changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Step 1: Frontend logic for Old Password Verification
  const handleVerifyStep = async (e) => {
    e.preventDefault();
    if (!formData.oldPassword)
      return showError("Please enter current password");

    setLoading(true);
    try {
      // Logic: Call your verify route
      const res = await fetch(`${API_URL}/api/users/verify-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ password: formData.oldPassword }),
      });

      if (res.ok) {
        setStep(2);
        showSuccess("Identity Verified");
      } else {
        showError("Incorrect current password");
      }
    } catch (error) {
      showError("Connection error");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Frontend logic for Password Update
  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      return showError("Passwords do not match");
    }
    if (formData.newPassword.length < 8) {
      return showError("Password must be at least 8 characters");
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/users/update-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          oldPassword: formData.oldPassword,
          newPassword: formData.newPassword,
        }),
      });

      if (res.ok) {
        showSuccess("Password Updated Successfully!");
        // Standard security practice: Redirect to login after password change
        setTimeout(() => navigate("/login"), 2000);
      } else {
        showError("Update failed. Please try again.");
      }
    } catch (error) {
      showError("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <Navbar />

      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden">
          {/* Progress Header */}
          <div className="bg-slate-900 dark:bg-slate-800 p-8 text-white">
            <div className="flex justify-between items-center mb-4">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${
                  step === 1 ? "bg-blue-500" : "bg-green-500"
                }`}
              >
                {step === 1 ? "1" : <CheckCircle2 size={16} />}
              </div>
              <div className="flex-grow h-[2px] mx-4 bg-slate-700">
                <div
                  className={`h-full bg-blue-500 transition-all duration-500 ${
                    step === 2 ? "w-full" : "w-0"
                  }`}
                ></div>
              </div>
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${
                  step === 2 ? "bg-blue-500" : "bg-slate-700 text-slate-400"
                }`}
              >
                2
              </div>
            </div>
            <h2 className="text-2xl font-black tracking-tight">
              Update Security
            </h2>
            <p className="text-slate-400 text-xs mt-1 uppercase tracking-widest font-bold">
              {step === 1 ? "Verify Old Password" : "Set New Password"}
            </p>
          </div>

          <div className="p-8">
            <form
              onSubmit={step === 1 ? handleVerifyStep : handleUpdatePassword}
              className="space-y-5"
            >
              {step === 1 ? (
                /* STEP 1 FIELDS */
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="relative">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                      Current Password
                    </label>
                    <div className="relative mt-1">
                      <Lock
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        size={18}
                      />
                      <input
                        type={showPass ? "text" : "password"}
                        name="oldPassword"
                        value={formData.oldPassword}
                        onChange={handleChange}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 rounded-2xl py-4 pl-12 pr-12 text-sm outline-none transition-all"
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* STEP 2 FIELDS */
                <div className="space-y-5 animate-in fade-in slide-in-from-left-4 duration-300">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      placeholder="Minimum 8 characters"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      placeholder="Repeat new password"
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleVerifyStep}
                disabled={loading || !formData.oldPassword}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-bold text-sm hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    Verify Identity
                    <ChevronRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      <AuthFooter />
    </div>
  );
}
