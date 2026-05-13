/**
 * Recommendation Engine Configuration
 * Production-grade settings for personalization system
 */

export const RECOMMENDATION_CONFIG = {
  // ✅ Cache Settings
  CACHE: {
    TTL_SECONDS: 5 * 60, // 5 minutes
    KEY_PREFIX: "recommendations:v3:",
    TRACKING_KEY_PREFIX: "track-intent:",
    DEDUP_PREFIX: "dedup-rec:",
    DEDUP_TTL_SECONDS: 2, // Prevent duplicate requests
  },

  // ✅ Product Selection
  RECOMMENDATIONS: {
    TARGET_COUNT: 8, // Final products to return
    CANDIDATE_POOL: 240, // Products to score from
    MAX_FALLBACK_ATTEMPTS: 3,
  },

  // ✅ User Data Limits
  USER_DATA: {
    MAX_RECENTLY_VIEWED: 10,
    MAX_INTERESTS: 15,
    MIN_SEARCH_LENGTH: 2,
  },

  // ✅ Scoring Algorithm
  SCORING: {
    RATING_WEIGHT: 0.25,
    REVIEW_WEIGHT: 0.2,
    DISCOUNT_WEIGHT: 0.15,
    STOCK_WEIGHT: 0.15,
    FEATURED_BOOST: 0.08,
    BESTSELLER_BOOST: 0.08,
    CATEGORY_WEIGHT_CAP: 20,
  },

  // ✅ Interest Tracking
  INTEREST_TRACKING: {
    SEARCH_WEIGHT_BOOST: 3.0,
    CLICK_WEIGHT_BOOST: 3.0,
    RECENCY_DECAY_FACTOR: 0.12, // 0.4 min boost for older items
    RECENCY_BOOST_MIN: 0.4,
  },

  // ✅ Performance & Monitoring
  MONITORING: {
    LOG_LEVEL: process.env.LOG_LEVEL || "info", // "debug", "info", "warn", "error"
    SLOW_QUERY_THRESHOLD_MS: 500,
    ENABLE_METRICS: true,
    METRICS_WINDOW_MS: 60 * 1000, // 1 minute
  },

  // ✅ Error Handling
  ERRORS: {
    MAX_RETRIES: 2,
    RETRY_DELAY_MS: 100,
    FALLBACK_ON_ERROR: true,
  },

  // ✅ Rate Limiting
  RATE_LIMIT: {
    ENABLED: true,
    MAX_REQUESTS_PER_MINUTE: 30,
    TRACKING_ENDPOINT_MAX: 60, // More lenient for tracking
  },
};

/**
 * Feature Flags for A/B testing and rollouts
 */
export const FEATURE_FLAGS = {
  PERSONALIZATION_ENABLED: true,
  DETERMINISTIC_SHUFFLE: true,
  CACHE_ENABLED: true,
  MONITORING_ENABLED: true,
  DEDUPLICATION_ENABLED: true,
};

/**
 * Error codes for structured error handling
 */
export const ERROR_CODES = {
  INVALID_INPUT: "INVALID_INPUT",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  CACHE_ERROR: "CACHE_ERROR",
  DB_ERROR: "DB_ERROR",
  ALGORITHM_ERROR: "ALGORITHM_ERROR",
  RATE_LIMITED: "RATE_LIMITED",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
};
