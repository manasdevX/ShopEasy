import React, { useState } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { Mail, ArrowLeft, Loader2, Lock } from "lucide-react";
import { toast } from "react-hot-toast";
import { showSuccess } from "../utils/toast";

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

  // Redirect if no user is found at all
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleUpdateEmail = async (e) => {
    e.preventDefault();

    if (!newEmail || !currentPassword) {
      toast.error("Please fill in all fields");
      return;
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
        showSuccess("Email updated successfully!");

        // Update local storage so Navbar and other components reflect the change
        const updatedUser = { ...user, email: newEmail };
        localStorage.setItem("user", JSON.stringify(updatedUser));

        // Dispatch event to update Navbar immediately
        window.dispatchEvent(new Event("user-info-updated"));

        navigate("/account");
      } else {
        toast.error(data.message || "Failed to update email");
      }
    } catch (err) {
      console.error(err);
      toast.error("Server connection failed. Please try again.");
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

          {/* FORM */}
          <form onSubmit={handleUpdateEmail} className="p-6 space-y-5">
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">
                Current Email
              </label>
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-500 text-sm font-medium">
                {user?.email}
              </div>
            </div>

            <div>
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">
                New Email Address
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  required
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Enter new email"
                  className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all dark:text-white placeholder:text-slate-500"
                />
              </div>
            </div>

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
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter password to confirm"
                  className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all dark:text-white placeholder:text-slate-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-4 rounded-xl font-bold text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200 dark:shadow-none mt-4 active:scale-95"
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
