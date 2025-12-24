import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const sellerSchema = new mongoose.Schema(
  {
    // --- PERSONAL INFO ---
    name: {
      type: String,
      required: [true, "Please enter your name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please enter your email"],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please add a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Please enter your password"],
      minlength: 6,
      select: false, // Security: hide password by default
    },
    phone: {
      type: String,
      required: [true, "Please enter your phone number"],
    },

    // === GOOGLE AUTH FIELD (New) ===
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allows null values (for sellers who don't use Google)
    },

    // --- BUSINESS DETAILS ---
    businessName: {
      type: String,
      required: [true, "Please enter your business name"],
      unique: true,
      trim: true,
    },
    businessType: {
      type: String,
      required: [true, "Please select business type"],
      enum: [
        "Proprietorship",
        "Partnership",
        "Private Limited",
        "LLP",
        "Individual",
      ],
    },
    gstin: {
      type: String,
      required: [true, "GSTIN is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    address: {
      type: String,
      required: [true, "Address is required"],
    },

    // --- BANK DETAILS ---
    bankDetails: {
      accountHolder: { type: String },
      accountNumber: { type: String },
      ifscCode: { type: String },
      bankName: { type: String },
      branchName: { type: String },
      isVerified: { type: Boolean, default: false },
    },

    // --- STATUS & ROLES ---
    role: {
      type: String,
      default: "seller", // Fixed role
    },
    isVerified: {
      type: Boolean, // Admin approval status
      default: false,
    },
    isActive: {
      type: Boolean, // Seller can temporarily disable their own account
      default: true,
    },

    // --- PASSWORD RESET TOKENS ---
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true, // Auto-adds createdAt and updatedAt
  }
);

/* ======================================================
   MIDDLEWARE & METHODS (Essential for Auth)
====================================================== */

// 1. Encrypt password before saving
sellerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// 2. Sign JWT Token (Helper method)
sellerSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id, role: "seller" }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  });
};

// 3. Match entered password with hashed password
sellerSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Check if "Seller" is already defined; if so, use it. If not, define it.
const Seller = mongoose.models.Seller || mongoose.model("Seller", sellerSchema);

export default Seller;
