import express from "express";

// 1. Import Auth Controller
import {
  sendEmailOtp,
  sendMobileOtp,
  checkOtp,
  registerVerifiedUser,
  loginUser,
  googleAuth,
  sendForgotPasswordOTP,
  resetPasswordWithOTP,
} from "../controllers/auth.controller.js";

// 2. Import User Profile Controller
import {
  getUserProfile,
  updateUserProfile,
  addAddress,
  deleteAddress,
  updateAddress,
  setDefaultAddress,
  deleteUserAccount,
  addToWishlist,
  removeFromWishlist,
  updateUserEmail,
  updateUserPassword,
  verifyUserPassword, // ✅ NEW: Import password controller
} from "../controllers/user.controller.js";

// 3. Import Middleware
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

/* ======================================================
   A. AUTH ROUTES
====================================================== */
router.post("/register", registerVerifiedUser);
router.post("/login", loginUser);
router.post("/google", googleAuth);

// OTP & Password Reset
router.post("/send-email-otp", sendEmailOtp);
router.post("/send-mobile-otp", sendMobileOtp);
router.post("/check-otp", checkOtp);
router.post("/forgot-password", sendForgotPasswordOTP);
router.post("/reset-password", resetPasswordWithOTP);

/* ======================================================
   B. PROFILE & ACCOUNT ROUTES
====================================================== */
router
  .route("/profile")
  .get(protect, getUserProfile) // Fetch Profile + Wishlist + Addresses
  .put(protect, updateUserProfile) // Update Info + Primary Address
  .delete(protect, deleteUserAccount); // Delete Account

/* ======================================================
   C. ADDRESS MANAGEMENT ROUTES
====================================================== */
router.route("/address").post(protect, addAddress);

router
  .route("/address/:id")
  .put(protect, updateAddress)
  .delete(protect, deleteAddress);

router.route("/address/:id/default").put(protect, setDefaultAddress);

/* ======================================================
   D. WISHLIST ROUTES
====================================================== */
router
  .route("/wishlist/:id")
  .post(protect, addToWishlist) // Add item
  .delete(protect, removeFromWishlist); // Remove item

/* ======================================================
   E. SECURITY ROUTES (New)
====================================================== */
router.post("/verify-password", protect, verifyUserPassword);
router.put("/password", protect, updateUserPassword); // Update Password
router.put("/update-email", protect, updateUserEmail);

export default router;
