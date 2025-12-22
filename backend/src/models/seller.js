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

    // --- BUSINESS DETAILS ---
    businessName: {
      type: String,
      required: [true, "Please enter your business name"],
      unique: true,
      trim: true,
    },
    businessType: {
      type: String,
      required: [true, "Please select business type"], // e.g., "Private Limited", "Proprietorship"
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
      unique: true,
      sparse: true, // Allows nulls if GST is not applicable yet
    },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      country: { type: String, default: "India" },
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

export default mongoose.model("Seller", sellerSchema);
