/**
 * ─────────────────────────────────────────────────────────────
 *  chat.controller.js — Chat API Endpoints
 * ─────────────────────────────────────────────────────────────
 *  Handles incoming chat requests via two modes:
 *  1. POST /message — Standard request/response
 *  2. POST /stream  — Server-Sent Events (SSE) streaming
 *  3. DELETE /session/:sessionId — Clear conversation history
 *
 *  Both modes share the same processing pipeline but differ
 *  in how the response is delivered to the client.
 * ─────────────────────────────────────────────────────────────
 */

import {
  processChatMessage,
  runStreamingLlmConversation,
} from "../services/chat/chatbot.service.js";
import { getOptionalChatUser } from "../services/chat/authContext.service.js";
import {
  clearChatSessionHistory,
  createChatSessionId,
  loadChatSessionHistory,
  saveChatSessionHistory,
} from "../services/chat/sessionStore.service.js";
import { detectIntent } from "../services/chat/intent.service.js";
import { getLlmModelName, getLlmProviderName } from "../services/chat/llmClient.service.js";
import { CHAT_SUPPORT_FALLBACK } from "../config/chatKnowledge.js";

// ── Constants ──

const MAX_MESSAGE_LENGTH = 1000;
const SSE_TIMEOUT_MS = 30000; // 30 seconds hard timeout for streaming

// ── Input Validation ──

const validateChatInput = (body) => {
  const { message, sessionId } = body || {};
  const trimmed = String(message || "").trim();

  if (!trimmed) {
    return { error: "Message is required", status: 400 };
  }

  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    return {
      error: `Message is too long (max ${MAX_MESSAGE_LENGTH} characters)`,
      status: 400,
    };
  }

  // Validate sessionId format if provided (UUID v4 pattern)
  if (sessionId && !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessionId)) {
    return { error: "Invalid session ID format", status: 400 };
  }

  return { message: trimmed, sessionId: sessionId || null };
};

// ── SSE Helpers ──

const sendSseEvent = (res, eventName, payload) => {
  if (res.writableEnded) return;
  res.write(`event: ${eventName}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
};

// ── Standard Message Handler ──

export const handleChatMessage = async (req, res) => {
  try {
    const validated = validateChatInput(req.body);
    if (validated.error) {
      return res.status(validated.status).json({ message: validated.error });
    }

    const user = await getOptionalChatUser(req);

    const result = await processChatMessage({
      message: validated.message,
      sessionId: validated.sessionId,
      user,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("Chat message handler error:", error.message);
    return res.status(500).json({
      message: "Chat service temporarily unavailable",
      detail:
        process.env.NODE_ENV === "production" ? undefined : error.message,
    });
  }
};

// ── Streaming (SSE) Message Handler ──

export const streamChatMessage = async (req, res) => {
  // Configure SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // Required for nginx proxies

  // Hard timeout to prevent indefinite open connections
  const sseTimeout = setTimeout(() => {
    if (!res.writableEnded) {
      sendSseEvent(res, "error", { message: "Response timed out. Please try again." });
      res.end();
    }
  }, SSE_TIMEOUT_MS);

  // Clean up timeout on client disconnect
  req.on("close", () => {
    clearTimeout(sseTimeout);
  });

  try {
    const validated = validateChatInput(req.body);
    if (validated.error) {
      sendSseEvent(res, "error", { message: validated.error });
      clearTimeout(sseTimeout);
      return res.end();
    }

    const { message, sessionId } = validated;
    const user = await getOptionalChatUser(req);
    const resolvedSessionId = sessionId || createChatSessionId();
    const history = await loadChatSessionHistory(resolvedSessionId);
    const intent = detectIntent(message);

    // Send metadata immediately
    sendSseEvent(res, "meta", {
      sessionId: resolvedSessionId,
      intent,
    });

    let fullReply = "";
    let finalUi = { products: [], orders: [], faq: null };
    let usedLlm = false;

    try {
      // Try streaming LLM conversation
      const stream = runStreamingLlmConversation({
        message,
        history,
        user,
        intent,
      });

      for await (const event of stream) {
        if (res.writableEnded) return;

        switch (event.type) {
          case "tool_start":
            sendSseEvent(res, "tool_start", { tools: event.tools });
            break;

          case "tool_end":
            finalUi = event.ui || finalUi;
            sendSseEvent(res, "tool_end", { ui: finalUi });
            break;

          case "chunk":
            fullReply += event.text;
            sendSseEvent(res, "chunk", { text: event.text });
            break;

          case "done":
            fullReply = event.reply || fullReply;
            finalUi = event.ui || finalUi;
            usedLlm = event.usedLlm || false;
            break;
        }
      }
    } catch (streamError) {
      console.error("Streaming failed, falling back:", streamError.message);
    }

    // If streaming didn't produce a reply, fall back to standard processing
    if (!fullReply) {
      try {
        const fallbackResult = await processChatMessage({
          message,
          sessionId: resolvedSessionId,
          user,
        });

        fullReply = fallbackResult.reply;
        finalUi = fallbackResult.ui || finalUi;

        // Send the full reply as a single chunk
        if (fullReply) {
          sendSseEvent(res, "chunk", { text: fullReply });
        }
      } catch (fallbackError) {
        fullReply = CHAT_SUPPORT_FALLBACK;
        sendSseEvent(res, "chunk", { text: fullReply });
      }
    }

    // Save to session history
    const nextHistory = [
      ...history,
      { role: "user", content: String(message).trim() },
      { role: "assistant", content: fullReply },
    ].slice(-20);

    await saveChatSessionHistory(resolvedSessionId, nextHistory);

    // Send final done event with complete payload
    sendSseEvent(res, "done", {
      sessionId: resolvedSessionId,
      intent,
      reply: fullReply,
      ui: finalUi,
      meta: {
        usedFallback: !usedLlm,
        provider: usedLlm ? getLlmProviderName() : "fallback",
        model: usedLlm ? getLlmModelName() : "deterministic",
        timestamp: new Date().toISOString(),
        userScoped: Boolean(user?._id),
      },
    });

    clearTimeout(sseTimeout);
    return res.end();
  } catch (error) {
    console.error("Chat stream handler error:", error.message);
    sendSseEvent(res, "error", {
      message: "Streaming service temporarily unavailable",
      detail:
        process.env.NODE_ENV === "production" ? undefined : error.message,
    });
    clearTimeout(sseTimeout);
    return res.end();
  }
};

// ── Session Management ──

export const clearChatSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ message: "sessionId is required" });
    }

    await clearChatSessionHistory(sessionId);
    return res.status(200).json({ success: true, sessionId });
  } catch (error) {
    console.error("Chat session clear error:", error.message);
    return res.status(500).json({ message: "Could not clear chat session" });
  }
};
