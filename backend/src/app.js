import express from "express";
import cors from "cors";

// --- ROUTES IMPORTS ---
import productRoutes from "./routes/product.routes.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js"; // ✅ Import User Routes
import sellerRoutes from "./routes/sellerRoutes.js";
import orderRoutes from "./routes/order.routes.js";

const app = express();

// --- MIDDLEWARE ---
app.use(
  cors({
    origin: "http://localhost:5173", // Make sure this matches your Frontend URL
    credentials: true,
  })
);
app.use(express.json({ limit: "50mb" })); // <--- Added limit here!
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// --- API ENDPOINTS ---
app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);

// ✅ Connect User Routes (Singular '/api/user' is better for profile actions)
app.use("/api/user", userRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/orders", orderRoutes);

export default app;
