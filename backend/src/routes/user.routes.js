import express from "express";
import {
  getUserProfile,
  updateUserProfile,
  addAddress,
  deleteAddress,
  updateAddress, 
  setDefaultAddress, 
} from "../controllers/user.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

/* ======================================================
   1. USER PROFILE ROUTES
   Endpoint: /api/user/profile
====================================================== */
router
  .route("/profile")
  .get(protect, getUserProfile) // Fetch profile data
  .put(protect, updateUserProfile); // Update profile data

/* ======================================================
   2. ADDRESS MANAGEMENT ROUTES
   Endpoint: /api/user/address
====================================================== */

// Add a new address
router.route("/address").post(protect, addAddress);

// Update or Delete a specific address by ID
router
  .route("/address/:id")
  .delete(protect, deleteAddress) // Delete address
  .put(protect, updateAddress); // 👈 Update existing address
  
router.route("/address/:id/default").put(protect, setDefaultAddress);

export default router;
