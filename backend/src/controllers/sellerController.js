import Seller from "../models/seller.js"; // Ensure filename matches exactly (case-sensitive)
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// @desc    Register new seller
// @route   POST /api/seller/register
// @access  Public
export const registerSeller = async (req, res) => {
  try {
    // 👇 UPDATED: Extract all fields including Address and Business Type
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

    // 1. Validation (Ensure required fields are present)
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

    // 2. Check if seller exists
    const sellerExists = await Seller.findOne({ email });
    if (sellerExists) {
      return res.status(400).json({ message: "Seller already exists" });
    }

    // 3. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create seller with ALL Data
    const seller = await Seller.create({
      name,
      email,
      password: hashedPassword,
      businessName,
      phone,
      businessType, // Saved
      gstin, // Saved
      address, // Saved (Object containing street, city, state, pincode)
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
// @route   POST /api/seller/login
// @access  Public
export const loginSeller = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for seller email
    const seller = await Seller.findOne({ email }).select("+password");

    if (seller && (await bcrypt.compare(password, seller.password))) {
      res.json({
        _id: seller._id,
        name: seller.name,
        email: seller.email,
        businessName: seller.businessName,
        role: seller.role, // Useful for frontend redirection
        token: generateToken(seller._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
