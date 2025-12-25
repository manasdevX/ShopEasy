import mongoose from "mongoose";

/* ======================================================
   1. REVIEW SCHEMA (Sub-document)
====================================================== */
const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reviews are left by Customers (Users)
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
    // 🔗 LINK TO SELLER (The account owner)
    // === CRITICAL FIX: Reference the 'Seller' Model ===
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller", // Points to 'sellers' collection
      required: true,
    },

    // 🔗 LINK TO STORE (Optional: For future multi-store features)
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      // required: true,
    },

    // 🔹 Basic Info
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

    // 🔹 Pricing
    price: {
      type: Number, // This is usually the Selling Price
      required: true,
    },
    mrp: {
      type: Number, // Maximum Retail Price (Crossed out price)
      required: true,
    },
    discountPercentage: {
      type: Number,
      default: 0,
    },

    // 🔹 Media
    thumbnail: {
      type: String,
      required: true,
    },
    images: [
      {
        type: String,
      },
    ],

    // 🔹 Inventory
    stock: {
      type: Number,
      required: true,
      default: 0,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },

    // 🔹 Ratings & Reviews
    rating: {
      type: Number,
      default: 0,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
    reviews: [reviewSchema],

    // 🔹 Metadata
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

// --- Virtual: Calculate Final Discounted Price (Optional Helper) ---
productSchema.virtual("finalPrice").get(function () {
  if (this.discountPercentage > 0) {
    return this.price - this.price * (this.discountPercentage / 100);
  }
  return this.price;
});

export default mongoose.model("Product", productSchema);
