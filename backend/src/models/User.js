import mongoose from "mongoose";
import bcrypt from "bcryptjs";

/* ======================================================
   1. ADDRESS SCHEMA (Sub-document)
   ✅ Updated to include 'type' (Home/Work)
====================================================== */
const addressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    pincode: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, default: "India" },
    addressLine: { type: String, required: true },

    // 👇 NEW FIELD: Address Type
    type: {
      type: String,
      enum: ["Home", "Work"],
      default: "Home",
    },

    isDefault: { type: Boolean, default: false },
  },
  { _id: true } // Keep _id to easily update/delete specific addresses
);

/* ======================================================
   2. CART ITEM SCHEMA (Sub-document)
====================================================== */
const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false }
);

/* ======================================================
   3. MAIN USER SCHEMA
====================================================== */
const userSchema = new mongoose.Schema(
  {
    // --- BASIC INFO ---
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      select: false, // Security: Don't return password by default
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      sparse: true, // Allows multiple null values (if phone not provided via Google)
    },

    // --- PROFILE PICTURE ---
    profilePicture: {
      type: String,
      default:
        "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
    },

    // --- AUTH PROVIDERS ---
    googleId: {
      type: String, // Stores the ID from Google OAuth
      unique: true,
      sparse: true,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },

    /* =========================
       🔐 OTP & PASSWORD RESET
    ========================= */
    resetPasswordOtp: { type: String },
    resetPasswordExpire: { type: Date },

    /* =========================
       ✅ ACCOUNT VERIFICATION
    ========================= */
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: { type: String },
    emailVerificationExpire: { type: Date },

    isMobileVerified: {
      type: Boolean,
      default: false,
    },
    mobileOtp: { type: String },
    mobileOtpExpire: { type: Date },

    /* =========================
       📦 USER DATA
    ========================= */
    addresses: [addressSchema], // Array of addresses

    cart: [cartItemSchema],

    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],

    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
      },
    ],
  },
  { timestamps: true }
);

/* ======================================================
   4. MIDDLEWARE & METHODS
====================================================== */

// Encrypt password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);
