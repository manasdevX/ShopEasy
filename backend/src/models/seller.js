import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const sellerSchema = new mongoose.Schema(
  {
    // --- STEP 1: PERSONAL INFO (Required for Account Creation) ---
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
      // Password is NOT required if using Google Auth
      required: function () {
        return !this.googleId;
      },
      minlength: 6,
      select: false,
    },
    phone: {
      type: String,
      // Phone might be collected later in some flows, but usually Step 1
      required: [false, "Please enter your phone number"],
    },

    // === GOOGLE AUTH FIELD ===
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },

    // --- STEP 2: BUSINESS DETAILS (Updated via PUT) ---
    // Note: 'required' removed to allow initial creation in Step 1
    businessName: {
      type: String,
      unique: true,
      trim: true,
      sparse: true, // Allows null/undefined for incomplete profiles
    },
    businessType: {
      type: String,
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
      uppercase: true,
      trim: true,
      // Unique but sparse so multiple "incomplete" users can exist without error
      unique: true,
      sparse: true,
    },
    address: {
      type: String,
    },

    // --- STEP 3: BANK DETAILS (Updated via PUT) ---
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
      default: "seller",
    },
    // Used to track if they finished the full registration wizard
    isOnboardingComplete: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean, // Admin approval status
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
  }
);

/* ======================================================
   MIDDLEWARE & METHODS
====================================================== */

// 1. Encrypt password before saving
sellerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  // Only hash if password exists (skip for Google Auth users)
  if (this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

// 2. Sign JWT Token
sellerSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id, role: "seller" }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  });
};

// 3. Match entered password
sellerSchema.methods.matchPassword = async function (enteredPassword) {
  // If user has no password (e.g., Google Auth only), return false
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

const Seller = mongoose.models.Seller || mongoose.model("Seller", sellerSchema);

export default Seller;
