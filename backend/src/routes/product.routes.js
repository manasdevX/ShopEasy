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

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

/* =========================================
   SELLER ROUTES (Manage Products)
   NOTE: Defined FIRST to prevent conflict with /:id
========================================= */

// GET /api/products/seller/all
router.get("/seller/all", protectSeller, getSellerProducts);

// POST /api/products/add
router.post(
  "/add",
  protectSeller,
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "images", maxCount: 5 },
  ]),
  createProduct
);

/* =========================================
   PUBLIC ROUTES
========================================= */

// GET /api/products
router.get("/", getAllProducts);

// GET /api/products/:id (STAY AT BOTTOM)
router.get("/:id", getProductById);

/* =========================================
   PROTECTED ACTIONS
========================================= */

router.put("/:id", protectSeller, updateProduct);
router.delete("/:id", protectSeller, deleteProduct);
router.post("/:id/reviews", protect, createProductReview);

export default router;
