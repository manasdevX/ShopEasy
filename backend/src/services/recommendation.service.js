/**
 * Recommendation Engine Service
 * Production-grade personalization with monitoring, error handling, and performance optimization
 */

import User from "../models/User.js";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import redisClient from "../config/redis.js";
import { normalizeCatalogQuery, buildSmartSearchConditions } from "../utils/catalogSearch.js";
import { semanticProductSearch } from "../utils/vectorStore.js";
import { RECOMMENDATION_CONFIG, FEATURE_FLAGS, ERROR_CODES } from "../config/recommendation.config.js";

/**
 * Logger utility with levels
 */
const createLogger = (context) => ({
  debug: (msg, data) => {
    if (RECOMMENDATION_CONFIG.MONITORING.LOG_LEVEL === "debug") {
      console.log(`[REC-DEBUG] [${context}]`, msg, data || "");
    }
  },
  info: (msg, data) => {
    if (["debug", "info"].includes(RECOMMENDATION_CONFIG.MONITORING.LOG_LEVEL)) {
      console.log(`[REC-INFO] [${context}]`, msg, data || "");
    }
  },
  warn: (msg, data) => {
    console.warn(`[REC-WARN] [${context}]`, msg, data || "");
  },
  error: (msg, err) => {
    console.error(`[REC-ERROR] [${context}]`, msg, err || "");
  },
});

/**
 * Metrics tracker for monitoring engine performance
 */
class MetricsTracker {
  constructor() {
    this.metrics = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      avgQueryTime: 0,
      errorCount: 0,
      dedupCount: 0,
    };
    this.queryTimes = [];
  }

  recordRequest(hitOrMiss, queryTimeMs) {
    this.metrics.totalRequests++;
    if (hitOrMiss === "hit") this.metrics.cacheHits++;
    else this.metrics.cacheMisses++;

    this.queryTimes.push(queryTimeMs);
    if (this.queryTimes.length > 100) this.queryTimes.shift();
    this.metrics.avgQueryTime = this.queryTimes.reduce((a, b) => a + b, 0) / this.queryTimes.length;
  }

  recordError() {
    this.metrics.errorCount++;
  }

  recordDedup() {
    this.metrics.dedupCount++;
  }

  getMetrics() {
    return {
      ...this.metrics,
      cacheHitRate: this.metrics.totalRequests > 0 ? (this.metrics.cacheHits / this.metrics.totalRequests).toFixed(2) : 0,
    };
  }
}

const metricsTracker = RECOMMENDATION_CONFIG.MONITORING.ENABLE_METRICS ? new MetricsTracker() : null;

/**
 * ============================================================================
 * HASH & SHUFFLE ALGORITHMS (Deterministic for consistency)
 * ============================================================================
 */

const hashSeed = (value = "") => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const mulberry32 = (seed) => {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

const deterministicShuffle = (items, seedSource) => {
  if (!FEATURE_FLAGS.DETERMINISTIC_SHUFFLE) return items;

  const arr = [...items];
  const random = mulberry32(hashSeed(seedSource));

  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
};

/**
 * ============================================================================
 * SCORING ALGORITHM
 * ============================================================================
 */

/**
 * Score a product for recommendation based on multiple signals
 * @param {Object} product - Product document
 * @param {number} categoryWeight - Weight for this product's category
 * @returns {number} Recommendation score
 */
const scoreRecommendation = (product, categoryWeight = 0) => {
  const { SCORING } = RECOMMENDATION_CONFIG;

  const rating = Math.min(Number(product.rating || 0), 5);
  const reviewSignal = Math.log10(Number(product.numReviews || 0) + 1);
  const discount = Number(product.discountPercentage || 0) / 100;
  const stockSignal = Math.min(Number(product.stock || 0), 30) / 30;
  const featureBoost = product.isFeatured ? SCORING.FEATURED_BOOST : 0;
  const bestsellerBoost = product.isBestSeller ? SCORING.BESTSELLER_BOOST : 0;

  const baseScore =
    (rating / 5) * SCORING.RATING_WEIGHT +
    (reviewSignal / 10) * SCORING.REVIEW_WEIGHT +
    discount * SCORING.DISCOUNT_WEIGHT +
    stockSignal * SCORING.STOCK_WEIGHT +
    featureBoost +
    bestsellerBoost;

  // Apply category weight (0-1 normalized)
  const normalizedCatWeight = Math.min(categoryWeight / SCORING.CATEGORY_WEIGHT_CAP, 1);
  return baseScore * (1 + normalizedCatWeight);
};

/**
 * ============================================================================
 * CACHE OPERATIONS
 * ============================================================================
 */

/**
 * Get cache key for user recommendations
 */
const getCacheKey = (userId) => `${RECOMMENDATION_CONFIG.CACHE.KEY_PREFIX}${userId}`;

/**
 * Get deduplication key for concurrent requests
 */
const getDedupKey = (userId) => `${RECOMMENDATION_CONFIG.CACHE.DEDUP_PREFIX}${userId}`;

/**
 * Check if request is already in progress (deduplication)
 */
const isDuplicate = async (userId) => {
  if (!FEATURE_FLAGS.DEDUPLICATION_ENABLED) return false;

  try {
    const existing = await redisClient.get(getDedupKey(userId));
    return !!existing;
  } catch (err) {
    console.warn("Dedup check failed:", err.message);
    return false;
  }
};

/**
 * Mark request as in-progress
 */
const markInProgress = async (userId) => {
  if (!FEATURE_FLAGS.DEDUPLICATION_ENABLED) return;

  try {
    await redisClient.setEx(getDedupKey(userId), RECOMMENDATION_CONFIG.CACHE.DEDUP_TTL_SECONDS, "1");
  } catch (err) {
    console.warn("Mark in-progress failed:", err.message);
  }
};

/**
 * Clear in-progress marker
 */
const clearInProgress = async (userId) => {
  if (!FEATURE_FLAGS.DEDUPLICATION_ENABLED) return;

  try {
    await redisClient.del([getDedupKey(userId)]);
  } catch (err) {
    console.warn("Clear in-progress failed:", err.message);
  }
};

/**
 * Invalidate user recommendations cache
 */
const invalidateCache = async (userId) => {
  if (!FEATURE_FLAGS.CACHE_ENABLED) return;

  try {
    await redisClient.del([getCacheKey(userId)]);
  } catch (err) {
    console.error("Cache invalidation failed:", err.message);
  }
};

/**
 * ============================================================================
 * CORE ALGORITHM
 * ============================================================================
 */

/**
 * Build weighted category preferences from user behavior
 */
const buildWeightedCategories = (user) => {
  const weightedCategories = new Map();

  // 1. Factor in recently viewed products (highest recency signal)
  const recentCats = (user.recentlyViewed || [])
    .filter((p) => p && p.category)
    .map((p) => p.category.trim().toLowerCase())
    .reverse();

  recentCats.forEach((cat, idx) => {
    const { RECENCY_BOOST_MIN, RECENCY_DECAY_FACTOR } = RECOMMENDATION_CONFIG.INTEREST_TRACKING;
    const recencyBoost = Math.max(RECENCY_BOOST_MIN, 1 - idx * RECENCY_DECAY_FACTOR);
    weightedCategories.set(cat, (weightedCategories.get(cat) || 0) + recencyBoost);
  });

  // 2. Factor in explicit search/click interests — use raw weight so one search
  // (weight=3.0) outweighs a single passive view (recencyBoost≈1.0), giving
  // search intent the dominant signal it deserves.
  for (const interest of user.interests || []) {
    const cat = interest.category?.trim().toLowerCase();
    if (!cat) continue;

    const { CATEGORY_WEIGHT_CAP } = RECOMMENDATION_CONFIG.SCORING;
    const weight = Math.min(Math.max(Number(interest.weight || 0), 0), CATEGORY_WEIGHT_CAP);
    weightedCategories.set(cat, (weightedCategories.get(cat) || 0) + weight);
  }

  return weightedCategories;
};

/**
 * Generate AI recommendations with all signals
 */
export const generateRecommendations = async (userId, logger) => {
  const startTime = Date.now();

  try {
    // 1. Check cache
    if (FEATURE_FLAGS.CACHE_ENABLED) {
      try {
        const cached = await redisClient.get(getCacheKey(userId));
        if (cached) {
          const queryTime = Date.now() - startTime;
          if (metricsTracker) metricsTracker.recordRequest("hit", queryTime);

          if (queryTime > RECOMMENDATION_CONFIG.MONITORING.SLOW_QUERY_THRESHOLD_MS) {
            logger.warn("Slow cache hit", { queryTimeMs: queryTime });
          }
          logger.debug("Cache hit", { userId, queryTimeMs: queryTime });
          return JSON.parse(cached);
        }
      } catch (err) {
        logger.warn("Cache read failed", err.message);
        if (metricsTracker) metricsTracker.recordRequest("miss", 0);
      }
    }

    // 2. Check for duplicate requests
    if (await isDuplicate(userId)) {
      if (metricsTracker) metricsTracker.recordDedup();
      logger.debug("Duplicate request detected", { userId });
      // Return fallback or cached data
      throw { code: ERROR_CODES.SERVICE_UNAVAILABLE, message: "Request already in progress" };
    }

    await markInProgress(userId);

    // 3. Fetch user with populated data
    const user = await User.findById(userId)
      .populate("recentlyViewed", "category _id")
      .lean()
      .exec();

    if (!user) {
      await clearInProgress(userId);
      throw { code: ERROR_CODES.USER_NOT_FOUND, message: "User not found" };
    }

    // 4. Build weighted categories
    const weightedCategories = buildWeightedCategories(user);
    const prioritizedCats = [...weightedCategories.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([cat]) => cat)
      .slice(0, 6);

    logger.debug("Prioritized categories", { categories: prioritizedCats });

    // 5. Get viewed product IDs to exclude
    const viewedProductIds = (user.recentlyViewed || [])
      .filter(Boolean)
      .map((p) => p._id?.toString?.() || String(p))
      .slice(-6);

    let selected = [];
    const selectedIdSet = new Set();

    // 6. Generate candidates from prioritized categories
    if (prioritizedCats.length > 0) {
      const categoryRegexes = prioritizedCats.map((cat) => new RegExp(`^${cat}$`, "i"));

      const similarProducts = await Product.find({
        category: { $in: categoryRegexes },
        _id: { $nin: viewedProductIds },
        stock: { $gt: 0 },
        isBlocked: { $ne: true },
      })
        .select(
          "_id name price mrp discountPercentage thumbnail images category subCategory brand stock rating numReviews isFeatured isBestSeller createdAt"
        )
        .limit(RECOMMENDATION_CONFIG.RECOMMENDATIONS.CANDIDATE_POOL)
        .lean()
        .exec();

      logger.debug("Candidates fetched", { count: similarProducts.length });

      // 7. Score and organize by category
      const poolByCategory = new Map();
      for (const product of similarProducts) {
        const cat = product.category?.trim().toLowerCase() || "uncategorized";
        const catWeight = weightedCategories.get(cat) || 0;
        const scored = {
          ...product,
          _recScore: scoreRecommendation(product, catWeight),
        };

        if (!poolByCategory.has(cat)) poolByCategory.set(cat, []);
        poolByCategory.get(cat).push(scored);
      }

      // 8. Deterministic shuffle by category
      const dayBucket = new Date().toISOString().slice(0, 10);
      for (const [cat, catItems] of poolByCategory.entries()) {
        poolByCategory.set(
          cat,
          deterministicShuffle(
            catItems.sort((a, b) => b._recScore - a._recScore),
            `${userId}:${dayBucket}:${cat}`
          )
        );
      }

      // 9. Round-robin selection for diversity
      const orderedCats = deterministicShuffle(prioritizedCats, `${userId}:${dayBucket}:category-order`);

      while (selected.length < RECOMMENDATION_CONFIG.RECOMMENDATIONS.TARGET_COUNT) {
        let progressed = false;
        for (const cat of orderedCats) {
          if (selected.length >= RECOMMENDATION_CONFIG.RECOMMENDATIONS.TARGET_COUNT) break;
          const bucket = poolByCategory.get(cat);
          if (!bucket || bucket.length === 0) continue;

          const next = bucket.shift();
          if (!next || selectedIdSet.has(next._id.toString())) continue;

          selected.push(next);
          selectedIdSet.add(next._id.toString());
          progressed = true;
        }

        if (!progressed) break;
      }
    }

    // 10. Fallback strategy
    if (selected.length < RECOMMENDATION_CONFIG.RECOMMENDATIONS.TARGET_COUNT) {
      const currentIds = selected.map((p) => p._id.toString());
      const fallback = await Product.find({
        _id: { $nin: [...currentIds, ...viewedProductIds] },
        stock: { $gt: 0 },
        isBlocked: { $ne: true },
      })
        .select(
          "_id name price mrp discountPercentage thumbnail images category subCategory brand stock rating numReviews isFeatured isBestSeller createdAt"
        )
        .sort({ rating: -1, numReviews: -1, createdAt: -1 })
        .limit(RECOMMENDATION_CONFIG.RECOMMENDATIONS.TARGET_COUNT - selected.length)
        .lean()
        .exec();

      selected = [...selected, ...fallback];
      logger.debug("Fallback triggered", { fallbackCount: fallback.length });
    }

    // 11. Remove scoring artifacts
    const normalizedProducts = selected.map((item) => {
      const { _recScore, ...rest } = item;
      return rest;
    });

    const response = {
      products: normalizedProducts,
      personalized: prioritizedCats.length > 0,
      timestamp: Date.now(),
    };

    // 12. Cache results
    if (FEATURE_FLAGS.CACHE_ENABLED) {
      try {
        await redisClient.setEx(
          getCacheKey(userId),
          RECOMMENDATION_CONFIG.CACHE.TTL_SECONDS,
          JSON.stringify(response)
        );
      } catch (err) {
        logger.warn("Cache write failed", err.message);
      }
    }

    const queryTime = Date.now() - startTime;
    if (metricsTracker) metricsTracker.recordRequest("miss", queryTime);

    if (queryTime > RECOMMENDATION_CONFIG.MONITORING.SLOW_QUERY_THRESHOLD_MS) {
      logger.warn("Slow query", { queryTimeMs: queryTime, userId });
    }

    logger.info("Recommendations generated", { queryTimeMs: queryTime, count: normalizedProducts.length });

    await clearInProgress(userId);
    return response;
  } catch (err) {
    if (metricsTracker) metricsTracker.recordError();
    await clearInProgress(userId);

    logger.error("Recommendation generation failed", err);
    throw err;
  }
};

/**
 * Track user interest from search
 */
export const trackSearchIntent = async (userId, query, logger) => {
  if (!query || query.trim().length < RECOMMENDATION_CONFIG.USER_DATA.MIN_SEARCH_LENGTH) {
    throw { code: ERROR_CODES.INVALID_INPUT, message: "Query too short" };
  }

  try {
    const searchTerm = normalizeCatalogQuery(query.trim());
    const Product = mongoose.model("Product");

    // Find a relevant product/category using broad lexical matching first.
    let matchingProduct = await Product.findOne({
      $or: buildSmartSearchConditions(searchTerm),
    })
      .select("category")
      .lean()
      .exec();

    // Semantic fallback for very broad / fuzzy searches like "ball".
    if (!matchingProduct) {
      try {
        const semanticMatches = await semanticProductSearch(searchTerm, 3);
        matchingProduct = semanticMatches.find((product) => product?.category) || null;
      } catch (semanticError) {
        logger.debug("Semantic search fallback failed", { message: semanticError.message });
      }
    }

    if (!matchingProduct) {
      logger.debug("No matching product found", { searchTerm });
      await invalidateCache(userId);
      return;
    }

    const category = matchingProduct.category;
    const normalizedCat = category.trim().toLowerCase();

    const user = await User.findById(userId);
    if (!user) throw { code: ERROR_CODES.USER_NOT_FOUND, message: "User not found" };

    // Update interests
    const interestIndex = user.interests.findIndex((i) => i.category.toLowerCase() === normalizedCat);

    if (interestIndex > -1) {
      // Boost existing
      user.interests[interestIndex].weight += RECOMMENDATION_CONFIG.INTEREST_TRACKING.SEARCH_WEIGHT_BOOST;
      user.interests[interestIndex].lastInteracted = Date.now();
      const updatedInterest = user.interests.splice(interestIndex, 1)[0];
      user.interests.unshift(updatedInterest);
    } else {
      // Add new
      user.interests.unshift({
        category: normalizedCat,
        weight: RECOMMENDATION_CONFIG.INTEREST_TRACKING.SEARCH_WEIGHT_BOOST,
        lastInteracted: Date.now(),
      });
    }

    // Trim excess interests
    if (user.interests.length > RECOMMENDATION_CONFIG.USER_DATA.MAX_INTERESTS) {
      user.interests.pop();
    }

    await user.save();

    // Invalidate cache
    await invalidateCache(userId);

    logger.info("Search intent tracked", { category, searchTerm });
  } catch (err) {
    logger.error("Track search intent failed", err);
    throw err;
  }
};

/**
 * Track user interest from product click
 */
export const trackProductClick = async (userId, category, productId, logger) => {
  if (!category) {
    throw { code: ERROR_CODES.INVALID_INPUT, message: "Category is required" };
  }

  try {
    const user = await User.findById(userId);
    if (!user) throw { code: ERROR_CODES.USER_NOT_FOUND, message: "User not found" };

    // Update recently viewed
    if (productId) {
      user.recentlyViewed = user.recentlyViewed.filter(
        (id) => id.toString() !== productId.toString()
      );
      user.recentlyViewed.push(productId);

      if (user.recentlyViewed.length > RECOMMENDATION_CONFIG.USER_DATA.MAX_RECENTLY_VIEWED) {
        user.recentlyViewed.shift();
      }
    }

    // Update interests
    const normalizedCat = category.trim().toLowerCase();
    const interestIndex = user.interests.findIndex((i) => i.category.toLowerCase() === normalizedCat);

    if (interestIndex > -1) {
      user.interests[interestIndex].weight += RECOMMENDATION_CONFIG.INTEREST_TRACKING.CLICK_WEIGHT_BOOST;
      user.interests[interestIndex].lastInteracted = Date.now();
      const updatedInterest = user.interests.splice(interestIndex, 1)[0];
      user.interests.unshift(updatedInterest);
    } else {
      user.interests.unshift({
        category: normalizedCat,
        weight: RECOMMENDATION_CONFIG.INTEREST_TRACKING.CLICK_WEIGHT_BOOST,
        lastInteracted: Date.now(),
      });
    }

    if (user.interests.length > RECOMMENDATION_CONFIG.USER_DATA.MAX_INTERESTS) {
      user.interests.pop();
    }

    await user.save();

    // Invalidate cache
    await invalidateCache(userId);

    logger.debug("Product click tracked", { category, productId });
  } catch (err) {
    logger.error("Track product click failed", err);
    throw err;
  }
};

/**
 * Get current metrics for monitoring
 */
export const getMetrics = () => {
  return metricsTracker ? metricsTracker.getMetrics() : null;
};

/**
 * Export logger factory
 */
export const createRecommendationLogger = createLogger;
