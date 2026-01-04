import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/db.js";

// --- 1. INITIALIZE REDIS ---
// Importing this early ensures the client starts the connection attempt for profile caching
import "./config/redis.js";

dotenv.config();

// Connect to Database
connectDB();

const PORT = process.env.PORT || 5000;

// 2. Create HTTP Server using the Express App
const server = http.createServer(app);

// 3. Initialize Socket.IO with matched CORS settings
/**
 * ✅ CRITICAL SYNC:
 * credentials: true and matching origins are required so the 'shopeasy.sid'
 * session cookie is correctly passed during the WebSocket handshake.
 */
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "https://shop-easy-livid.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true, // ✅ Allows sharing the session between HTTP and WebSockets
  },
  transports: ["websocket", "polling"], // Fallback to polling if WebSocket is blocked
  allowEIO3: true,
});

// 4. Attach 'io' to the Express app instance
// This allows req.io to be used in controllers to send real-time alerts
app.set("socketio", io);

// 5. Handle Real-Time Connections
io.on("connection", (socket) => {
  /**
   * 📡 IDENTITY MANAGEMENT
   * Pass userId via query: const socket = io(URL, { query: { userId: '123' } });
   */
  const userId = socket.handshake.query.userId;

  if (userId && userId !== "undefined") {
    socket.join(userId);
    console.log(`📡 Socket connected: ${socket.id} (User: ${userId})`);
  }

  /**
   * ✅ SELLER ROOM JOINING
   * Specifically used by Dashboard.jsx to receive real-time order alerts.
   */
  socket.on("join_seller_room", (sellerId) => {
    if (sellerId && sellerId !== "undefined") {
      // Sellers join their own unique room for private broadcasts
      socket.join(sellerId);
      console.log(`👨‍💼 Seller active in room: ${sellerId}`);
    }
  });

  // Handle errors silently to keep the server running
  socket.on("error", (err) => {
    console.error(`❌ Socket error for client ${socket.id}:`, err.message);
  });

  socket.on("disconnect", (reason) => {
    // console.log(`🔌 Client ${socket.id} disconnected: ${reason}`);
  });
});

// 6. Start the Server
server.listen(PORT, () => {
  const env = process.env.NODE_ENV || "development";
  console.log("==========================================");
  console.log(`🚀 SERVER RUNNING ON PORT: ${PORT}`);
  console.log(`📡 SOCKET.IO ENGINE: Initialized`);
  console.log(`🌍 ENVIRONMENT: ${env.toUpperCase()}`);
  console.log(`🔒 SESSION SECURITY: Cookie Sync Active`);
  console.log("==========================================");
});

// 7. GLOBAL STABILITY HANDLERS
// Prevents server from crashing on unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.log(`🚨 Unhandled Rejection: ${err.message}`);
});

process.on("uncaughtException", (err) => {
  console.log(`🚨 Uncaught Exception: ${err.message}`);
  // Graceful exit if needed
  // process.exit(1);
});
