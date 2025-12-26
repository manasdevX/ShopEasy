import express from "express";
import cors from "cors";

// --- ROUTES IMPORTS ---
import productRoutes from "./routes/product.routes.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import sellerRoutes from "./routes/sellerRoutes.js";
import orderRoutes from "./routes/order.routes.js";
import cartRoutes from "./routes/cartRoutes.js"; // ✅ New Production Cart Routes

const app = express();

// --- MIDDLEWARE ---
app.use(
  cors({
    origin: [
      "http://localhost:5173", // Localhost
      "https://shop-easy-livid.vercel.app", // Vercel Deployment
    ],
    credentials: true,
  })
);

/**
 * Body Parsers
 * Increased limit to 50mb to handle base64 image strings during
 * product creation/editing before they reach Cloudinary
 */
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// --- API ENDPOINTS ---

// Product & Catalog Management
app.use("/api/products", productRoutes);

// User Authentication & Profile
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);

// Seller Management (Dashboard, Inventory, Payouts)
app.use("/api/sellers", sellerRoutes);

// Order Processing & Management
app.use("/api/orders", orderRoutes);

// Persistent Cart (Database-Synced)
app.use("/api/cart", cartRoutes); // ✅ Handles /api/cart/sync and /api/cart/get

/**
 * Health Check Route
 * Useful for deployment monitoring (Render, Vercel, AWS)
 */
app.get("/health", (req, res) => {
  res.status(200).json({ status: "active", uptime: process.uptime() });
});

export default app;
