import express from "express";
import rateLimit from "express-rate-limit";
import {
  clearChatSession,
  handleChatMessage,
  streamChatMessage,
} from "../controllers/chat.controller.js";

const router = express.Router();

// ── Rate Limiters ──
// Standard message endpoint: 20 requests/minute per IP
const chatMessageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many messages. Please wait a moment before sending again.",
  },
});

// Streaming endpoint: 12 requests/minute per IP (more expensive)
const chatStreamLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Please slow down. Try again in a moment.",
  },
});

router.post("/message", chatMessageLimiter, handleChatMessage);
router.post("/stream", chatStreamLimiter, streamChatMessage);
router.delete("/session/:sessionId", clearChatSession);

export default router;
