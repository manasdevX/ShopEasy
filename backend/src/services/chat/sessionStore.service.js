/**
 * ─────────────────────────────────────────────────────────────
 *  sessionStore.service.js — Chat Session Persistence
 * ─────────────────────────────────────────────────────────────
 *  Manages multi-turn conversation history storage using Redis
 *  as primary store with an in-memory fallback for development.
 *  Each session stores the last N messages for context.
 * ─────────────────────────────────────────────────────────────
 */

import { randomUUID } from "crypto";
import redisClient from "../../config/redis.js";

const SESSION_KEY_PREFIX = "chat:session:";
const SESSION_TTL_SECONDS = Number(process.env.CHAT_SESSION_TTL_SECONDS || 24 * 60 * 60);
const MAX_STORED_MESSAGES = Number(process.env.CHAT_HISTORY_LIMIT || 20);

// In-memory fallback for when Redis is unavailable
const fallbackStore = new Map();

// Auto-cleanup stale fallback sessions every 30 minutes
const CLEANUP_INTERVAL_MS = 30 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of fallbackStore.entries()) {
    if (value.expiresAt < now) {
      fallbackStore.delete(key);
    }
  }
}, CLEANUP_INTERVAL_MS);

const getSessionKey = (sessionId) => `${SESSION_KEY_PREFIX}${sessionId}`;

/**
 * Normalize and validate history entries.
 * Supports both simple {role, content} messages and
 * messages with tool_calls metadata.
 */
const normalizeHistory = (history = []) => {
  if (!Array.isArray(history)) return [];

  return history
    .filter((entry) => {
      if (!entry) return false;
      // Allow tool/system messages too, not just user/assistant
      if (typeof entry.content === "string" && entry.content.trim()) return true;
      // Allow messages with tool_calls even if content is empty
      if (entry.tool_calls && entry.tool_calls.length > 0) return true;
      return false;
    })
    .map((entry) => {
      const normalized = {
        role: entry.role || "user",
        content: (entry.content || "").trim(),
      };

      // Preserve tool_calls for assistant messages
      if (entry.tool_calls) {
        normalized.tool_calls = entry.tool_calls;
      }

      // Preserve tool metadata for tool responses
      if (entry.role === "tool") {
        normalized.tool_call_id = entry.tool_call_id;
        normalized.name = entry.name;
      }

      return normalized;
    })
    .slice(-MAX_STORED_MESSAGES);
};

/**
 * Generate a new unique session ID.
 */
export const createChatSessionId = () => randomUUID();

/**
 * Load conversation history for a session.
 * Tries Redis first, falls back to in-memory store.
 */
export const loadChatSessionHistory = async (sessionId) => {
  if (!sessionId) return [];

  const key = getSessionKey(sessionId);

  try {
    const payload = await redisClient.get(key);
    if (!payload) {
      // Check fallback store too
      const fallback = fallbackStore.get(key);
      if (fallback && fallback.expiresAt > Date.now()) {
        return normalizeHistory(fallback.history || []);
      }
      return [];
    }

    const parsed = JSON.parse(payload);
    return normalizeHistory(parsed.history || []);
  } catch (error) {
    // Redis unavailable, try fallback
    const fallback = fallbackStore.get(key);
    if (!fallback || fallback.expiresAt < Date.now()) {
      fallbackStore.delete(key);
      return [];
    }
    return normalizeHistory(fallback.history || []);
  }
};

/**
 * Save conversation history for a session.
 * Persists to Redis with TTL, with in-memory fallback.
 */
export const saveChatSessionHistory = async (sessionId, history) => {
  if (!sessionId) return;

  const key = getSessionKey(sessionId);
  const normalizedHistory = normalizeHistory(history);
  const payload = JSON.stringify({
    history: normalizedHistory,
    savedAt: Date.now(),
    messageCount: normalizedHistory.length,
  });

  try {
    await redisClient.setEx(key, SESSION_TTL_SECONDS, payload);
  } catch (error) {
    // Fallback to in-memory
    fallbackStore.set(key, {
      history: normalizedHistory,
      expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000,
    });
  }
};

/**
 * Clear conversation history for a session.
 */
export const clearChatSessionHistory = async (sessionId) => {
  if (!sessionId) return;

  const key = getSessionKey(sessionId);
  try {
    await redisClient.del(key);
  } catch (error) {
    // Ignore Redis errors
  }
  fallbackStore.delete(key);
};

/**
 * Get session metadata (for debugging/analytics).
 */
export const getSessionMetadata = async (sessionId) => {
  if (!sessionId) return null;

  const history = await loadChatSessionHistory(sessionId);
  return {
    sessionId,
    messageCount: history.length,
    hasHistory: history.length > 0,
  };
};
