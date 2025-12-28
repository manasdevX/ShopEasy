import express from "express";

// 1. 👇 Import the Auth Controller (This was missing)
// Make sure your auth controller file is named 'auth.controller.js'
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
} from "../controllers/user.controller.js";

// 3. Import Middleware (Keep the path that was working for you!)
// If your folder is 'middleware' (singular), use that.
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

/* ======================================================
   A. AUTH ROUTES (The missing part causing 404)
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
   B. PROFILE & ADDRESS ROUTES (Existing)
====================================================== */
router
  .route("/profile")
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

router.route("/address").post(protect, addAddress);

router
  .route("/address/:id")
  .put(protect, updateAddress)
  .delete(protect, deleteAddress);

router.route("/address/:id/default").put(protect, setDefaultAddress);
router.delete("/profile", protect, deleteUserAccount);

export default router;
