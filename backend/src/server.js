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
// ✅ These MUST match the CORS settings in app.js
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173", // Localhost
      "https://shop-easy-livid.vercel.app", // Vercel Production
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

// 4. Attach 'io' to the Express app instance
// This allows req.io to be accessed in app.js middleware
app.set("socketio", io);

// 5. Handle Real-Time Connections
io.on("connection", (socket) => {
  // 🔍 Optional: Detective Logger to track who connects
  // console.log(`✅ Socket Connected: ${socket.id}`);

  // Identification via query string (Current setup)
  const userId = socket.handshake.query.userId;
  if (userId) {
    socket.join(userId);
    console.log(`📡 User ${userId} joined personal room`);
  }

  // Seller specific rooms (For Dashboard Alerts)
  socket.on("join_seller_room", (sellerId) => {
    if (sellerId) {
      socket.join(sellerId);
      console.log(`👨‍💼 Seller ${sellerId} joined notification room`);
    }
  });

  socket.on("disconnect", () => {
    // console.log("❌ Client Disconnected:", socket.id);
  });
});

// 6. Start the Server
server.listen(PORT, () => {
  console.log("========================================");
  console.log(`🚀 SERVER RUNNING ON PORT: ${PORT}`);
  console.log(`📡 SOCKET.IO ENGINE: Initialized`);
  console.log(`🔒 SESSION MODE: Secure & Trust Proxy Active`);
  console.log("========================================");
});
