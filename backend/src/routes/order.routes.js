import express from "express";
import {
  addOrderItems,
  getOrderById,
  getMyOrders,
  getSellerOrders,
  updateOrderStatus,
  cancelOrder,
  requestReturn,
  // ❌ handleReturnRequest is REMOVED (Returns are now auto-approved)
} from "../controllers/order.controller.js";
import { protect, protectSeller } from "../middlewares/auth.middleware.js";

const router = express.Router();

/* =========================================
   CUSTOMER ROUTES
========================================= */

// Matches: POST /api/orders (Create Order)
router.post("/", protect, addOrderItems);

// Matches: GET /api/orders/myorders (Get History)
router.get("/myorders", protect, getMyOrders);

// Matches: PUT /api/orders/:id/cancel
router.put("/:id/cancel", protect, cancelOrder);

// Matches: PUT /api/orders/:id/return
// (Now handles Auto-Approval, Stock Refill & Refund logic)
router.put("/:id/return", protect, requestReturn);

/* =========================================
   SELLER ROUTES
========================================= */

// Matches: GET /api/orders/seller-orders
router.get("/seller-orders", protectSeller, getSellerOrders);

// Matches: PUT /api/orders/:id/status
// (For shipping updates: Processing -> Shipped -> Delivered)
router.put("/:id/status", protectSeller, updateOrderStatus);

/* =========================================
   GENERAL ROUTES
========================================= */

// Matches: GET /api/orders/:id (Get Single Order Details)
router.get("/:id", protect, getOrderById);

export default router;
