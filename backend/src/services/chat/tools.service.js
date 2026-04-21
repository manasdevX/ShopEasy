/**
 * ─────────────────────────────────────────────────────────────
 *  tools.service.js — Chatbot Tool Functions (Function Calling)
 * ─────────────────────────────────────────────────────────────
 *  Defines the tool/function schemas for LLM function calling
 *  and implements each tool's execution logic. Tools interact
 *  with the database to fetch real product and order data.
 *
 *  Tools:
 *  1. search_products       — Search product catalog
 *  2. get_product_details   — Get detailed product info
 *  3. get_user_orders       — Fetch user's recent orders
 *  4. get_order_by_reference— Look up specific order
 *  5. answer_faq            — Answer policy/support questions
 *  6. get_categories        — List available product categories
 *  7. get_trending_products — Fetch featured/bestseller/popular items
 * ─────────────────────────────────────────────────────────────
 */

import mongoose from "mongoose";
import Product from "../../models/Product.js";
import Order from "../../models/Order.js";
import {
  CHAT_FAQ_KNOWLEDGE_BASE,
  CHAT_SUPPORT_FALLBACK,
} from "../../config/chatKnowledge.js";

// ── Constants ──

const DEFAULT_PRODUCT_LIMIT = 5;
const MAX_PRODUCT_LIMIT = 8;
const DEFAULT_ORDER_LIMIT = 5;
const MAX_ORDER_LIMIT = 10;

// ── Utility Functions ──

const clampNumber = (value, min, max, fallback) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(Math.max(numeric, min), max);
};

const normalize = (value = "") => value.toString().toLowerCase().trim();

const dedupeById = (items) => {
  const byId = new Map();
  for (const item of items || []) {
    if (!item || !item.id) continue;
    if (!byId.has(item.id)) byId.set(item.id, item);
  }
  return [...byId.values()];
};

// Words that signal a "discovery" intent rather than a specific product search
const DISCOVERY_KEYWORDS = [
  "trending", "popular", "best", "top", "hot", "featured",
  "bestseller", "best seller", "new", "latest", "recommended",
  "deals", "offers", "discount", "sale", "cheap",
];

const isDiscoveryQuery = (query = "") => {
  const text = normalize(query);
  return DISCOVERY_KEYWORDS.some((kw) => text.includes(kw));
};

// ── Data Transformers ──

const toProductCard = (product) => {
  const id = product._id.toString();
  const availability =
    product.isAvailable && product.stock > 0 ? "In Stock" : "Out of Stock";

  return {
    id,
    name: product.name,
    price: product.price,
    mrp: product.mrp,
    category: product.category,
    brand: product.brand,
    description: (product.description || "").slice(0, 200),
    stock: product.stock,
    rating: product.rating || 0,
    numReviews: product.numReviews || 0,
    discountPercentage: product.discountPercentage || 0,
    availability,
    thumbnail: product.thumbnail,
    link: `/product/${id}`,
    isFeatured: product.isFeatured || false,
    isBestSeller: product.isBestSeller || false,
  };
};

const toOrderCard = (order) => {
  const id = order._id.toString();

  return {
    id,
    shortId: id.slice(-6).toUpperCase(),
    status: order.status,
    totalPrice: order.totalPrice,
    paymentMethod: order.paymentMethod,
    isPaid: order.isPaid,
    isDelivered: order.isDelivered,
    createdAt: order.createdAt,
    itemCount: order.orderItems.length,
    items: order.orderItems.slice(0, 4).map((item) => ({
      name: item.name,
      qty: item.qty,
      price: item.price,
      itemStatus: item.itemStatus,
      image: item.image,
    })),
  };
};

// ── Query Builders ──

const buildProductQuery = ({
  query,
  category,
  minPrice,
  maxPrice,
  inStockOnly = true,
  brand,
}) => {
  const criteria = {};

  const text = normalize(query);

  // Strip out discovery keywords to get actual product-relevant terms
  const cleanedText = text
    .replace(
      /\b(trending|popular|best|top|hot|featured|bestseller|best seller|new|latest|recommended|deals|offers|discount|sale|cheap|show|find|me|please|some|the|under|below|i want|i need)\b/gi,
      " "
    )
    .replace(/\s+/g, " ")
    .trim();

  if (cleanedText && cleanedText.length > 1) {
    // Use multiple search strategies for better results
    const searchTerms = cleanedText.split(" ").filter((t) => t.length > 1);

    if (searchTerms.length > 0) {
      criteria.$or = [];

      // Exact phrase match (highest relevance)
      criteria.$or.push(
        { name: { $regex: cleanedText, $options: "i" } },
        { brand: { $regex: cleanedText, $options: "i" } },
        { category: { $regex: cleanedText, $options: "i" } },
        { tags: { $regex: cleanedText, $options: "i" } },
        { subCategory: { $regex: cleanedText, $options: "i" } }
      );

      // Individual word matches (broader results)
      for (const term of searchTerms) {
        criteria.$or.push(
          { name: { $regex: term, $options: "i" } },
          { category: { $regex: term, $options: "i" } },
          { tags: { $regex: term, $options: "i" } }
        );
      }
    }
  }

  if (category) {
    criteria.category = { $regex: normalize(category), $options: "i" };
  }

  if (brand) {
    criteria.brand = { $regex: normalize(brand), $options: "i" };
  }

  if (minPrice || maxPrice) {
    criteria.price = {};
    if (minPrice) criteria.price.$gte = Number(minPrice);
    if (maxPrice) criteria.price.$lte = Number(maxPrice);
  }

  if (inStockOnly) {
    criteria.stock = { $gt: 0 };
    criteria.isAvailable = true;
  }

  return criteria;
};

// ── FAQ Scoring ──

const scoreFaqEntry = (entry, text) => {
  let score = 0;
  const normalizedText = normalize(text);

  for (const keyword of entry.keywords) {
    if (normalizedText.includes(keyword)) {
      score += keyword.split(" ").length;
    }
  }

  if (normalizedText.includes(entry.topic)) score += 3;
  return score;
};

// ── Tool Definitions (OpenAI Function Calling Schema) ──

export const CHAT_TOOL_DEFINITIONS = [
  {
    type: "function",
    function: {
      name: "search_products",
      description:
        "Search the ShopEasy product catalog. Use this for product recommendations, category browsing, budget-based filtering, and finding specific items. Always use this before recommending products.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "Search keyword, category name, brand, or product phrase. Examples: 'wireless headphones', 'Samsung phones', 'running shoes'.",
          },
          category: {
            type: "string",
            description:
              "Optional explicit category filter like 'smartphones', 'laptops', 'beauty', 'furniture', etc.",
          },
          brand: {
            type: "string",
            description: "Optional brand filter like 'Samsung', 'Apple', 'Nike', etc.",
          },
          minPrice: {
            type: "number",
            description: "Minimum product price in INR.",
          },
          maxPrice: {
            type: "number",
            description: "Maximum product price in INR.",
          },
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 8,
            description: "Number of products to return (default: 5, max: 8).",
          },
          inStockOnly: {
            type: "boolean",
            description: "If true, only return in-stock items (default: true).",
          },
        },
        required: ["query"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_trending_products",
      description:
        "Get trending, popular, featured, or best-selling products. Use this when users ask for trending items, popular products, best sellers, new arrivals, hot deals, or recommendations without a specific product in mind.",
      parameters: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["featured", "bestseller", "top_rated", "new_arrivals", "deals", "popular"],
            description:
              "Type of discovery: 'featured' for featured items, 'bestseller' for best sellers, 'top_rated' for highest rated, 'new_arrivals' for newest, 'deals' for biggest discounts, 'popular' for a mix.",
          },
          category: {
            type: "string",
            description: "Optional category filter like 'smartphones', 'laptops', 'beauty'.",
          },
          maxPrice: {
            type: "number",
            description: "Optional maximum price filter in INR.",
          },
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 8,
            description: "Number of products to return (default: 6).",
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_product_details",
      description:
        "Fetch detailed information about a specific product including price, stock, description, and ratings. Use when a user asks about a particular product.",
      parameters: {
        type: "object",
        properties: {
          productId: {
            type: "string",
            description: "Exact MongoDB product ID if known from a previous search result.",
          },
          name: {
            type: "string",
            description:
              "Product name to look up when productId is not available. Uses fuzzy matching.",
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_user_orders",
      description:
        "Fetch the latest orders of the currently signed-in user. Use for order tracking queries like 'where is my order', 'show my orders', 'my recent orders'. Requires the user to be logged in.",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            description:
              "Optional status filter.",
            enum: [
              "Processing",
              "Shipped",
              "Delivered",
              "Cancelled",
              "Return Initiated",
              "Returned",
            ],
          },
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 10,
            description: "Number of orders to return (default: 5).",
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_order_by_reference",
      description:
        "Fetch a specific order by its order ID or short reference code. Use when a user provides an order number like '#A1B2C3' or a full order ID. Requires the user to be logged in.",
      parameters: {
        type: "object",
        properties: {
          orderReference: {
            type: "string",
            description:
              "The order identifier — can be a full 24-character MongoDB ID or a 6-character short reference.",
          },
        },
        required: ["orderReference"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "answer_faq",
      description:
        "Answer frequently asked questions about ShopEasy policies including shipping, returns, refunds, payments, warranty, seller program, and account management. Use this for policy and support queries.",
      parameters: {
        type: "object",
        properties: {
          question: {
            type: "string",
            description: "The user's support question in natural language.",
          },
          topic: {
            type: "string",
            description:
              "Optional topic hint: 'shipping', 'returns', 'payments', 'orders', 'seller', 'account', 'pricing', 'warranty', 'general'.",
          },
        },
        required: ["question"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_categories",
      description:
        "Get a list of available product categories on ShopEasy. Use when users want to browse by category or ask what's available.",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    },
  },
];

// ── Tool Implementations ──

export const searchProductsTool = async (args = {}) => {
  const {
    query = "",
    category = "",
    brand = "",
    minPrice = null,
    maxPrice = null,
    inStockOnly = true,
  } = args;

  const limit = clampNumber(args.limit, 1, MAX_PRODUCT_LIMIT, DEFAULT_PRODUCT_LIMIT);

  // If the query is a discovery keyword with no specific product,
  // redirect to trending products
  const queryText = normalize(query);
  if (isDiscoveryQuery(queryText)) {
    const cleanedForCategory = queryText
      .replace(
        /\b(trending|popular|best|top|hot|featured|bestseller|best seller|new|latest|recommended|deals|offers|discount|sale|cheap|show|find|me|please|some|the)\b/gi,
        ""
      )
      .trim();

    // If there's a category-like word remaining, search with the discovery type
    const discoveryType = queryText.includes("deal") || queryText.includes("discount") || queryText.includes("sale") || queryText.includes("cheap")
      ? "deals"
      : queryText.includes("new") || queryText.includes("latest")
        ? "new_arrivals"
        : queryText.includes("best")
          ? "bestseller"
          : "popular";

    return getTrendingProductsTool({
      type: discoveryType,
      category: cleanedForCategory || category || undefined,
      maxPrice: maxPrice || undefined,
      limit,
    });
  }

  const dbQuery = buildProductQuery({
    query,
    category,
    minPrice,
    maxPrice,
    inStockOnly,
    brand,
  });

  let products = await Product.find(dbQuery)
    .select(
      "_id name price mrp stock isAvailable description thumbnail category brand rating numReviews discountPercentage isFeatured isBestSeller"
    )
    .sort({ isFeatured: -1, rating: -1, createdAt: -1 })
    .limit(limit)
    .lean();

  // If no results, try broader search by splitting query into individual words
  if (products.length === 0 && queryText.length > 3) {
    const words = queryText.split(/\s+/).filter((w) => w.length > 2);
    if (words.length > 0) {
      const broadOr = [];
      for (const word of words) {
        broadOr.push(
          { name: { $regex: word, $options: "i" } },
          { category: { $regex: word, $options: "i" } },
          { brand: { $regex: word, $options: "i" } },
          { tags: { $regex: word, $options: "i" } }
        );
      }

      const broadQuery = { $or: broadOr };
      if (inStockOnly) {
        broadQuery.stock = { $gt: 0 };
        broadQuery.isAvailable = true;
      }
      if (maxPrice) broadQuery.price = { $lte: Number(maxPrice) };

      products = await Product.find(broadQuery)
        .select(
          "_id name price mrp stock isAvailable description thumbnail category brand rating numReviews discountPercentage isFeatured isBestSeller"
        )
        .sort({ rating: -1, isFeatured: -1 })
        .limit(limit)
        .lean();
    }
  }

  // Last resort: if still no results, show popular products
  if (products.length === 0) {
    products = await Product.find({ isAvailable: true, stock: { $gt: 0 } })
      .select(
        "_id name price mrp stock isAvailable description thumbnail category brand rating numReviews discountPercentage isFeatured isBestSeller"
      )
      .sort({ isFeatured: -1, rating: -1 })
      .limit(limit)
      .lean();
  }

  return {
    count: products.length,
    filters: { query, category, brand, minPrice, maxPrice, inStockOnly },
    products: products.map(toProductCard),
  };
};

/**
 * NEW: Get trending/featured/bestseller/new products
 */
export const getTrendingProductsTool = async (args = {}) => {
  const limit = clampNumber(args.limit, 1, MAX_PRODUCT_LIMIT, 6);
  const type = args.type || "popular";
  const criteria = { isAvailable: true, stock: { $gt: 0 } };

  if (args.category) {
    criteria.category = { $regex: normalize(args.category), $options: "i" };
  }
  if (args.maxPrice) {
    criteria.price = { $lte: Number(args.maxPrice) };
  }

  let sort = {};
  let label = "Popular Products";

  switch (type) {
    case "featured":
      criteria.isFeatured = true;
      sort = { rating: -1, createdAt: -1 };
      label = "Featured Products";
      break;
    case "bestseller":
      criteria.isBestSeller = true;
      sort = { rating: -1, numReviews: -1 };
      label = "Best Sellers";
      break;
    case "top_rated":
      sort = { rating: -1, numReviews: -1 };
      label = "Top Rated Products";
      break;
    case "new_arrivals":
      sort = { createdAt: -1 };
      label = "New Arrivals";
      break;
    case "deals":
      sort = { discountPercentage: -1, rating: -1 };
      label = "Best Deals";
      break;
    case "popular":
    default:
      sort = { isFeatured: -1, rating: -1, numReviews: -1 };
      label = "Popular Products";
      break;
  }

  let products = await Product.find(criteria)
    .select(
      "_id name price mrp stock isAvailable description thumbnail category brand rating numReviews discountPercentage isFeatured isBestSeller"
    )
    .sort(sort)
    .limit(limit)
    .lean();

  // If no results with strict criteria (e.g., no featured items), fall back
  if (products.length === 0) {
    const fallbackCriteria = { isAvailable: true, stock: { $gt: 0 } };
    if (args.category) {
      fallbackCriteria.category = { $regex: normalize(args.category), $options: "i" };
    }
    if (args.maxPrice) {
      fallbackCriteria.price = { $lte: Number(args.maxPrice) };
    }

    products = await Product.find(fallbackCriteria)
      .select(
        "_id name price mrp stock isAvailable description thumbnail category brand rating numReviews discountPercentage isFeatured isBestSeller"
      )
      .sort({ rating: -1, isFeatured: -1, createdAt: -1 })
      .limit(limit)
      .lean();
  }

  return {
    count: products.length,
    type,
    label,
    products: products.map(toProductCard),
  };
};

export const getProductDetailsTool = async (args = {}) => {
  const { productId, name } = args;

  let product = null;

  // Try by ID first
  if (productId && mongoose.Types.ObjectId.isValid(productId)) {
    product = await Product.findById(productId)
      .select(
        "_id name price mrp stock isAvailable description thumbnail category brand rating numReviews discountPercentage isFeatured isBestSeller"
      )
      .lean();
  }

  // Fallback to name search with progressively broader matching
  if (!product && name) {
    const searchName = normalize(name);

    // Try exact match first
    product = await Product.findOne({
      name: { $regex: searchName, $options: "i" },
    })
      .select(
        "_id name price mrp stock isAvailable description thumbnail category brand rating numReviews discountPercentage isFeatured isBestSeller"
      )
      .sort({ rating: -1, createdAt: -1 })
      .lean();

    // Try word-by-word match
    if (!product) {
      const words = searchName.split(/\s+/).filter((w) => w.length > 2);
      if (words.length > 0) {
        product = await Product.findOne({
          $and: words.map((w) => ({
            $or: [
              { name: { $regex: w, $options: "i" } },
              { brand: { $regex: w, $options: "i" } },
            ],
          })),
        })
          .select(
            "_id name price mrp stock isAvailable description thumbnail category brand rating numReviews discountPercentage isFeatured isBestSeller"
          )
          .sort({ rating: -1 })
          .lean();
      }
    }
  }

  if (!product) {
    return {
      found: false,
      message: "No matching product found. Try a different name or browse by category.",
      product: null,
    };
  }

  return {
    found: true,
    product: toProductCard(product),
  };
};

export const getUserOrdersTool = async (args = {}, userId) => {
  if (!userId) {
    return {
      requiresAuth: true,
      message: "Please sign in to view your orders. I can help with order tracking once you're logged in.",
      orders: [],
    };
  }

  const limit = clampNumber(args.limit, 1, MAX_ORDER_LIMIT, DEFAULT_ORDER_LIMIT);
  const query = { user: userId };

  if (args.status) {
    query.status = args.status;
  }

  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return {
    requiresAuth: false,
    count: orders.length,
    orders: orders.map(toOrderCard),
  };
};

export const getOrderByReferenceTool = async (args = {}, userId) => {
  if (!userId) {
    return {
      requiresAuth: true,
      message: "Please sign in to look up order details.",
      order: null,
    };
  }

  const reference = normalize(args.orderReference || "").replace(/^#/, "");
  if (!reference) {
    return {
      requiresAuth: false,
      order: null,
      message: "Please share the order ID or short reference code (e.g., #A1B2C3).",
    };
  }

  let order = null;

  if (reference.length === 24 && mongoose.Types.ObjectId.isValid(reference)) {
    order = await Order.findOne({ _id: reference, user: userId }).lean();
  }

  if (!order) {
    const candidates = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    order =
      candidates.find(
        (item) => item._id.toString().toLowerCase() === reference
      ) ||
      candidates.find(
        (item) =>
          item._id.toString().slice(-6).toLowerCase() === reference
      );
  }

  if (!order) {
    return {
      requiresAuth: false,
      order: null,
      message:
        "No matching order found for that reference. Please double-check the ID and try again.",
    };
  }

  return {
    requiresAuth: false,
    order: toOrderCard(order),
  };
};

export const answerFaqTool = async (args = {}) => {
  const question = normalize(args.question || "");
  const topicHint = normalize(args.topic || "");

  let candidates = CHAT_FAQ_KNOWLEDGE_BASE;
  if (topicHint) {
    const byTopic = CHAT_FAQ_KNOWLEDGE_BASE.filter(
      (entry) => entry.topic === topicHint
    );
    if (byTopic.length > 0) {
      candidates = byTopic;
    }
  }

  const ranked = candidates
    .map((entry) => ({ entry, score: scoreFaqEntry(entry, question) }))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  if (!best || best.score <= 0) {
    return {
      matched: false,
      topic: "general",
      answer: CHAT_SUPPORT_FALLBACK,
    };
  }

  return {
    matched: true,
    topic: best.entry.topic,
    answer: best.entry.answer,
  };
};

export const getCategoriesList = async () => {
  try {
    const categoryData = await Product.aggregate([
      { $match: { isAvailable: true, stock: { $gt: 0 } } },
      {
        $group: {
          _id: "$category",
          productCount: { $sum: 1 },
          avgRating: { $avg: "$rating" },
          minPrice: { $min: "$price" },
        },
      },
      { $sort: { productCount: -1 } },
    ]);

    return {
      categories: categoryData.map((cat) => ({
        name: cat._id,
        productCount: cat.productCount,
        avgRating: Math.round(cat.avgRating * 10) / 10,
        startingPrice: cat.minPrice,
      })),
    };
  } catch (error) {
    return { categories: [] };
  }
};

// ── Tool Execution Router ──

export const executeChatTool = async (toolName, args, { user } = {}) => {
  switch (toolName) {
    case "search_products": {
      const result = await searchProductsTool(args);
      return { result, ui: { products: result.products } };
    }
    case "get_trending_products": {
      const result = await getTrendingProductsTool(args);
      return { result, ui: { products: result.products } };
    }
    case "get_product_details": {
      const result = await getProductDetailsTool(args);
      return {
        result,
        ui: { products: result.product ? [result.product] : [] },
      };
    }
    case "get_user_orders": {
      const result = await getUserOrdersTool(args, user?._id);
      return { result, ui: { orders: result.orders || [] } };
    }
    case "get_order_by_reference": {
      const result = await getOrderByReferenceTool(args, user?._id);
      return {
        result,
        ui: { orders: result.order ? [result.order] : [] },
      };
    }
    case "answer_faq": {
      const result = await answerFaqTool(args);
      return {
        result,
        ui: { faq: result },
      };
    }
    case "get_categories": {
      const result = await getCategoriesList();
      return {
        result,
        ui: {},
      };
    }
    default:
      return {
        result: { error: `Unknown tool: ${toolName}` },
        ui: {},
      };
  }
};

// ── UI Payload Merger ──

export const mergeToolUiPayload = (aggregate, ui = {}) => {
  return {
    products: dedupeById([
      ...(aggregate.products || []),
      ...(ui.products || []),
    ]),
    orders: dedupeById([...(aggregate.orders || []), ...(ui.orders || [])]),
    faq: ui.faq || aggregate.faq || null,
  };
};
