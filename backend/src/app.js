import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import MongoStore from "connect-mongo";
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

/**
 * 🟢 CLOUD DEPLOYMENT & PROXY CONFIG
 * Essential for Render/Vercel to allow cookies over HTTPS.
 */
app.set("trust proxy", 1);

// --- MIDDLEWARE ---
app.use(
  cors({
    origin: ["http://localhost:5173", "https://shop-easy-livid.vercel.app"],
    credentials: true, // ✅ Allows cookies to be sent and received
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Cookie",
      "X-Requested-With",
    ],
  })
);

app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

/**
 * 🟢 SESSION CONFIGURATION
 * This manages the 'shopeasy.sid' cookie to prevent instant redirects.
 */
app.use(
  session({
    secret: process.env.SESSION_SECRET || "shopeasy_secret_77",
    resave: false,
    saveUninitialized: false,
    proxy: true, // ✅ Required for secure: true behind a proxy
    name: "shopeasy.sid",
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      ttl: 14 * 24 * 60 * 60, // 14 days
      autoRemove: "native",
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production", // ✅ True in production (HTTPS)
      httpOnly: true,
      // 'none' allows cookies between Vercel and Render. 'lax' for localhost.
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  })
);

/**
 * 🟢 SOCKET.IO INTEGRATION
 * Attaches the socket instance to the request object for real-time order alerts.
 */
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
 * Health Check for Uptime Monitoring
 */
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "active",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

/**
 * 🛡️ 404 ROUTE HANDLER
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found on this server.`,
  });
});

/**
 * 🚨 GLOBAL ERROR HANDLER
 */
app.use((err, req, res, next) => {
  console.error("🔥 Server Error Stack:", err.stack);
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

export default app;
