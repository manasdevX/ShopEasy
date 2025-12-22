import express from "express";
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview, // Optional: If you have a review system
} from "../controllers/product.controller.js";

// 👇 Import the auth middleware
import {
  protect,
  protectSeller,
  admin,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

// --- 1. General Routes ---
router
  .route("/")
  .get(getAllProducts) // Public: Anyone can see products
  .post(protectSeller, createProduct); // 🔒 Seller Only: Add new product

// --- 2. Specific Product Routes (ID) ---
router
  .route("/:id")
  .get(getProductById) // Public: View single product details
  .put(protectSeller, updateProduct) // 🔒 Seller Only: Update their product
  .delete(protectSeller, deleteProduct); // 🔒 Seller Only: Remove their product

// --- 3. Review Route (Optional) ---
// Only logged-in customers (Users) can review, not necessarily sellers
router.route("/:id/reviews").post(protect, createProductReview);

export default router;
