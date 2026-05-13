import express from "express";
import rateLimit from "express-rate-limit";
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

// ── Rate Limiters for Sensitive Endpoints ──
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Max 3 OTP requests
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many OTP requests. Please try again later." },
  skip: (req) => process.env.NODE_ENV !== "production", // Skip in development
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 login attempts
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts. Please try again later." },
  skip: (req) => process.env.NODE_ENV !== "production",
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 2, // Max 2 password reset attempts
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many password reset attempts. Try again later." },
  skip: (req) => process.env.NODE_ENV !== "production",
});

/* ======================================================
   1. OTP & VERIFICATION ROUTES
   Used during the signup/onboarding process.
====================================================== */

// ✅ Send OTP to Email (Supports 'type' body param: 'user' or 'seller')
router.post("/send-email-otp", otpLimiter, sendEmailOtp);

// ✅ Send OTP to Mobile (Supports 'type' body param: 'user' or 'seller')
router.post("/send-mobile-otp", otpLimiter, sendMobileOtp);

// ✅ Check OTP (Generic verification for both email and mobile)
router.post("/check-otp", checkOtp);

/* ======================================================
   2. CORE AUTHENTICATION ROUTES
====================================================== */

// ✅ Final Registration for Verified Users
router.post("/register", loginLimiter, registerVerifiedUser);

// ✅ Standard Email/Phone Login (User Portal)
router.post("/login", loginLimiter, loginUser);

// ✅ Google OAuth (Role-based: handles both Sellers and Users)
router.post("/google", loginLimiter, googleAuth);

// ✅ Logout (Clears Cookies, generic Session, and SellerSession)
router.post("/logout", logoutUser);

/* ======================================================
   3. PASSWORD RECOVERY ROUTES
====================================================== */

// ✅ Request Password Reset OTP
router.post("/forgot-password", passwordResetLimiter, sendForgotPasswordOTP);

// ✅ Reset Password using OTP
router.post("/reset-password", passwordResetLimiter, resetPasswordWithOTP);

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
