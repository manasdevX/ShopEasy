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
        "_id name price mrp stock isAvailable description thumbnail category brand rating numReviews discountPercentage isFeatured isBestSeller embeddings"
      )
      .lean();

    if (products.length === 0) {
      console.warn("⚠️ Semantic search: no products with embeddings found");
      return [];
    }

    // Score each product by cosine similarity
    const scored = products.map((product) => ({
      product,
      score: cosineSimilarity(queryVector, product.embeddings),
    }));

    // Sort descending by score
    scored.sort((a, b) => b.score - a.score);

    // Return top-K products above the similarity threshold
    const SIMILARITY_THRESHOLD = 0.35;
    const results = scored
      .filter((s) => s.score > SIMILARITY_THRESHOLD)
      .slice(0, limit)
      .map((s) => {
        // Strip embeddings from the returned object to keep payloads small
        const { embeddings, ...productWithoutEmbeddings } = s.product;
        return productWithoutEmbeddings;
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
