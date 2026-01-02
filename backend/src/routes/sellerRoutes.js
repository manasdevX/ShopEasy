import express from "express";
import {
  registerSeller,
  loginSeller,
  getSellerProfile,
  updateSellerProfile,
  addBankDetails,
  getSellerDashboard,
  forgotPasswordSeller,
  resetPasswordSeller,
  searchSellerData, // ✅ NEW: Imported search controller
} from "../controllers/sellerController.js";
import { protectSeller } from "../middlewares/auth.middleware.js";

const router = express.Router();

// ============================================
//               PUBLIC ROUTES
// ============================================

// ✅ Register a new seller
router.post("/register", registerSeller);

// ✅ Login seller
router.post("/login", loginSeller);

// ✅ Forgot Password (sends OTP)
router.post("/forgot-password", forgotPasswordSeller);

// ✅ Reset Password (verifies OTP and updates password)
router.post("/reset-password", resetPasswordSeller);

// ============================================
//               PRIVATE ROUTES
// ============================================

// ✅ Get Seller Profile Data
router.get("/profile", protectSeller, getSellerProfile);

// ✅ Update Business Profile (Step 2 of Onboarding)
router.put("/profile", protectSeller, updateSellerProfile);

// ✅ Add/Update Bank Details (Step 3 of Onboarding)
router.put("/bank-details", protectSeller, addBankDetails);

// ✅ Get Dashboard Stats (Revenue, Orders, Graphs)
router.get("/dashboard", protectSeller, getSellerDashboard);

// ✅ NEW: Search Products & Orders in Dashboard
router.get("/search", protectSeller, searchSellerData);

router.delete("/profile", protectSeller, deleteSellerAccount);

export default router;
