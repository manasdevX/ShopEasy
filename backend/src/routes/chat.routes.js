import express from "express";
import {
  clearChatSession,
  handleChatMessage,
  streamChatMessage,
} from "../controllers/chat.controller.js";

const router = express.Router();

router.post("/message", handleChatMessage);
router.post("/stream", streamChatMessage);
router.delete("/session/:sessionId", clearChatSession);

export default router;
