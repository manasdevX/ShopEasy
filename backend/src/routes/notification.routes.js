import express from "express";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from "../controllers/notification.controller.js";
import { protectSeller } from "../middlewares/auth.middleware.js";

const router = express.Router();

/* =========================================
   SELLER NOTIFICATION ROUTES
   Base URL: /api/notifications
========================================= */

// 1. Get all notifications (Supports query ?filter=unread|orders)
router.get("/", protectSeller, getNotifications);

// 2. Mark ALL as read
// ✅ PLACED BEFORE /:id to avoid conflict
router.put("/read-all", protectSeller, markAllAsRead);

// 3. Mark SINGLE notification as read
router.put("/:id/read", protectSeller, markAsRead);

export default router;
