import express from "express";
import {
  createOrder,
  verifyPayment,
} from "../controllers/payment.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * @route   GET /api/payment/ping
 * @desc    Health check for payment module
 * @access  Public
 */
router.get("/ping", (req, res) =>
  res.json({ success: true, message: "Payment routes are active and mounted." })
);

/**
 * @route   POST /api/payment/create-order
 * @desc    Initiate a Razorpay transaction by creating an Order ID
 * @access  Private
 */
router.post("/create-order", protect, createOrder);

/**
 * @route   POST /api/payment/verify-payment
 * @desc    Verify HMAC signature, map address/pricing, and save Order to MongoDB
 * @access  Private
 */
router.post("/verify-payment", protect, verifyPayment);

export default router;
