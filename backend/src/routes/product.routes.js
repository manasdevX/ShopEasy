import express from "express";
import multer from "multer";
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
  getSellerProducts,
} from "../controllers/product.controller.js";

import { protect, protectSeller } from "../middlewares/auth.middleware.js";

const router = express.Router();

// --- Multer Configuration (Memory Storage for Cloudinary) ---
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

/* =========================================
   SELLER ROUTES (Manage Products)
   ⚠️ IMPORTANT: Specialized routes must come BEFORE /:id 
   so "seller/all" isn't treated as an product ID
========================================= */

// 1. Get all products for the logged-in seller
router.get("/seller/all", protectSeller, getSellerProducts);

// 2. Add a new product (Thumb + Images)
router.post(
  "/add",
  protectSeller,
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "images", maxCount: 5 },
  ]),
  createProduct
);

// 3. Update an existing product
router.put(
  "/:id",
  protectSeller,
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "images", maxCount: 5 },
  ]),
  updateProduct
);

// 4. Delete a product
router.delete("/:id", protectSeller, deleteProduct);

/* =========================================
   PUBLIC ROUTES (Browsing)
========================================= */

// 1. Get All Products (Home Page & Search)
// Supports query params: ?keyword=...&category=...
router.get("/", getAllProducts);

// 2. Get Single Product Details
router.get("/:id", getProductById);

/* =========================================
   CUSTOMER ACTIONS
========================================= */

// 1. Add/Update Review
router.post("/:id/reviews", protect, createProductReview);

export default router;
