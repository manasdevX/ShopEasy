import Product from "../models/Product.js";
import cloudinary from "cloudinary";
import streamifier from "streamifier";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Helper: Upload Buffer to Cloudinary
 * Wraps the upload stream in a Promise for async/await usage
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

// @desc    Fetch all products with Search/Filter functionality
// @route   GET /api/products
// @access  Public
export const getAllProducts = async (req, res) => {
  try {
    const { keyword, category } = req.query;

    // 1. Build Query Object
    let query = {};

    // Global Search: Matches keyword against Name, Description, Category, or Tags
    if (keyword) {
      const regex = { $regex: keyword, $options: "i" };
      query.$or = [
        { name: regex },
        { description: regex },
        { category: regex },
        { brand: regex },
        { tags: regex },
      ];
    }

    // Direct Category Filter
    if (category) {
      query.category = category;
    }

    const products = await Product.find(query).sort({ createdAt: -1 });
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

    // 1. Upload Thumbnail
    let thumbnail = "";
    if (req.files && req.files.thumbnail) {
      thumbnail = await uploadToCloudinary(req.files.thumbnail[0].buffer);
    }

    // 2. Upload Gallery Images
    let galleryImages = [];
    if (req.files && req.files.images) {
      const uploadPromises = req.files.images.map((file) =>
        uploadToCloudinary(file.buffer)
      );
      galleryImages = await Promise.all(uploadPromises);
    }

    // Combine Thumbnail + Gallery into one "images" array for frontend slider
    const allImages = [thumbnail, ...galleryImages].filter(Boolean);

    // 3. Parse Tags
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
      images: allImages,
      tags: parsedTags,
      isFeatured: isFeatured === "true" || isFeatured === true,
      isBestSeller: isBestSeller === "true" || isBestSeller === true,
    });

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

    // Security Check: Only owner can update
    if (product.seller.toString() !== req.seller._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to edit this product" });
    }

    // --- 1. HANDLE THUMBNAIL ---
    // If new file uploaded, use it. Else if existing URL sent, keep it.
    if (req.files && req.files.thumbnail) {
      product.thumbnail = await uploadToCloudinary(
        req.files.thumbnail[0].buffer
      );
    } else if (req.body.existingThumbnail) {
      product.thumbnail = req.body.existingThumbnail;
    }

    // --- 2. HANDLE GALLERY IMAGES (MERGE LOGIC) ---
    let finalImages = [];

    // Part A: Keep existing images sent from frontend
    if (req.body.existingImages) {
      if (Array.isArray(req.body.existingImages)) {
        finalImages = req.body.existingImages;
      } else {
        finalImages = [req.body.existingImages]; // Handle single URL string case
      }
    }

    // Part B: Upload and add new images
    if (req.files && req.files.images) {
      const uploadPromises = req.files.images.map((file) =>
        uploadToCloudinary(file.buffer)
      );
      const newImageUrls = await Promise.all(uploadPromises);
      finalImages = [...finalImages, ...newImageUrls];
    }

    // Part C: Update the product images array
    // We update IF there are final images OR if the user is explicitly sending new files/existing data
    // This prevents wiping the gallery if the frontend sends nothing
    if (finalImages.length > 0) {
      product.images = finalImages;
    } else if (
      req.body.existingImages === undefined &&
      req.files?.images === undefined
    ) {
      // If both are undefined, do NOT touch product.images (user didn't edit gallery)
    } else {
      // If fields were present but empty, it means user deleted everything
      product.images = [];
    }

    // --- 3. UPDATE TEXT FIELDS ---
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

    // Handle Booleans
    if (req.body.isFeatured !== undefined) {
      product.isFeatured = req.body.isFeatured === "true";
    }
    if (req.body.isBestSeller !== undefined) {
      product.isBestSeller = req.body.isBestSeller === "true";
    }

    const updatedProduct = await product.save();
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
