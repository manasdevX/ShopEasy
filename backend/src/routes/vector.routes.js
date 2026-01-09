// routes/vector.routes.js
import express from "express";
import { syncProductVectors } from "../controllers/vector.controller.js";
import { handleChat } from "../controllers/ChatController.js";

const router = express.Router();

router.post("/sync", syncProductVectors);
router.post("/message", handleChat);

export default router;