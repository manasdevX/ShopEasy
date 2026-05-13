import Product from "../models/Product.js";
import cloudinary from "cloudinary";
import streamifier from "streamifier";
import dotenv from "dotenv";
import redisClient from "../config/redis.js"; // <--- 1. IMPORT REDIS CLIENT
import { buildCatalogRegexTerms, normalizeCatalogQuery, buildSmartSearchConditions, scoreProduct } from "../utils/catalogSearch.js";
import { validateProductImageAndTitle } from "../utils/aiValidation.js";

// Load environment variables
dotenv.config();

/**
 * Helper: Upload Buffer to Cloudinary
 */
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    cloudinary.v2.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const stream = cloudinary.v2.uploader.upload_stream(
      { folder: "shopeasy_products" },
      (error, result) => {
        if (result) resolve(result.secure_url);
        else reject(error);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

const SEARCH_CACHE_VERSION_KEY = "products:cache:version";
const SEARCH_CACHE_VERSION_TTL_SECONDS = 30 * 24 * 60 * 60;

const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const toPositiveInt = (value, fallback) => {
  const num = Number.parseInt(value, 10);
  return Number.isFinite(num) && num > 0 ? num : fallback;
};

const toFiniteNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const buildFacetPipeline = (matchQuery) => [
  { $match: matchQuery },
  {
    $facet: {
      categories: [
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
        { $limit: 20 },
      ],
      ratings: [
        { $project: { rating: { $floor: "$rating" } } },
        { $group: { _id: "$rating", count: { $sum: 1 } } },
        { $match: { _id: { $gte: 1 } } },
        { $sort: { _id: -1 } },
      ],
    },
  },
];

// Layer 1: Database Retrieval & Layer 2: Application Ranking
const runTwoLayerSearchPipeline = async ({ matchQuery, hasQuery, page, limit, sort, qRaw }) => {
  // Layer 1: Candidate Retrieval (Lightweight, bounded DB fetch)
  const [count, facetsResult, rawCandidates] = await Promise.all([
    Product.countDocuments(matchQuery),
    Product.aggregate(buildFacetPipeline(matchQuery)),
    Product.find(matchQuery, {
      name: 1, price: 1, mrp: 1, discountPercentage: 1, thumbnail: 1, images: 1,
      category: 1, subCategory: 1, brand: 1, stock: 1, rating: 1, numReviews: 1,
      isFeatured: 1, isBestSeller: 1, createdAt: 1, description: 1, tags: 1
    }).limit(1000).lean() // Limit DB retrieval to prevent OOM
  ]);

  let items = rawCandidates;

  // Layer 2: Application-Level Logic-Based Ranking
  if (hasQuery && sort === "relevance") {
    items = items.map(item => ({
      ...item,
      _relevanceScore: scoreProduct(item, qRaw),
    }));
    
    // Sort primarily by computed relevance, tie-breaker by newest
    items.sort((a, b) => {
      if (b._relevanceScore !== a._relevanceScore) {
        return b._relevanceScore - a._relevanceScore;
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  } else {
    // Standard explicit sorts (price, rating, newest)
    items.sort((a, b) => {
      if (sort === "price_asc") return a.price - b.price || new Date(b.createdAt) - new Date(a.createdAt);
      if (sort === "price_desc") return b.price - a.price || new Date(b.createdAt) - new Date(a.createdAt);
      if (sort === "rating_desc" || sort === "rating") {
        return (b.rating || 0) - (a.rating || 0) || (b.numReviews || 0) - (a.numReviews || 0);
      }
      return new Date(b.createdAt) - new Date(a.createdAt); // default: newest
    });
  }

  // Application-level pagination
  const startIndex = (page - 1) * limit;
  const paginatedItems = items.slice(startIndex, startIndex + limit);

  // Clean up internal metadata fields
  const finalItems = paginatedItems.map(({ description, tags, _relevanceScore, ...rest }) => rest);

  return { count, facetsResult, items: finalItems };
};

const getSearchCacheVersion = async () => {
  const raw = await redisClient.get(SEARCH_CACHE_VERSION_KEY);
  const parsed = Number.parseInt(raw || "1", 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    await redisClient.setEx(SEARCH_CACHE_VERSION_KEY, SEARCH_CACHE_VERSION_TTL_SECONDS, "1");
    return 1;
  }

  return parsed;
};

const bumpSearchCacheVersion = async () => {
  const current = await getSearchCacheVersion();
  const next = String(current + 1);
  await redisClient.setEx(SEARCH_CACHE_VERSION_KEY, SEARCH_CACHE_VERSION_TTL_SECONDS, next);
};

/**
 * Helper: Clear Product Caches
 * Clears specific product ID and any list/search caches to ensure data freshness
 */
const clearProductCache = async (productId = null, sellerId = null) => {
  try {
    // Invalidate all search/list cache entries using version bump.
    await bumpSearchCacheVersion();

    // Clear specific product detail cache.
    if (productId) {
      await redisClient.del(`product:${productId}`);
    }

    // Clear specific seller list cache.
    if (sellerId) {
      await redisClient.del(`seller_products:${sellerId}`);
    }

    console.log("🧹 Redis Cache Cleared (Lists & Details)");
  } catch (error) {
    console.error("Cache Clear Error:", error);
  }
};

/* =========================================
   PUBLIC ROUTES
========================================= */

// @desc    Fetch all products with Search, Filter & Dynamic Facets
// @route   GET /api/products?keyword=iphone&minPrice=1000
// @access  Public
export const getAllProducts = async (req, res) => {
  try {
    const qRaw = (req.query.q || req.query.keyword || "").toString().trim();
    
    // 1. Local Normalization (Includes Phonetic & Fuzzy correction natively)
    const q = normalizeCatalogQuery(qRaw).slice(0, 120);

    const page = toPositiveInt(req.query.page || req.query.pageNumber, 1);
    const limit = Math.min(
      toPositiveInt(req.query.limit || req.query.pageSize, 12),
      50
    );

    const minPrice = toFiniteNumber(req.query.minPrice);
    const maxPrice = toFiniteNumber(req.query.maxPrice);
    const ratingMin = toFiniteNumber(req.query.ratingMin ?? req.query.rating);
    const category = (req.query.category || "").toString().trim();
    const sort = (req.query.sort || "relevance").toString().trim();

    const baseFilters = {
      stock: { $gt: 0 },
      isAvailable: { $ne: false },
    };

    if (category) {
      baseFilters.category = category;
    }

    if (minPrice != null || maxPrice != null) {
      baseFilters.price = {};
      if (minPrice != null) baseFilters.price.$gte = minPrice;
      if (maxPrice != null) baseFilters.price.$lte = maxPrice;
    }

    if (ratingMin != null) {
      baseFilters.rating = { $gte: ratingMin };
    }

    const normalizedQueryForCache = {
      q,
      page,
      limit,
      minPrice,
      maxPrice,
      ratingMin,
      category,
      sort,
    };

    const cacheVersion = await getSearchCacheVersion();
    const cacheKey = `products:v${cacheVersion}:${JSON.stringify(normalizedQueryForCache)}`;

    // 2. Check Redis
    const cachedResult = await redisClient.get(cacheKey);
    if (cachedResult) {
      console.log("⚡ Serving Search Results from Redis");
      return res.json(JSON.parse(cachedResult));
    }

    const hasQuery = q.length > 0;
    const regexQuery = { ...baseFilters };

    if (hasQuery) {
      // LAYER 1: Retrieve broad candidates using lightweight regex OR conditions
      const smartConditions = buildSmartSearchConditions(qRaw);
      if (smartConditions.length > 0) {
        regexQuery.$or = smartConditions;
      } else {
        const searchTerms = buildCatalogRegexTerms(qRaw);
        regexQuery.$or = searchTerms.flatMap((term) => [
          { name: { $regex: term, $options: "i" } },
          { brand: { $regex: term, $options: "i" } },
          { description: { $regex: term, $options: "i" } },
          { tags: { $regex: term, $options: "i" } },
          { category: { $regex: term, $options: "i" } },
        ]);
      }
    }

    const searchQuery = hasQuery ? regexQuery : baseFilters;

    let result;

    try {
      result = await runTwoLayerSearchPipeline({
        matchQuery: searchQuery,
        hasQuery,
        page,
        limit,
        sort,
        qRaw,
      });
    } catch (primaryError) {
      console.error("Two-Layer Search Pipeline Failed:", primaryError.message);
      throw primaryError;
    }

    const { count, facetsResult, items } = result;

    const responseData = {
      items,
      page,
      totalPages: Math.ceil(count / limit),
      total: count,
      facets: facetsResult[0] || { categories: [], ratings: [] },
      sort,
      query: q,
      originalQuery: qRaw,
      correctedQuery: (q !== qRaw.toLowerCase()) ? q : null,

      // Backward compatibility fields
      products: items,
      pages: Math.ceil(count / limit),
    };

    // 3. Save to Redis (TTL: 1 hour)
    await redisClient.setEx(cacheKey, 900, JSON.stringify(responseData));

    res.json(responseData);
  } catch (error) {
    console.error("Search Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Fetch single product by ID
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res) => {
  try {
    const cacheKey = `product:${req.params.id}`;

    // 1. Check Redis
    const cachedProduct = await redisClient.get(cacheKey);
    if (cachedProduct) {
      console.log("⚡ Serving Product Detail from Redis");
      return res.json(JSON.parse(cachedProduct));
    }

    // 2. Fetch from DB
    const product = await Product.findById(req.params.id).populate(
      "reviews.user",
      "name"
    );

    if (product) {
      // 3. Save to Redis (TTL: 1 hour)
      await redisClient.setEx(cacheKey, 3600, JSON.stringify(product));
      res.json(product);
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================================
   SELLER ROUTES (Protected)
========================================= */

// @desc    Get all products for a specific seller
// @route   GET /api/products/seller/all
// @access  Private (Seller Only)
export const getSellerProducts = async (req, res) => {
  try {
    const cacheKey = `seller_products:${req.seller._id}`;

    // 1. Check Redis
    const cachedSellerProducts = await redisClient.get(cacheKey);
    if (cachedSellerProducts) {
      console.log("⚡ Serving Seller Products from Redis");
      return res.json(JSON.parse(cachedSellerProducts));
    }

    const products = await Product.find({ seller: req.seller._id }).sort({
      createdAt: -1,
    });

    // 2. Save to Redis
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(products));

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a product (With Image Upload)
// @route   POST /api/products/add
// @access  Private (Seller Only)
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      mrp,
      stock,
      category,
      subCategory,
      brand,
      tags,
      isFeatured,
      isBestSeller,
    } = req.body;

    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = JSON.parse(tags);
      } catch (e) {
        parsedTags = tags.split(",").map((t) => t.trim());
      }
    }

    let thumbnail = "";
    let aiGeneratedTags = [];

    if (req.files && req.files.thumbnail) {
      const thumbnailFile = req.files.thumbnail[0];
      
      // AI VALIDATION & TAG GENERATION
      const aiResult = await validateProductImageAndTitle(
        thumbnailFile.buffer,
        thumbnailFile.mimetype,
        name,
        category,
        parsedTags,
        description
      );

      if (!aiResult.isValid) {
        return res.status(400).json({ 
          message: aiResult.reason || "Uploaded images do not appear to match the product details." 
        });
      }
      
      aiGeneratedTags = aiResult.generatedTags;
      thumbnail = await uploadToCloudinary(thumbnailFile.buffer);
    }

    let galleryImages = [];
    if (req.files && req.files.images) {
      const uploadPromises = req.files.images.map((file) =>
        uploadToCloudinary(file.buffer)
      );
      galleryImages = await Promise.all(uploadPromises);
    }

    const allImages = [thumbnail, ...galleryImages].filter(Boolean);
    if (aiGeneratedTags && aiGeneratedTags.length > 0) {
      const existingTagsSet = new Set(parsedTags.map(t => t.toLowerCase()));
      aiGeneratedTags.forEach(tag => {
        if (!existingTagsSet.has(tag.toLowerCase())) {
          parsedTags.push(tag);
        }
      });
    }

    const product = await Product.create({
      seller: req.seller._id,
      name,
      description,
      price: Number(price),
      mrp: Number(mrp),
      stock: Number(stock),
      countInStock: Number(stock),
      category,
      subCategory,
      brand,
      thumbnail,
      images: galleryImages,
      tags: parsedTags,
      isFeatured: isFeatured === "true" || isFeatured === true,
      isBestSeller: isBestSeller === "true" || isBestSeller === true,
    });

    // ✅ INVALIDATE CACHE
    await clearProductCache(null, req.seller._id);

    res.status(201).json(product);
  } catch (error) {
    console.error("ADD PRODUCT ERROR:", error);
    res.status(500).json({ message: "Server Error: " + error.message });
  }
};

// @desc    Update a product (Supports Merge Logic for Images)
// @route   PUT /api/products/:id
// @access  Private (Seller Only)
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.seller.toString() !== req.seller._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to edit this product" });
    }

    // --- Image Handling Logic ---
    if (req.files && req.files.thumbnail) {
      product.thumbnail = await uploadToCloudinary(
        req.files.thumbnail[0].buffer
      );
    } else if (req.body.existingThumbnail) {
      product.thumbnail = req.body.existingThumbnail;
    }

    let finalImages = [];
    if (req.body.existingImages) {
      if (Array.isArray(req.body.existingImages)) {
        finalImages = req.body.existingImages;
      } else {
        finalImages = [req.body.existingImages];
      }
    }

    if (req.files && req.files.images) {
      const uploadPromises = req.files.images.map((file) =>
        uploadToCloudinary(file.buffer)
      );
      const newImageUrls = await Promise.all(uploadPromises);
      finalImages = [...finalImages, ...newImageUrls];
    }

    if (finalImages.length > 0) {
      product.images = finalImages;
    } else if (
      req.body.existingImages === undefined &&
      req.files?.images === undefined
    ) {
      // Keep existing
    } else {
      product.images = [];
    }

    // --- Text Field Updates ---
    product.name = req.body.name || product.name;
    product.price = req.body.price || product.price;
    product.mrp = req.body.mrp || product.mrp;
    product.description = req.body.description || product.description;
    product.brand = req.body.brand || product.brand;
    product.category = req.body.category || product.category;
    product.stock = req.body.stock || product.stock;
    product.countInStock = req.body.stock || product.countInStock;

    if (req.body.tags) {
      try {
        product.tags = JSON.parse(req.body.tags);
      } catch (e) {
        product.tags = req.body.tags.split(",").map((t) => t.trim());
      }
    }

    if (req.body.isFeatured !== undefined)
      product.isFeatured = req.body.isFeatured === "true";
    if (req.body.isBestSeller !== undefined)
      product.isBestSeller = req.body.isBestSeller === "true";

    const updatedProduct = await product.save();

    // ✅ INVALIDATE CACHE
    await clearProductCache(product._id, req.seller._id);

    res.json(updatedProduct);
  } catch (error) {
    console.error("UPDATE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private (Seller Only)
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      if (product.seller.toString() !== req.seller._id.toString()) {
        return res
          .status(403)
          .json({ message: "Not authorized to delete this product" });
      }

      await product.deleteOne();

      // ✅ INVALIDATE CACHE
      await clearProductCache(req.params.id, req.seller._id);

      res.json({ message: "Product removed" });
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================================
   REVIEW ROUTES
========================================= */

// @desc    Create new review
// @route   POST /api/products/:id/reviews
// @access  Private
export const createProductReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!req.params.id || req.params.id.match(/^[0-9a-fA-F]{24}$/) === null) {
      return res.status(400).json({ message: "Invalid Product ID format" });
    }

    const product = await Product.findById(req.params.id);

    if (product) {
      const alreadyReviewed = product.reviews.find(
        (r) => r.user.toString() === req.user._id.toString()
      );
      if (alreadyReviewed) {
        return res.status(400).json({ message: "Product already reviewed" });
      }

      const review = {
        name: req.user.name,
        rating: Number(rating),
        comment,
        user: req.user._id,
      };

      product.reviews.push(review);
      product.numReviews = product.reviews.length;
      product.rating =
        product.reviews.reduce((acc, item) => item.rating + acc, 0) /
        product.reviews.length;

      await product.save();

      // ✅ INVALIDATE CACHE
      await clearProductCache(product._id);

      res.status(201).json({ message: "Review added" });
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    console.error("Review Error:", error);
    res.status(500).json({ message: "Server Error: " + error.message });
  }
};
