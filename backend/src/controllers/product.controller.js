import Product from "../models/Product.js";

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
export const getAllProducts = async (req, res) => {
  try {
    // Optional: You can add search/pagination logic here later
    const products = await Product.find({});
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

// @desc    Create a product
// @route   POST /api/products
// @access  Private (Seller Only)
export const createProduct = async (req, res) => {
  try {
    // 1. Assign the logged-in seller's ID to the product
    // 'req.seller' comes from the protectSeller middleware
    const productData = {
      ...req.body,
      seller: req.seller._id,
    };

    const product = await Product.create(productData);
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private (Seller Only)
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      // 🔒 SECURITY CHECK: Ensure the seller owns this product
      if (product.seller.toString() !== req.seller._id.toString()) {
        return res
          .status(403)
          .json({ message: "Not authorized to edit this product" });
      }

      // Update fields based on input
      product.name = req.body.name || product.name;
      product.price = req.body.price || product.price;
      product.description = req.body.description || product.description;
      product.image = req.body.image || product.image;
      product.brand = req.body.brand || product.brand;
      product.category = req.body.category || product.category;
      product.stock = req.body.stock || product.stock;

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
      // 🔒 SECURITY CHECK: Ensure the seller owns this product
      if (product.seller.toString() !== req.seller._id.toString()) {
        return res
          .status(403)
          .json({ message: "Not authorized to delete this product" });
      }

      await product.deleteOne(); // Removes product from DB
      res.json({ message: "Product removed" });
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new review
// @route   POST /api/products/:id/reviews
// @access  Private (Users)
export const createProductReview = async (req, res) => {
  const { rating, comment } = req.body;
  const product = await Product.findById(req.params.id);

  if (product) {
    // 1. Check if user already reviewed
    // Note: req.user comes from 'protect' middleware (Customers)
    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      return res.status(400).json({ message: "Product already reviewed" });
    }

    // 2. Create review object
    const review = {
      name: req.user.name,
      rating: Number(rating),
      comment,
      user: req.user._id,
    };

    // 3. Add to array
    product.reviews.push(review);

    // 4. Update NumReviews
    product.numReviews = product.reviews.length;

    // 5. Update Total Rating
    product.rating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;

    await product.save();
    res.status(201).json({ message: "Review added" });
  } else {
    res.status(404).json({ message: "Product not found" });
  }
};
