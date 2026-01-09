// controllers/vectorController.js
import Product from "../models/Product.js"; // Match your exact model filename
import { generateEmbedding } from "../utils/vectorStore.js";

export const syncProductVectors = async (req, res) => {
  try {
    // 1. Find products with no embeddings
    const products = await Product.find({
      $or: [{ embeddings: { $exists: false } }, { embeddings: { $size: 0 } }]
    });

    if (products.length === 0) {
      return res.status(200).json({ message: "All products already have vectors." });
    }

    console.log(`Found ${products.length} products to vectorize.`);

    for (const product of products) {
      const textToEmbed = `Product: ${product.name}. Brand: ${product.brand}. Description: ${product.description}`;
      const vector = await generateEmbedding(textToEmbed);

      product.embeddings = vector;
      await product.save();
      console.log(`✅ Indexed: ${product.name}`);
    }

    res.status(200).json({ 
      success: true, 
      message: `Successfully synchronized ${products.length} products.` 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};