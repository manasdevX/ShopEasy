import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// --- REDIS INITIALIZATION ---
// This ensures Redis connects as soon as the app starts
import "./config/redis.js";

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

// 🟢 CRITICAL FOR RENDER DEPLOYMENT
// Render puts your app behind a proxy. Without this, Express thinks
// the connection is HTTP (not HTTPS) and blocks "Secure" cookies.
app.set("trust proxy", 1);

// --- MIDDLEWARE ---
app.use(
  cors({
    origin: [
      "http://localhost:5173", // Local Development
      "https://shop-easy-livid.vercel.app", // Vercel Production Client
    ],
    credentials: true, // ✅ Essential: Allows cookies to be sent/received
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.use(cookieParser()); // ✅ Reads cookies from incoming requests
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// --- 🟢 SOCKET.IO MIDDLEWARE ---
// Attaches the 'io' instance to every request so controllers can emit events
app.use((req, res, next) => {
  req.io = req.app.get("socketio");
  next();
});

// --- API ENDPOINTS ---
app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/sellers", sellerRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/notifications", notificationRoutes);

/**
 * Health Check Route
 * Useful for Render/Vercel to know your app is alive
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
