/**
 * ─────────────────────────────────────────────────────────────
 *  vectorStore.js — Embedding Generation & Semantic Search (v2)
 * ─────────────────────────────────────────────────────────────
 *  Uses Google's gemini-embedding-001 model via @google/genai
 *  to generate vector embeddings for product text, and performs
 *  cosine-similarity-based semantic search against the
 *  Product collection. Now with intent-aware thresholds,
 *  graceful failure handling, and async embedding queue.
 * ─────────────────────────────────────────────────────────────
 */

import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import Product from "../models/Product.js";

dotenv.config();

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// ── In-Memory Retry Queue for Failed Embeddings ──

const embeddingRetryQueue = [];
let retryTimerActive = false;
const MAX_RETRY_QUEUE = 50;
const RETRY_INTERVAL_MS = 60000;

const processRetryQueue = async () => {
  if (embeddingRetryQueue.length === 0) {
    retryTimerActive = false;
    return;
  }

  const batch = embeddingRetryQueue.splice(0, 5);
  for (const { productId, text } of batch) {
    try {
      const embedding = await generateEmbedding(text);
      if (embedding) {
        await Product.updateOne(
          { _id: productId },
          { $set: { embeddings: embedding } }
        );
      }
    } catch (err) {
      console.error(`Embedding retry failed for ${productId}: ${err.message}`);
    }
  }

  if (embeddingRetryQueue.length > 0) {
    setTimeout(processRetryQueue, RETRY_INTERVAL_MS);
  } else {
    retryTimerActive = false;
  }
};

/**
 * Queue a product for async embedding generation.
 * Does NOT block the caller. Failures are silently retried.
 */
export const queueEmbeddingGeneration = (productId, text) => {
  if (!productId || !text) return;

  if (embeddingRetryQueue.length >= MAX_RETRY_QUEUE) {
    embeddingRetryQueue.shift();
  }

  embeddingRetryQueue.push({ productId, text });

  if (!retryTimerActive) {
    retryTimerActive = true;
    setTimeout(processRetryQueue, 2000);
  }
};

/**
 * Generate embedding for a product and save it asynchronously.
 * This function does NOT block — it fires and forgets.
 */
export const generateAndSaveProductEmbedding = (product) => {
  if (!product || !product._id) return;

  const textParts = [
    product.name,
    product.brand,
    product.category,
    product.subCategory,
    product.description,
    ...(product.tags || []),
  ].filter(Boolean);

  const text = textParts.join(" ").slice(0, 2000);
  if (!text.trim()) return;

  generateEmbedding(text)
    .then(async (embedding) => {
      if (embedding) {
        try {
          await Product.updateOne(
            { _id: product._id },
            { $set: { embeddings: embedding } }
          );
        } catch (saveErr) {
          console.error(`Embedding save failed for ${product._id}: ${saveErr.message}`);
          queueEmbeddingGeneration(product._id, text);
        }
      }
    })
    .catch((err) => {
      console.error(`Embedding generation failed for ${product._id}: ${err.message}`);
      queueEmbeddingGeneration(product._id, text);
    });
};

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
        outputDimensionality: 768,
      },
    });

    const vector = result?.embeddings?.[0]?.values;

    if (!vector || vector.length === 0) {
      return null;
    }

    return vector;
  } catch (err) {
    console.error("Embedding generation error:", err.message);
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

// ── Semantic Product Search (Intent-Aware) ──

/**
 * Searches the product catalog using vector similarity.
 * Now uses intent-aware similarity thresholds.
 *
 * @param {string} queryText - The user's natural language query
 * @param {number} limit     - Max number of results to return (default 5)
 * @param {Object} options   - Optional config { specificity: "broad"|"narrow"|"unknown" }
 * @returns {Array}          - Array of raw product documents
 */
export const semanticProductSearch = async (queryText, limit = 5, options = {}) => {
  try {
    const queryVector = await generateEmbedding(queryText);
    if (!queryVector) {
      return [];
    }

    const products = await Product.find({
      embeddings: { $exists: true, $not: { $size: 0 } },
      isAvailable: { $ne: false },
      stock: { $gt: 0 },
    })
      .select(
        "_id name price mrp stock isAvailable description thumbnail category subCategory brand tags rating numReviews discountPercentage isFeatured isBestSeller createdAt embeddings"
      )
      .lean();

    if (products.length === 0) {
      return [];
    }

    const specificity = options.specificity || "unknown";

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

    const PRODUCT_WEIGHT = specificity === "broad" ? 0.5 : 0.7;
    const CATEGORY_WEIGHT = specificity === "broad" ? 0.5 : 0.3;

    const scored = products.map((product) => {
      const productScore = cosineSimilarity(queryVector, product.embeddings);
      const categoryKey = String(product.category || "uncategorized").toLowerCase();
      const categoryScore = cosineSimilarity(
        queryVector,
        categoryCentroids.get(categoryKey) || product.embeddings
      );

      const finalScore = (productScore * PRODUCT_WEIGHT) + (categoryScore * CATEGORY_WEIGHT);

      return {
        product,
        score: finalScore,
      };
    });

    scored.sort((a, b) => b.score - a.score);

    // Intent-aware thresholds
    let SIMILARITY_THRESHOLD;
    if (specificity === "narrow") {
      SIMILARITY_THRESHOLD = 0.62;
    } else if (specificity === "broad") {
      SIMILARITY_THRESHOLD = 0.52;
    } else {
      SIMILARITY_THRESHOLD = 0.56;
    }

    const results = scored
      .filter((s) => s.score > SIMILARITY_THRESHOLD)
      .slice(0, limit)
      .map((s, index) => {
        const { embeddings, ...productWithoutEmbeddings } = s.product;
        return {
          ...productWithoutEmbeddings,
          _semanticScore: s.score,
          _semanticRank: index + 1,
        };
      });

    return results;
  } catch (err) {
    console.error("Semantic search error:", err.message);
    return [];
  }
};
