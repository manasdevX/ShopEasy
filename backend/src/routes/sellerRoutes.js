import express from "express";
import {
  registerSeller,
  loginSeller,
  getSellerProfile,
  updateSellerProfile,
  addBankDetails,
  updatePersonalProfile,
  updateSellerAddress,
  getSellerDashboard,
  forgotPasswordSeller,
  resetPasswordSeller,
  searchSellerData,
  deleteSellerAccount, // ✅ Added for complete account management
} from "../controllers/sellerController.js";
import { protectSeller } from "../middlewares/auth.middleware.js";

const router = express.Router();

/* ============================================
               PUBLIC ROUTES
============================================ */

// ✅ Register a new seller (Initial Step)
router.post("/register", registerSeller);

// ✅ Login seller (Establishes SellerSession)
router.post("/login", loginSeller);

// ✅ Forgot Password (Sends OTP to Email/Phone)
router.post("/forgot-password", forgotPasswordSeller);

// ✅ Reset Password (Verifies OTP and updates password)
router.post("/reset-password", resetPasswordSeller);

/* ============================================
               PRIVATE ROUTES (Protected)
============================================ */

/**
 * All routes below require a valid 'shopeasy.sid' session cookie
 * OR a valid JWT Bearer token verified against the SellerSession collection.
 */

// ✅ Get Full Seller Profile Data (with Redis Caching)
router.get("/profile", protectSeller, getSellerProfile);

// ✅ Update Business Details (Onboarding Step 2: GSTIN, Business Name, etc.)
router.put("/profile", protectSeller, updateSellerProfile);

// ✅ Update Personal Information (Name and Phone number)
router.put("/profile/personal", protectSeller, updatePersonalProfile);

// ✅ Update Store/Business Address
router.put("/profile/address", protectSeller, updateSellerAddress);

// ✅ Add/Update Bank Details (Onboarding Step 3: Bank account, IFSC)
router.put("/bank-details", protectSeller, addBankDetails);

// ✅ Get Dashboard Analytics (Revenue stats, Product counts, Recent orders)
router.get("/dashboard", protectSeller, getSellerDashboard);

// ✅ Search Seller Specific Data (Products and Orders)
router.get("/search", protectSeller, searchSellerData);

// ✅ Delete Seller Account (Clears SellerSession and Seller data)
router.delete("/account", protectSeller, deleteSellerAccount);

export default router;
