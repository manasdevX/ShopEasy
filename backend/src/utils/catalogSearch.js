/* ═══════════════════════════════════════════════════════════════
   ShopEasy Search Engine v3 — Amazon-Style Relevance Engine
   
   Exports (backward-compatible):
     normalizeCatalogQuery, buildCatalogRegexTerms,
     buildSmartRegexPatterns, buildSmartSearchConditions, scoreProduct
   ═══════════════════════════════════════════════════════════════ */

// ─── CONSTANTS ───────────────────────────────────────────────

const STOPWORDS = new Set([
  "the","a","an","and","or","but","in","on","at","to","for","of",
  "with","by","from","is","it","this","that","are","was","be",
  "has","had","not","no","so","if","all","any","its","my","our","your",
]);

/** Bidirectional synonym groups — every word in a group maps to all others. */
const SYNONYM_GROUPS = [
  ["phone","phones","mobile","mobiles","smartphone","smartphones","cellphone"],
  ["laptop","laptops","notebook","notebooks"],
  ["shoes","shoe","sneakers","sneaker","footwear","trainers"],
  ["headphones","headphone","earbuds","earbud","earphones"],
  ["watches","watch","smartwatch","smartwatches"],
  ["bags","bag","handbag","handbags","backpack","backpacks"],
  ["clothes","cloth","clothing","outfits","apparel","garment"],
  ["dress","dresses","gown","gowns"],
  ["shirt","shirts","tshirt","t-shirt","tee"],
  ["tv","television","televisions"],
  ["fridge","refrigerator","refrigerators"],
  ["ac","air conditioner","airconditioner"],
  ["camera","cameras","dslr"],
  ["tablet","tablets","ipad"],
  ["charger","chargers","adapter","adapters"],
  ["mouse","mice"],
  ["keyboard","keyboards"],
  ["speaker","speakers","soundbar"],
  ["beauty","cosmetics","makeup"],
  ["skincare","skin-care","skin care"],
  ["kitchenware","kitchen-accessories","kitchen accessories"],
];

// Build fast lookup: word → canonical + all synonyms
const SYNONYM_MAP = new Map();
const SYNONYM_CANONICAL = new Map();
for (const group of SYNONYM_GROUPS) {
  const canonical = group[0];
  for (const word of group) {
    const lower = word.toLowerCase();
    SYNONYM_MAP.set(lower, group.map(w => w.toLowerCase()));
    SYNONYM_CANONICAL.set(lower, canonical);
  }
}

/** Catalog-level normalization map (preserves original API behavior). */
const CATALOG_SYNONYMS = {
  clothes:"clothing", cloth:"clothing", clothing:"clothing", outfits:"clothing",
  dress:"clothing", dresses:"clothing", shirt:"clothing", shirts:"clothing",
  tshirt:"clothing", "t-shirt":"clothing",
  phones:"smartphones", phone:"smartphones", mobile:"smartphones",
  mobiles:"smartphones", smartphone:"smartphones", smartphones:"smartphones",
  laptop:"laptops", laptops:"laptops", notebook:"laptops", notebooks:"laptops",
  shoes:"footwear", shoe:"footwear", sneakers:"footwear", sneaker:"footwear",
  headphones:"headphones", headphone:"headphones", earbuds:"headphones", earbud:"headphones",
  watches:"watches", watch:"watches",
  bags:"bags", bag:"bags",
  kitchenware:"kitchen-accessories", kitchen:"kitchen-accessories",
  beauty:"beauty", skincare:"skin-care", skin:"skin-care",
};

// Known brand names for intent detection
const KNOWN_BRANDS = new Set([
  "apple","samsung","nike","adidas","puma","sony","lg","hp","dell","lenovo",
  "asus","acer","oneplus","realme","xiaomi","mi","redmi","oppo","vivo",
  "boat","jbl","bose","philips","panasonic","whirlpool","bosch","canon",
  "nikon","logitech","corsair","razer","reebok","under armour","new balance",
  "gucci","prada","zara","h&m","levi","levis","tommy","polo","calvin klein",
  "fossil","casio","titan","noise","fire-boltt","amazfit","garmin",
]);

// Common product lines to prevent aggressive typo correction away from valid terms
const KNOWN_PRODUCTS = new Set([
  "iphone", "ipad", "macbook", "airpods", "imac", "watch", "galaxy", "pixel", 
  "playstation", "xbox", "nintendo", "switch", "kindle", "echo", "fire",
  "car", "bike", "jeans", "tshirt", "shirt", "pant", "trouser", "jacket",
  "suit", "saree", "kurta", "lehenga", "ring", "necklace", "earring",
  "bracelet", "perfume", "deodorant", "lipstick", "foundation", "cream",
  "shampoo", "soap", "brush", "comb", "towel", "bedsheet", "blanket",
  "pillow", "mattress", "curtain", "sofa", "chair", "table", "desk",
  "wardrobe", "cabinet", "shelf", "lamp", "bulb", "fan", "cooler",
  "heater", "geyser", "iron", "mixer", "grinder", "juicer", "toaster",
  "oven", "microwave", "stove", "cooktop", "chimney", "dishwasher",
  "washing machine", "dryer", "vacuum", "purifier", "router", "modem",
  "pendrive", "harddisk", "ssd", "monitor", "printer", "scanner",
  "projector", "cable", "wire", "battery", "charger", "adapter",
  "powerbank", "cover", "case", "screen guard", "tempered glass",
  "lens", "tripod", "mic", "microphone", "speaker", "soundbar",
  "home theater", "earphone", "headphone", "headset", "earbud",
  "smartwatch", "fitness band", "tracker", "drone", "camera",
  "toy", "game", "puzzle", "board", "book", "pen", "pencil",
  "notebook", "diary", "bag", "backpack", "suitcase", "trolley",
  "wallet", "purse", "belt", "tie", "sock", "shoe", "sandal",
  "slipper", "boot", "sneaker", "loafer", "heel", "flat", "wedge",
  "cricket", "bat", "ball", "stump", "helmet", "glove", "pad"
]);

// ─── UTILITIES ───────────────────────────────────────────────

const escapeRegex = (v = "") => String(v).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Damerau-Levenshtein distance — handles transpositions as a single edit.
 * "iphnoe" → "iphone" = distance 2 (two transpositions), not 4 as in plain Levenshtein.
 */
const damerauLevenshtein = (a, b) => {
  if (a === b) return 0;
  const la = a.length, lb = b.length;
  if (la === 0) return lb;
  if (lb === 0) return la;
  if (Math.abs(la - lb) > 3) return Math.max(la, lb);

  const d = Array.from({ length: la + 1 }, () => new Array(lb + 1).fill(0));
  for (let i = 0; i <= la; i++) d[i][0] = i;
  for (let j = 0; j <= lb; j++) d[0][j] = j;

  for (let i = 1; i <= la; i++) {
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + cost,
      );
      // Transposition
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + cost);
      }
    }
  }
  return d[la][lb];
};

/** Tokenize text into lowercase words. */
const tokenize = (text) => {
  if (!text) return [];
  return String(text).toLowerCase().split(/[\s\-_,./&+:;!?'"()[\]{}]+/).filter(t => t.length > 0);
};

/** Tokenize, remove stopwords (with fallback). */
const tokenizeQuery = (text) => {
  const all = tokenize(text);
  const filtered = all.filter(t => !STOPWORDS.has(t));
  return filtered.length > 0 ? filtered : all;
};

/** Lightweight stem variants (plural/singular). */
const getStemVariants = (word) => {
  if (!word || word.length < 3) return [word];
  const v = new Set([word]);
  if (word.endsWith("ies") && word.length > 4) v.add(word.slice(0, -3) + "y");
  else if (word.endsWith("es") && word.length > 4) { v.add(word.slice(0, -2)); v.add(word.slice(0, -1)); }
  else if (word.endsWith("s") && !word.endsWith("ss") && word.length > 3) v.add(word.slice(0, -1));
  if (word.endsWith("y") && word.length > 3) v.add(word.slice(0, -1) + "ies");
  v.add(word + "s");
  if (word.endsWith("ing") && word.length > 5) { v.add(word.slice(0, -3)); v.add(word.slice(0, -3) + "e"); }
  if (word.endsWith("ed") && word.length > 4) { v.add(word.slice(0, -2)); v.add(word.slice(0, -1)); }
  return [...v];
};

/** Get all synonym expansions for a token. */
const expandSynonyms = (token) => {
  const group = SYNONYM_MAP.get(token);
  return group ? group.filter(w => w !== token) : [];
};

/** Unicode normalization + cleanup. */
const normalizeUnicode = (text) =>
  String(text).normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s\-]/g, " ").replace(/\s+/g, " ").trim().toLowerCase();

// ─── TYPO CORRECTION ────────────────────────────────────────

/**
 * Lightweight phonetic encoding function (custom Metaphone variant).
 * Strips vowels, maps similar sounds (c->k, ph->f, z->s, q->k), removes duplicate adjacent letters.
 * Preserves the first letter even if it's a vowel.
 */
const getPhoneticCode = (word) => {
  if (!word || word.length < 3) return word;
  let code = word.toLowerCase().replace(/[^a-z]/g, '')
    .replace(/ph/g, 'f')
    .replace(/ck/g, 'k')
    .replace(/c(?=[eiy])/g, 's')
    .replace(/c/g, 'k')
    .replace(/z/g, 's')
    .replace(/q/g, 'k')
    .replace(/x/g, 'ks')
    .replace(/(.)\1+/g, '$1'); // remove duplicate consecutive letters
    
  if (code.length > 0) {
    let first = code[0];
    let rest = code.slice(1).replace(/[aeiouhw]/g, '');
    return first + rest;
  }
  return code;
};

/**
 * Build a vocabulary from synonym groups + known brands + known products + catalog synonyms.
 * Used for query-time typo correction BEFORE hitting the database.
 */
const VOCABULARY = new Set();
for (const group of SYNONYM_GROUPS) group.forEach(w => VOCABULARY.add(w.toLowerCase()));
for (const brand of KNOWN_BRANDS) VOCABULARY.add(brand);
for (const prod of KNOWN_PRODUCTS) VOCABULARY.add(prod);
for (const key of Object.keys(CATALOG_SYNONYMS)) VOCABULARY.add(key);
for (const val of Object.values(CATALOG_SYNONYMS)) VOCABULARY.add(val);

const PHONETIC_MAP = new Map();
for (const word of VOCABULARY) {
  const code = getPhoneticCode(word);
  if (!PHONETIC_MAP.has(code)) PHONETIC_MAP.set(code, []);
  PHONETIC_MAP.get(code).push(word);
}

/**
 * Attempt to correct a single token against known vocabulary using Levenshtein & Phonetic mapping.
 * Returns the corrected word or the original if no good match.
 */
const correctTypo = (token) => {
  if (token.length < 3) return token;
  if (VOCABULARY.has(token)) return token;
  // Check stem variants
  for (const v of getStemVariants(token)) { if (VOCABULARY.has(v)) return v; }

  let bestWord = token;
  let bestDist = Infinity;
  const maxDist = token.length <= 4 ? 1 : token.length <= 6 ? 2 : 3;

  // 1. Damerau-Levenshtein Exact Fuzzy Match
  for (const word of VOCABULARY) {
    if (Math.abs(word.length - token.length) > maxDist) continue;
    const dist = damerauLevenshtein(token, word);
    if (dist < bestDist && dist <= maxDist) {
      bestDist = dist;
      bestWord = word;
      if (dist === 1) break; // Good enough for edit distance
    }
  }

  // 2. Phonetic Match Fallback (e.g., "crickat" -> "cricket", "niki" -> "nike")
  if (bestDist > 1) {
    const pCode = getPhoneticCode(token);
    const phoneticCandidates = PHONETIC_MAP.get(pCode) || [];
    for (const word of phoneticCandidates) {
      // Ensure phonetic matches are somewhat similar in length to avoid wild matches
      if (Math.abs(word.length - token.length) <= 3) {
        const dist = damerauLevenshtein(token, word);
        if (dist < bestDist) {
          bestDist = dist;
          bestWord = word;
        }
      }
    }
  }
  
  return bestWord;
};

// ─── INTENT DETECTION ────────────────────────────────────────

/**
 * Analyze query tokens to detect brand and category intent.
 * Returns { brandTokens, categoryTokens, productTokens, detectedBrand, detectedCategory }
 */
const detectIntent = (tokens) => {
  const result = { brandTokens: [], categoryTokens: [], productTokens: [], detectedBrand: null, detectedCategory: null };
  for (const t of tokens) {
    if (KNOWN_BRANDS.has(t)) {
      result.brandTokens.push(t);
      result.detectedBrand = t;
    } else if (CATALOG_SYNONYMS[t] || SYNONYM_CANONICAL.has(t)) {
      result.categoryTokens.push(t);
      result.detectedCategory = CATALOG_SYNONYMS[t] || SYNONYM_CANONICAL.get(t) || t;
    } else {
      result.productTokens.push(t);
    }
  }
  return result;
};


// ─── QUERY PROCESSING PIPELINE ──────────────────────────────

/**
 * Full query processing pipeline:
 *   raw → normalize → tokenize → correct typos → expand synonyms → detect intent
 *
 * @returns {object} Processed query context
 */
const processQuery = (rawQuery) => {
  const raw = normalizeUnicode(rawQuery);
  if (!raw) return { tokens: [], corrected: [], synonyms: [], allTerms: [], intent: { brandTokens: [], categoryTokens: [], productTokens: [], detectedBrand: null, detectedCategory: null }, phrase: "" };

  const tokens = tokenizeQuery(raw);

  // Typo correction
  const corrected = tokens.map(t => correctTypo(t));

  // Synonym expansion (deduplicated)
  const synonymSet = new Set();
  for (const t of corrected) {
    for (const syn of expandSynonyms(t)) synonymSet.add(syn);
    for (const sv of getStemVariants(t)) { synonymSet.add(sv); for (const syn of expandSynonyms(sv)) synonymSet.add(syn); }
  }
  // Remove tokens already in corrected
  const correctedSet = new Set(corrected);
  const synonyms = [...synonymSet].filter(s => !correctedSet.has(s));

  // All unique terms for matching
  const allTerms = [...new Set([...corrected, ...synonyms])];

  // Intent detection on corrected tokens
  const intent = detectIntent(corrected);

  // Reconstructed phrase for exact phrase matching
  const phrase = corrected.join(" ");

  return { tokens: corrected, corrected, synonyms, allTerms, intent, phrase };
};

// ─── EXPORTED: BACKWARD-COMPATIBLE FUNCTIONS ─────────────────

/** 
 * Now uses the advanced processing pipeline so that typo-corrected
 * queries are fed to the primary MongoDB $text index.
 */
export const normalizeCatalogQuery = (value = "") => {
  if (!value) return "";
  const processed = processQuery(value);
  // Re-apply catalog synonym map just in case it's a direct synonym hit 
  // (e.g. "clothes" -> "clothing") if the processed phrase is a single word
  const phrase = processed.phrase;
  if (phrase && CATALOG_SYNONYMS[phrase]) return CATALOG_SYNONYMS[phrase];
  
  if (phrase.endsWith("ies")) return `${phrase.slice(0, -3)}y`;
  if (phrase.endsWith("s") && phrase.length > 3) return phrase.slice(0, -1);
  
  return phrase || String(value).trim().toLowerCase();
};

/** Original regex term builder — preserved for ultimate fallback. */
export const buildCatalogRegexTerms = (value = "") => {
  const normalized = normalizeCatalogQuery(value);
  const raw = String(value).trim().toLowerCase();
  const terms = new Set([normalized, raw].filter(Boolean));
  return [...terms].map(t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
};

// ─── REGEX PATTERN BUILDER ──────────────────────────────────

/**
 * Build smart regex patterns from processed query.
 * Exported for backward compatibility.
 */
export const buildSmartRegexPatterns = (value = "") => {
  const { tokens: corrected, synonyms } = processQuery(value);
  const exactSet = new Set();
  const prefixSet = new Set();
  const fuzzySet = new Set();

  // Primary tokens: exact + bounded prefix + stem variants
  for (const token of corrected) {
    const esc = escapeRegex(token);
    exactSet.add(`\\b${esc}\\b`);
    // Bounded prefix only for tokens >= 4 chars
    if (token.length >= 4) {
      const maxExp = token.length <= 5 ? 3 : 5;
      prefixSet.add(`\\b${esc}\\w{0,${maxExp}}`);
    }
    for (const v of getStemVariants(token)) {
      if (v !== token) exactSet.add(`\\b${escapeRegex(v)}\\b`);
    }
  }

  // Synonym tokens: exact boundary only
  for (const syn of synonyms) {
    exactSet.add(`\\b${escapeRegex(syn)}\\b`);
  }

  // Fuzzy prefixes for tokens >= 5 chars (short anchor for mid-word typos)
  for (const token of corrected) {
    if (token.length >= 5) {
      const shortPfx = token.slice(0, 3);
      fuzzySet.add(`\\b${escapeRegex(shortPfx)}\\w{1,${Math.min(token.length + 1, 8)}}`);
    }
  }

  return {
    exactPatterns: [...exactSet],
    prefixPatterns: [...prefixSet],
    fuzzyPatterns: [...fuzzySet],
  };
};

// ─── MONGODB QUERY BUILDER ──────────────────────────────────

/**
 * Build compact MongoDB $or conditions.
 * Combines all patterns per tier into a SINGLE alternation regex per field.
 * Result: typically 5-10 conditions total instead of 30-50.
 */
export const buildSmartSearchConditions = (rawQuery = "") => {
  const { tokens: corrected, synonyms, intent } = processQuery(rawQuery);
  if (corrected.length === 0) return [];

  const conditions = [];
  const fields = ["name", "brand", "category", "tags"];

  // Collect all patterns
  const exactPatterns = new Set();
  const broadPatterns = new Set();

  // 1. Corrected tokens — exact word boundary + stem variants
  for (const t of corrected) {
    exactPatterns.add(`\\b${escapeRegex(t)}\\b`);
    for (const v of getStemVariants(t)) {
      if (v !== t) exactPatterns.add(`\\b${escapeRegex(v)}\\b`);
    }
    // Bounded prefix for longer tokens
    if (t.length >= 5) {
      broadPatterns.add(`\\b${escapeRegex(t)}\\w{0,4}`);
    }
  }

  // 2. Synonym tokens — exact boundary
  for (const s of synonyms.slice(0, 15)) { // Cap synonym expansion
    exactPatterns.add(`\\b${escapeRegex(s)}\\b`);
  }

  // 3. Fuzzy short-prefix for longer tokens
  for (const t of corrected) {
    if (t.length >= 5) {
      broadPatterns.add(`\\b${escapeRegex(t.slice(0, 3))}\\w{1,${Math.min(t.length + 1, 8)}}`);
    }
  }

  // Combine into single alternation per field
  const addCombined = (patterns, targetFields) => {
    const arr = [...patterns];
    if (arr.length === 0) return;
    const regex = arr.length === 1 ? arr[0] : `(${arr.join("|")})`;
    for (const f of targetFields) {
      conditions.push({ [f]: { $regex: regex, $options: "i" } });
    }
  };

  // Tier 1: Exact patterns on primary fields
  addCombined(exactPatterns, fields);

  // Tier 2: Broad patterns on primary fields (only if we have them)
  addCombined(broadPatterns, fields);

  // Tier 3: Exact patterns on description
  addCombined(exactPatterns, ["description"]);

  return conditions;
};

// ─── RELEVANCE SCORING ENGINE ───────────────────────────────

/** Score a single search token against a target token. */
const scoreTokenMatch = (search, target) => {
  if (!search || !target) return 0;
  if (search === target) return 100;

  // Stem match
  const sv = getStemVariants(search);
  const tv = getStemVariants(target);
  for (const a of sv) for (const b of tv) { if (a === b) return 92; }

  // Synonym match
  const syns = SYNONYM_MAP.get(search);
  if (syns && syns.includes(target)) return 85;

  // Prefix match with coverage gating
  if (target.startsWith(search) && search.length >= 2) {
    const cov = search.length / target.length;
    if (cov >= (search.length <= 3 ? 0.65 : 0.50)) {
      return Math.round(40 + cov * 40); // 40-80 range
    }
    return 0;
  }

  // Fuzzy match (Damerau-Levenshtein)
  if (search.length >= 4) {
    const maxDist = search.length <= 5 ? 1 : 2;
    const maxLenDiff = search.length >= 6 ? 2 : 1;
    if (Math.abs(search.length - target.length) <= maxLenDiff) {
      const dist = damerauLevenshtein(search, target);
      if (dist <= maxDist) return Math.round(50 - (dist - 1) * 18);
    }
  }

  return 0;
};

/** Score field match with proximity and order awareness. */
const scoreFieldMatch = (queryTokens, fieldValue) => {
  if (!fieldValue || queryTokens.length === 0) return 0;
  const fieldTokens = tokenize(fieldValue);
  if (fieldTokens.length === 0) return 0;

  let totalScore = 0;
  let matched = 0;
  const positions = [];

  for (const qt of queryTokens) {
    let best = 0, bestPos = -1;
    for (let i = 0; i < fieldTokens.length; i++) {
      const s = scoreTokenMatch(qt, fieldTokens[i]);
      if (s > best) { best = s; bestPos = i; }
    }
    if (best > 0) { totalScore += best; matched++; positions.push(bestPos); }
  }

  if (matched === 0) return 0;

  const avg = totalScore / queryTokens.length;
  const coverage = matched / queryTokens.length;
  let score = Math.round(avg * coverage);

  // Multi-word bonuses
  if (queryTokens.length >= 2 && matched >= 2) {
    // Order bonus
    let ordered = true;
    for (let i = 1; i < positions.length; i++) {
      if (positions[i] >= 0 && positions[i - 1] >= 0 && positions[i] <= positions[i - 1]) { ordered = false; break; }
    }
    if (ordered) score += 10;

    // Proximity bonus
    const valid = positions.filter(p => p >= 0).sort((a, b) => a - b);
    if (valid.length >= 2) {
      const span = valid[valid.length - 1] - valid[0];
      if (span === matched - 1) score += 12;
      else if (span <= matched + 1) score += 6;
    }

    // All-match bonus
    if (matched === queryTokens.length) score += 8;
  }

  return Math.min(score, 100);
};

/** Check if a field contains an exact phrase using word boundaries. */
const containsPhrase = (fieldValue, phrase) => {
  if (!fieldValue || !phrase) return false;
  // Use a word-boundary regex to ensure "car" doesn't match "carpet"
  const regex = new RegExp(`\\b${escapeRegex(phrase)}\\b`, 'i');
  return regex.test(fieldValue);
};

/**
 * Score a product against a search query.
 * Uses a 9-tier ranking system inspired by Amazon/Flipkart.
 */
export const scoreProduct = (product, rawQuery) => {
  if (!rawQuery || !product) return 0;

  const { tokens, phrase, intent, synonyms } = processQuery(rawQuery);
  if (tokens.length === 0) return 0;

  // Combine tokens + limited synonyms for field scoring (avoid double-counting)
  const queryTokens = [...new Set([...tokens, ...synonyms.slice(0, 5)])];

  // ─── FIELD-WEIGHTED SCORING ───
  const WEIGHTS = { name: 12, brand: 7, category: 6, tags: 4, subCategory: 3, description: 1.5 };
  let fieldTotal = 0;

  for (const [field, weight] of Object.entries(WEIGHTS)) {
    let val = product[field];
    if (Array.isArray(val)) val = val.join(" ");
    fieldTotal += scoreFieldMatch(queryTokens, val) * weight;
  }

  const maxPossible = 100 * Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
  let score = (fieldTotal / maxPossible) * 100;

  // ─── TIER BONUSES ───

  const name = (product.name || "").toLowerCase();
  const brand = (product.brand || "").toLowerCase();
  const category = (product.category || "").toLowerCase();

  // T1: Exact phrase in title (highest signal)
  if (phrase.length > 2 && containsPhrase(name, phrase)) score += 25;

  // T2: Brand intent match
  if (intent.detectedBrand && brand.includes(intent.detectedBrand)) score += 15;

  // T3: Category intent match
  if (intent.detectedCategory) {
    const catNorm = CATALOG_SYNONYMS[category] || category;
    const intentCat = intent.detectedCategory;
    if (category === intentCat || catNorm === intentCat || category.includes(intentCat)) score += 10;
  }

  // ─── POPULARITY BONUS (max 5 pts) ───
  let pop = 0;
  if (product.rating) pop += product.rating * 0.5;
  if (product.numReviews) pop += Math.min(product.numReviews * 0.01, 1);
  if (product.isBestSeller) pop += 1;
  if (product.isFeatured) pop += 0.5;

  return score + pop;
};
