import mongoose from "mongoose";
import bcrypt from "bcryptjs";

/* ======================================================
   1. ADDRESS SCHEMA (Sub-document)
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
    type: {
      type: String,
      enum: ["Home", "Work"],
      default: "Home",
    },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
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
    price: { type: Number },
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
      sparse: true, // Allows null/duplicate nulls for OAuth users
    },

    // --- PROFILE PICTURE ---
    profilePicture: {
      type: String,
      default:
        "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
    },

    // --- AUTH PROVIDERS ---
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },

    // --- ROLES & PERMISSIONS ---
    role: {
      type: String,
      enum: ["user", "admin", "seller"],
      default: "user",
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    passwordChangedAt: {
      type: Date,
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

    /* =========================
       📦 USER DATA
    ========================= */
    // ✅ Updated Address Management
    addresses: [addressSchema],

    // ✅ Embedded Cart (Optional if using separate Cart model)
    cart: [cartItemSchema],

    // ✅ Wishlist Feature
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
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/* ======================================================
   4. VIRTUALS
====================================================== */
// Creates a fake 'isAdmin' field that matches your middleware check
userSchema.virtual("isAdmin").get(function () {
  return this.role === "admin";
});

// Optional: Creates a fake 'isSeller' field for easier frontend checks
userSchema.virtual("isSeller").get(function () {
  return this.role === "seller";
});

/* ======================================================
   5. MIDDLEWARE & METHODS
====================================================== */

// Encrypt password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  if (!this.isNew) {
    this.passwordChangedAt = Date.now() - 1000;
  }

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to check if password changed AFTER token was issued
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Check if model exists to prevent overwrite error in HMR environments
const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
