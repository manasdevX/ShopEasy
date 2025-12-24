import express from "express";
import cors from "cors";

// --- ROUTES IMPORTS ---
import productRoutes from "./routes/product.routes.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import sellerRoutes from "./routes/sellerRoutes.js"; // Ensure this file exists
import orderRoutes from "./routes/order.routes.js";

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

// Body Parsers (Increased limit to avoid payload errors with images)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// --- API ENDPOINTS ---
app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);

// === THE FIX IS HERE ===
// Changed "/api/seller" to "/api/sellers" to match your Frontend URL
app.use("/api/sellers", sellerRoutes);

app.use("/api/orders", orderRoutes);

export default app;
