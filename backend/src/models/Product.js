import mongoose from "mongoose";

/* ======================================================
   1. REVIEW SCHEMA (Sub-document)
   Stored inside the Product document for faster access
====================================================== */
const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Links to the Customer who wrote the review
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
  { timestamps: true } // Auto-adds createdAt for the review
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
      index: true, // Index for faster filtering
    },
    subCategory: {
      type: String,
    },

    // 🔹 PRICING
    price: {
      type: Number, // Selling Price (e.g., ₹2000)
      required: true,
    },
    mrp: {
      type: Number, // List Price (e.g., ₹2500)
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
    // Optional alias to match some controller logic if needed
    countInStock: {
      type: Number,
      default: 0,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },

    // 🔹 RATINGS & REVIEWS (Calculated Fields)
    rating: {
      type: Number,
      default: 0, // Average Rating (e.g., 4.5)
    },
    numReviews: {
      type: Number,
      default: 0, // Total number of reviews
    },
    reviews: [reviewSchema], // The array of review objects

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

// --- Virtual: Calculate Discount % if not manually set ---
productSchema.pre("save", function (next) {
  if (this.mrp > this.price) {
    this.discountPercentage = Math.round(
      ((this.mrp - this.price) / this.mrp) * 100
    );
  }
  next();
});

export default mongoose.model("Product", productSchema);
