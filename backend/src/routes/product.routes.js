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
// We use memoryStorage so we can access file.buffer in the controller
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

/* =========================================
   SELLER ROUTES (Manage Products)
   NOTE: Specialized routes must come BEFORE /:id 
   to prevent "seller/all" being interpreted as an ID
========================================= */

// Matches: GET /api/products/seller/all
router.get("/seller/all", protectSeller, getSellerProducts);

// Matches: POST /api/products/add
// Uploads thumbnail (1) + gallery images (up to 5)
router.post(
  "/add",
  protectSeller,
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "images", maxCount: 5 },
  ]),
  createProduct
);

// Matches: PUT /api/products/:id
// Allows updating images during edit
router.put(
  "/:id",
  protectSeller,
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "images", maxCount: 5 },
  ]),
  updateProduct
);

// Matches: DELETE /api/products/:id
router.delete("/:id", protectSeller, deleteProduct);

/* =========================================
   PUBLIC ROUTES
========================================= */

// Matches: GET /api/products
// Supports: ?keyword=abc & minPrice=100 & rating=4 & category=electronics
router.get("/", getAllProducts);

// Matches: GET /api/products/:id
router.get("/:id", getProductById);

/* =========================================
   CUSTOMER ACTIONS (Reviews)
========================================= */

// Matches: POST /api/products/:id/reviews
// Uses 'protect' (any logged-in user) not 'protectSeller'
router.post("/:id/reviews", protect, createProductReview);

export default router;
