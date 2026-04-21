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

// ── SSE Helpers ──

const sendSseEvent = (res, eventName, payload) => {
  if (res.writableEnded) return;
  res.write(`event: ${eventName}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
};

// ── Standard Message Handler ──

export const handleChatMessage = async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || !String(message).trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    const user = await getOptionalChatUser(req);

    const result = await processChatMessage({
      message,
      sessionId,
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

  try {
    const { message, sessionId } = req.body;

    if (!message || !String(message).trim()) {
      sendSseEvent(res, "error", { message: "Message is required" });
      return res.end();
    }

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

    return res.end();
  } catch (error) {
    console.error("Chat stream handler error:", error.message);
    sendSseEvent(res, "error", {
      message: "Streaming service temporarily unavailable",
      detail:
        process.env.NODE_ENV === "production" ? undefined : error.message,
    });
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
