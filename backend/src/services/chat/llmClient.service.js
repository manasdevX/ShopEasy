/**
 * ─────────────────────────────────────────────────────────────
 *  llmClient.service.js — LLM Provider Abstraction Layer
 * ─────────────────────────────────────────────────────────────
 *  Creates and caches an OpenAI-compatible LLM client.
 *  Supports Gemini (via OpenAI-compatible endpoint) and OpenAI
 *  natively. Uses env vars for configuration.
 *
 *  Provider priority: GEMINI_API_KEY → OPENAI_API_KEY
 * ─────────────────────────────────────────────────────────────
 */

import OpenAI from "openai";

let cachedClient = null;
let cachedStreamClient = null;

const GEMINI_OPENAI_BASE_URL =
  process.env.GEMINI_OPENAI_BASE_URL ||
  "https://generativelanguage.googleapis.com/v1beta/openai/";

/**
 * Detect which LLM provider is configured.
 */
export const getLlmProviderName = () => {
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.OPENAI_API_KEY) return "openai";
  return null;
};

/**
 * Get the configured model name for the active provider.
 */
export const getLlmModelName = () => {
  const provider = getLlmProviderName();

  if (provider === "gemini") {
    return process.env.GEMINI_MODEL || "gemini-2.5-flash";
  }

  return process.env.OPENAI_MODEL || "gpt-4.1-mini";
};

/**
 * Check if any LLM provider is configured.
 */
export const hasLlmProvider = () => Boolean(getLlmProviderName());

/**
 * Get (or create) a cached OpenAI-compatible client for non-streaming calls.
 */
export const getLlmClient = () => {
  if (!hasLlmProvider()) return null;

  if (!cachedClient) {
    const provider = getLlmProviderName();

    if (provider === "gemini") {
      cachedClient = new OpenAI({
        apiKey: process.env.GEMINI_API_KEY,
        baseURL: GEMINI_OPENAI_BASE_URL,
      });
    } else {
      cachedClient = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  return cachedClient;
};

/**
 * Get (or create) a cached client configured for streaming.
 * This is the same client but kept separate for clarity.
 */
export const getStreamingClient = () => {
  if (!hasLlmProvider()) return null;

  if (!cachedStreamClient) {
    const provider = getLlmProviderName();

    if (provider === "gemini") {
      cachedStreamClient = new OpenAI({
        apiKey: process.env.GEMINI_API_KEY,
        baseURL: GEMINI_OPENAI_BASE_URL,
      });
    } else {
      cachedStreamClient = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
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
