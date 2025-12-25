import express from "express";
import multer from "multer";
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
} from "../controllers/product.controller.js";

// Import Auth Middlewares
import { protect, protectSeller } from "../middlewares/auth.middleware.js";

const router = express.Router();

// --- Multer Configuration (Memory Storage) ---
// We store files in memory temporarily so the Controller can stream them to Cloudinary
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

/* =========================================
   PUBLIC ROUTES (View Products)
========================================= */

// Matches: GET /api/products
router.get("/", getAllProducts);

// Matches: GET /api/products/:id
router.get("/:id", getProductById);

/* =========================================
   SELLER ROUTES (Manage Products)
========================================= */

// Matches: POST /api/products/add
// Middleware Order:
// 1. protectSeller: Ensures user is logged in as a Seller
// 2. upload.fields: Processes the 'thumbnail' and 'images' files from FormData
// 3. createProduct: Your controller that uploads to Cloudinary and saves to DB
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
router.put("/:id", protectSeller, updateProduct);

// Matches: DELETE /api/products/:id
router.delete("/:id", protectSeller, deleteProduct);

/* =========================================
   CUSTOMER ROUTES (Reviews)
========================================= */

// Matches: POST /api/products/:id/reviews
// Only logged-in users (customers) can leave reviews
router.post("/:id/reviews", protect, createProductReview);

export default router;
