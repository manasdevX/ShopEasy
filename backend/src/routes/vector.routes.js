// routes/vector.routes.js
import express from "express";
import { syncProductVectors } from "../controllers/vector.controller.js";
import { handleChatMessage } from "../controllers/chat.controller.js";

const router = express.Router();

router.post("/sync", syncProductVectors);

// Backward compatibility route for older frontend clients.
router.post("/message", handleChatMessage);

export default router;