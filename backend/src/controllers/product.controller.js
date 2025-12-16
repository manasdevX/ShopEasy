const Product = require("../models/Product");

const createProduct = async (req, res) => {
  const product = new Product(req.body);
  await product.save();
  res.status(201).json(product);
};

const getAllProducts = async (req, res) => {
  const products = await Product.find();
  res.json(products);
};

module.exports = {
  createProduct,
  getAllProducts,
};
