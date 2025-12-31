import express from "express";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from "../controllers/notification.controller.js";
import { protectSeller } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", protectSeller, getNotifications);
router.put("/:id/read", protectSeller, markAsRead);
router.put("/read-all", protectSeller, markAllAsRead);

export default router;
