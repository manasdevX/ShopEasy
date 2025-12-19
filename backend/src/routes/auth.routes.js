import express from "express";
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

const router = express.Router();

// --- INLINE VERIFICATION ROUTES ---
router.post("/send-email-otp", sendEmailOtp);
router.post("/send-mobile-otp", sendMobileOtp);
router.post("/check-otp", checkOtp); // Helper to verify OTP matches before signup

// --- FINAL REGISTRATION ---
router.post("/register", registerVerifiedUser);

// --- AUTH ROUTES ---
router.post("/login", loginUser);
router.post("/google", googleAuth);
router.post("/forgot-password", sendForgotPasswordOTP);
router.post("/reset-password", resetPasswordWithOTP);

export default router;
