import express from "express";
import cors from "cors";

// --- ROUTES IMPORTS ---
import productRoutes from "./routes/product.routes.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import sellerRoutes from "./routes/sellerRoutes.js";
import orderRoutes from "./routes/order.routes.js";
import cartRoutes from "./routes/cartRoutes.js";

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

// Product & Catalog Management (Search & Filters work here automatically)
app.use("/api/products", productRoutes);

// User Authentication & Customer Profile
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);

/**
 * SELLER MANAGEMENT
 * - POST /api/sellers/register
 * - POST /api/sellers/login
 * - PUT  /api/sellers/profile
 * - PUT  /api/sellers/bank-details
 */
app.use("/api/sellers", sellerRoutes);

// Order Processing & Management
app.use("/api/orders", orderRoutes);

// Persistent Cart (Database-Synced)
app.use("/api/cart", cartRoutes);

/**
 * Health Check Route
 * Useful for Render/Vercel/AWS to verify the backend is active.
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
 * Returns JSON instead of HTML when a route is missing.
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found on this server.`,
    error: "NOT_FOUND",
  });
});

export default app;
