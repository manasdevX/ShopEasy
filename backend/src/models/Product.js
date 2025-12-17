const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    name: {
      type: String,
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    // 🔹 Basic Info
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    brand: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true,
      index: true
    },
    subCategory: {
      type: String
    },

    // 🔹 Pricing
    price: {
      type: Number,
      required: true
    },
    mrp: {
      type: Number,
      required: true
    },
    discountPercentage: {
      type: Number,
      default: 0
    },

    // 🔹 Media
    thumbnail: {
      type: String,
      required: true
    },
    images: [
      {
        type: String
      }
    ],

    // 🔹 Inventory
    stock: {
      type: Number,
      required: true,
      default: 0
    },
    isAvailable: {
      type: Boolean,
      default: true
    },

    // 🔹 Ratings & Reviews
    rating: {
      type: Number,
      default: 0
    },
    numReviews: {
      type: Number,
      default: 0
    },
    reviews: [reviewSchema],

    // 🔹 Metadata
    tags: [String],
    isFeatured: {
      type: Boolean,
      default: false
    },
    isBestSeller: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Product", productSchema);
