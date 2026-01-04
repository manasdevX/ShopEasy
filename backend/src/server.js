import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/db.js";

// --- 1. INITIALIZE REDIS ---
// Importing this early ensures the client starts the connection attempt
import "./config/redis.js";

dotenv.config();

// Connect to Database
connectDB();

const PORT = process.env.PORT || 5000;

// 2. Create HTTP Server using the Express App
const server = http.createServer(app);

// 3. Initialize Socket.IO with CORS settings
/**
 * ✅ MATCHED CORS CONFIGURATION
 * withCredentials: true must be set on both the Express app and Socket.IO
 * to ensure sessions are shared across the handshake.
 */
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173", // Localhost
      "https://shop-easy-livid.vercel.app", // Vercel Production
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true, // ✅ Required for session-based socket auth
  },
  // Adding transparency for production stability
  transports: ["websocket", "polling"],
  allowEIO3: true,
});

// 4. Attach 'io' to the Express app instance
// This allows req.io to be accessed in controllers via req.app.get("socketio")
app.set("socketio", io);

// 5. Handle Real-Time Connections
io.on("connection", (socket) => {
  /**
   * 📡 IDENTITY MANAGEMENT
   * We use the userId passed from the frontend query to place the user/seller
   * in a unique room. This allows us to send notifications to specific IDs.
   */
  const userId = socket.handshake.query.userId;

  if (userId && userId !== "undefined") {
    socket.join(userId);
    console.log(`📡 Client ${socket.id} joined room: ${userId}`);
  }

  // ✅ SELLER SPECIFIC ROOM
  // Used for real-time order alerts and dashboard refreshes
  socket.on("join_seller_room", (sellerId) => {
    if (sellerId && sellerId !== "undefined") {
      socket.join(sellerId);
      console.log(`👨‍💼 Seller Room Active: ${sellerId}`);
    }
  });

  // Handle errors silently to prevent server crashes
  socket.on("error", (err) => {
    console.error(`❌ Socket Error for ${socket.id}:`, err.message);
  });

  socket.on("disconnect", (reason) => {
    // console.log(`🔌 Client Disconnected (${reason}): ${socket.id}`);
  });
});

// 6. Start the Server
server.listen(PORT, () => {
  console.log("==========================================");
  console.log(`🚀 SERVER RUNNING ON PORT: ${PORT}`);
  console.log(`📡 SOCKET.IO ENGINE: Ready`);
  console.log(`🌍 ENVIRONMENT: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔒 SESSION SECURITY: Cookie Sync Enabled`);
  console.log("==========================================");
});

// Handle unhandled promise rejections for server stability
process.on("unhandledRejection", (err) => {
  console.log(`🚨 Unhandled Rejection: ${err.message}`);
  // server.close(() => process.exit(1)); // Optional: close server
});
