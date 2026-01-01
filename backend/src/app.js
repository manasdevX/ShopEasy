import express from "express";
import cors from "cors";

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
 * Increased limit to 50mb to handle base64 image strings
 * and large JSON payloads.
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
// ✅ This makes the URL: http://localhost:5000/api/payment/create-order
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
 * Catches any errors thrown in controllers (e.g., throw new Error(...))
 */
app.use((err, req, res, next) => {
  console.error("🔥 Error Stack:", err.stack); // Log error stack for debugging

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "production" ? null : err.stack, // Hide stack in production
  });
});

export default app;
