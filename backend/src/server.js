import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/db.js";

// --- 1. INITIALIZE REDIS ---
import "./config/redis.js";

dotenv.config();

// Connect to Database
connectDB();

const PORT = process.env.PORT || 5000;

// 2. Create HTTP Server using the Express App
const server = http.createServer(app);

// 3. Initialize Socket.IO with matched CORS settings
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "https://shop-easy-livid.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
  allowEIO3: true,
  pingTimeout: 60000,
});

// 4. Attach 'io' to the Express app instance
// This is critical for req.io to work in your OrderController
app.set("socketio", io);

// 5. Handle Real-Time Connections
io.on("connection", (socket) => {
  /**
   * 📡 IDENTITY MANAGEMENT
   * Automatically joins the room based on the userId passed in the query
   */
  const rawUserId = socket.handshake.query.userId;

  // FIX: Ensure ID is a clean string and not "undefined" as a string
  const userId =
    rawUserId && rawUserId !== "undefined" ? String(rawUserId) : null;

  if (userId) {
    socket.join(userId);
    console.log(`✅ Socket connected: ${socket.id} | Joined Room: ${userId}`);
  }

  /**
   * ✅ SELLER ROOM JOINING
   * Redundant but safe listener for frontend components to manually request a room join
   */
  socket.on("join_seller_room", (sellerId) => {
    if (sellerId && sellerId !== "undefined") {
      const cleanSellerId = String(sellerId);
      socket.join(cleanSellerId);
      console.log(`👨‍💼 Seller active in room: ${cleanSellerId}`);

      // Verification emit (Optional: Helps you test if the join worked)
      socket.emit("room_joined", { room: cleanSellerId });
    }
  });

  // Handle errors silently
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
process.on("unhandledRejection", (err) => {
  console.log(`🚨 Unhandled Rejection: ${err.message}`);
});

process.on("uncaughtException", (err) => {
  console.log(`🚨 Uncaught Exception: ${err.message}`);
});
