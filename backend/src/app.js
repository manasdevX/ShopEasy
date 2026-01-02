import express from "express";
import cors from "cors";

// --- REDIS INITIALIZATION ---
import "./config/redis.js"; // ✅ CRITICAL: Initializes the Redis connection

// --- ROUTES IMPORTS ---
import productRoutes from "./routes/product.routes.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import sellerRoutes from "./routes/sellerRoutes.js";
import orderRoutes from "./routes/order.routes.js";
import cartRoutes from "./routes/cartRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import notificationRoutes from "./routes/notification.routes.js";

const app = express();

// --- MIDDLEWARE ---
app.use(
  cors({
    origin: [
      "http://localhost:5173", // Localhost (Vite)
      "https://shop-easy-livid.vercel.app", // Production Client
    ],
    credentials: true, // Allow cookies/headers
  })
);

/**
 * Body Parsers
 */
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// --- API ENDPOINTS ---

// Product & Catalog Management
app.use("/api/products", productRoutes);

// User Authentication & Customer Profile
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);

// Seller Management
app.use("/api/sellers", sellerRoutes);

// Order Processing & Management
app.use("/api/orders", orderRoutes);

// Persistent Cart
app.use("/api/cart", cartRoutes);

// Payment Integration (Razorpay)
app.use("/api/payment", paymentRoutes);
app.use("/api/notifications", notificationRoutes);

/**
 * Health Check Route
 */
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "active",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

/**
 * 🛡️ GLOBAL 404 HANDLER
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found on this server.`,
    error: "NOT_FOUND",
  });
});

/**
 * 🚨 GLOBAL ERROR HANDLER
 */
app.use((err, req, res, next) => {
  console.error("🔥 Error Stack:", err.stack);

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

export default app;
