import express from "express";
import {
  addOrderItems,
  getOrderById,
  getMyOrders,
  getSellerOrders,
  updateOrderStatus,
  cancelOrder,
  requestReturn,
  handleReturnRequest, // 👈 1. Import this function
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
router.put("/:id/return", protect, requestReturn);

/* =========================================
   SELLER ROUTES
   Note: Specialized routes MUST come before /:id to prevent CastErrors
========================================= */

// Matches: GET /api/orders/seller-orders
router.get("/seller-orders", protectSeller, getSellerOrders);

// ✅ 2. NEW ROUTE: Handle Returns (Approve/Reject)
// Matches: PUT /api/orders/handle-return
router.put("/handle-return", protectSeller, handleReturnRequest);

// Matches: PUT /api/orders/:id/status
router.put("/:id/status", protectSeller, updateOrderStatus);

/* =========================================
   GENERAL ROUTES
========================================= */

// Matches: GET /api/orders/:id (Get Single Order Details)
router.get("/:id", protect, getOrderById);

export default router;
