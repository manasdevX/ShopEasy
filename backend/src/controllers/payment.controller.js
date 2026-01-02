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

    // 1. Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "A valid amount is required",
      });
    }

    // 2. Options for Razorpay
    const options = {
      amount: Math.round(amount * 100), // Razorpay accepts smallest currency unit (paise)
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    // 3. Create Order via Razorpay API
    const order = await razorpay.orders.create(options);

    if (!order) {
      return res.status(500).json({
        success: false,
        message: "Failed to create order with Razorpay",
      });
    }

    // 4. Send the order object directly to frontend
    res.status(200).json(order);

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
    // Create the expected signature using the order_id and payment_id returned by Razorpay
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

    // 2. Database Logic: Save the Order
    // Since payment is verified, we now commit the order to the database
    const newOrder = new Order({
      user: req.user._id, // Assumes authMiddleware populates req.user

      // Safe mapping for Order Items to handle different frontend structures
      orderItems: orderItems.map((item) => ({
        name: item.name,
        qty: item.qty || item.quantity, // Handles both 'qty' and 'quantity' keys
        image: item.image,
        price: item.price,
        product: item.product || item._id, // Handles both 'product' (id ref) and '_id' (object)
        seller: item.seller,
      })),

      shippingAddress: {
        address: shippingAddress.address || shippingAddress.street,
        city: shippingAddress.city,
        postalCode: shippingAddress.postalCode || shippingAddress.pincode,
        country: shippingAddress.country || "India",
        phone: shippingAddress.phone,
      },

      paymentMethod: "Razorpay",
      paymentResult: {
        id: razorpay_payment_id,
        status: "Completed",
        update_time: new Date().toISOString(),
        email_address: req.user.email,
      },

      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      
      // Explicitly mark as paid
      isPaid: true,
      paidAt: Date.now(),
      status: "Processing", // Default status for paid orders
    });

    const savedOrder = await newOrder.save();

    // 3. Return Success with the Saved Order
    // Frontend uses 'savedOrder._id' to redirect to Order Summary
    res.status(201).json({
      success: true,
      message: "Order placed and payment verified successfully",
      order: savedOrder,
    });

  } catch (error) {
    console.error("Detailed Order Saving Error:", error);
    
    // Check for Mongoose validation errors
    if (error.name === "ValidationError") {
       return res.status(400).json({
         success: false,
         message: "Order Validation Failed",
         error: error.message
       });
    }

    res.status(500).json({
      success: false,
      message: "Payment verified but failed to save order.",
      error: error.message,
    });
  }
};
