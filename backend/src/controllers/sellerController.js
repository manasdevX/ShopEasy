import Seller from "../models/seller.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import jwt from "jsonwebtoken";
import crypto from "crypto"; // Needed for password reset
import sendEmail from "../utils/emailHelper.js"; // Needed for password reset email

// --- Helper: Generate JWT ---
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

/* =========================================
   AUTH CONTROLLERS
========================================= */

// @desc    Register new seller
// @route   POST /api/sellers/register
// @access  Public
export const registerSeller = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      businessName,
      businessType,
      gstin,
      address,
      googleId,
    } = req.body;

    // 1. Validation
    if (
      !name ||
      !email ||
      !password ||
      !businessName ||
      !phone ||
      !businessType ||
      !gstin ||
      !address
    ) {
      return res
        .status(400)
        .json({ message: "Please fill all required fields" });
    }

    // 2. Check if seller email already exists
    const sellerExists = await Seller.findOne({ email });
    if (sellerExists) {
      return res.status(400).json({ message: "Seller email already exists" });
    }

    // 3. Check if Business Name is taken
    const businessExists = await Seller.findOne({ businessName });
    if (businessExists) {
      return res
        .status(400)
        .json({ message: "Business Name is already registered" });
    }

    // 4. Create Seller
    const seller = await Seller.create({
      name,
      email,
      password,
      businessName,
      phone,
      businessType,
      gstin,
      address,
      googleId,
    });

    if (seller) {
      res.status(201).json({
        _id: seller._id,
        name: seller.name,
        email: seller.email,
        businessName: seller.businessName,
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
  console.log("👉 Login Attempt:", req.body);

  try {
    const { email: identifier, password } = req.body;

    if (!identifier || !password) {
      return res
        .status(400)
        .json({ message: "Please enter email/phone and password" });
    }

    // 1. Find Seller
    console.log("🔍 Searching DB for:", identifier);
    const seller = await Seller.findOne({
      $or: [{ email: identifier }, { phone: identifier }],
    }).select("+password");

    if (!seller) {
      console.log("❌ Seller not found.");
      return res
        .status(401)
        .json({ message: "Invalid email/phone or password" });
    }

    // 2. Match Password
    const isMatch = await seller.matchPassword(password);

    if (!isMatch) {
      console.log("❌ Password incorrect.");
      return res
        .status(401)
        .json({ message: "Invalid email/phone or password" });
    }

    // 3. Generate Token
    const token = generateToken(seller._id);

    res.json({
      _id: seller._id,
      name: seller.name,
      email: seller.email,
      businessName: seller.businessName,
      role: seller.role,
      token: token,
    });
    console.log("🚀 Login Successful.");
  } catch (error) {
    console.error("🔥 LOGIN CRASH ERROR:", error);
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
      return res.status(400).json({ message: "Email is required" });

    // Find seller by email
    const seller = await Seller.findOne({ email: identifier });
    if (!seller) return res.status(404).json({ message: "Seller not found" });

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash OTP and save to DB
    seller.resetPasswordToken = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");
    seller.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 Minutes
    await seller.save();

    // Send Email
    const message = `Your ShopEasy Password Reset OTP is: ${otp}`;
    await sendEmail({
      email: seller.email,
      subject: "Password Reset Request",
      message,
    });

    res.status(200).json({ success: true, message: "OTP sent to email" });
  } catch (error) {
    console.error("FORGOT PASS ERROR:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Reset Password with OTP (Seller)
// @route   POST /api/sellers/reset-password
// @access  Public
export const resetPasswordSeller = async (req, res) => {
  try {
    const { identifier, otp, password } = req.body;

    // Hash the incoming OTP to compare
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    const seller = await Seller.findOne({
      email: identifier,
      resetPasswordToken: hashedOtp,
      resetPasswordExpire: { $gt: Date.now() }, // Check if not expired
    });

    if (!seller)
      return res.status(400).json({ message: "Invalid or expired OTP" });

    // Set new password
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
    if (!req.seller) {
      return res
        .status(401)
        .json({ message: "Not authorized, no seller data found" });
    }

    const seller = await Seller.findById(req.seller._id);

    if (seller) {
      res.json({
        _id: seller._id,
        name: seller.name,
        email: seller.email,
        businessName: seller.businessName,
        address: seller.address,
        phone: seller.phone,
        role: seller.role,
        isVerified: seller.isVerified,
        bankDetails: seller.bankDetails,
      });
    } else {
      res.status(404).json({ message: "Seller not found" });
    }
  } catch (error) {
    console.error("PROFILE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add/Update Bank Details
// @route   POST /api/sellers/bank-details
// @access  Private (Seller)
export const addBankDetails = async (req, res) => {
  try {
    const { accountHolder, accountNumber, ifscCode, bankName, branchName } =
      req.body;

    if (!accountHolder || !accountNumber || !ifscCode) {
      return res
        .status(400)
        .json({ message: "Please provide all bank details" });
    }

    const seller = await Seller.findById(req.seller._id);

    if (seller) {
      seller.bankDetails = {
        accountHolder,
        accountNumber,
        ifscCode,
        bankName: bankName || "",
        branchName: branchName || "",
        isVerified: true,
      };

      await seller.save();

      res.status(200).json({
        message: "Bank details updated successfully",
        bankDetails: seller.bankDetails,
      });
    } else {
      res.status(404).json({ message: "Seller not found" });
    }
  } catch (error) {
    console.error("BANK DETAILS ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Seller Dashboard Stats (With Trends)
// @route   GET /api/sellers/dashboard
// @access  Private (Seller)
export const getSellerDashboard = async (req, res) => {
  try {
    const sellerId = req.seller._id;
    const seller = req.seller;

    // --- 1. SETUP DATES ---
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // --- 2. CALCULATE PRODUCTS ---
    const allProducts = await Product.find({ seller: sellerId });
    const totalProducts = allProducts.length;

    const productsThisMonth = allProducts.filter(
      (p) => p.createdAt >= startOfThisMonth
    ).length;

    const productTrend =
      productsThisMonth > 0 ? `+${productsThisMonth} New` : "No New";

    // --- 3. CALCULATE REVENUE ---
    const orders = await Order.find({ "orderItems.seller": sellerId });

    const thisMonthOrders = orders.filter(
      (o) => o.createdAt >= startOfThisMonth
    );
    const lastMonthOrders = orders.filter(
      (o) => o.createdAt >= startOfLastMonth && o.createdAt < startOfThisMonth
    );

    const totalRevenue = orders.reduce(
      (acc, order) => acc + (order.totalPrice || 0),
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

    let revenueGrowth = 0;
    if (lastMonthRevenue === 0) {
      revenueGrowth = thisMonthRevenue > 0 ? 100 : 0;
    } else {
      revenueGrowth =
        ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
    }

    // --- 4. RATING LOGIC ---
    const ratingStats = await Product.aggregate([
      { $match: { seller: sellerId } },
      { $group: { _id: null, averageRating: { $avg: "$rating" } } },
    ]);
    const storeRating =
      ratingStats.length > 0 ? ratingStats[0].averageRating.toFixed(1) : 0;

    // --- 5. SEND RESPONSE ---
    res.json({
      seller: {
        name: seller.name,
        businessName: seller.businessName,
        rating: storeRating,
      },
      stats: {
        totalRevenue,
        totalProducts,
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
