/**
 * ─────────────────────────────────────────────────────────────
 *  vectorStore.js — Embedding Generation & Semantic Search
 * ─────────────────────────────────────────────────────────────
 *  Uses Google's text-embedding-004 model via @google/genai
 *  to generate vector embeddings for product text, and performs
 *  cosine-similarity-based semantic search against the
 *  Product collection for RAG context retrieval.
 * ─────────────────────────────────────────────────────────────
 */

import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import Product from "../models/Product.js";

dotenv.config();

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// ── Embedding Generation ──

export const generateEmbedding = async (text) => {
  try {
    if (!text || !text.trim()) return null;

    const result = await genAI.models.embedContent({
      model: "gemini-embedding-001",
      contents: [
        {
          role: "user",
          parts: [{ text }],
        },
      ],
      config: {
        outputDimensionality: 768, // Match existing product embeddings dimension
      },
    });

    const vector = result?.embeddings?.[0]?.values;

    if (!vector || vector.length === 0) {
      return null;
    }

    return vector;
  } catch (err) {
    console.error("❌ Embedding Error:", err.message);
    return null;
  }
};

// ── Cosine Similarity ──

export const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

// ── Semantic Product Search (RAG Retrieval) ──

/**
 * Searches the product catalog using vector similarity.
 * 1. Generates an embedding for the user's query text.
 * 2. Fetches all products that have embeddings from MongoDB.
 * 3. Computes cosine similarity between query and each product.
 * 4. Returns the top-K most similar products above a threshold.
 *
 * @param {string} queryText - The user's natural language query
 * @param {number} limit     - Max number of results to return (default 5)
 * @returns {Array}          - Array of raw product documents
 */
export const semanticProductSearch = async (queryText, limit = 5) => {
  try {
    const queryVector = await generateEmbedding(queryText);
    if (!queryVector) {
      console.warn("⚠️ Semantic search: failed to generate query embedding");
      return [];
    }

    // Fetch products that have embeddings and are available
    const products = await Product.find({
      embeddings: { $exists: true, $not: { $size: 0 } },
      isAvailable: true,
      stock: { $gt: 0 },
    })
      .select(
        "_id name price mrp stock isAvailable description thumbnail category subCategory brand tags rating numReviews discountPercentage isFeatured isBestSeller createdAt embeddings"
      )
      .lean();

    if (products.length === 0) {
      console.warn("⚠️ Semantic search: no products with embeddings found");
      return [];
    }

    // Detect apparel-intent queries to adjust scoring weights
    const APPAREL_KEYWORDS = /\b(clothes|apparel|fashion|outfit|garment|wear|clothing|dress|shirt|pants|jacket|shoe|footwear|attire)\b/i;
    const isApparelIntent = APPAREL_KEYWORDS.test(queryText);

    // Apparel categories for boosting
    const APPAREL_CATEGORIES = new Set([
      "womens-dresses",
      "mens-shirts",
      "tops",
      "bottoms",
      "mens-shoes",
      "womens-shoes",
      "activewear",
      "formal-wear",
      "casual-wear",
      "accessories",
      "outerwear",
      "innerwear",
      "footwear",
      "sunglasses",
      "womens-watches",
      "mens-watches",
    ]);

    const categoryCentroids = new Map();
    const categoryCounts = new Map();

    for (const product of products) {
      const categoryKey = String(product.category || "uncategorized").toLowerCase();
      const existing = categoryCentroids.get(categoryKey) || [];
      if (existing.length === 0) {
        categoryCentroids.set(categoryKey, [...product.embeddings]);
      } else {
        for (let i = 0; i < product.embeddings.length; i++) {
          existing[i] = (existing[i] || 0) + product.embeddings[i];
        }
        categoryCentroids.set(categoryKey, existing);
      }
      categoryCounts.set(categoryKey, (categoryCounts.get(categoryKey) || 0) + 1);
    }

    for (const [categoryKey, centroid] of categoryCentroids.entries()) {
      const count = categoryCounts.get(categoryKey) || 1;
      categoryCentroids.set(
        categoryKey,
        centroid.map((value) => value / count)
      );
    }

    // Adjust weights based on intent: apparel queries use heavier category weighting
    const PRODUCT_WEIGHT = isApparelIntent ? 0.5 : 0.7;
    const CATEGORY_WEIGHT = isApparelIntent ? 0.5 : 0.3;

    // Score each product by a blend of product similarity and category affinity
    const scored = products.map((product) => {
      const productScore = cosineSimilarity(queryVector, product.embeddings);
      const categoryKey = String(product.category || "uncategorized").toLowerCase();
      const categoryScore = cosineSimilarity(
        queryVector,
        categoryCentroids.get(categoryKey) || product.embeddings
      );

      // For apparel-intent queries, apply category boost multiplier
      let finalScore = (productScore * PRODUCT_WEIGHT) + (categoryScore * CATEGORY_WEIGHT);
      if (isApparelIntent && APPAREL_CATEGORIES.has(categoryKey)) {
        finalScore *= 1.3; // 30% boost for apparel categories during apparel-intent queries
      }

      return {
        product,
        score: finalScore,
      };
    });

    // Sort descending by score
    scored.sort((a, b) => b.score - a.score);

    // Return top-K products above the similarity threshold
    const SIMILARITY_THRESHOLD = isApparelIntent ? 0.46 : 0.56;
    const results = scored
      .filter((s) => s.score > SIMILARITY_THRESHOLD)
      .slice(0, limit)
      .map((s, index) => {
        // Strip embeddings from the returned object to keep payloads small
        const { embeddings, ...productWithoutEmbeddings } = s.product;
        return {
          ...productWithoutEmbeddings,
          _semanticScore: s.score,
          _semanticRank: index + 1,
        };
      });

    console.log(
      `🔍 Semantic search: "${queryText}" → ${results.length} results (top score: ${scored[0]?.score?.toFixed(3) || "N/A"})`
    );

    return results;
  } catch (err) {
    console.error("❌ Semantic Search Error:", err.message);
    return [];
  }
};
