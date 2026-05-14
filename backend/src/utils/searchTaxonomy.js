/**
 * ─────────────────────────────────────────────────────────────
 *  searchTaxonomy.js — Semantic Taxonomy Engine
 * ─────────────────────────────────────────────────────────────
 *  Comprehensive, hardcoded taxonomy tree that maps every broad
 *  concept to children, synonyms, and ancestors. O(1) lookups
 *  via pre-built Maps. Pure JS — zero external dependencies.
 * ─────────────────────────────────────────────────────────────
 */

const TAXONOMY_TREE = {
  clothing: {
    aliases: ["clothes", "clothing", "apparel", "fashion", "garment", "garments", "wear", "outfit", "outfits", "attire"],
    children: {
      tops: ["shirt", "t-shirt", "tshirt", "polo", "blouse", "kurti", "kurta", "top", "tank top", "crop top", "sweatshirt", "hoodie", "sweater", "pullover", "jersey"],
      bottoms: ["pant", "pants", "trouser", "trousers", "jeans", "legging", "leggings", "skirt", "shorts", "palazzo", "pallazo", "cargo", "cargo pants"],
      ethnic: ["saree", "sari", "salwar", "kameez", "lehenga", "sherwani", "dhoti", "dupatta", "churidar", "anarkali"],
      dresses: ["dress", "gown", "frock", "maxi", "midi", "sundress", "bodycon"],
      outerwear: ["jacket", "coat", "blazer", "windbreaker", "raincoat", "overcoat", "parka", "gilet"],
      innerwear: ["underwear", "bra", "brief", "briefs", "boxer", "boxers", "camisole", "vest", "thermal", "lingerie"],
    },
  },

  footwear: {
    aliases: ["footwear", "shoes", "shoe", "footgear"],
    children: {
      casual: ["sneaker", "sneakers", "loafer", "loafers", "moccasin", "canvas shoe", "slip-on", "slip on"],
      formal: ["oxford", "derby", "brogue", "formal shoe", "formal shoes", "dress shoe", "dress shoes"],
      sport: ["running shoe", "running shoes", "sport shoe", "sport shoes", "training shoe", "athletic shoe", "gym shoe", "jogging shoe"],
      ethnic_footwear: ["mojri", "jutti", "jutii", "kolhapuri", "kolhapuri chappal"],
      feminine: ["heel", "heels", "stiletto", "pump", "pumps", "wedge", "wedges", "sandal", "sandals", "mule", "mules", "kitten heel"],
      comfort: ["flat", "flats", "flip flop", "flip flops", "slipper", "slippers", "chappal", "clog", "clogs", "crocs"],
    },
  },

  electronics: {
    aliases: ["electronics", "electronic", "gadget", "gadgets", "tech", "technology"],
    children: {
      phones: ["mobile", "smartphone", "smartphones", "phone", "phones", "feature phone", "iphone", "android phone", "cellphone", "cell phone"],
      computing: ["laptop", "laptops", "notebook", "ultrabook", "desktop", "computer", "pc", "monitor", "monitors", "all-in-one"],
      audio: ["headphone", "headphones", "earphone", "earphones", "earbud", "earbuds", "speaker", "speakers", "soundbar", "wired headphone", "wireless headphone", "bluetooth speaker", "bluetooth headphone", "airpods", "airpod"],
      display: ["tv", "television", "projector", "smart tv", "oled", "led tv", "qled", "4k tv"],
      wearables: ["smartwatch", "smart watch", "fitness band", "fitness tracker", "gps watch", "apple watch"],
      cameras: ["camera", "dslr", "mirrorless", "action camera", "dashcam", "webcam", "gopro", "dash cam"],
      tablets: ["tablet", "tablets", "ipad", "android tablet", "e-reader", "kindle", "tab"],
      accessories: ["charger", "cable", "power bank", "adapter", "cover", "case", "screen guard", "screen protector", "tempered glass", "usb cable", "hdmi cable", "phone case", "laptop bag"],
    },
  },

  home_appliances: {
    aliases: ["home appliances", "home appliance", "appliance", "appliances", "kitchen appliance", "kitchen appliances"],
    children: {
      kitchen: ["mixer", "grinder", "blender", "microwave", "oven", "toaster", "juicer", "food processor", "kettle", "coffee maker", "air fryer", "induction", "induction cooktop", "rice cooker", "pressure cooker"],
      cooling: ["ac", "air conditioner", "fan", "cooler", "air purifier", "ceiling fan", "table fan", "tower fan"],
      cleaning: ["vacuum cleaner", "washing machine", "dishwasher", "iron", "steam iron", "robot vacuum", "mop"],
      refrigeration: ["refrigerator", "fridge", "freezer", "wine cooler", "mini fridge", "deep freezer"],
      water: ["water purifier", "ro", "water heater", "geyser", "water filter", "water dispenser"],
    },
  },

  furniture: {
    aliases: ["furniture", "furnishing", "furnishings", "home furniture"],
    children: {
      seating: ["sofa", "couch", "chair", "recliner", "beanbag", "bean bag", "bench", "stool", "armchair", "rocking chair"],
      sleeping: ["bed", "mattress", "pillow", "bedframe", "bed frame", "divan", "bunk bed", "cot"],
      storage: ["wardrobe", "almirah", "cabinet", "bookshelf", "rack", "drawer", "chest of drawers", "cupboard", "shoe rack"],
      tables: ["dining table", "coffee table", "study table", "side table", "console table", "work desk", "computer desk", "office table"],
      outdoor_furniture: ["garden chair", "outdoor furniture", "patio set", "hammock", "swing", "garden bench"],
    },
  },

  groceries: {
    aliases: ["groceries", "grocery", "food", "foods", "food items", "edible", "edibles", "provisions"],
    children: {
      staples: ["rice", "wheat", "flour", "atta", "dal", "lentil", "lentils", "grain", "grains", "pulse", "pulses", "maida", "sooji", "besan"],
      spices: ["spice", "spices", "masala", "pepper", "turmeric", "haldi", "cumin", "jeera", "coriander", "chili powder", "garam masala"],
      snacks: ["chip", "chips", "biscuit", "biscuits", "cookie", "cookies", "snack", "snacks", "namkeen", "popcorn", "mixture", "rusk"],
      beverages: ["juice", "drink", "drinks", "water", "soda", "tea", "coffee", "milk", "energy drink", "soft drink", "cold drink"],
      dairy: ["butter", "ghee", "cheese", "paneer", "curd", "yogurt", "yoghurt", "cream", "milk powder"],
      health_food: ["protein powder", "supplement", "supplements", "vitamin", "vitamins", "whey protein", "health drink", "oats", "muesli", "granola"],
    },
  },

  sports_fitness: {
    aliases: ["sports", "sport", "fitness", "gym", "workout", "exercise", "athletic", "athletics", "sports accessories"],
    children: {
      gym_equipment: ["dumbbell", "dumbbells", "barbell", "kettlebell", "weight plate", "gym equipment", "bench press", "treadmill", "elliptical", "pull up bar", "ab roller"],
      yoga: ["yoga mat", "yoga block", "resistance band", "resistance bands", "foam roller", "yoga strap", "exercise ball", "pilates"],
      outdoor_sports: ["cycle", "bicycle", "cricket bat", "football", "basketball", "badminton", "tennis", "racket", "bat", "ball", "shuttlecock", "cricket ball", "skating", "skateboard"],
      sportswear: ["track pants", "track suit", "sports bra", "sports shoes", "gym wear", "active wear", "activewear", "sports shorts", "compression"],
    },
  },

  beauty_personal_care: {
    aliases: ["beauty", "personal care", "cosmetics", "cosmetic", "grooming", "skincare", "skin care", "haircare", "hair care", "makeup", "make up"],
    children: {
      skincare: ["moisturizer", "sunscreen", "serum", "face wash", "toner", "mask", "face mask", "cream", "face cream", "cleanser", "exfoliator", "night cream", "day cream", "lotion"],
      haircare: ["shampoo", "conditioner", "hair oil", "hair mask", "hair serum", "hair spray", "hair gel", "hair color", "hair dye"],
      makeup_items: ["lipstick", "foundation", "mascara", "eyeliner", "kajal", "blush", "eyeshadow", "concealer", "primer", "compact", "nail polish"],
      mens_grooming: ["razor", "shaving cream", "aftershave", "beard oil", "trimmer", "shaver", "grooming kit"],
      fragrance: ["perfume", "deodorant", "body spray", "cologne", "attar", "fragrance", "body mist"],
    },
  },

  bags_luggage: {
    aliases: ["bags", "bag", "luggage", "travel bag", "travel bags"],
    children: {
      handbags: ["handbag", "purse", "clutch", "tote", "sling bag", "shoulder bag", "crossbody", "crossbody bag", "wristlet"],
      backpacks: ["backpack", "rucksack", "laptop bag", "school bag", "daypack"],
      travel: ["travel bag", "trolley", "suitcase", "duffel", "duffel bag", "carry on", "luggage set", "cabin bag"],
      wallets: ["wallet", "money clip", "card holder", "passport holder"],
    },
  },

  books_media: {
    aliases: ["books", "book", "media", "reading", "literature", "stationery"],
    children: {
      fiction: ["fiction", "novel", "novels", "thriller", "mystery", "romance novel", "sci-fi", "fantasy"],
      non_fiction: ["non-fiction", "nonfiction", "biography", "autobiography", "self-help", "business book", "motivational"],
      academic: ["academic", "textbook", "textbooks", "reference book", "study material", "guide", "ncert"],
      comics_magazines: ["comic", "comics", "manga", "magazine", "magazines", "graphic novel"],
      stationery: ["pen", "pencil", "notebook", "diary", "planner", "eraser", "ruler", "marker", "highlighter", "stapler", "glue"],
    },
  },

  toys_games: {
    aliases: ["toys", "toy", "games", "game", "play", "plaything"],
    children: {
      infant: ["infant toy", "baby toy", "rattle", "teether", "soft toy", "plush", "stuffed animal"],
      educational: ["educational toy", "learning toy", "stem toy", "building blocks", "lego", "puzzle", "puzzles"],
      board_games: ["board game", "board games", "chess", "carrom", "ludo", "monopoly", "scrabble", "card game"],
      action_figures: ["action figure", "action figures", "doll", "dolls", "barbie", "figurine"],
      remote_control: ["remote control", "rc car", "rc helicopter", "drone", "toy drone", "rc boat"],
      outdoor_toys: ["outdoor game", "outdoor toy", "trampoline", "water gun", "nerf", "frisbee", "kite"],
    },
  },

  jewellery: {
    aliases: ["jewellery", "jewelry", "jewel", "jewels", "ornament", "ornaments", "accessories"],
    children: {
      necklaces: ["necklace", "pendant", "chain", "choker", "mangalsutra", "locket"],
      earrings: ["earring", "earrings", "studs", "jhumka", "jhumkas", "hoop earring", "drop earring"],
      rings: ["ring", "rings", "engagement ring", "wedding ring", "finger ring"],
      bracelets: ["bracelet", "bracelets", "bangle", "bangles", "kada", "cuff", "charm bracelet"],
      anklets: ["anklet", "anklets", "payal", "toe ring"],
    },
  },

  watches: {
    aliases: ["watches", "watch", "wristwatch", "timepiece"],
    children: {
      mens_watches: ["mens watch", "men's watch", "analog watch", "digital watch", "chronograph"],
      womens_watches: ["womens watch", "women's watch", "ladies watch"],
      smart_watches: ["smartwatch", "smart watch", "fitness watch", "apple watch", "galaxy watch"],
      luxury_watches: ["luxury watch", "premium watch", "designer watch", "automatic watch"],
    },
  },

  home_decor: {
    aliases: ["home decor", "decor", "decoration", "decorations", "home decoration", "interior"],
    children: {
      wall_decor: ["wall art", "painting", "paintings", "poster", "posters", "wall clock", "mirror", "photo frame", "canvas"],
      lighting: ["lamp", "lamps", "light", "led light", "fairy lights", "table lamp", "floor lamp", "chandelier", "pendant light"],
      textiles: ["curtain", "curtains", "carpet", "rug", "bedsheet", "bed sheet", "cushion", "cushion cover", "throw pillow", "blanket", "comforter", "duvet"],
      garden: ["planter", "plant pot", "garden decor", "artificial plant", "artificial flower", "vase"],
    },
  },
};

// ─── Build Lookup Maps ──────────────────────────────────────

const aliasToRoot = new Map();
const termToNode = new Map();
const rootCategories = new Map();

const allTermsForRoot = (rootKey) => {
  const root = TAXONOMY_TREE[rootKey];
  if (!root) return [];
  const terms = [];
  for (const subcategoryTerms of Object.values(root.children)) {
    terms.push(...subcategoryTerms);
  }
  return terms;
};

const allFlatChildren = (rootKey) => {
  const root = TAXONOMY_TREE[rootKey];
  if (!root) return [];
  const result = [];
  for (const [subGroup, terms] of Object.entries(root.children)) {
    result.push(...terms);
  }
  return result;
};

for (const [rootKey, rootData] of Object.entries(TAXONOMY_TREE)) {
  const allChildren = allFlatChildren(rootKey);
  const allAliases = rootData.aliases || [];

  const rootNode = {
    key: rootKey,
    specificity: "broad",
    aliases: allAliases,
    allChildren,
    subcategories: rootData.children,
    ancestors: [],
    siblings: [],
  };

  rootCategories.set(rootKey, rootNode);

  for (const alias of allAliases) {
    const normalized = alias.toLowerCase().trim();
    aliasToRoot.set(normalized, rootKey);
    termToNode.set(normalized, {
      term: normalized,
      rootKey,
      specificity: "broad",
      subcategoryGroup: null,
      matchedTerms: allChildren,
      ancestors: [rootKey],
      siblings: [],
    });
  }

  for (const [subGroup, terms] of Object.entries(rootData.children)) {
    const siblingTerms = allChildren.filter((t) => !terms.includes(t));

    for (const term of terms) {
      const normalized = term.toLowerCase().trim();
      if (termToNode.has(normalized) && termToNode.get(normalized).specificity === "broad") {
        continue;
      }

      const synonyms = terms.filter((t) => t !== term);

      termToNode.set(normalized, {
        term: normalized,
        rootKey,
        specificity: "narrow",
        subcategoryGroup: subGroup,
        matchedTerms: terms,
        synonyms,
        ancestors: [rootKey, subGroup],
        siblings: siblingTerms,
      });
    }
  }
}

// ─── Known Brands ───────────────────────────────────────────

const KNOWN_BRANDS = new Set([
  "apple", "samsung", "xiaomi", "redmi", "oneplus", "realme", "oppo", "vivo",
  "motorola", "nokia", "google", "pixel", "nothing",
  "sony", "lg", "panasonic", "philips", "bose", "jbl", "sennheiser", "boat",
  "hp", "dell", "lenovo", "asus", "acer", "msi",
  "nike", "adidas", "puma", "reebok", "new balance", "skechers", "fila", "asics",
  "zara", "h&m", "uniqlo", "levis", "levi's", "tommy hilfiger", "gap", "gucci",
  "prada", "louis vuitton", "dior", "chanel", "versace",
  "titan", "fossil", "casio", "fastrack", "timex", "rolex", "omega",
  "bosch", "whirlpool", "haier", "godrej", "voltas", "daikin", "hitachi",
  "ikea", "nilkamal", "urban ladder", "pepperfry",
  "nestle", "amul", "britannia", "parle", "haldiram",
  "lakme", "maybelline", "loreal", "l'oreal", "nivea", "dove", "garnier",
  "woodland", "bata", "liberty", "hush puppies", "red tape", "sparx",
  "american tourister", "samsonite", "safari", "wildcraft", "skybags",
  "bajaj", "prestige", "butterfly", "preethi", "morphy richards",
  "havells", "crompton", "orient", "usha", "v-guard",
  "boat", "noise", "fire-boltt", "amazfit",
]);

// ─── Public API ─────────────────────────────────────────────

export const lookupTerm = (term) => {
  if (!term) return null;
  const normalized = term.toLowerCase().trim();
  return termToNode.get(normalized) || null;
};

export const lookupAlias = (alias) => {
  if (!alias) return null;
  const normalized = alias.toLowerCase().trim();
  const rootKey = aliasToRoot.get(normalized);
  if (!rootKey) return null;
  return rootCategories.get(rootKey) || null;
};

export const isKnownBrand = (term) => {
  if (!term) return false;
  return KNOWN_BRANDS.has(term.toLowerCase().trim());
};

export const getAllTermsForCategory = (rootKey) => {
  return allTermsForRoot(rootKey);
};

export const getRootCategories = () => {
  return rootCategories;
};

export const getSubcategoryTerms = (rootKey, subGroup) => {
  const root = TAXONOMY_TREE[rootKey];
  if (!root || !root.children[subGroup]) return [];
  return root.children[subGroup];
};

export const findTermInTaxonomy = (rawToken) => {
  if (!rawToken) return null;
  const token = rawToken.toLowerCase().trim();

  const direct = termToNode.get(token);
  if (direct) return direct;

  const rootHit = aliasToRoot.get(token);
  if (rootHit) return termToNode.get(token) || null;

  const singularForms = [];
  if (token.endsWith("ies") && token.length > 4) singularForms.push(token.slice(0, -3) + "y");
  if (token.endsWith("es") && token.length > 4) singularForms.push(token.slice(0, -2));
  if (token.endsWith("s") && !token.endsWith("ss") && token.length > 3) singularForms.push(token.slice(0, -1));

  for (const form of singularForms) {
    const hit = termToNode.get(form);
    if (hit) return hit;
  }

  const pluralForms = [token + "s", token + "es"];
  for (const form of pluralForms) {
    const hit = termToNode.get(form);
    if (hit) return hit;
  }

  return null;
};

export const getSiblingTermsForNode = (node) => {
  if (!node || !node.siblings) return [];
  return node.siblings;
};

export const buildTaxonomyRegex = (terms) => {
  if (!terms || !terms.length) return null;
  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(`\\b(${escaped.join("|")})\\b`, "i");
};

export const getBroadCategoryLabel = (rootKey) => {
  const root = TAXONOMY_TREE[rootKey];
  if (!root) return null;
  return root.aliases[0] || rootKey;
};

export { KNOWN_BRANDS, TAXONOMY_TREE };
