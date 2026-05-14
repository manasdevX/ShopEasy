/**
 * ─────────────────────────────────────────────────────────────
 *  searchIntent.js — Search Intent Parser
 * ─────────────────────────────────────────────────────────────
 *  Parses raw search queries into structured intent objects
 *  using the taxonomy engine. Detects primary intent, price
 *  hints, brand hints, filter terms, and specificity level.
 *  Pure JS — zero external dependencies.
 * ─────────────────────────────────────────────────────────────
 */

import {
  findTermInTaxonomy,
  isKnownBrand,
  lookupAlias,
  getBroadCategoryLabel,
} from "./searchTaxonomy.js";

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of",
  "with", "by", "from", "is", "it", "this", "that", "are", "was", "be",
  "has", "had", "not", "no", "so", "if", "all", "any", "its", "my", "our", "your",
  "i", "me", "we", "you", "he", "she", "they", "them", "his", "her", "their",
  "do", "does", "did", "will", "would", "could", "should", "can", "may",
  "very", "just", "also", "than", "then", "here", "there", "when", "where",
  "what", "which", "who", "how", "some", "other", "about", "into", "over",
  "such", "only", "own", "same", "so", "too", "up", "down", "out", "off",
  "buy", "want", "need", "get", "find", "search", "looking", "look", "show",
  "best", "good", "great", "nice", "top", "popular", "trending", "new",
  "cheap", "affordable", "expensive", "premium", "budget", "quality",
  "online", "shop", "store", "purchase", "order",
]);

const PRICE_PATTERNS = [
  { regex: /\bunder\s+(\d+)\b/i, extract: (m) => ({ max: Number(m[1]) }) },
  { regex: /\bbelow\s+(\d+)\b/i, extract: (m) => ({ max: Number(m[1]) }) },
  { regex: /\babove\s+(\d+)\b/i, extract: (m) => ({ min: Number(m[1]) }) },
  { regex: /\bover\s+(\d+)\b/i, extract: (m) => ({ min: Number(m[1]) }) },
  { regex: /\bbetween\s+(\d+)\s+(?:and|to|-)\s+(\d+)\b/i, extract: (m) => ({ min: Number(m[1]), max: Number(m[2]) }) },
  { regex: /\b(\d+)\s*(?:to|-)\s*(\d+)\b/, extract: (m) => ({ min: Number(m[1]), max: Number(m[2]) }) },
  { regex: /\brs\.?\s*(\d+)/i, extract: (m) => ({ max: Number(m[1]) }) },
  { regex: /\b₹\s*(\d+)/i, extract: (m) => ({ max: Number(m[1]) }) },
];

const normalizeText = (text = "") =>
  String(text)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['']/g, "'")
    .replace(/[^\w\s\-₹.]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const tokenize = (text = "") =>
  normalizeText(text)
    .split(/[\s\-_/.,+]+/)
    .map((t) => t.trim())
    .filter(Boolean);

/**
 * Parse a raw search query into a structured intent object
 * @param {string} rawQuery - The raw user query
 * @returns {Object} Parsed intent
 */
export const parseSearchIntent = (rawQuery = "") => {
  const originalQuery = rawQuery.trim();
  const normalizedQuery = normalizeText(originalQuery);
  const allTokens = tokenize(originalQuery);

  const result = {
    originalQuery,
    normalizedQuery,
    tokens: allTokens,
    meaningfulTokens: [],
    primaryIntent: null,
    taxonomyMatch: null,
    specificity: "unknown",
    broadCategory: null,
    broadCategoryLabel: null,
    filterTerms: [],
    priceHint: null,
    brandHint: null,
  };

  if (!allTokens.length) return result;

  let priceHint = null;
  for (const pattern of PRICE_PATTERNS) {
    const match = normalizedQuery.match(pattern.regex);
    if (match) {
      priceHint = pattern.extract(match);
      break;
    }
  }
  result.priceHint = priceHint;

  let brandHint = null;
  for (const token of allTokens) {
    if (isKnownBrand(token)) {
      brandHint = token.toLowerCase();
      break;
    }
  }

  if (!brandHint) {
    for (let i = 0; i < allTokens.length - 1; i++) {
      const bigram = `${allTokens[i]} ${allTokens[i + 1]}`;
      if (isKnownBrand(bigram)) {
        brandHint = bigram.toLowerCase();
        break;
      }
    }
  }
  result.brandHint = brandHint;

  const meaningfulTokens = allTokens.filter((t) => !STOPWORDS.has(t) && t.length >= 2);
  result.meaningfulTokens = meaningfulTokens.length > 0 ? meaningfulTokens : allTokens.filter((t) => t.length >= 2);

  let bestMatch = null;
  let bestSpecificity = null;

  const normalizedFull = normalizedQuery;
  const fullMatch = findTermInTaxonomy(normalizedFull);
  if (fullMatch) {
    bestMatch = fullMatch;
    bestSpecificity = fullMatch.specificity;
  }

  if (!bestMatch && allTokens.length >= 2) {
    for (let len = Math.min(allTokens.length, 4); len >= 2; len--) {
      for (let start = 0; start <= allTokens.length - len; start++) {
        const phrase = allTokens.slice(start, start + len).join(" ");
        const phraseMatch = findTermInTaxonomy(phrase);
        if (phraseMatch) {
          if (!bestMatch || phraseMatch.specificity === "narrow") {
            bestMatch = phraseMatch;
            bestSpecificity = phraseMatch.specificity;
          }
          if (bestSpecificity === "narrow") break;
        }
      }
      if (bestSpecificity === "narrow") break;
    }
  }

  if (!bestMatch || bestSpecificity !== "narrow") {
    for (const token of result.meaningfulTokens) {
      if (token === brandHint) continue;
      const tokenMatch = findTermInTaxonomy(token);
      if (tokenMatch) {
        if (!bestMatch) {
          bestMatch = tokenMatch;
          bestSpecificity = tokenMatch.specificity;
        } else if (tokenMatch.specificity === "narrow" && bestSpecificity !== "narrow") {
          bestMatch = tokenMatch;
          bestSpecificity = tokenMatch.specificity;
        }
      }
    }
  }

  if (bestMatch) {
    result.taxonomyMatch = bestMatch;
    result.primaryIntent = bestMatch.term;
    result.specificity = bestMatch.specificity;
    result.broadCategory = bestMatch.rootKey;
    result.broadCategoryLabel = getBroadCategoryLabel(bestMatch.rootKey);
  }

  const intentTerms = new Set();
  if (bestMatch) {
    intentTerms.add(bestMatch.term);
    if (bestMatch.matchedTerms) bestMatch.matchedTerms.forEach((t) => intentTerms.add(t));
  }
  if (brandHint) intentTerms.add(brandHint);

  result.filterTerms = result.meaningfulTokens.filter(
    (t) => !intentTerms.has(t) && !STOPWORDS.has(t)
  );

  return result;
};

/**
 * Generate a stable hash for intent-based cache keys
 * @param {Object} intent - Parsed search intent
 * @returns {string} Hash string
 */
export const intentCacheHash = (intent) => {
  const parts = [
    intent.specificity || "unknown",
    intent.broadCategory || "none",
    intent.primaryIntent || "none",
    intent.brandHint || "none",
  ];
  return parts.join(":");
};
