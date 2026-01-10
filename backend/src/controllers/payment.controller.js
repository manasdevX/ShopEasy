import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";
import Order from "../models/Order.js";
import sendEmail from "../utils/emailHelper.js";
import redisClient from "../config/redis.js";
import { createNotification } from "./notification.controller.js";

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
      return res
        .status(400)
        .json({ success: false, message: "Missing required order data" });
    }

    // 2. Signature Verification
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Payment Signature" });
    }

    const mappedOrderItems = orderItems.map((item) => ({
      name: item.name,
      qty: Number(item.qty || item.quantity || 1),
      image: item.image,
      category: item.category || "General",
      price: Number(item.price),
      product: item.product || item._id,
      seller: item.seller,
    }));

    // 3. Database Logic: Save the Order
    const newOrder = new Order({
      // Ensure user exists from authMiddleware
      user: req.user?._id,

      orderItems: mappedOrderItems,

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

    (async () => {
      try {
        // 1. Clear Cache
        // Note: Make sure clearOrderCache is imported or defined in this file
        if (typeof clearOrderCache === 'function') {
           clearOrderCache(req.user._id, savedOrder._id);
        }

        // 2. Save Notifications to DB
        const sellersToNotify = [...new Set(mappedOrderItems.map((item) => item.seller.toString()))];
        for (const sellerId of sellersToNotify) {
          await createNotification(
            sellerId,
            "order",
            "New Order Received! 📦",
            `You have a new order #${savedOrder._id.toString().slice(-6).toUpperCase()} valued at ₹${itemsPrice}`,
            savedOrder._id
          ).catch((e) => console.error("DB Notification failed", e));
        }

        // 3. Send Email (Exact format from Order Controller)
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        const orderHistoryLink = `${frontendUrl}/account?tab=orders`;

        const orderItemsHTML = mappedOrderItems
          .map((item) => `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">
                <img src="${item.image}" alt="${item.name}" width="50" style="border-radius: 5px; display: block;">
              </td>
              <td style="padding: 10px; border-bottom: 1px solid #eee; font-size: 14px;">
                ${item.name} <br>
                <span style="font-size: 12px; color: #777;">Qty: ${item.qty}</span>
              </td>
              <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">
                ₹${(item.price * item.qty).toLocaleString()}
              </td>
            </tr>`
          ).join("");

        const emailMessage = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
            <div style="background-color: #2563eb; padding: 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Order Confirmed!</h1>
            </div>
            <div style="padding: 20px;">
              <p>Hi <strong>${req.user.name}</strong>,</p>
              <p>Thank you for shopping with us! We have received your order.</p>
              <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
                <p style="margin: 5px 0;"><strong>Order ID:</strong> <a href="${orderHistoryLink}" style="color: #2563eb; text-decoration: none; font-weight: bold;">${savedOrder._id}</a></p>
                <p style="margin: 5px 0;"><strong>Payment Method:</strong> Razorpay (Online)</p>
                <p style="margin: 5px 0; font-size: 18px; color: #2563eb;"><strong>Total: ₹${totalPrice.toLocaleString()}</strong></p>
              </div>
              <table style="width: 100%; border-collapse: collapse; text-align: left;">
                <thead>
                  <tr>
                    <th colspan="2" style="padding: 10px; border-bottom: 2px solid #eee; font-size: 12px; text-transform: uppercase; color: #666;">Product</th>
                    <th style="padding: 10px; border-bottom: 2px solid #eee; font-size: 12px; text-transform: uppercase; color: #666; text-align: right;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${orderItemsHTML}
                </tbody>
              </table>
              <div style="margin-top: 25px; text-align: center;">
                <a href="${orderHistoryLink}" style="background-color: #2563eb; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Order History</a>
              </div>
            </div>
            <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #9ca3af;">
              If you have any questions, please contact our support team.
            </div>
          </div>`;

        await sendEmail({
          email: req.user.email,
          subject: `Order Confirmation - ${savedOrder._id}`,
          message: emailMessage,
        });
      } catch (backgroundError) {
        console.error("⚠️ Background task error:", backgroundError.message);
      }
    })();
  } catch (error) {
    // Log the actual error to your Render/Server console so you can see it!
    console.error("PAYMENT_VERIFICATION_CRASH:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Order Validation Failed",
        details: error.message, // Tells you exactly which field is missing
      });
    }

    res
      .status(500)
      .json({ success: false, message: "Server error during verification" });
  }
};
