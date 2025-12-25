import express from "express";
import {
  addOrderItems,
  getOrderById,
  getMyOrders,
  getSellerOrders,
  updateOrderStatus,
} from "../controllers/order.controller.js";
import { protect, protectSeller } from "../middlewares/auth.middleware.js";

const router = express.Router();

/* =========================================
   CUSTOMER ROUTES
========================================= */

// Matches: POST /api/orders
router.post("/", protect, addOrderItems);

// Matches: GET /api/orders/myorders
router.get("/myorders", protect, getMyOrders);

/* =========================================
   SELLER ROUTES
   Note: Specialized routes MUST come before /:id
========================================= */

// Matches: GET /api/orders/seller-orders
router.get("/seller-orders", protectSeller, getSellerOrders);

// Matches: PUT /api/orders/:id/status
// We use updateOrderStatus which handles the multi-vendor logic
router.put("/:id/status", protectSeller, updateOrderStatus);

/* =========================================
   GENERAL ROUTES
========================================= */

// Matches: GET /api/orders/:id
// Keep this at the bottom to avoid catching 'myorders' or 'seller-orders'
router.get("/:id", protect, getOrderById);

export default router;
