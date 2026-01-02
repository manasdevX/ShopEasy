import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/db.js";

// --- 1. INITIALIZE REDIS ---
// This ensures Redis connects as soon as the server starts
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
// This allows you to use `req.io.to(id).emit()` in your controllers
app.set("socketio", io);

// 5. Handle Real-Time Connections
io.on("connection", (socket) => {
  console.log("⚡ New Client Connected:", socket.id);

  // OPTION A: Automatic Room Join (Using userId passed in connection query)
  const userId = socket.handshake.query.userId;
  if (userId) {
    socket.join(userId);
    console.log(`📡 User ${userId} joined personal room via handshake`);
  }

  // OPTION B: Manual Room Join (The event your frontend dashboard triggers)
  socket.on("join_seller_room", (sellerId) => {
    if (sellerId) {
      socket.join(sellerId);
      console.log(
        `👨‍💼 Seller ${sellerId} joined notification room: ${sellerId}`
      );
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Client Disconnected:", socket.id);
  });
});

// 6. Start the Server
// ⚠️ We use server.listen instead of app.listen to support Socket.IO
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.IO initialized and Redis connection pending...`);
});
