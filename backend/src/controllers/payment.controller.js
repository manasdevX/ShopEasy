import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";
import Order from "../models/Order.js";

dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * @desc    Create a Razorpay Order
 * @route   POST /api/payment/create-order
 * @access  Private
 */
export const createOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "A valid amount is required",
      });
    }

    const options = {
      amount: Math.round(amount * 100), // Convert RS to Paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    if (!order) {
      return res.status(500).json({
        success: false,
        message: "Failed to create order with Razorpay",
      });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Razorpay Order Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

/**
 * @desc    Verify Razorpay Payment and Save Order to DB
 * @route   POST /api/payment/verify-payment
 * @access  Private
 */
export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderItems,
      shippingAddress,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    } = req.body;

    // 1. Signature Verification
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return res.status(400).json({
        success: false,
        message: "Invalid Payment Signature. Fraud detected.",
      });
    }

    // 2. Database Logic: Save the Order with correct field mapping
    const newOrder = new Order({
      user: req.user._id,
      orderItems: orderItems.map((item) => ({
        name: item.name,
        qty: item.quantity,
        image: item.image,
        price: item.price,
        product: item._id,
        // ✅ CRITICAL FIX: Ensure 'seller' is passed from frontend
        seller: item.seller,
      })),
      shippingAddress: {
        address: shippingAddress.street,
        city: shippingAddress.city,
        postalCode: shippingAddress.pincode,
        country: shippingAddress.country || "India",
      },
      paymentMethod: "Razorpay",
      paymentResult: {
        id: razorpay_payment_id,
        status: "Completed",
        update_time: new Date().toISOString(),
      },
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      isPaid: true,
      paidAt: Date.now(),
      status: "Processing",
    });

    const savedOrder = await newOrder.save();

    res.status(201).json({
      success: true,
      message: "Order placed and payment verified successfully",
      order: savedOrder,
    });
  } catch (error) {
    console.error("Detailed Order Saving Error:", error);
    res.status(500).json({
      success: false,
      message: "Payment verified but failed to save order.",
      error: error.message,
    });
  }
};
