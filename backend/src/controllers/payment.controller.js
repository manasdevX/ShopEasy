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

    // 1. Validate incoming data exists before processing
    if (!razorpay_signature || !orderItems || !shippingAddress) {
       return res.status(400).json({ success: false, message: "Missing required order data" });
    }

    // 2. Signature Verification
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid Payment Signature" });
    }

    // 3. Database Logic: Save the Order
    const newOrder = new Order({
      // Ensure user exists from authMiddleware
      user: req.user?._id, 

      orderItems: orderItems.map((item) => ({
        name: item.name,
        qty: Number(item.qty || item.quantity || 1),
        image: item.image,
        category: item.category || "Uncategorized", // Required field in Schema
        price: Number(item.price),
        product: item.product || item._id,
        seller: item.seller, // Required field in Schema
      })),

      shippingAddress: {
        address: shippingAddress.address || shippingAddress.street,
        city: shippingAddress.city,
        postalCode: shippingAddress.postalCode || shippingAddress.pincode, // Required
        country: shippingAddress.country || "India",
        phone: shippingAddress.phone,
      },

      paymentMethod: "Razorpay",
      paymentResult: {
        id: razorpay_payment_id,
        status: "Completed",
        update_time: new Date().toISOString(),
        email_address: req.user?.email || "customer@shopeasy.com",
      },

      itemsPrice: Number(itemsPrice),
      taxPrice: Number(taxPrice),
      shippingPrice: Number(shippingPrice),
      totalPrice: Number(totalPrice),
      
      isPaid: true,
      paidAt: Date.now(),
      status: "Processing",
    });

    const savedOrder = await newOrder.save();

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order: savedOrder,
    });

  } catch (error) {
    // Log the actual error to your Render/Server console so you can see it!
    console.error("PAYMENT_VERIFICATION_CRASH:", error);
    
    if (error.name === "ValidationError") {
       return res.status(400).json({
         success: false,
         message: "Order Validation Failed",
         details: error.message // Tells you exactly which field is missing
       });
    }

    res.status(500).json({ success: false, message: "Server error during verification" });
  }
};
