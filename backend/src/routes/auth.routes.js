import express from "express";
import {
  registerUser,
  loginUser,
  sendForgotPasswordOTP,
  resetPasswordWithOTP,
  verifyEmail, 
  verifyMobile, 
} from "../controllers/auth.controller.js";
import { googleAuth } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google", googleAuth);
router.post("/forgot-password", sendForgotPasswordOTP);
router.post("/reset-password", resetPasswordWithOTP);
router.put("/verify-email/:token", verifyEmail); 
router.post("/verify-mobile", verifyMobile);    

export default router;
