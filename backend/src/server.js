import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/db.js";

// --- 1. INITIALIZE REDIS ---
// Importing this first ensures the client starts the connection attempt early
import "./config/redis.js";

dotenv.config();

// Connect to Database
connectDB();

const PORT = process.env.PORT || 5000;

// 2. Create HTTP Server
const server = http.createServer(app);

// 3. Initialize Socket.IO with CORS settings
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "https://shop-easy-livid.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

// 4. Attach 'io' to every request
app.set("socketio", io);

// 5. Handle Real-Time Connections
io.on("connection", (socket) => {
  // Use console.info or console.warn for higher visibility in some log viewers
  console.log(`✅ Socket Connected: ${socket.id}`);

  const userId = socket.handshake.query.userId;
  if (userId) {
    socket.join(userId);
    console.log(`📡 User ${userId} joined personal room via handshake`);
  }

  socket.on("join_seller_room", (sellerId) => {
    if (sellerId) {
      socket.join(sellerId);
      console.log(`👨‍💼 Seller ${sellerId} joined notification room`);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Client Disconnected:", socket.id);
  });
});

// 6. Start the Server
// Render sends the "Your service is live" message once the port is reachable
server.listen(PORT, () => {
  console.log("========================================");
  console.log(`🚀 SERVER RUNNING ON PORT: ${PORT}`);
  console.log(`📡 SOCKET.IO ENGINE: Initialized`);
  console.log("========================================");
});
