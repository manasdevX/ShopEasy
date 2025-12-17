import Product from "../models/Product.js";

const createProduct = async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json(product);
};

const getAllProducts = async (req, res) => {
  const products = await Product.find();
  res.json(products);
};

export { createProduct, getAllProducts };
