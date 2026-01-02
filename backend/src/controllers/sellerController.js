import Seller from "../models/seller.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import sendEmail from "../utils/emailHelper.js";
import twilio from "twilio";
import redisClient from "../config/redis.js"; // <--- IMPORT REDIS

// --- Helper: Generate JWT ---
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

/**
 * Helper: Clear Seller Cache
 * Clears the specific seller profile cache.
 */
const clearSellerCache = async (sellerId) => {
  try {
    await redisClient.del(`seller_profile:${sellerId}`);
    console.log(`🧹 Cache Cleared for Seller: ${sellerId}`);
  } catch (error) {
    console.error("Cache Clear Error:", error);
  }
};

/* =========================================
   AUTH CONTROLLERS
========================================= */

// @desc    Register new seller (Step 1)
// @route   POST /api/sellers/register
// @access  Public
export const registerSeller = async (req, res) => {
  try {
    const { name, email, password, phone, googleId } = req.body;

    // Basic validation for Step 1
    if (!name || !email || !password || !phone) {
      return res
        .status(400)
        .json({ message: "Please fill all required fields" });
    }

    const sellerExists = await Seller.findOne({ email });
    if (sellerExists)
      return res.status(400).json({ message: "Seller email already exists" });

    // Create the partial seller profile
    const seller = await Seller.create({
      name,
      email,
      password,
      phone,
      googleId,
    });

    if (seller) {
      res.status(201).json({
        _id: seller._id,
        name: seller.name,
        email: seller.email,
        role: seller.role,
        token: generateToken(seller._id),
      });
    } else {
      res.status(400).json({ message: "Invalid seller data" });
    }
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate a seller
// @route   POST /api/sellers/login
// @access  Public
export const loginSeller = async (req, res) => {
  try {
    const { email: identifier, password } = req.body;
    if (!identifier || !password)
      return res
        .status(400)
        .json({ message: "Please enter email/phone and password" });

    const seller = await Seller.findOne({
      $or: [{ email: identifier }, { phone: identifier }],
    }).select("+password");

    if (!seller || !(await seller.matchPassword(password))) {
      return res
        .status(401)
        .json({ message: "Invalid email/phone or password" });
    }

    res.json({
      _id: seller._id,
      name: seller.name,
      email: seller.email,
      businessName: seller.businessName,
      role: seller.role,
      token: generateToken(seller._id),
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send Forgot Password OTP (Seller)
// @route   POST /api/sellers/forgot-password
// @access  Public
export const forgotPasswordSeller = async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier)
      return res.status(400).json({ message: "Email or Phone is required" });

    const seller = await Seller.findOne({
      $or: [{ email: identifier }, { phone: identifier }],
    });

    if (!seller) return res.status(404).json({ message: "Seller not found" });

    // Generate & Save OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    seller.resetPasswordToken = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");
    seller.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await seller.save();

    const isEmailInput = identifier.includes("@");

    if (isEmailInput) {
      // --- SEND EMAIL ---
      await sendEmail({
        email: seller.email,
        subject: "Password Reset Request",
        message: `Your ShopEasy Password Reset OTP is: ${otp}`,
      });
      return res
        .status(200)
        .json({ success: true, message: "OTP sent to email" });
    } else {
      // --- SEND SMS (TWILIO) ---
      const accountSid = process.env.TWILIO_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

      if (!accountSid || !authToken || !twilioPhone) {
        console.error("Twilio Config Missing: Check .env for TWILIO_SID");
        throw new Error("Server SMS configuration error");
      }

      const client = twilio(accountSid, authToken);

      let phoneToSend = seller.phone;
      if (!phoneToSend.startsWith("+")) {
        phoneToSend = `+91${phoneToSend}`;
      }

      await client.messages.create({
        body: `Your ShopEasy Password Reset OTP is: ${otp}`,
        from: twilioPhone,
        to: phoneToSend,
      });

      return res
        .status(200)
        .json({ success: true, message: "OTP sent to mobile" });
    }
  } catch (error) {
    console.error("FORGOT PASS ERROR:", error);
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

// @desc    Reset Password with OTP (Seller)
// @route   POST /api/sellers/reset-password
// @access  Public
export const resetPasswordSeller = async (req, res) => {
  try {
    const { identifier, otp, password } = req.body;
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    const seller = await Seller.findOne({
      $or: [{ email: identifier }, { phone: identifier }],
      resetPasswordToken: hashedOtp,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!seller)
      return res.status(400).json({ message: "Invalid or expired OTP" });

    seller.password = password;
    seller.resetPasswordToken = undefined;
    seller.resetPasswordExpire = undefined;
    await seller.save();

    res
      .status(200)
      .json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

/* =========================================
   PROFILE & DASHBOARD CONTROLLERS
========================================= */

// @desc    Get Seller Profile
// @route   GET /api/sellers/profile
// @access  Private (Seller)
export const getSellerProfile = async (req, res) => {
  try {
    if (!req.seller) return res.status(401).json({ message: "Not authorized" });

    // 1. Check Redis Cache
    const cacheKey = `seller_profile:${req.seller._id}`;
    const cachedProfile = await redisClient.get(cacheKey);

    if (cachedProfile) {
      // console.log("⚡ Serving Seller Profile from Redis");
      return res.json(JSON.parse(cachedProfile));
    }

    // 2. Fetch from DB
    const seller = await Seller.findById(req.seller._id);
    if (seller) {
      const responseData = {
        _id: seller._id,
        name: seller.name,
        email: seller.email,
        businessName: seller.businessName,
        address: seller.address,
        phone: seller.phone,
        role: seller.role,
        isVerified: seller.isVerified,
        bankDetails: seller.bankDetails,
      };

      // 3. Save to Redis (TTL: 1 hour)
      await redisClient.setEx(cacheKey, 3600, JSON.stringify(responseData));

      res.json(responseData);
    } else {
      res.status(404).json({ message: "Seller not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update Seller Business Profile (Step 2)
// @route   PUT /api/sellers/profile
// @access  Private (Seller)
export const updateSellerProfile = async (req, res) => {
  try {
    const seller = await Seller.findById(req.seller._id);

    if (seller) {
      seller.businessName = req.body.businessName || seller.businessName;
      seller.businessType = req.body.businessType || seller.businessType;
      seller.gstin = req.body.gstin || seller.gstin;
      seller.address = req.body.address || seller.address;

      const updatedSeller = await seller.save();

      // ✅ INVALIDATE CACHE
      await clearSellerCache(updatedSeller._id);

      res.json({
        _id: updatedSeller._id,
        name: updatedSeller.name,
        email: updatedSeller.email,
        businessName: updatedSeller.businessName,
        role: updatedSeller.role,
        token: generateToken(updatedSeller._id),
      });
    } else {
      res.status(404).json({ message: "Seller not found" });
    }
  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add/Update Bank Details (Step 3)
// @route   PUT /api/sellers/bank
// @access  Private (Seller)
export const addBankDetails = async (req, res) => {
  try {
    const { accountHolder, accountNumber, ifscCode, bankName, branchName } =
      req.body;

    if (!accountHolder || !accountNumber || !ifscCode)
      return res.status(400).json({ message: "Provide all bank details" });

    const seller = await Seller.findById(req.seller._id);
    if (seller) {
      seller.bankDetails = {
        accountHolder,
        accountNumber,
        ifscCode,
        bankName,
        branchName,
        isVerified: true,
      };

      if (seller.businessName && seller.gstin) {
        seller.isOnboardingComplete = true;
      }

      await seller.save();

      // ✅ INVALIDATE CACHE
      await clearSellerCache(seller._id);

      res.status(200).json({
        message: "Bank details updated",
        bankDetails: seller.bankDetails,
      });
    } else {
      res.status(404).json({ message: "Seller not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Seller Dashboard Stats
// @route   GET /api/sellers/dashboard
// @access  Private (Seller)
export const getSellerDashboard = async (req, res) => {
  try {
    const sellerId = req.seller._id;
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const allProducts = await Product.find({ seller: sellerId });
    const productsThisMonth = allProducts.filter(
      (p) => p.createdAt >= startOfThisMonth
    ).length;
    const productTrend =
      productsThisMonth > 0 ? `+${productsThisMonth} New` : "No New";

    const orders = await Order.find({ "orderItems.seller": sellerId });
    const thisMonthOrders = orders.filter(
      (o) => o.createdAt >= startOfThisMonth
    );
    const lastMonthOrders = orders.filter(
      (o) => o.createdAt >= startOfLastMonth && o.createdAt < startOfThisMonth
    );

    const totalRevenue = orders.reduce(
      (acc, o) => acc + (o.totalPrice || 0),
      0
    );
    const thisMonthRevenue = thisMonthOrders.reduce(
      (acc, o) => acc + (o.totalPrice || 0),
      0
    );
    const lastMonthRevenue = lastMonthOrders.reduce(
      (acc, o) => acc + (o.totalPrice || 0),
      0
    );

    let revenueGrowth =
      lastMonthRevenue === 0
        ? thisMonthRevenue > 0
          ? 100
          : 0
        : ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;

    const ratingStats = await Product.aggregate([
      { $match: { seller: sellerId } },
      { $group: { _id: null, averageRating: { $avg: "$rating" } } },
    ]);
    const storeRating =
      ratingStats.length > 0 ? ratingStats[0].averageRating.toFixed(1) : 0;

    res.json({
      seller: {
        name: req.seller.name,
        businessName: req.seller.businessName,
        rating: storeRating,
      },
      stats: {
        totalRevenue,
        totalProducts: allProducts.length,
        activeOrders: orders.filter(
          (o) => o.status !== "Delivered" && o.status !== "Cancelled"
        ).length,
      },
      trends: {
        revenue: revenueGrowth.toFixed(1) + "%",
        products: productTrend,
        revenueIsUp: revenueGrowth >= 0,
      },
      recentProducts: await Product.find({ seller: sellerId })
        .sort({ createdAt: -1 })
        .limit(5),
    });
  } catch (error) {
    console.error("DASHBOARD ERROR:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

/* =========================================
   SEARCH CONTROLLER
========================================= */

// @desc    Search Products & Orders for Dashboard
// @route   GET /api/sellers/search?query=...
// @access  Private (Seller)
export const searchSellerData = async (req, res) => {
  try {
    const { query } = req.query;
    // Safely check for seller ID (supports different auth middlewares)
    const sellerId = req.seller?._id || req.user?._id;

    if (!sellerId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Seller ID missing" });
    }

    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    // Case-insensitive regex
    const searchRegex = new RegExp(query, "i");

    // 1. Search Products (by Name or Category)
    const products = await Product.find({
      seller: sellerId,
      $or: [
        { name: searchRegex },
        { category: searchRegex },
        // { sku: searchRegex }, // Uncomment if you add SKU later
      ],
    })
      .select("name category price thumbnail stock")
      .limit(5);

    // 2. Search Orders (by ID or Customer City)
    // Checking strict ID length prevents CastError for partial IDs
    const isObjectId = query.length === 24 && /^[0-9a-fA-F]{24}$/.test(query);

    const orders = await Order.find({
      "orderItems.seller": sellerId,
      $or: [
        // If query looks like an ID, search _id, otherwise search address fields
        ...(isObjectId ? [{ _id: query }] : []),
        { "shippingAddress.city": searchRegex },
        { "shippingAddress.address": searchRegex },
      ],
    })
      .select("_id totalPrice status createdAt")
      .limit(5);

    res.status(200).json({
      success: true,
      results: {
        products,
        orders,
      },
    });
  } catch (error) {
    console.error("SEARCH ERROR:", error);
    res.status(500).json({ message: "Search failed", error: error.message });
  }
};

// @desc    Delete Seller Account
// @route   DELETE /api/sellers/profile
// @access  Private (Seller)
export const deleteSellerAccount = async (req, res) => {
  try {
    const seller = await Seller.findById(req.seller._id);
    if (!seller) return res.status(404).json({ message: "Seller not found" });

    // Optional: Delete seller's products too?
    // await Product.deleteMany({ seller: req.seller._id });

    // ✅ INVALIDATE CACHE before deleting
    await clearSellerCache(req.seller._id);

    await seller.deleteOne();
    res
      .status(200)
      .json({ success: true, message: "Account deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
