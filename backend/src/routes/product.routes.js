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
   NOTE: Specialized routes come BEFORE /:id to prevent routing conflicts
========================================= */

// Matches: GET /api/products/seller/all
router.get("/seller/all", protectSeller, getSellerProducts);

// Matches: POST /api/products/add
// Uploads thumbnail + up to 5 gallery images
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

// Matches: GET /api/products (Supports ?keyword=... search)
router.get("/", getAllProducts);

// Matches: GET /api/products/:id
// Keep this at the bottom of the GET routes so "seller/all" isn't treated as an ID
router.get("/:id", getProductById);

/* =========================================
   CUSTOMER ACTIONS
========================================= */

// Matches: POST /api/products/:id/reviews
router.post("/:id/reviews", protect, createProductReview);

export default router;
