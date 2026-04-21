/**
 * ─────────────────────────────────────────────────────────────
 *  intent.service.js — Intent Detection & Entity Extraction
 * ─────────────────────────────────────────────────────────────
 *  Provides rule-based intent classification and entity extraction
 *  as a lightweight pre-processing step before LLM processing.
 *  This helps the fallback system work even without an LLM,
 *  and provides intent metadata for analytics/logging.
 * ─────────────────────────────────────────────────────────────
 */

const normalize = (value = "") => value.toString().toLowerCase().trim();

// ── Intent Patterns (ordered by specificity: most specific first) ──

const INTENT_PATTERNS = [
  {
    type: "GREETING",
    patterns: [
      "hello", "hi", "hey", "good morning", "good evening",
      "good afternoon", "howdy", "what's up", "sup",
    ],
    exact: ["hi", "hey", "hello"],
  },
  {
    type: "ORDER_TRACKING",
    patterns: [
      "track", "my order", "order status", "where is my order",
      "order update", "order tracking", "delivery status",
      "when will i get", "when will my order", "dispatch",
      "shipped", "out for delivery", "my orders", "recent order",
      "last order", "latest order", "cancel order", "cancel my order",
    ],
  },
  {
    type: "PRODUCT_DETAILS",
    patterns: [
      "details of", "details about", "tell me about", "spec",
      "specification", "availability of", "is it available",
      "in stock", "out of stock", "price of", "how much is",
      "how much does", "what is the price",
    ],
  },
  {
    type: "FAQ_SUPPORT",
    patterns: [
      "shipping", "delivery time", "shipping cost", "free shipping",
      "refund", "return", "return policy", "exchange", "replacement",
      "cancel", "cancellation", "payment", "payment method", "cod",
      "cash on delivery", "payment failed", "warranty", "guarantee",
      "support", "help", "contact", "customer service",
      "seller", "sell on", "become a seller", "commission",
      "account", "password", "change email", "forgot password",
    ],
  },
  {
    type: "PRODUCT_SEARCH",
    patterns: [
      "show", "find", "recommend", "looking for", "search",
      "under", "best", "buy", "want", "need", "suggest",
      "trending", "popular", "top", "cheap", "affordable",
      "budget", "compare", "alternative", "similar",
      "phones", "laptops", "headphones", "shoes", "clothes",
      "electronics", "watch", "camera", "tablet",
    ],
  },
];

/**
 * Detect the primary intent from user message.
 * Returns one of: GREETING, ORDER_TRACKING, PRODUCT_DETAILS,
 * FAQ_SUPPORT, PRODUCT_SEARCH, GENERAL
 */
export const detectIntent = (message = "") => {
  const text = normalize(message);
  if (!text) return "GENERAL";

  // Check for exact matches first (e.g., just "hi")
  for (const intent of INTENT_PATTERNS) {
    if (intent.exact && intent.exact.includes(text)) {
      return intent.type;
    }
  }

  // Score-based matching: count how many patterns hit
  let bestType = "GENERAL";
  let bestScore = 0;

  for (const intent of INTENT_PATTERNS) {
    let score = 0;
    for (const pattern of intent.patterns) {
      if (text.includes(pattern)) {
        score += pattern.split(" ").length; // Multi-word patterns get higher score
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestType = intent.type;
    }
  }

  return bestType;
};

/**
 * Extract price budget from message.
 * Handles: "under 20000", "below Rs 15000", "less than 5000", "max 10k"
 */
export const extractPriceBudget = (message = "") => {
  const text = normalize(message);

  // Handle "10k", "20k" etc.
  const kMatch = text.match(/(?:under|below|less than|max|within|budget)\s*(?:rs?\s*\.?\s*)?(\d+)\s*k\b/i);
  if (kMatch) {
    const value = Number(kMatch[1]) * 1000;
    return Number.isFinite(value) ? value : null;
  }

  // Handle regular numbers
  const match = text.match(/(?:under|below|less than|max|within|budget)\s*(?:rs?\s*\.?\s*)?(\d{3,})/i);
  if (match) {
    const value = Number(match[1]);
    return Number.isFinite(value) ? value : null;
  }

  // Handle "Rs 20000" without a qualifier (still likely a budget)
  const priceOnly = text.match(/(?:rs?\s*\.?\s*)(\d{3,})/i);
  if (priceOnly && text.match(/\b(phone|laptop|headphone|shoe|watch|tablet|camera|tv)\b/i)) {
    const value = Number(priceOnly[1]);
    return Number.isFinite(value) ? value : null;
  }

  return null;
};

/**
 * Extract order reference from message (MongoDB ID or short reference).
 */
export const extractOrderReference = (message = "") => {
  const text = normalize(message);

  // Full 24-char MongoDB ObjectId
  const fullMatch = text.match(/\b([a-f0-9]{24})\b/i);
  if (fullMatch) return fullMatch[1].toLowerCase();

  // Short order reference like #A1B2C3 or A1B2C3
  const shortMatch = text.match(/#?([a-f0-9]{6,12})\b/i);
  return shortMatch ? shortMatch[1].toLowerCase() : null;
};

/**
 * Extract clean search query from user message by removing
 * common filler words and command words.
 */
export const extractSearchQuery = (message = "") => {
  const cleaned = normalize(message)
    .replace(
      /\b(show|find|search|recommend|please|for me|product|products|under|below|less than|max|price|details|about|me|some|the|a|an|can you|could you|i want|i need|looking for|good|great|suggest|budget|rs|rupees|right now|what's)\b/gi,
      " "
    )
    .replace(/\d+k?\b/g, " ") // Remove price numbers
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || normalize(message);
};

/**
 * Extract category hint from message.
 */
export const extractCategory = (message = "") => {
  const text = normalize(message);

  const CATEGORY_MAP = {
    phone: "Smartphones",
    mobile: "Smartphones",
    smartphone: "Smartphones",
    laptop: "Laptops",
    notebook: "Laptops",
    headphone: "Headphones",
    earphone: "Headphones",
    earbud: "Headphones",
    shoe: "Footwear",
    sneaker: "Footwear",
    watch: "Watches",
    smartwatch: "Watches",
    camera: "Cameras",
    tablet: "Tablets",
    tv: "Televisions",
    television: "Televisions",
    clothing: "Clothing",
    shirt: "Clothing",
    tshirt: "Clothing",
    jeans: "Clothing",
  };

  for (const [keyword, category] of Object.entries(CATEGORY_MAP)) {
    if (text.includes(keyword)) return category;
  }

  return null;
};
