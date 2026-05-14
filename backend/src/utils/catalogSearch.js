/**
 * ─────────────────────────────────────────────────────────────
 *  catalogSearch.js — Production Search Core (v2)
 * ─────────────────────────────────────────────────────────────
 *  Intent-aware query building, weighted relevance scoring,
 *  result validation with taxonomy enforcement.
 *  Deterministic normalization and tokenization.
 *  Typo-tolerant matching via Damerau-Levenshtein.
 * ─────────────────────────────────────────────────────────────
 */

import { findTermInTaxonomy, buildTaxonomyRegex, getAllTermsForCategory } from "./searchTaxonomy.js";
import { parseSearchIntent } from "./searchIntent.js";

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of",
  "with", "by", "from", "is", "it", "this", "that", "are", "was", "be",
  "has", "had", "not", "no", "so", "if", "all", "any", "its", "my", "our", "your",
]);

const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeUnicode = (text = "") =>
  String(text)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['']/g, "'")
    .replace(/[^\w\s\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const tokenize = (text = "") =>
  normalizeUnicode(text)
    .split(/[\s\-_/.,+]+/)
    .map((t) => t.trim())
    .filter(Boolean);

const tokenizeQuery = (text = "") => {
  const tokens = tokenize(text);
  const filtered = tokens.filter((t) => !STOPWORDS.has(t));
  return filtered.length > 0 ? filtered : tokens;
};

const getStemVariants = (word = "") => {
  if (!word || word.length < 3) return [word];
  const variants = new Set([word]);

  if (word.endsWith("ies") && word.length > 4) variants.add(`${word.slice(0, -3)}y`);
  if (word.endsWith("es") && word.length > 4) variants.add(word.slice(0, -2));
  if (word.endsWith("s") && !word.endsWith("ss") && word.length > 3) variants.add(word.slice(0, -1));

  if (word.endsWith("ing") && word.length > 5) {
    variants.add(word.slice(0, -3));
    variants.add(`${word.slice(0, -3)}e`);
  }
  if (word.endsWith("ed") && word.length > 4) {
    variants.add(word.slice(0, -2));
    variants.add(word.slice(0, -1));
  }

  variants.add(`${word}s`);
  return [...variants].filter(Boolean);
};

const damerauLevenshtein = (a, b) => {
  if (a === b) return 0;
  if (!a) return b.length;
  if (!b) return a.length;

  const rows = a.length + 1;
  const cols = b.length + 1;
  const dist = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let i = 0; i < rows; i++) dist[i][0] = i;
  for (let j = 0; j < cols; j++) dist[0][j] = j;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dist[i][j] = Math.min(
        dist[i - 1][j] + 1,
        dist[i][j - 1] + 1,
        dist[i - 1][j - 1] + cost
      );

      if (
        i > 1 &&
        j > 1 &&
        a[i - 1] === b[j - 2] &&
        a[i - 2] === b[j - 1]
      ) {
        dist[i][j] = Math.min(dist[i][j], dist[i - 2][j - 2] + cost);
      }
    }
  }

  return dist[a.length][b.length];
};

const getQueryContext = (rawQuery = "") => {
  const normalized = normalizeCatalogQuery(rawQuery);
  const tokens = tokenizeQuery(normalized);
  const tokenVariants = tokens.map((t) => [...new Set(getStemVariants(t))]);
  return {
    normalized,
    phrase: tokens.join(" "),
    tokens,
    tokenVariants,
  };
};

// ─── Exports ────────────────────────────────────────────────

export const normalizeCatalogQuery = (value = "") => {
  if (!value) return "";
  return tokenizeQuery(value).join(" ").slice(0, 240);
};

export const buildCatalogRegexTerms = (value = "") => {
  const { tokens, tokenVariants } = getQueryContext(value);
  if (!tokens.length) return [];

  const terms = new Set();
  tokenVariants.forEach((variants) => variants.forEach((v) => terms.add(v)));
  return [...terms].map((t) => escapeRegex(t));
};

export const buildSmartRegexPatterns = (value = "") => {
  const { tokens, tokenVariants } = getQueryContext(value);
  const exactPatterns = new Set();
  const prefixPatterns = new Set();
  const fuzzyPatterns = new Set();

  tokenVariants.forEach((variants) => {
    variants.forEach((v) => {
      const escaped = escapeRegex(v);
      exactPatterns.add(`\\b${escaped}\\b`);

      if (v.length >= 4) {
        prefixPatterns.add(`\\b${escaped}\\w{0,4}`);
      }

      if (v.length >= 5) {
        const shortPrefix = escapeRegex(v.slice(0, 3));
        fuzzyPatterns.add(`\\b${shortPrefix}\\w{1,${Math.min(v.length + 2, 9)}}`);
      }
    });
  });

  return {
    exactPatterns: [...exactPatterns],
    prefixPatterns: [...prefixPatterns],
    fuzzyPatterns: [...fuzzyPatterns],
    tokens,
  };
};

/**
 * Build intent-aware MongoDB search conditions.
 * For narrow queries, constrains to taxonomy subset.
 * For broad queries, expands to all children.
 */
export const buildSmartSearchConditions = (rawQuery = "", intent = null) => {
  if (!intent) {
    try {
      intent = parseSearchIntent(rawQuery);
    } catch (e) {
      intent = null;
    }
  }

  const taxonomyMatch = intent?.taxonomyMatch;
  const specificity = intent?.specificity;

  if (taxonomyMatch && specificity === "narrow") {
    return buildNarrowSearchConditions(rawQuery, taxonomyMatch, intent);
  }

  if (taxonomyMatch && specificity === "broad") {
    return buildBroadSearchConditions(rawQuery, taxonomyMatch, intent);
  }

  return buildFallbackSearchConditions(rawQuery);
};

const buildNarrowSearchConditions = (rawQuery, taxonomyMatch, intent) => {
  const matchedTerms = taxonomyMatch.matchedTerms || [taxonomyMatch.term];
  const synonyms = taxonomyMatch.synonyms || [];
  const allNarrowTerms = [...new Set([...matchedTerms, ...synonyms, taxonomyMatch.term])];

  const termRegex = buildTaxonomyRegex(allNarrowTerms);
  const conditions = [];

  if (termRegex) {
    conditions.push({ name: { $regex: termRegex } });
    conditions.push({ tags: { $in: allNarrowTerms.map((t) => new RegExp(escapeRegex(t), "i")) } });
    conditions.push({ category: { $regex: termRegex } });
    conditions.push({ subCategory: { $regex: termRegex } });
    conditions.push({ searchKeywords: { $in: allNarrowTerms.map((t) => new RegExp(escapeRegex(t), "i")) } });
  }

  if (intent?.brandHint) {
    conditions.push({ brand: { $regex: new RegExp(escapeRegex(intent.brandHint), "i") } });
  }

  if (intent?.filterTerms?.length) {
    for (const ft of intent.filterTerms) {
      if (ft.length >= 3) {
        conditions.push({ name: { $regex: new RegExp(escapeRegex(ft), "i") } });
        conditions.push({ description: { $regex: new RegExp(escapeRegex(ft), "i") } });
      }
    }
  }

  return conditions;
};

const buildBroadSearchConditions = (rawQuery, taxonomyMatch, intent) => {
  const allChildren = taxonomyMatch.allChildren || taxonomyMatch.matchedTerms || [];
  const aliases = taxonomyMatch.aliases || [];
  const allTerms = [...new Set([...allChildren, ...aliases])];

  const conditions = [];

  if (allTerms.length > 0) {
    const termRegex = buildTaxonomyRegex(allTerms);
    if (termRegex) {
      conditions.push({ name: { $regex: termRegex } });
      conditions.push({ category: { $regex: termRegex } });
      conditions.push({ subCategory: { $regex: termRegex } });
      conditions.push({ tags: { $in: allTerms.map((t) => new RegExp(escapeRegex(t), "i")) } });
      conditions.push({ searchKeywords: { $in: allTerms.map((t) => new RegExp(escapeRegex(t), "i")) } });
    }
  }

  if (intent?.brandHint) {
    conditions.push({ brand: { $regex: new RegExp(escapeRegex(intent.brandHint), "i") } });
  }

  return conditions;
};

const buildFallbackSearchConditions = (rawQuery = "") => {
  const { exactPatterns, prefixPatterns, fuzzyPatterns, tokens } = buildSmartRegexPatterns(rawQuery);
  const conditions = [];
  const primaryFields = ["name", "brand", "category", "subCategory", "tags"];
  const isShortQuery = tokens.some((token) => token.length <= 3);
  const prefixFields = isShortQuery ? ["name", "brand", "category", "subCategory"] : primaryFields;
  const descriptionFields = isShortQuery ? [] : ["description"];

  const addCombinedPatterns = (patterns, fields) => {
    if (!patterns.length) return;
    const combined = patterns.length === 1 ? patterns[0] : `(${patterns.join("|")})`;
    fields.forEach((field) => {
      conditions.push({ [field]: { $regex: combined, $options: "i" } });
    });
  };

  addCombinedPatterns(exactPatterns, primaryFields);
  addCombinedPatterns(prefixPatterns, prefixFields);
  addCombinedPatterns(exactPatterns, descriptionFields);
  addCombinedPatterns(fuzzyPatterns, ["name", "brand"]);

  return conditions;
};

// ─── Token Matching ─────────────────────────────────────────

const scoreTokenMatch = (queryToken, targetToken) => {
  if (!queryToken || !targetToken) return 0;
  if (queryToken === targetToken) return 1;

  const queryStems = getStemVariants(queryToken);
  const targetStems = getStemVariants(targetToken);
  if (queryStems.some((s) => targetStems.includes(s))) return 0.9;

  if (targetToken.startsWith(queryToken) && queryToken.length >= 4) {
    const coverage = queryToken.length / targetToken.length;
    if (coverage >= 0.5) return Math.min(0.85, 0.5 + coverage * 0.35);
  }

  if (queryToken.length >= 4) {
    const maxDistance = queryToken.length <= 5 ? 1 : 2;
    if (Math.abs(queryToken.length - targetToken.length) <= maxDistance) {
      const distance = damerauLevenshtein(queryToken, targetToken);
      if (distance <= maxDistance) {
        return Math.max(0.45, 0.8 - distance * 0.18);
      }
    }
  }

  return 0;
};

const scoreFieldMatch = (queryTokens, fieldValue) => {
  if (!queryTokens.length || !fieldValue) return 0;
  const fieldTokens = tokenize(fieldValue);
  if (!fieldTokens.length) return 0;

  let matched = 0;
  let totalBest = 0;
  const positions = [];

  queryTokens.forEach((queryToken) => {
    let best = 0;
    let bestPos = -1;
    fieldTokens.forEach((fieldToken, idx) => {
      const score = scoreTokenMatch(queryToken, fieldToken);
      if (score > best) {
        best = score;
        bestPos = idx;
      }
    });

    if (best > 0) {
      matched += 1;
      totalBest += best;
      positions.push(bestPos);
    }
  });

  if (!matched) return 0;

  const coverage = matched / queryTokens.length;
  const avgMatch = totalBest / queryTokens.length;
  let score = avgMatch * (0.55 + coverage * 0.45);

  if (positions.length >= 2) {
    const sorted = [...positions].sort((a, b) => a - b);
    const contiguousSpan = sorted[sorted.length - 1] - sorted[0];
    if (contiguousSpan <= positions.length) score += 0.07;

    const inOrder = positions.every((p, i) => i === 0 || p > positions[i - 1]);
    if (inOrder) score += 0.06;
  }

  return Math.min(score, 1);
};

// ─── Lexical Match Helpers ──────────────────────────────────

export const hasMeaningfulLexicalMatch = (product, rawQuery = "") => {
  if (!product || !rawQuery) return false;

  const { tokens, normalized } = getQueryContext(rawQuery);
  if (!tokens.length) return false;

  const fieldWeights = {
    name: 0.4,
    brand: 0.16,
    category: 0.14,
    subCategory: 0.1,
    tags: 0.12,
    description: 0.08,
  };

  let lexicalScore = 0;
  Object.entries(fieldWeights).forEach(([field, weight]) => {
    const value = Array.isArray(product[field]) ? product[field].join(" ") : product[field];
    lexicalScore += scoreFieldMatch(tokens, value) * weight;
  });

  const normalizedName = normalizeUnicode(product.name || "");
  const normalizedCategory = normalizeUnicode(product.category || "");
  const normalizedBrand = normalizeUnicode(product.brand || "");

  if (normalized.length >= 3) {
    if (normalizedName.includes(normalized)) lexicalScore += 0.18;
    if (normalizedCategory.includes(normalized)) lexicalScore += 0.14;
    if (normalizedBrand.includes(normalized)) lexicalScore += 0.12;
  }

  return lexicalScore >= 0.18;
};

export const hasDirectQueryHit = (product, rawQuery = "") => {
  if (!product || !rawQuery) return false;

  const { tokens } = getQueryContext(rawQuery);
  if (!tokens.length) return false;

  const searchableFields = [product.name, product.brand, product.category, product.subCategory];
  const tokensToCheck = tokens.flatMap((token) => getStemVariants(token));

  return searchableFields.some((fieldValue) => {
    const normalizedField = normalizeUnicode(fieldValue || "");
    if (!normalizedField) return false;

    return tokensToCheck.some((token) => {
      if (!token) return false;
      return normalizedField === token || normalizedField.includes(token);
    });
  });
};

// ─── Query Correction ───────────────────────────────────────

const buildProductTextVocabulary = (products = []) => {
  const vocab = new Set();
  products.forEach((product) => {
    [product?.name, product?.brand, product?.category, product?.subCategory, ...(Array.isArray(product?.tags) ? product.tags : [])]
      .filter(Boolean)
      .forEach((segment) => {
        tokenize(segment).forEach((t) => {
          if (t.length >= 3) vocab.add(t);
        });
      });
  });
  return [...vocab];
};

export const suggestQueryCorrection = (rawQuery = "", products = []) => {
  const queryTokens = tokenizeQuery(rawQuery);
  if (!queryTokens.length || !products.length) return null;
  if (queryTokens.length !== 1) return null;

  const vocabulary = buildProductTextVocabulary(products);
  if (!vocabulary.length) return null;

  let replacements = 0;
  const corrected = queryTokens.map((token) => {
    if (token.length < 4) return token;

    const hasNaturalHit = vocabulary.some(
      (candidate) =>
        candidate === token ||
        candidate.startsWith(token) ||
        token.startsWith(candidate) ||
        candidate.includes(token)
    );

    if (hasNaturalHit) return token;

    let bestWord = token;
    let bestDistance = Infinity;

    vocabulary.forEach((candidate) => {
      if (candidate[0] !== token[0]) return;
      if (token.length >= 5 && candidate[1] && token[1] && candidate[1] !== token[1]) return;
      if (Math.abs(candidate.length - token.length) > 2) return;

      const distance = damerauLevenshtein(token, candidate);
      if (distance < bestDistance && distance <= 2) {
        bestDistance = distance;
        bestWord = candidate;
      }
    });

    if (bestWord !== token) replacements += 1;
    return bestWord;
  });

  if (replacements === 0) return null;
  const correctedQuery = corrected.join(" ");
  return correctedQuery === normalizeCatalogQuery(rawQuery) ? null : correctedQuery;
};

// ─── Product Scoring (v2 — Multi-Signal Weighted) ───────────

const MINIMUM_RELEVANCE_THRESHOLD = 25;

const SCORE_WEIGHTS = {
  EXACT_NAME_MATCH: 100,
  NAME_TOKEN_MATCH: 60,
  TAXONOMY_CATEGORY_MATCH: 80,
  TAGS_MATCH: 50,
  DESCRIPTION_MATCH: 20,
  BRAND_MATCH: 30,
  RATING_MAX: 15,
  REVIEW_VOLUME_MAX: 10,
  FEATURED_BONUS: 8,
  BESTSELLER_BONUS: 5,
  STOCK_BONUS: 3,
  FRESHNESS_MAX: 5,
  TAXONOMY_PENALTY: -200,
};

export const scoreProduct = (product, rawQuery = "", intent = null) => {
  if (!product || !rawQuery) return 0;

  const { tokens, normalized } = getQueryContext(rawQuery);
  if (!tokens.length) return 0;

  if (!intent) {
    try {
      intent = parseSearchIntent(rawQuery);
    } catch (e) {
      intent = null;
    }
  }

  let totalScore = 0;

  // 1. Exact name match
  const normalizedName = normalizeUnicode(product.name || "");
  if (normalizedName.includes(normalized) && normalized.length >= 3) {
    totalScore += SCORE_WEIGHTS.EXACT_NAME_MATCH;
  }

  // 2. Name token match
  const nameTokens = tokenize(product.name || "");
  const nameMatchCount = tokens.filter((qt) =>
    nameTokens.some((nt) => scoreTokenMatch(qt, nt) >= 0.8)
  ).length;
  if (nameMatchCount === tokens.length && tokens.length > 0) {
    totalScore += SCORE_WEIGHTS.NAME_TOKEN_MATCH;
  } else if (nameMatchCount > 0) {
    totalScore += Math.round(SCORE_WEIGHTS.NAME_TOKEN_MATCH * (nameMatchCount / tokens.length) * 0.6);
  }

  // 3. Taxonomy category match
  if (intent?.taxonomyMatch) {
    const productCategory = normalizeUnicode(product.category || "");
    const productSubCategory = normalizeUnicode(product.subCategory || "");
    const matchedTerms = intent.taxonomyMatch.matchedTerms || [];
    const allRelevant = [...matchedTerms, intent.taxonomyMatch.term, ...(intent.taxonomyMatch.aliases || [])];

    const categoryHit = allRelevant.some((term) => {
      const normalizedTerm = term.toLowerCase();
      return (
        productCategory.includes(normalizedTerm) ||
        productSubCategory.includes(normalizedTerm)
      );
    });

    if (categoryHit) {
      totalScore += SCORE_WEIGHTS.TAXONOMY_CATEGORY_MATCH;
    }

    // Taxonomy penalty: product category is in a completely different branch
    if (intent.specificity === "narrow" && !categoryHit) {
      const productCatNode = findTermInTaxonomy(productCategory) || findTermInTaxonomy(productSubCategory);
      if (productCatNode && productCatNode.rootKey !== intent.taxonomyMatch.rootKey) {
        totalScore += SCORE_WEIGHTS.TAXONOMY_PENALTY;
      }
    }
  }

  // 4. Tags match
  const productTags = (Array.isArray(product.tags) ? product.tags : []).map((t) => normalizeUnicode(t));
  const tagMatchCount = tokens.filter((qt) =>
    productTags.some((tag) => tag.includes(qt) || scoreTokenMatch(qt, tag) >= 0.8)
  ).length;
  if (tagMatchCount > 0) {
    totalScore += Math.round(SCORE_WEIGHTS.TAGS_MATCH * (tagMatchCount / tokens.length));
  }

  // 5. Description match
  const descScore = scoreFieldMatch(tokens, product.description || "");
  if (descScore > 0.15) {
    totalScore += Math.round(SCORE_WEIGHTS.DESCRIPTION_MATCH * Math.min(descScore, 1));
  }

  // 6. Brand match
  if (intent?.brandHint) {
    const productBrand = normalizeUnicode(product.brand || "");
    if (productBrand.includes(intent.brandHint)) {
      totalScore += SCORE_WEIGHTS.BRAND_MATCH;
    }
  }

  // 7. Rating quality
  const rating = Math.min(Number(product.rating || 0), 5);
  totalScore += Math.round((rating / 5) * SCORE_WEIGHTS.RATING_MAX);

  // 8. Review volume
  const reviewVolume = Math.min(Math.log10(Number(product.numReviews || 0) + 1) / 3, 1);
  totalScore += Math.round(reviewVolume * SCORE_WEIGHTS.REVIEW_VOLUME_MAX);

  // 9. Featured & Best Seller
  if (product.isFeatured) totalScore += SCORE_WEIGHTS.FEATURED_BONUS;
  if (product.isBestSeller) totalScore += SCORE_WEIGHTS.BESTSELLER_BONUS;

  // 10. Stock availability
  if (Number(product.stock || 0) > 10) totalScore += SCORE_WEIGHTS.STOCK_BONUS;

  // 11. Freshness
  const freshnessDays = Math.max(
    0,
    (Date.now() - new Date(product.createdAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (freshnessDays <= 30) totalScore += SCORE_WEIGHTS.FRESHNESS_MAX;
  else if (freshnessDays <= 90) totalScore += Math.round(SCORE_WEIGHTS.FRESHNESS_MAX * 0.5);

  return Math.max(0, totalScore);
};

// ─── Result Validation ──────────────────────────────────────

export const validateSearchResults = (products, intent, scores = null) => {
  if (!Array.isArray(products)) return { items: [], total: 0, noResultsReason: "invalid_input" };

  const seenIds = new Set();
  let validated = [];

  for (const product of products) {
    // Remove unavailable (but keep out of stock to display them with zero quantity)
    if (product.isAvailable === false) continue;

    // Deduplicate
    const id = String(product._id);
    if (seenIds.has(id)) continue;
    seenIds.add(id);

    // Check minimum relevance threshold
    const score = scores?.get(id) ?? product._relevanceScore ?? 0;
    if (score < MINIMUM_RELEVANCE_THRESHOLD) continue;

    // For narrow intent, enforce taxonomy boundary
    if (intent?.specificity === "narrow" && intent?.taxonomyMatch) {
      const productCategory = normalizeUnicode(product.category || "");
      const productSubCategory = normalizeUnicode(product.subCategory || "");
      const productName = normalizeUnicode(product.name || "");
      const productTags = (Array.isArray(product.tags) ? product.tags : []).map((t) => normalizeUnicode(t));

      const matchedTerms = intent.taxonomyMatch.matchedTerms || [intent.taxonomyMatch.term];

      // Word-boundary check to prevent substring false positives
      // e.g. "top" must NOT match "laptop" / "laptops"
      const wordBoundaryMatch = (text, term) => {
        if (!text || !term) return false;
        if (text === term) return true;
        try {
          const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          return new RegExp(`(?:^|[\\s\\-_/])${escaped}(?:s|es)?(?:[\\s\\-_/]|$)`, "i").test(text);
        } catch {
          return text === term;
        }
      };

      const termHit = matchedTerms.some((term) => {
        const normalizedTerm = term.toLowerCase();
        return (
          wordBoundaryMatch(productCategory, normalizedTerm) ||
          wordBoundaryMatch(productSubCategory, normalizedTerm) ||
          wordBoundaryMatch(productName, normalizedTerm) ||
          productTags.some((tag) => wordBoundaryMatch(tag, normalizedTerm))
        );
      });

      if (!termHit) {
        // For narrow intent, no term hit means the product is likely off-taxonomy.
        // Only allow it through if its category resolves to the SAME root branch.
        const productCatNode = findTermInTaxonomy(productCategory) || findTermInTaxonomy(productSubCategory);

        if (!productCatNode) {
          // Category not in taxonomy at all — exclude unless name has a direct match
          const intentTerm = (intent.taxonomyMatch.term || "").toLowerCase();
          if (!productName.includes(intentTerm)) {
            continue;
          }
        } else if (productCatNode.rootKey !== intent.taxonomyMatch.rootKey) {
          // Different taxonomy branch entirely — hard exclude
          continue;
        } else {
          // Same root but different subcategory — check siblings
          const siblingTerms = intent.taxonomyMatch.siblings || [];
          const isSibling = siblingTerms.some((sibling) => {
            const normalizedSibling = sibling.toLowerCase();
            return productCategory.includes(normalizedSibling) || productSubCategory.includes(normalizedSibling);
          });
          if (isSibling) continue;
        }
      }
    }

    validated.push(product);
  }

  // Cap at 200 final candidates
  validated = validated.slice(0, 200);

  if (validated.length === 0) {
    return { items: [], total: 0, noResultsReason: "no_relevant_products" };
  }

  return { items: validated, total: validated.length, noResultsReason: null };
};

export { MINIMUM_RELEVANCE_THRESHOLD };
