import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import SellerNavbar from "../../components/Seller/SellerNavbar";
import SellerFooter from "../../components/Seller/SellerFooter";
import { showError, showSuccess } from "../../utils/toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function BankDetails() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showAcc, setShowAcc] = useState(false);

  // Verification States
  const [confirmAccountNumber, setConfirmAccountNumber] = useState("");
  const [ifscInfo, setIfscInfo] = useState({
    bank: "",
    branch: "",
    loading: false,
    error: false,
  });

  const [bankData, setBankData] = useState({
    accountHolder: "",
    accountNumber: "",
    ifscCode: "",
  });

  // 1. SECURITY CHECK: Ensure Step 1 & 2 are done
  useEffect(() => {
    if (
      !localStorage.getItem("seller_step1") ||
      !localStorage.getItem("seller_step2")
    ) {
      showError("Please complete previous steps first.");
      navigate("/Seller/signup");
    }
  }, [navigate]);

  // IFSC Verification
  useEffect(() => {
    const verifyIFSC = async () => {
      if (bankData.ifscCode.length === 11) {
        setIfscInfo((prev) => ({ ...prev, loading: true, error: false }));
        try {
          const res = await fetch(
            `https://ifsc.razorpay.com/${bankData.ifscCode}`
          );
          if (res.ok) {
            const data = await res.json();
            setIfscInfo({
              bank: data.BANK,
              branch: data.BRANCH,
              loading: false,
              error: false,
            });
            showSuccess(`Verified: ${data.BANK}`);
          } else {
            setIfscInfo({ bank: "", branch: "", loading: false, error: true });
            showError("Invalid IFSC code format.");
          }
        } catch (err) {
          setIfscInfo({ bank: "", branch: "", loading: false, error: true });
          showError("Could not verify IFSC. Please check your connection.");
        }
      } else {
        setIfscInfo({ bank: "", branch: "", loading: false, error: false });
      }
    };
    verifyIFSC();
  }, [bankData.ifscCode]);

  // 🚀 SUBMIT HANDLER
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Frontend Validations
    if (bankData.accountNumber !== confirmAccountNumber) {
      return showError("Account numbers do not match!");
    }
    if (bankData.accountNumber.length < 9) {
      return showError("Enter a valid Account number.");
    }
    if (ifscInfo.error || bankData.ifscCode.length !== 11) {
      return showError("Please provide a valid 11-digit IFSC code.");
    }

    setLoading(true);

    try {
      // 2. RETRIEVE ALL DATA
      const step1 = JSON.parse(localStorage.getItem("seller_step1"));
      const step2 = JSON.parse(localStorage.getItem("seller_step2"));

      if (!step1 || !step2)
        throw new Error("Missing registration data. Please restart.");

      // =========================================================
      // 3. API CALL 1: Create Account
      // Note: Endpoint is plural 'sellers' based on app.js mount point
      // =========================================================
      const signupRes = await fetch(`${API_URL}/api/sellers/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(step1),
      });

      // Defensive check for HTML 404/500 errors
      const contentType = signupRes.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server Error: Endpoint not found or server crash.");
      }

      const signupData = await signupRes.json();
      if (!signupRes.ok)
        throw new Error(signupData.message || "Account creation failed");

      const token = signupData.token;

      // =========================================================
      // 4. API CALL 2: Save Profile (Business Details)
      // =========================================================
      const profileRes = await fetch(`${API_URL}/api/sellers/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(step2),
      });

      if (!profileRes.ok) throw new Error("Failed to save business details");

      // =========================================================
      // 5. API CALL 3: Save Bank Details
      // =========================================================
      const bankPayload = {
        accountHolder: bankData.accountHolder,
        accountNumber: bankData.accountNumber,
        ifscCode: bankData.ifscCode,
        bankName: ifscInfo.bank,
        branchName: ifscInfo.branch,
      };

      const bankRes = await fetch(`${API_URL}/api/sellers/bank-details`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bankPayload),
      });

      if (!bankRes.ok) throw new Error("Failed to save bank details");

      // 6. SUCCESS
      localStorage.removeItem("seller_step1");
      localStorage.removeItem("seller_step2");
      localStorage.setItem("sellerToken", token);
      localStorage.setItem("sellerUser", JSON.stringify(signupData.seller));

      showSuccess("Seller Account Created Successfully!");
      navigate("/Seller/Dashboard");
    } catch (err) {
      console.error(err);
      showError(err.message || "Registration failed. Please check console.");
    } finally {
      setLoading(false);
    }
  };

  const inputBase = `w-full bg-slate-100 dark:bg-[#161f35] border border-transparent dark:border-slate-700/50 rounded-lg py-4 px-5 text-slate-900 dark:text-white placeholder:text-slate-500 outline-none focus:border-orange-500 transition-all font-medium text-base`;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-[#030712] transition-colors duration-300 font-sans">
      <SellerNavbar isLoggedIn={false} />
      <div className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 border dark:border-slate-800">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-orange-500 tracking-tight mb-2">
              ShopEasy
            </h1>
            <p className="text-center text-gray-500 dark:text-slate-400 mb-8 font-medium">
              Final step to start receiving payments
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Account Holder */}
            <div className="space-y-1">
              <input
                type="text"
                required
                placeholder="Account Holder Name"
                className={inputBase}
                onChange={(e) =>
                  setBankData({ ...bankData, accountHolder: e.target.value })
                }
              />
            </div>

            {/* Account Number */}
            <div className="relative">
              <input
                type={showAcc ? "text" : "password"}
                required
                placeholder="Account Number"
                className={`${inputBase} pr-14`}
                onChange={(e) =>
                  setBankData({ ...bankData, accountNumber: e.target.value })
                }
              />
              <button
                type="button"
                onClick={() => setShowAcc(!showAcc)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-orange-500 transition-colors"
              >
                {showAcc ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Confirm Account Number */}
            <div className="relative">
              <input
                type="text"
                required
                onPaste={(e) => {
                  e.preventDefault();
                  showError("Pasting disabled.");
                }}
                placeholder="Confirm Account Number"
                className={`${inputBase} ${
                  confirmAccountNumber &&
                  confirmAccountNumber !== bankData.accountNumber
                    ? "border-red-500"
                    : ""
                }`}
                onChange={(e) => setConfirmAccountNumber(e.target.value)}
              />
              {confirmAccountNumber && (
                <div className="absolute right-5 top-1/2 -translate-y-1/2">
                  {confirmAccountNumber === bankData.accountNumber ? (
                    <CheckCircle2 size={18} className="text-green-500" />
                  ) : (
                    <AlertCircle size={18} className="text-red-500" />
                  )}
                </div>
              )}
            </div>

            {/* IFSC Code */}
            <div className="space-y-2">
              <div className="relative">
                <input
                  type="text"
                  required
                  maxLength={11}
                  placeholder="IFSC Code"
                  className={`${inputBase} uppercase tracking-widest`}
                  onChange={(e) =>
                    setBankData({
                      ...bankData,
                      ifscCode: e.target.value.toUpperCase(),
                    })
                  }
                />
                {ifscInfo.loading && (
                  <Loader2
                    className="absolute right-5 top-1/2 -translate-y-1/2 animate-spin text-orange-500"
                    size={18}
                  />
                )}
              </div>
              {ifscInfo.bank && (
                <div className="mx-1 px-3 py-2 bg-green-500/10 rounded-lg border border-green-500/20">
                  <p className="text-[10px] font-bold text-green-500 uppercase">
                    {ifscInfo.bank}
                  </p>
                  <p className="text-[9px] text-green-600/80 font-medium">
                    Branch: {ifscInfo.branch}
                  </p>
                </div>
              )}
            </div>

            <div className="bg-slate-50 dark:bg-[#161f35]/50 border border-slate-100 dark:border-slate-800 rounded-lg p-4 flex gap-3">
              <ShieldCheck className="text-orange-500 shrink-0" size={18} />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                We'll verify your account with a small ₹1 deposit.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-4 rounded-lg shadow-[0_0_20px_rgba(249,115,22,0.2)] transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} /> Creating
                  Account...
                </>
              ) : (
                <>
                  VERIFY & FINISH <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 flex justify-center">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
              Step 3 of 3: <span className="text-orange-500">Final Step</span>
            </p>
          </div>
        </div>
      </div>
      <SellerFooter />
    </div>
  );
}
