import express from "express";
import {
  addOrderItems,
  getOrderById,
  getMyOrders,
  getSellerOrders,
  updateOrderItemStatus,
  updateOrderStatus,
} from "../controllers/order.controller.js";
import { protect, protectSeller } from "../middlewares/auth.middleware.js";

const router = express.Router();

// --- Customer Routes ---
router.route("/").post(protect, addOrderItems);
router.route("/myorders").get(protect, getMyOrders);

// --- Seller Routes ---
router.route("/seller-orders").get(protectSeller, getSellerOrders);
router.route("/:id/status").put(protectSeller, updateOrderItemStatus);

// --- General Routes ---
// Put this last so it doesn't catch 'myorders' or 'seller-orders' as an ID
router.route("/:id").get(protect, getOrderById);
router.route("/:id/status").put(protectSeller, updateOrderStatus);

export default router;
