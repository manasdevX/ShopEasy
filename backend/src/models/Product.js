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
    // 🔗 LINK TO USER (The account owner)
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // ✅ Corrected: Refers to the User model
      required: true,
    },

    // 🔗 LINK TO STORE (The business profile)
    // Useful for grouping products by "Brand" or "Shop"
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      // required: true, // Uncomment if you enforce every seller to have a created Store
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
// This ensures you don't have to manually calculate it on the frontend every time
productSchema.virtual("finalPrice").get(function () {
  if (this.discountPercentage > 0) {
    return this.price - this.price * (this.discountPercentage / 100);
  }
  return this.price;
});

export default mongoose.model("Product", productSchema);
