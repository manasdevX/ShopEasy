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
} from "../controllers/auth.controller.js"; // Ensure filename matches your project

// 2. Import User Profile Controller
import {
  getUserProfile,
  updateUserProfile,
  addAddress,
  deleteAddress,
  updateAddress,
  setDefaultAddress,
  deleteUserAccount,
  addToWishlist, // ✅ NEW
  removeFromWishlist, // ✅ NEW
} from "../controllers/user.controller.js"; // Ensure filename matches your project

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
   D. WISHLIST ROUTES (New)
====================================================== */
router
  .route("/wishlist/:id")
  .post(protect, addToWishlist) // Add item
  .delete(protect, removeFromWishlist); // Remove item

export default router;
