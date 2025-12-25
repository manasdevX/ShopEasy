import express from "express";
import {
  registerSeller,
  loginSeller,
  getSellerProfile,
  addBankDetails,
  getSellerDashboard,
  forgotPasswordSeller, // <--- Import Forgot Password
  resetPasswordSeller, // <--- Import Reset Password
} from "../controllers/sellerController.js";

// Import the Seller Middleware
import { protectSeller } from "../middlewares/auth.middleware.js";

const router = express.Router();

/* =========================================
   PUBLIC ROUTES (No Token Required)
========================================= */

// Matches: POST /api/sellers/register
router.post("/register", registerSeller);

// Matches: POST /api/sellers/login
router.post("/login", loginSeller);

// Matches: POST /api/sellers/forgot-password
// (Fixes the "Failed to fetch" error on Forgot Password page)
router.post("/forgot-password", forgotPasswordSeller);

// Matches: POST /api/sellers/reset-password
router.post("/reset-password", resetPasswordSeller);

/* =========================================
   PRIVATE ROUTES (Token Required)
   (Seller must be logged in to access these)
========================================= */

// Matches: GET /api/sellers/profile
router.get("/profile", protectSeller, getSellerProfile);

// Matches: POST /api/sellers/bank-details
router.post("/bank-details", protectSeller, addBankDetails);

// Matches: GET /api/sellers/dashboard
router.get("/dashboard", protectSeller, getSellerDashboard);

export default router;
