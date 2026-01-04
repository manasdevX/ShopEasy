import express from "express";
import {
  sendEmailOtp,
  sendMobileOtp,
  checkOtp,
  registerVerifiedUser,
  loginUser,
  logoutUser,
  googleAuth,
  sendForgotPasswordOTP,
  resetPasswordWithOTP,
  getMe, // ✅ Integrated from controller
} from "../controllers/auth.controller.js";

import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

/* ======================================================
   1. OTP & VERIFICATION ROUTES
   Used during the signup/onboarding process.
====================================================== */

// ✅ Send OTP to Email (Supports 'type' body param: 'user' or 'seller')
router.post("/send-email-otp", sendEmailOtp);

// ✅ Send OTP to Mobile (Supports 'type' body param: 'user' or 'seller')
router.post("/send-mobile-otp", sendMobileOtp);

// ✅ Check OTP (Generic verification for both email and mobile)
router.post("/check-otp", checkOtp);

/* ======================================================
   2. CORE AUTHENTICATION ROUTES
====================================================== */

// ✅ Final Registration for Verified Users
router.post("/register", registerVerifiedUser);

// ✅ Standard Email/Phone Login (User Portal)
router.post("/login", loginUser);

// ✅ Google OAuth (Role-based: handles both Sellers and Users)
router.post("/google", googleAuth);

// ✅ Logout (Clears Cookies, generic Session, and SellerSession)
router.post("/logout", logoutUser);

/* ======================================================
   3. PASSWORD RECOVERY ROUTES
====================================================== */

// ✅ Request Password Reset OTP
router.post("/forgot-password", sendForgotPasswordOTP);

// ✅ Reset Password using OTP
router.post("/reset-password", resetPasswordWithOTP);

/* ======================================================
   4. SESSION & PROFILE ROUTES
====================================================== */

/**
 * ✅ GET /api/auth/me
 * This is the critical endpoint used by App.jsx to verify if the
 * current session (cookie + JWT) is still valid on the server.
 */
router.get("/me", protect, getMe);

export default router;
