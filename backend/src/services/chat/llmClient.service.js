/**
 * ─────────────────────────────────────────────────────────────
 *  llmClient.service.js — Gemini LLM Client (Native SDK)
 * ─────────────────────────────────────────────────────────────
 *  Uses the @google/genai SDK directly for chat completions.
 *  Provides both standard and streaming conversation methods,
 *  wrapping the Gemini API with an OpenAI-compatible interface
 *  so the rest of the codebase can use it interchangeably.
 *
 *  Reads GEMINI_API_KEY and GEMINI_MODEL from process.env.
 * ─────────────────────────────────────────────────────────────
 */

import { GoogleGenAI } from "@google/genai";

let cachedGenAI = null;

const getGenAI = () => {
  if (!cachedGenAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    cachedGenAI = new GoogleGenAI({ apiKey });
  }
  return cachedGenAI;
};

/**
 * Detect which LLM provider is configured.
 */
export const getLlmProviderName = () => {
  if (process.env.GEMINI_API_KEY) return "gemini";
  return null;
};

/**
 * Get the configured model name for the active provider.
 */
export const getLlmModelName = () => {
  return process.env.GEMINI_MODEL || "gemini-2.5-flash";
};

/**
 * Fallback model chain — if the primary model is overloaded (503),
 * we try these in order.
 */
const FALLBACK_MODELS = ["gemini-2.0-flash", "gemini-2.0-flash-lite"];
const LLM_REQUEST_TIMEOUT_MS = 20000; // 20 second timeout per LLM call

export const getModelChain = () => {
  const primary = getLlmModelName();
  return [primary, ...FALLBACK_MODELS.filter((m) => m !== primary)];
};

/**
 * Check if any LLM provider is configured.
 */
export const hasLlmProvider = () => Boolean(getLlmProviderName());

// ── Tool Schema Converter ──
// Convert OpenAI-style tool definitions to Gemini function declarations

const convertToolsToGemini = (openaiTools = []) => {
  if (!openaiTools || openaiTools.length === 0) return undefined;

  const functionDeclarations = openaiTools.map((tool) => {
    const fn = tool.function;
    // Deep-clone params and strip 'additionalProperties' which Gemini doesn't support
    const params = JSON.parse(JSON.stringify(fn.parameters || {}));
    stripUnsupportedKeys(params);

    return {
      name: fn.name,
      description: fn.description,
      parameters: params,
    };
  });

  return [{ functionDeclarations }];
};

/**
 * Recursively strip keys Gemini doesn't accept (e.g. additionalProperties).
 */
const stripUnsupportedKeys = (obj) => {
  if (!obj || typeof obj !== "object") return;
  delete obj.additionalProperties;
  if (obj.properties) {
    for (const key of Object.keys(obj.properties)) {
      stripUnsupportedKeys(obj.properties[key]);
    }
  }
  if (obj.items) {
    stripUnsupportedKeys(obj.items);
  }
};

// ── Message Converter ──
// Convert OpenAI-style messages to Gemini SDK format

const convertMessagesToGemini = (messages = []) => {
  let systemInstruction = undefined;
  const contents = [];

  // Track tool calls by ID so we can match tool responses
  const pendingToolCalls = new Map();

  for (const msg of messages) {
    if (msg.role === "system") {
      systemInstruction = msg.content;
      continue;
    }

    if (msg.role === "user") {
      contents.push({
        role: "user",
        parts: [{ text: msg.content }],
      });
      continue;
    }

    if (msg.role === "assistant") {
      const parts = [];

      // Add text content if present
      if (msg.content && msg.content.trim()) {
        parts.push({ text: msg.content });
      }

      // Add function calls if present
      if (msg.tool_calls && msg.tool_calls.length > 0) {
        for (const tc of msg.tool_calls) {
          let args = {};
          try {
            args = JSON.parse(tc.function?.arguments || "{}");
          } catch {
            args = {};
          }
          parts.push({
            functionCall: {
              name: tc.function?.name,
              args,
            },
          });
          pendingToolCalls.set(tc.id, tc.function?.name);
        }
      }

      if (parts.length > 0) {
        contents.push({ role: "model", parts });
      }
      continue;
    }

    if (msg.role === "tool") {
      // Tool responses go as user messages with functionResponse parts
      let responseData;
      try {
        responseData = JSON.parse(msg.content);
      } catch {
        responseData = { result: msg.content };
      }

      contents.push({
        role: "user",
        parts: [
          {
            functionResponse: {
              name: msg.name,
              response: responseData,
            },
          },
        ],
      });
      continue;
    }
  }

  return { systemInstruction, contents };
};

// ── Response Converter ──
// Convert Gemini response to OpenAI-compatible format

const convertGeminiResponse = (response) => {
  const candidate = response?.candidates?.[0];
  if (!candidate) {
    return {
      choices: [{ message: { role: "assistant", content: "" } }],
    };
  }

  const parts = candidate.content?.parts || [];

  // Check for function calls
  const functionCallParts = parts.filter((p) => p.functionCall);
  if (functionCallParts.length > 0) {
    const toolCalls = functionCallParts.map((p, idx) => ({
      id: `call_${Date.now()}_${idx}`,
      type: "function",
      function: {
        name: p.functionCall.name,
        arguments: JSON.stringify(p.functionCall.args || {}),
      },
    }));

    // Also gather any text parts
    const textParts = parts.filter((p) => p.text);
    const textContent = textParts.map((p) => p.text).join("") || "";

    return {
      choices: [
        {
          message: {
            role: "assistant",
            content: textContent,
            tool_calls: toolCalls,
          },
        },
      ],
    };
  }

  // Text-only response
  const textContent = parts
    .filter((p) => p.text)
    .map((p) => p.text)
    .join("");

  return {
    choices: [
      {
        message: {
          role: "assistant",
          content: textContent,
        },
      },
    ],
  };
};

// ── Global Rate Limiter ──
// Gemini free tier is ~15 RPM. We enforce a minimum gap between calls
// to prevent burning through the quota with rapid-fire retries.

let lastApiCallTime = 0;
const MIN_CALL_GAP_MS = 4000; // 4 seconds between API calls = max 15 RPM

const waitForRateLimit = async () => {
  const now = Date.now();
  const elapsed = now - lastApiCallTime;
  if (elapsed < MIN_CALL_GAP_MS) {
    const waitMs = MIN_CALL_GAP_MS - elapsed;
    await new Promise((r) => setTimeout(r, waitMs));
  }
  lastApiCallTime = Date.now();
};

// ── OpenAI-Compatible Client Wrapper ──

const createGeminiClientWrapper = () => {
  const genAI = getGenAI();
  if (!genAI) return null;

  return {
    chat: {
      completions: {
        create: async ({
          model,
          messages,
          tools,
          temperature = 0.3,
          max_tokens = 1024,
        }) => {
          const { systemInstruction, contents } =
            convertMessagesToGemini(messages);

          const geminiTools = convertToolsToGemini(tools);

          const config = {
            temperature,
            maxOutputTokens: max_tokens,
          };

          if (systemInstruction) {
            config.systemInstruction = systemInstruction;
          }

          if (geminiTools) {
            config.tools = geminiTools;
          }

          // Try each model in the chain until one works
          const modelsToTry = getModelChain();
          let lastError = null;

          for (const modelName of modelsToTry) {
            try {
              await waitForRateLimit();

              const response = await genAI.models.generateContent({
                model: modelName,
                contents,
                config,
                // Prevent indefinite hangs if Gemini is slow
                ...(typeof AbortSignal?.timeout === "function"
                  ? { signal: AbortSignal.timeout(LLM_REQUEST_TIMEOUT_MS) }
                  : {}),
              });

              return convertGeminiResponse(response);
            } catch (err) {
              lastError = err;
              const is503 =
                err?.status === 503 || err?.message?.includes("503");
              const is429 =
                err?.status === 429 || err?.message?.includes("429");

              if (is429) {
                // Rate limit is per-key, not per-model — trying another model won't help.
                // Throw immediately so the retry wrapper in chatbot.service can handle backoff.
                throw err;
              }

              if (is503) {
                // Model overloaded — a different model might be available
                console.warn(
                  `⚠️ Model ${modelName} overloaded (503), trying next...`
                );
                continue;
              }

              // Non-retryable error — throw immediately
              throw err;
            }
          }

          // All models exhausted (all returned 503)
          throw lastError;
        },
      },
    },
  };
};

/**
 * Get (or create) a cached OpenAI-compatible client for non-streaming calls.
 */
let cachedClient = null;
export const getLlmClient = () => {
  if (!hasLlmProvider()) return null;
  if (!cachedClient) {
    cachedClient = createGeminiClientWrapper();
  }
  return cachedClient;
};

/**
 * Get (or create) a cached client configured for streaming.
 * Uses the same wrapper — kept separate for API compatibility.
 */
let cachedStreamClient = null;
export const getStreamingClient = () => {
  if (!hasLlmProvider()) return null;
  if (!cachedStreamClient) {
    cachedStreamClient = createGeminiClientWrapper();
  }
  return cachedStreamClient;
};

/**
 * Get the LLM configuration summary (for logging/debugging).
 */
export const getLlmConfig = () => ({
  provider: getLlmProviderName(),
  model: getLlmModelName(),
  available: hasLlmProvider(),
});
