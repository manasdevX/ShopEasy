import Product from "../models/Product.js";
import cloudinary from "cloudinary";
import streamifier from "streamifier";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Helper: Upload Buffer to Cloudinary
 * Configured inside the function to ensure process.env variables are loaded
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

/* =========================================
   PUBLIC ROUTES
========================================= */

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Fetch single product by ID
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "reviews.user",
      "name"
    );

    if (product) {
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
    const products = await Product.find({ seller: req.seller._id }).sort({
      createdAt: -1,
    });
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

    // 1. Handle Thumbnail Upload
    let thumbnail = "";
    if (req.files && req.files.thumbnail) {
      thumbnail = await uploadToCloudinary(req.files.thumbnail[0].buffer);
    }

    // 2. Handle Gallery Images Upload
    let images = [];
    if (req.files && req.files.images) {
      const uploadPromises = req.files.images.map((file) =>
        uploadToCloudinary(file.buffer)
      );
      images = await Promise.all(uploadPromises);
    }

    // 3. Create Product in DB
    const product = await Product.create({
      seller: req.seller._id,
      name,
      description,
      price,
      mrp,
      stock,
      category,
      subCategory,
      brand,
      thumbnail,
      images,
      tags: tags ? tags.split(",").map((t) => t.trim()) : [],
      isFeatured: isFeatured === "true" || isFeatured === true,
      isBestSeller: isBestSeller === "true" || isBestSeller === true,
    });

    res.status(201).json(product);
  } catch (error) {
    console.error("ADD PRODUCT ERROR:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private (Seller Only)
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      // Security Check: Seller must own the product
      if (product.seller.toString() !== req.seller._id.toString()) {
        return res
          .status(403)
          .json({ message: "Not authorized to edit this product" });
      }

      // 1. Handle Image Updates if new files are provided
      if (req.files && req.files.thumbnail) {
        product.thumbnail = await uploadToCloudinary(
          req.files.thumbnail[0].buffer
        );
      }

      if (req.files && req.files.images) {
        const uploadPromises = req.files.images.map((file) =>
          uploadToCloudinary(file.buffer)
        );
        product.images = await Promise.all(uploadPromises);
      }

      // 2. Update Fields
      product.name = req.body.name || product.name;
      product.price = req.body.price || product.price;
      product.mrp = req.body.mrp || product.mrp;
      product.description = req.body.description || product.description;
      product.brand = req.body.brand || product.brand;
      product.category = req.body.category || product.category;
      product.stock = req.body.stock || product.stock;

      if (req.body.tags) {
        product.tags = req.body.tags.split(",").map((t) => t.trim());
      }

      product.isFeatured = req.body.isFeatured ?? product.isFeatured;
      product.isBestSeller = req.body.isBestSeller ?? product.isBestSeller;

      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
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
      // Security Check: Seller must own the product
      if (product.seller.toString() !== req.seller._id.toString()) {
        return res
          .status(403)
          .json({ message: "Not authorized to delete this product" });
      }

      await product.deleteOne();
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
// @access  Private (Users)
export const createProductReview = async (req, res) => {
  const { rating, comment } = req.body;
  const product = await Product.findById(req.params.id);

  if (product) {
    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );
    if (alreadyReviewed)
      return res.status(400).json({ message: "Product already reviewed" });

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
    res.status(201).json({ message: "Review added" });
  } else {
    res.status(404).json({ message: "Product not found" });
  }
};
