import express from "express";
import {
  registerSeller,
  loginSeller,
  getSellerProfile,
  addBankDetails, // <--- Import the new bank details controller
} from "../controllers/sellerController.js";

// Import the Seller Middleware
// Make sure this path matches your actual file name (auth.middleware.js vs authMiddleware.js)
import { protectSeller } from "../middlewares/auth.middleware.js";

const router = express.Router();

/* =========================================
   PUBLIC ROUTES (No Token Required)
========================================= */

// Matches: POST /api/sellers/register
router.post("/register", registerSeller);

// Matches: POST /api/sellers/login
router.post("/login", loginSeller);

/* =========================================
   PRIVATE ROUTES (Token Required)
   (Seller must be logged in to access these)
========================================= */

// Matches: GET /api/sellers/profile
router.get("/profile", protectSeller, getSellerProfile);

// Matches: POST /api/sellers/bank-details
// This handles the form submission from your Bank Verification page
router.post("/bank-details", protectSeller, addBankDetails);

export default router;
