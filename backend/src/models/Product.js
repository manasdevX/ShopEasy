import mongoose from "mongoose";

/* ======================================================
   1. REVIEW SCHEMA (Sub-document)
====================================================== */
const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

/* ======================================================
   2. MAIN PRODUCT SCHEMA
====================================================== */
const productSchema = new mongoose.Schema(
  {
    // 🔗 OWNERSHIP
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
    },

    // 🔹 BASIC INFO
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    subCategory: {
      type: String,
    },

    // 🔹 PRICING
    price: {
      type: Number,
      required: true,
    },
    mrp: {
      type: Number,
      required: true,
    },
    discountPercentage: {
      type: Number,
      default: 0,
    },

    // 🔹 MEDIA
    thumbnail: {
      type: String,
      required: true,
    },
    images: [
      {
        type: String,
      },
    ],

    // 🔹 INVENTORY
    stock: {
      type: Number,
      required: true,
      default: 0,
    },
    countInStock: {
      type: Number,
      default: 0,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },

    // 🔹 RATINGS & REVIEWS
    rating: {
      type: Number,
      default: 0,
      index: true, // Added index for fast sorting/filtering
    },
    numReviews: {
      type: Number,
      default: 0,
    },
    reviews: [reviewSchema],

    // 🔹 METADATA
    tags: [String],
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isBestSeller: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/* ======================================================
   3. MIDDLEWARE & INDEXES
====================================================== */

// Calculate Discount % automatically before saving
productSchema.pre("save", function (next) {
  if (this.mrp > this.price) {
    this.discountPercentage = Math.round(
      ((this.mrp - this.price) / this.mrp) * 100
    );
  }
  next();
});

// ⭐ KEY UPDATE: Text Index for Search Bar
// This allows you to search "black" and find it in Name, Brand, OR Tags
productSchema.index({
  name: "text",
  description: "text",
  brand: "text",
  tags: "text",
});

// ⭐ KEY UPDATE: Compound Index for Filters
// Speeds up queries like "Price between 1000-5000 AND Rating >= 4"
productSchema.index({ price: 1, rating: -1 });

export default mongoose.model("Product", productSchema);
