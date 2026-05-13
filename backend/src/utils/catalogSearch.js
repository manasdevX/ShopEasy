/*
  Production Search Core
  - No hardcoded query-to-category remapping
  - Deterministic normalization and tokenization
  - Smart regex retrieval helpers
  - Weighted relevance scoring with typo tolerance
*/

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
    .replace(/[����]/g, "'")
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

export const buildSmartSearchConditions = (rawQuery = "") => {
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

export const scoreProduct = (product, rawQuery = "") => {
  if (!product || !rawQuery) return 0;

  const { tokens, normalized } = getQueryContext(rawQuery);
  if (!tokens.length) return 0;

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
  if (normalized.length >= 3 && normalizedName.includes(normalized)) {
    lexicalScore += 0.18;
  }

  const qualitySignal =
    Math.min((product.rating || 0) / 5, 1) * 0.08 +
    Math.min(Math.log10((product.numReviews || 0) + 1) / 3, 1) * 0.06 +
    (product.isBestSeller ? 0.03 : 0) +
    (product.isFeatured ? 0.02 : 0);

  const freshnessDays = Math.max(
    0,
    (Date.now() - new Date(product.createdAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24)
  );
  const freshnessSignal = freshnessDays <= 30 ? 0.03 : freshnessDays <= 90 ? 0.015 : 0;

  const stockSignal = product.stock > 0 ? 0.02 : -0.08;

  const finalScore = lexicalScore + qualitySignal + freshnessSignal + stockSignal;
  return Math.round(Math.max(0, finalScore) * 1000);
};
