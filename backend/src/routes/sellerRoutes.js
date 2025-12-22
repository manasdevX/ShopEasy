import express from "express";
import {
  registerSeller,
  loginSeller,
  getSellerProfile,
} from "../controllers/sellerController.js"; // 👈 Ensure this matches your file name (e.g. seller.controller.js or sellerController.js)

import { protectSeller } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public Routes (No Token Required)
router.post("/register", registerSeller);
router.post("/login", loginSeller);

// Private Routes (Token Required)
// This route is useful to verify if the 'protectSeller' middleware is working
router.get("/profile", protectSeller, getSellerProfile);

export default router;
