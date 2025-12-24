import Seller from "../models/seller.js";
import jwt from "jsonwebtoken";

// --- Helper: Generate JWT ---
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

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
      googleId, // <--- 1. Extract googleId from request
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
      googleId, // <--- 2. Save googleId to database
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
    console.log("✅ Seller found:", seller.email);

    // 2. Match Password
    console.log("🔐 Checking Password...");
    const isMatch = await seller.matchPassword(password);

    if (!isMatch) {
      console.log("❌ Password incorrect.");
      return res
        .status(401)
        .json({ message: "Invalid email/phone or password" });
    }
    console.log("✅ Password Matched!");

    // 3. Generate Token
    console.log("🎟️ Generating Token...");
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing in .env file");
    }

    const token = generateToken(seller._id);

    res.json({
      _id: seller._id,
      name: seller.name,
      email: seller.email,
      businessName: seller.businessName,
      role: seller.role,
      token: token,
    });
    console.log("🚀 Login Successful. Response sent.");
  } catch (error) {
    console.error("🔥 LOGIN CRASH ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Seller Profile
// @route   GET /api/sellers/profile
// @access  Private (Seller)
export const getSellerProfile = async (req, res) => {
  try {
    // req.seller is set by the 'protectSeller' middleware
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
        bankDetails: seller.bankDetails, // Return bank details in profile
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

    // req.seller is set by the middleware
    const seller = await Seller.findById(req.seller._id);

    if (seller) {
      seller.bankDetails = {
        accountHolder,
        accountNumber,
        ifscCode,
        bankName: bankName || "",
        branchName: branchName || "",
        isVerified: true, // Assuming instant verification for now
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
