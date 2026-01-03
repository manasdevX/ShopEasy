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
 * 🟢 CLOUD DEPLOYMENT CONFIGURATION
 * Render and Vercel use reverse proxies. Trusting the proxy allows Express
 * to read the 'X-Forwarded-Proto' header to determine if the connection is secure.
 */
app.set("trust proxy", 1);

// --- MIDDLEWARE ---
app.use(
  cors({
    origin: ["http://localhost:5173", "https://shop-easy-livid.vercel.app"],
    credentials: true, // Required to allow cookies to be sent/received
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
 * 🟢 UPDATED SESSION CONFIGURATION
 * Optimized for cross-site cookie persistence.
 */
app.use(
  session({
    secret: process.env.SESSION_SECRET || "shopeasy_secret_77",
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, // Don't create session until something is stored
    proxy: true, // Essential for 'secure: true' cookies behind proxies
    name: "shopeasy.sid",
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      ttl: 14 * 24 * 60 * 60, // 14 days session life
      autoRemove: "native",
    }),
    cookie: {
      // Must be true in production to work with sameSite: 'none'
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      /**
       * 'none' + secure: true is required for cross-domain cookies (Vercel to Render)
       * 'lax' is best for localhost development.
       */
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  })
);

// --- 🟢 SOCKET.IO MIDDLEWARE ---
// Attaches the 'io' instance to req so controllers can trigger real-time alerts
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
    message: `Route ${req.originalUrl} not found.`,
    error: "NOT_FOUND",
  });
});

/**
 * 🚨 GLOBAL ERROR HANDLER
 */
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err.message);
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

export default app;
