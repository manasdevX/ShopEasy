import express from "express";

// 1. Import Cloudinary Config (Make sure this path matches where you created the file)
import { upload } from "../config/cloudinary.js";

// 2. Import Auth Controller
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

// 3. Import User Profile Controller
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
  verifyUserPassword,
  getAiRecommendations, 
  trackUserInterestRoute,
  trackSearchIntent
} from "../controllers/user.controller.js";

// 4. Import Middleware
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

  // ✅ FIXED: Added 'upload.single' middleware to handle file uploads
  .put(protect, upload.single("profilePicture"), updateUserProfile)

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
   E. SECURITY ROUTES
====================================================== */
router.post("/verify-password", protect, verifyUserPassword);
router.put("/password", protect, updateUserPassword); // Update Password
router.put("/update-email", protect, updateUserEmail);

router.get("/recommendations", protect, getAiRecommendations);

// 2. Track clicks/views to update user interest weights
router.post("/track-interest", protect, trackUserInterestRoute);

router.post("/track-search-intent", protect, trackSearchIntent);

export default router;
