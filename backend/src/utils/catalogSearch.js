const CATALOG_SYNONYMS = {
  clothes: "clothing",
  cloth: "clothing",
  clothing: "clothing",
  outfits: "clothing",
  dress: "clothing",
  dresses: "clothing",
  shirt: "clothing",
  shirts: "clothing",
  tshirt: "clothing",
  t-shirt: "clothing",
  phones: "smartphones",
  phone: "smartphones",
  mobile: "smartphones",
  mobiles: "smartphones",
  smartphone: "smartphones",
  smartphones: "smartphones",
  laptop: "laptops",
  laptops: "laptops",
  notebook: "laptops",
  notebooks: "laptops",
  shoes: "footwear",
  shoe: "footwear",
  sneakers: "footwear",
  sneaker: "footwear",
  headphones: "headphones",
  headphone: "headphones",
  earbuds: "headphones",
  earbud: "headphones",
  watches: "watches",
  watch: "watches",
  bags: "bags",
  bag: "bags",
  kitchenware: "kitchen-accessories",
  kitchen: "kitchen-accessories",
  beauty: "beauty",
  skincare: "skin-care",
  skin: "skin-care",
};

export const normalizeCatalogQuery = (value = "") => {
  const cleaned = String(value).trim().toLowerCase().replace(/\s+/g, " ");
  if (!cleaned) return "";

  if (CATALOG_SYNONYMS[cleaned]) {
    return CATALOG_SYNONYMS[cleaned];
  }

  if (cleaned.endsWith("ies")) {
    return `${cleaned.slice(0, -3)}y`;
  }

  if (cleaned.endsWith("s") && cleaned.length > 3) {
    return cleaned.slice(0, -1);
  }

  return cleaned;
};

export const buildCatalogRegexTerms = (value = "") => {
  const normalized = normalizeCatalogQuery(value);
  const raw = String(value).trim().toLowerCase();

  const terms = new Set([normalized, raw].filter(Boolean));
  return [...terms].map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
};
