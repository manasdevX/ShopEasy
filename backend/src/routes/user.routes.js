import express from "express";
import {
  getUserProfile,
  updateUserProfile,
} from "../controllers/user.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

/* ======================================================
   USER PROFILE ROUTES
   Endpoint: /api/user/profile
====================================================== */
router
  .route("/profile")
  .get(protect, getUserProfile) // Fetch profile data
  .put(protect, updateUserProfile); // Update profile data

export default router;
