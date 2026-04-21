/**
 * ─────────────────────────────────────────────────────────────
 *  chatbot.service.js — Core Chatbot Orchestrator
 * ─────────────────────────────────────────────────────────────
 *  The main entry point for processing chat messages. Handles:
 *  - LLM-powered conversation with multi-turn context
 *  - Function/tool calling for products, orders, and FAQs
 *  - Smart deterministic fallback when LLM is unavailable
 *  - Streaming support for real-time responses
 *  - Session management for conversation continuity
 *
 *  Architecture:
 *  User Message → Intent Detection → LLM + Tools → Response
 *                                  ↓ (fallback)
 *                        Smart Deterministic Handlers
 * ─────────────────────────────────────────────────────────────
 */

import {
  detectIntent,
  extractOrderReference,
  extractPriceBudget,
  extractSearchQuery,
  extractCategory,
} from "./intent.service.js";
import {
  CHAT_TOOL_DEFINITIONS,
  answerFaqTool,
  executeChatTool,
  getOrderByReferenceTool,
  getProductDetailsTool,
  getUserOrdersTool,
  getTrendingProductsTool,
  mergeToolUiPayload,
  searchProductsTool,
} from "./tools.service.js";
import {
  createChatSessionId,
  loadChatSessionHistory,
  saveChatSessionHistory,
} from "./sessionStore.service.js";
import {
  getLlmClient,
  getLlmModelName,
  getLlmProviderName,
  getStreamingClient,
} from "./llmClient.service.js";
import {
  CHAT_BRAND_PERSONA,
  CHAT_SUPPORT_FALLBACK,
} from "../../config/chatKnowledge.js";

// ── Configuration ──

const MAX_TOOL_ROUNDS = 5;
const MAX_HISTORY_MESSAGES = 16;
const LLM_RETRY_DELAY_MS = 1500;
const LLM_MAX_RETRIES = 1;

/**
 * Retry wrapper for LLM API calls — handles 429 rate limiting
 * with exponential backoff. Reduces fallback triggering.
 */
const retryLlmCall = async (callFn, label = "LLM") => {
  for (let attempt = 0; attempt <= LLM_MAX_RETRIES; attempt++) {
    try {
      return await callFn();
    } catch (error) {
      const is429 = error?.status === 429 || error?.message?.includes("429");
      if (is429 && attempt < LLM_MAX_RETRIES) {
        const delay = LLM_RETRY_DELAY_MS * (attempt + 1);
        console.warn(`${label}: Rate limited (429), retrying in ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      // Only log non-429 errors or final retry failures
      if (!is429) {
        console.error(`${label} failed:`, error.message);
      } else {
        console.warn(`${label}: Rate limited after ${attempt + 1} attempts, using fallback.`);
      }
      throw error;
    }
  }
};

// ── System Prompt ──

const SYSTEM_PROMPT = `${CHAT_BRAND_PERSONA}

## Available Tools
You have access to these tools to fetch real data:
- **search_products**: Search the product catalog by keyword, category, brand, or price range
- **get_trending_products**: Get trending, popular, featured, bestseller, or new arrival products. Use this when users ask for trending/popular/best/featured items.
- **get_product_details**: Get detailed info about a specific product
- **get_user_orders**: Fetch the logged-in user's recent orders
- **get_order_by_reference**: Look up a specific order by ID
- **answer_faq**: Answer policy questions (shipping, returns, payments, etc.)
- **get_categories**: List available product categories

## Response Guidelines
- ALWAYS use tools to fetch data before making claims about products or orders
- For "trending", "popular", "best", "featured" queries → use get_trending_products
- For specific product searches → use search_products
- If a tool returns no results, suggest alternative searches or categories
- When showing products, mention the key details: name, price, availability
- For order queries from unauthenticated users, ask them to sign in
- Use markdown formatting: **bold** for emphasis, bullet lists for multiple items
- Be conversational but efficient — no unnecessary filler
- Format prices with ₹ symbol
`;

// ── Helper Functions ──

const textFromAssistantContent = (content) => {
  if (!content) return "";
  if (typeof content === "string") return content;

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part?.type === "text") return part.text || "";
        return "";
      })
      .join(" ")
      .trim();
  }

  return String(content);
};

const trimHistory = (history = []) => history.slice(-MAX_HISTORY_MESSAGES);

const formatPrice = (price) => {
  if (!price) return "₹0";
  return `₹${Number(price).toLocaleString("en-IN")}`;
};

// ── Smart Deterministic Fallback System ──

const buildProductFallbackReply = (products, query, label) => {
  if (!products || products.length === 0) {
    return `I couldn't find products matching "${query}". Try a different keyword, browse by category, or adjust your budget.`;
  }

  const count = products.length;
  const headerLabel = label || "products";
  const lines = products
    .slice(0, 4)
    .map((item, i) => {
      const discount = item.discountPercentage > 0 ? ` ~~${formatPrice(item.mrp)}~~ (${item.discountPercentage}% off)` : "";
      const rating = item.rating > 0 ? ` ⭐ ${item.rating.toFixed(1)}` : "";
      return `${i + 1}. **${item.name}** — ${formatPrice(item.price)}${discount}${rating}`;
    })
    .join("\n");

  const suffix = count > 4
    ? `\n\n📌 Showing ${count} results. Want me to narrow these down by budget, brand, or category?`
    : "\n\nWant more details on any of these? Just ask!";

  return `Here are some ${headerLabel} for you:\n\n${lines}${suffix}`;
};

const buildOrderFallbackReply = (orders) => {
  if (!orders || orders.length === 0) {
    return "No recent orders found for your account. If you just placed an order, it may take a moment to appear.";
  }

  if (orders.length === 1) {
    const o = orders[0];
    const itemNames = o.items.map((i) => i.name).slice(0, 2).join(", ");
    return `Your order **#${o.shortId}** is currently **${o.status}**.\n\n- 📦 Items: ${itemNames}\n- 💰 Total: ${formatPrice(o.totalPrice)}\n- 📅 Placed: ${new Date(o.createdAt).toLocaleDateString("en-IN")}`;
  }

  const lines = orders.slice(0, 3).map(
    (o) => `- **#${o.shortId}** → ${o.status} (${formatPrice(o.totalPrice)}, ${o.itemCount} items)`
  ).join("\n");

  return `Here are your recent orders:\n\n${lines}\n\nWant details on a specific order? Share the order ID!`;
};

const buildFallbackReply = async ({ intent, message, user }) => {
  let ui = { products: [], orders: [], faq: null };

  // ─── Greeting ───
  if (intent === "GREETING") {
    return {
      reply: "Hey there! 👋 I'm your ShopEasy AI Assistant. I can help you find products, track orders, or answer questions about our policies. What are you looking for today?",
      ui,
      usedLlm: false,
    };
  }

  // ─── Order Tracking ───
  if (intent === "ORDER_TRACKING") {
    const orderRef = extractOrderReference(message);

    if (orderRef) {
      const orderResult = await getOrderByReferenceTool(
        { orderReference: orderRef },
        user?._id
      );
      if (orderResult.requiresAuth) {
        return {
          reply: "🔒 Please sign in to track your orders. Once logged in, I can instantly look up your order status!",
          ui,
          usedLlm: false,
        };
      }

      if (orderResult.order) {
        ui = mergeToolUiPayload(ui, { orders: [orderResult.order] });
        return {
          reply: `Order **#${orderResult.order.shortId}** is currently **${orderResult.order.status}**. Total: ${formatPrice(orderResult.order.totalPrice)}.`,
          ui,
          usedLlm: false,
        };
      }
    }

    const ordersResult = await getUserOrdersTool({ limit: 5 }, user?._id);
    if (ordersResult.requiresAuth) {
      return {
        reply: "🔒 Please sign in first so I can securely access your order history. Head to the [Login page](/login) and come back — I'll be here!",
        ui,
        usedLlm: false,
      };
    }

    ui = mergeToolUiPayload(ui, { orders: ordersResult.orders });

    return {
      reply: buildOrderFallbackReply(ordersResult.orders),
      ui,
      usedLlm: false,
    };
  }

  // ─── Product Details ───
  if (intent === "PRODUCT_DETAILS") {
    const details = await getProductDetailsTool({ name: message });
    if (!details.found) {
      // Fallback: search for the product
      const searchResult = await searchProductsTool({
        query: extractSearchQuery(message),
        limit: 4,
      });
      if (searchResult.products.length > 0) {
        ui = mergeToolUiPayload(ui, { products: searchResult.products });
        return {
          reply: buildProductFallbackReply(searchResult.products, message, "matching products"),
          ui,
          usedLlm: false,
        };
      }
      return {
        reply: "I couldn't find that specific product. Could you share the exact product name, or should I search for similar items?",
        ui,
        usedLlm: false,
      };
    }

    ui = mergeToolUiPayload(ui, { products: [details.product] });

    const p = details.product;
    const discount = p.discountPercentage ? ` (${p.discountPercentage}% off!)` : "";
    const ratingStr = p.rating > 0 ? `\n- ⭐ Rating: ${p.rating.toFixed(1)}/5 (${p.numReviews} reviews)` : "";
    return {
      reply: `**${p.name}**\n\n- 💰 Price: ${formatPrice(p.price)}${discount}\n- 📦 Status: ${p.availability}\n- 🏷️ Brand: ${p.brand}${ratingStr}\n\n${p.description}`,
      ui,
      usedLlm: false,
    };
  }

  // ─── FAQ Support ───
  if (intent === "FAQ_SUPPORT") {
    const faq = await answerFaqTool({ question: message });
    ui = mergeToolUiPayload(ui, { faq });
    return {
      reply: faq.answer || CHAT_SUPPORT_FALLBACK,
      ui,
      usedLlm: false,
    };
  }

  // ─── Product Search (default) ───
  const budget = extractPriceBudget(message);
  const category = extractCategory(message);
  const searchText = extractSearchQuery(message);

  const searchResult = await searchProductsTool({
    query: searchText,
    category: category || undefined,
    maxPrice: budget || undefined,
    inStockOnly: true,
    limit: 6,
  });

  ui = mergeToolUiPayload(ui, { products: searchResult.products });

  const label = searchResult.label || (
    budget ? `products under ${formatPrice(budget)}` :
      category ? `${category} products` :
        "results"
  );

  return {
    reply: buildProductFallbackReply(searchResult.products, searchText, label),
    ui,
    usedLlm: false,
  };
};

// ── LLM Conversation Engine ──

const runLlmConversation = async ({ message, history, user }) => {
  const client = getLlmClient();
  if (!client) return null;

  let ui = { products: [], orders: [], faq: null };

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map((entry) => ({
      role: entry.role,
      content: entry.content,
      ...(entry.tool_calls ? { tool_calls: entry.tool_calls } : {}),
      ...(entry.tool_call_id ? { tool_call_id: entry.tool_call_id } : {}),
      ...(entry.name ? { name: entry.name } : {}),
    })),
    { role: "user", content: message },
  ];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    let completion;
    try {
      completion = await retryLlmCall(
        () => client.chat.completions.create({
          model: getLlmModelName(),
          temperature: 0.3,
          max_tokens: 1024,
          messages,
          tools: CHAT_TOOL_DEFINITIONS,
          tool_choice: "auto",
        }),
        `LLM round ${round}`
      );
    } catch (error) {
      return null;
    }

    const assistantMessage = completion?.choices?.[0]?.message;
    if (!assistantMessage) break;

    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      messages.push({
        role: "assistant",
        content: assistantMessage.content || "",
        tool_calls: assistantMessage.tool_calls,
      });

      for (const toolCall of assistantMessage.tool_calls) {
        const toolName = toolCall.function?.name;
        let args = {};

        try {
          args = JSON.parse(toolCall.function?.arguments || "{}");
        } catch (parseError) {
          console.warn(
            `Failed to parse tool args for ${toolName}:`,
            parseError.message
          );
          args = {};
        }

        try {
          const toolResponse = await executeChatTool(toolName, args, { user });
          ui = mergeToolUiPayload(ui, toolResponse.ui);

          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            name: toolName,
            content: JSON.stringify(toolResponse.result),
          });
        } catch (toolError) {
          console.error(`Tool execution failed (${toolName}):`, toolError.message);
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            name: toolName,
            content: JSON.stringify({
              error: "Tool execution failed. Please try a different approach.",
            }),
          });
        }
      }

      continue;
    }

    const assistantReply = textFromAssistantContent(
      assistantMessage.content
    ).trim();

    return {
      reply: assistantReply || CHAT_SUPPORT_FALLBACK,
      ui,
      usedLlm: true,
    };
  }

  console.warn("Max tool rounds exceeded in LLM conversation");
  return null;
};

/**
 * Streaming LLM conversation generator.
 */
export const runStreamingLlmConversation = async function* ({
  message,
  history,
  user,
}) {
  const client = getStreamingClient();
  if (!client) return;

  let ui = { products: [], orders: [], faq: null };

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map((entry) => ({
      role: entry.role,
      content: entry.content,
      ...(entry.tool_calls ? { tool_calls: entry.tool_calls } : {}),
      ...(entry.tool_call_id ? { tool_call_id: entry.tool_call_id } : {}),
      ...(entry.name ? { name: entry.name } : {}),
    })),
    { role: "user", content: message },
  ];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    let completion;
    try {
      completion = await retryLlmCall(
        () => client.chat.completions.create({
          model: getLlmModelName(),
          temperature: 0.3,
          max_tokens: 1024,
          messages,
          tools: CHAT_TOOL_DEFINITIONS,
          tool_choice: "auto",
        }),
        `Stream round ${round}`
      );
    } catch (error) {
      return;
    }

    const assistantMessage = completion?.choices?.[0]?.message;
    if (!assistantMessage) break;

    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      messages.push({
        role: "assistant",
        content: assistantMessage.content || "",
        tool_calls: assistantMessage.tool_calls,
      });

      yield {
        type: "tool_start",
        tools: assistantMessage.tool_calls.map((tc) => tc.function?.name),
      };

      for (const toolCall of assistantMessage.tool_calls) {
        const toolName = toolCall.function?.name;
        let args = {};

        try {
          args = JSON.parse(toolCall.function?.arguments || "{}");
        } catch (parseError) {
          args = {};
        }

        try {
          const toolResponse = await executeChatTool(toolName, args, { user });
          ui = mergeToolUiPayload(ui, toolResponse.ui);

          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            name: toolName,
            content: JSON.stringify(toolResponse.result),
          });
        } catch (toolError) {
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            name: toolName,
            content: JSON.stringify({ error: "Tool execution failed." }),
          });
        }
      }

      yield { type: "tool_end", ui };
      continue;
    }

    const fullReply = textFromAssistantContent(assistantMessage.content).trim();
    if (fullReply) {
      const words = fullReply.split(/(\s+)/);
      let buffer = "";

      for (const word of words) {
        buffer += word;
        if (buffer.length >= 20) {
          yield { type: "chunk", text: buffer };
          buffer = "";
        }
      }

      if (buffer) {
        yield { type: "chunk", text: buffer };
      }
    }

    yield {
      type: "done",
      reply: fullReply || CHAT_SUPPORT_FALLBACK,
      ui,
      usedLlm: true,
    };
    return;
  }
};

// ── Public API ──

export const processChatMessage = async ({ message, sessionId, user }) => {
  const userMessage = String(message || "").trim();

  if (!userMessage) {
    throw new Error("Message is required");
  }

  const resolvedSessionId = sessionId || createChatSessionId();
  const history = await loadChatSessionHistory(resolvedSessionId);
  const intent = detectIntent(userMessage);

  let outcome;

  try {
    outcome = await runLlmConversation({
      message: userMessage,
      history,
      user,
    });
  } catch (error) {
    console.error("Chatbot LLM flow failed, using fallback:", error.message);
  }

  if (!outcome) {
    outcome = await buildFallbackReply({
      intent,
      message: userMessage,
      user,
    });
  }

  const reply = (outcome.reply || CHAT_SUPPORT_FALLBACK).trim();

  const nextHistory = trimHistory([
    ...history,
    { role: "user", content: userMessage },
    { role: "assistant", content: reply },
  ]);

  await saveChatSessionHistory(resolvedSessionId, nextHistory);

  return {
    sessionId: resolvedSessionId,
    intent,
    reply,
    ui: {
      products: outcome.ui?.products || [],
      orders: outcome.ui?.orders || [],
      faq: outcome.ui?.faq || null,
    },
    meta: {
      usedFallback: !outcome.usedLlm,
      provider: outcome.usedLlm ? getLlmProviderName() : "fallback",
      model: outcome.usedLlm ? getLlmModelName() : "deterministic",
      timestamp: new Date().toISOString(),
      userScoped: Boolean(user?._id),
    },
  };
};
