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
} from "../controllers/sellerController.js";
import { protectSeller } from "../middlewares/auth.middleware.js";

const router = express.Router();

// --- PUBLIC ROUTES ---

// ✅ FIX 1: Change "/signup" to "/register" to match Frontend
router.post("/register", registerSeller);

router.post("/login", loginSeller);
router.post("/forgot-password", forgotPasswordSeller);
router.post("/reset-password", resetPasswordSeller);

// --- PRIVATE ROUTES ---

router.put("/profile", protectSeller, updateSellerProfile);

// ✅ FIX 2: Ensure this matches Frontend "/bank-details"
router.put("/bank-details", protectSeller, addBankDetails);

router.get("/dashboard", protectSeller, getSellerDashboard);

export default router;
