import Product from "../models/Product.js";
import cloudinary from "cloudinary";
import streamifier from "streamifier";
import dotenv from "dotenv";
import redisClient from "../config/redis.js"; // <--- 1. IMPORT REDIS CLIENT

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

/**
 * Helper: Clear Product Caches
 * Clears specific product ID and any list/search caches to ensure data freshness
 */
const clearProductCache = async (productId = null, sellerId = null) => {
  try {
    // 1. Clear "All Products" search/filter caches (Pattern Match)
    const keys = await redisClient.keys("products:*");
    if (keys.length > 0) {
      await redisClient.del(keys);
    }

    // 2. Clear specific product detail cache
    if (productId) {
      await redisClient.del(`product:${productId}`);
    }

    // 3. Clear specific seller's list cache
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
    // 1. Generate Unique Cache Key based on Query Params
    const cacheKey = `products:${JSON.stringify(req.query)}`;

    // 2. Check Redis
    const cachedResult = await redisClient.get(cacheKey);
    if (cachedResult) {
      console.log("⚡ Serving Search Results from Redis");
      return res.json(JSON.parse(cachedResult));
    }

    const pageSize = Number(req.query.limit) || 12;
    const page = Number(req.query.pageNumber) || 1;

    // --- Base Search Query ---
    let keywordQuery = {};
    if (req.query.keyword) {
      keywordQuery.$or = [
        { name: { $regex: req.query.keyword, $options: "i" } },
        { brand: { $regex: req.query.keyword, $options: "i" } },
        { description: { $regex: req.query.keyword, $options: "i" } },
        { tags: { $regex: req.query.keyword, $options: "i" } },
        { category: { $regex: req.query.keyword, $options: "i" } },
      ];
    }

    // --- Filter Query ---
    let filterQuery = {};
    if (req.query.category) filterQuery.category = req.query.category;
    if (req.query.minPrice || req.query.maxPrice) {
      filterQuery.price = {};
      if (req.query.minPrice)
        filterQuery.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice)
        filterQuery.price.$lte = Number(req.query.maxPrice);
    }
    if (req.query.rating) {
      filterQuery.rating = { $gte: Number(req.query.rating) };
    }

    const finalQuery = { ...keywordQuery, ...filterQuery };

    // --- Execute DB Queries ---
    const [products, count, facetsResult] = await Promise.all([
      Product.find(finalQuery)
        .limit(pageSize)
        .skip(pageSize * (page - 1))
        .sort({ createdAt: -1 }),
      Product.countDocuments(finalQuery),
      Product.aggregate([
        { $match: keywordQuery },
        {
          $facet: {
            categories: [
              { $group: { _id: "$category", count: { $sum: 1 } } },
              { $sort: { count: -1 } },
            ],
            ratings: [
              { $project: { rating: { $floor: "$rating" } } },
              { $group: { _id: "$rating", count: { $sum: 1 } } },
              { $sort: { _id: -1 } },
            ],
          },
        },
      ]),
    ]);

    const responseData = {
      products,
      page,
      pages: Math.ceil(count / pageSize),
      total: count,
      facets: facetsResult[0],
    };

    // 3. Save to Redis (TTL: 1 hour)
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(responseData));

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

    let thumbnail = "";
    if (req.files && req.files.thumbnail) {
      thumbnail = await uploadToCloudinary(req.files.thumbnail[0].buffer);
    }

    let galleryImages = [];
    if (req.files && req.files.images) {
      const uploadPromises = req.files.images.map((file) =>
        uploadToCloudinary(file.buffer)
      );
      galleryImages = await Promise.all(uploadPromises);
    }

    const allImages = [thumbnail, ...galleryImages].filter(Boolean);

    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = JSON.parse(tags);
      } catch (e) {
        parsedTags = tags.split(",").map((t) => t.trim());
      }
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
