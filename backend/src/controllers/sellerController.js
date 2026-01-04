import Seller from "../models/seller.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import SellerSession from "../models/SellerSession.js"; // ✅ New Import
import jwt from "jsonwebtoken";
import crypto from "crypto";
import sendEmail from "../utils/emailHelper.js";
import twilio from "twilio";
import redisClient from "../config/redis.js";

// --- Helper: Generate JWT ---
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

/**
 * 🟢 SESSION LIMITER HELPER
 * Blocks login if the maximum number of concurrent sessions is reached.
 */
const checkSessionLimit = async (Model, queryKey, id, limit = 2) => {
  const sessionCount = await Model.countDocuments({ [queryKey]: id });

  if (sessionCount >= limit) {
    const error = new Error(
      `Maximum of ${limit} active sessions reached. Please logout from another device first.`
    );
    error.statusCode = 403; // Forbidden
    throw error;
  }
};

/**
 * Helper: Clear Seller Cache
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

// @desc    Register new seller
// @route   POST /api/sellers/register
export const registerSeller = async (req, res) => {
  try {
    const { name, email, password, phone, googleId } = req.body;

    if (!name || !email || !password || !phone) {
      return res
        .status(400)
        .json({ message: "Please fill all required fields" });
    }

    const sellerExists = await Seller.findOne({ email: email.toLowerCase() });
    if (sellerExists)
      return res.status(400).json({ message: "Seller email already exists" });

    const seller = await Seller.create({
      name,
      email: email.toLowerCase(),
      password,
      phone,
      googleId,
      isOnline: true, // 🟢 FORCE LIVE ON REGISTER
    });

    if (seller) {
      const token = generateToken(seller._id);

      // 🟢 1. CHECK SESSION LIMIT
      try {
        await checkSessionLimit(SellerSession, "seller", seller._id, 2);
      } catch (limitError) {
        return res
          .status(limitError.statusCode)
          .json({ message: limitError.message });
      }

      // ✅ 2. Create entry in SellerSession Collection
      await SellerSession.create({
        seller: seller._id,
        refreshToken: token,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 Days
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });

      // ✅ 3. Link Express Session for persistence
      req.session.sellerId = seller._id;
      req.session.role = "seller";

      req.session.save((err) => {
        if (err)
          return res
            .status(500)
            .json({ message: "Session initialization failed" });

        // 🟢 FIX: Set Cookie so logout can find the token
        res.cookie("accessToken", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 Days
        });

        res.status(201).json({
          _id: seller._id,
          name: seller.name,
          email: seller.email,
          role: seller.role,
          isOnline: seller.isOnline, // ✅ Send status to frontend
          token: token,
        });
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
export const loginSeller = async (req, res) => {
  try {
    const { email: identifier, password } = req.body;
    if (!identifier || !password)
      return res.status(400).json({ message: "Provide credentials" });

    const seller = await Seller.findOne({
      $or: [{ email: identifier.toLowerCase() }, { phone: identifier }],
    }).select("+password");

    if (!seller || !(await seller.matchPassword(password))) {
      return res
        .status(401)
        .json({ message: "Invalid email/phone or password" });
    }

    // 🟢 FORCE ALWAYS LIVE ON LOGIN
    seller.isOnline = true;
    await seller.save(); // Save status to DB

    // 🟢 1. HARD BLOCK: Check if seller already has 2 active sessions
    try {
      await checkSessionLimit(SellerSession, "seller", seller._id, 2);
    } catch (limitError) {
      return res
        .status(limitError.statusCode)
        .json({ message: limitError.message });
    }

    const token = generateToken(seller._id);

    // ✅ 2. Create entry in SellerSession Collection
    await SellerSession.create({
      seller: seller._id,
      refreshToken: token,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 Days
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    // ✅ 3. Link Express Session
    req.session.sellerId = seller._id;
    req.session.role = "seller";

    req.session.save((err) => {
      if (err)
        return res.status(500).json({ message: "Internal Server Error" });

      // 🟢 FIX: Set Cookie so logout can find the token
      res.cookie("accessToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 Days
      });

      res.json({
        _id: seller._id,
        name: seller.name,
        email: seller.email,
        businessName: seller.businessName,
        role: seller.role,
        isOnline: seller.isOnline, // ✅ Send "true" to frontend
        token: token,
      });
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send Forgot Password OTP
export const forgotPasswordSeller = async (req, res) => {
  try {
    const { identifier } = req.body;
    const seller = await Seller.findOne({
      $or: [{ email: identifier }, { phone: identifier }],
    });
    if (!seller) return res.status(404).json({ message: "Seller not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    seller.resetPasswordToken = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");
    seller.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await seller.save();

    if (identifier.includes("@")) {
      await sendEmail({
        email: seller.email,
        subject: "Password Reset Request",
        message: `Your OTP is: ${otp}`,
      });
      return res
        .status(200)
        .json({ success: true, message: "OTP sent to email" });
    } else {
      const client = twilio(
        process.env.TWILIO_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      await client.messages.create({
        body: `Your OTP is: ${otp}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: seller.phone.startsWith("+") ? seller.phone : `+91${seller.phone}`,
      });
      return res
        .status(200)
        .json({ success: true, message: "OTP sent to mobile" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset Password
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
    PROFILE & SETTINGS CONTROLLERS
========================================= */

// @desc    Get Seller Profile
export const getSellerProfile = async (req, res) => {
  try {
    const cacheKey = `seller_profile:${req.seller._id}`;
    const cachedProfile = await redisClient.get(cacheKey);
    if (cachedProfile) return res.json(JSON.parse(cachedProfile));

    const seller = await Seller.findById(req.seller._id);
    if (!seller) return res.status(404).json({ message: "Seller not found" });

    const parts = (seller.address || "").split(",").map((p) => p.trim());
    const responseData = {
      ...seller._doc,
      addressObject: {
        street: parts[0] || "",
        city: parts[1] || "",
        state: parts[2] || "",
        zip: parts[3] || "",
      },
    };

    await redisClient.setEx(cacheKey, 3600, JSON.stringify(responseData));
    res.json(responseData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update Personal Info (Name/Phone)
export const updatePersonalProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const seller = await Seller.findById(req.seller._id);
    if (!seller) return res.status(404).json({ message: "Seller not found" });

    if (name) seller.name = name;
    if (phone) seller.phone = phone;

    await seller.save();
    await clearSellerCache(seller._id);

    res.status(200).json({
      message: "Personal info updated",
      name: seller.name,
      phone: seller.phone,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update Business Profile (Step 2)
export const updateSellerProfile = async (req, res) => {
  try {
    const seller = await Seller.findById(req.seller._id);
    if (!seller) return res.status(404).json({ message: "Seller not found" });

    seller.businessName = req.body.businessName || seller.businessName;
    seller.businessType = req.body.businessType || seller.businessType;
    seller.gstin = req.body.gstin || seller.gstin;
    seller.address = req.body.address || seller.address;

    if (
      seller.businessName &&
      seller.gstin &&
      seller.bankDetails?.accountNumber
    ) {
      seller.isOnboardingComplete = true;
    }

    const updatedSeller = await seller.save();
    await clearSellerCache(updatedSeller._id);

    res.json({
      ...updatedSeller._doc,
      token: generateToken(updatedSeller._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update Address
export const updateSellerAddress = async (req, res) => {
  try {
    let { address } = req.body;
    if (typeof address === "object") {
      const { street = "", city = "", state = "", zip = "" } = address;
      address = `${street}, ${city}, ${state}, ${zip}`;
    }

    const seller = await Seller.findById(req.seller._id);
    if (!seller) return res.status(404).json({ message: "Seller not found" });

    seller.address = address;
    await seller.save();
    await clearSellerCache(seller._id);

    const parts = (address || "").split(",").map((p) => p.trim());
    res.status(200).json({
      message: "Address updated",
      address: seller.address,
      addressObject: {
        street: parts[0] || "",
        city: parts[1] || "",
        state: parts[2] || "",
        zip: parts[3] || "",
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add/Update Bank Details (Step 3)
export const addBankDetails = async (req, res) => {
  try {
    const seller = await Seller.findById(req.seller._id);
    if (!seller) return res.status(404).json({ message: "Seller not found" });

    seller.bankDetails = { ...req.body, isVerified: true };
    if (seller.businessName && seller.gstin) seller.isOnboardingComplete = true;

    await seller.save();
    await clearSellerCache(seller._id);
    res.status(200).json({
      message: "Bank details updated",
      bankDetails: seller.bankDetails,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================================
    STATS & DATA CONTROLLERS
========================================= */

// @desc    Get Seller Dashboard Stats
export const getSellerDashboard = async (req, res) => {
  try {
    const sellerId = req.seller._id;

    const [allProducts, orders, ratingStats] = await Promise.all([
      Product.find({ seller: sellerId }),
      Order.find({ "orderItems.seller": sellerId }),
      Product.aggregate([
        { $match: { seller: sellerId } },
        { $group: { _id: null, averageRating: { $avg: "$rating" } } },
      ]),
    ]);

    const totalRevenue = orders.reduce(
      (acc, o) => acc + (o.totalPrice || 0),
      0
    );
    const activeOrders = orders.filter(
      (o) => o.status !== "Delivered" && o.status !== "Cancelled"
    ).length;
    const storeRating =
      ratingStats.length > 0 ? ratingStats[0].averageRating.toFixed(1) : "0.0";

    res.json({
      seller: {
        name: req.seller.name,
        businessName: req.seller.businessName,
        rating: storeRating,
      },
      stats: { totalRevenue, totalProducts: allProducts.length, activeOrders },
      recentProducts: await Product.find({ seller: sellerId })
        .sort({ createdAt: -1 })
        .limit(5),
    });
  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Search Seller Data (Products/Orders)
export const searchSellerData = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query)
      return res.status(400).json({ message: "Search query is required" });

    const searchRegex = new RegExp(query, "i");
    const products = await Product.find({
      seller: req.seller._id,
      name: searchRegex,
    }).limit(5);

    res.status(200).json({ success: true, results: { products } });
  } catch (error) {
    res.status(500).json({ message: "Search failed" });
  }
};

// @desc    Delete Seller Account
export const deleteSellerAccount = async (req, res) => {
  try {
    const sellerId = req.seller._id;

    // ✅ Clean up Specific Seller Sessions
    await SellerSession.deleteMany({ seller: sellerId });
    await clearSellerCache(sellerId);

    await Seller.findByIdAndDelete(sellerId);

    // ✅ Clear Express Session
    if (req.session) req.session.destroy();

    res
      .status(200)
      .json({ success: true, message: "Account deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
