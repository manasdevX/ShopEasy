import mongoose from "mongoose";
import { findTermInTaxonomy } from "../utils/searchTaxonomy.js";

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
      index: true,
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
    embeddings: {
      type: [Number],
      default: [],
    },

    // 🔹 SEARCH KEYWORDS (Auto-populated from taxonomy)
    searchKeywords: {
      type: [String],
      default: [],
      index: true,
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

  // Auto-generate search keywords from product data + taxonomy
  try {
    const keywords = new Set();

    if (this.category) {
      const node = findTermInTaxonomy(this.category);
      if (node) {
        if (node.ancestors) node.ancestors.forEach((a) => keywords.add(a.toLowerCase()));
        if (node.synonyms) node.synonyms.forEach((s) => keywords.add(s.toLowerCase()));
        if (node.matchedTerms) node.matchedTerms.forEach((t) => keywords.add(t.toLowerCase()));
        keywords.add(node.term.toLowerCase());
        if (node.rootKey) keywords.add(node.rootKey.toLowerCase());
      }
      keywords.add(this.category.toLowerCase());
    }

    if (this.subCategory) {
      keywords.add(this.subCategory.toLowerCase());
      const subNode = findTermInTaxonomy(this.subCategory);
      if (subNode) {
        if (subNode.ancestors) subNode.ancestors.forEach((a) => keywords.add(a.toLowerCase()));
        if (subNode.synonyms) subNode.synonyms.forEach((s) => keywords.add(s.toLowerCase()));
      }
    }

    // Add name tokens (non-stopword, length > 2)
    const stopwords = new Set(["the", "a", "an", "and", "or", "for", "of", "in", "on", "to", "with", "by"]);
    const nameTokens = (this.name || "").toLowerCase().split(/\s+/).filter((t) => t.length > 2 && !stopwords.has(t));
    nameTokens.forEach((t) => keywords.add(t));

    if (this.brand) keywords.add(this.brand.toLowerCase());

    (this.tags || []).forEach((t) => {
      if (t) keywords.add(t.toLowerCase());
    });

    this.searchKeywords = [...keywords];
  } catch (err) {
    // Taxonomy lookup failure should not block product save
    console.error("searchKeywords generation failed:", err.message);
  }

  next();
});

// Text Index for Search Bar with weights
productSchema.index(
  {
    name: "text",
    description: "text",
    brand: "text",
    tags: "text",
    searchKeywords: "text",
  },
  {
    weights: {
      name: 10,
      searchKeywords: 8,
      brand: 6,
      tags: 5,
      description: 1,
    },
  }
);

// Compound Index for Filters
productSchema.index({ price: 1, rating: -1 });

export default mongoose.model("Product", productSchema);
