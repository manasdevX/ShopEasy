import Seller from "../models/seller.js"; // Ensure file name matches your model (Capital S usually)
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
      businessName,
      phone,
      businessType,
      gstin,
      address,
    } = req.body;

    // 1. Validation
    if (
      !name ||
      !email ||
      !password ||
      !businessName ||
      !phone ||
      !businessType ||
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

    // 3. Check if Business Name is taken (Optional but recommended)
    const businessExists = await Seller.findOne({ businessName });
    if (businessExists) {
      return res
        .status(400)
        .json({ message: "Business Name is already registered" });
    }

    // 4. Create Seller
    // NOTE: We pass the 'password' directly. The Seller Model's pre('save') hook handles the hashing.
    const seller = await Seller.create({
      name,
      email,
      password,
      businessName,
      phone,
      businessType,
      gstin,
      address,
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
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate a seller
// @route   POST /api/sellers/login
// @access  Public
export const loginSeller = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find Seller & explicitly select password (since it's hidden by default)
    const seller = await Seller.findOne({ email }).select("+password");

    // 2. Check if seller exists & Match Password
    // We use the method defined in the Seller model
    if (seller && (await seller.matchPassword(password))) {
      // 3. Check if account is active (Optional security)
      if (!seller.isActive) {
        return res
          .status(403)
          .json({ message: "Account is suspended/inactive" });
      }

      res.json({
        _id: seller._id,
        name: seller.name,
        email: seller.email,
        businessName: seller.businessName,
        role: seller.role,
        token: generateToken(seller._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Seller Profile
// @route   GET /api/sellers/profile
// @access  Private (Seller)
export const getSellerProfile = async (req, res) => {
  try {
    // req.seller is set by the 'protectSeller' middleware
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
      });
    } else {
      res.status(404).json({ message: "Seller not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
