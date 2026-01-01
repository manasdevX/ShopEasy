import http from "http"; // ✅ Import Node.js HTTP module
import { Server } from "socket.io"; // ✅ Import Socket.IO
import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/db.js";

dotenv.config();

// Connect to Database
connectDB();

const PORT = process.env.PORT || 5000;

// 1. Create HTTP Server (Required to bind Socket.IO and Express together)
const server = http.createServer(app);

// 2. Initialize Socket.IO with CORS settings (Must match your Frontend URLs)
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173", // Localhost Frontend
      "https://shop-easy-livid.vercel.app", // Production Frontend
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

// 3. Make 'io' accessible globally in all Controllers
// This allows you to use `req.io.emit` inside order.controller.js
app.use((req, res, next) => {
  req.io = io;
  next();
});

// 4. Handle Real-Time Connections
io.on("connection", (socket) => {
  console.log("⚡ New Client Connected:", socket.id);

  // Allow Sellers to join a private room using their Seller ID
  // The Frontend emits this event when the Seller Dashboard loads
  socket.on("join_seller_room", (sellerId) => {
    socket.join(sellerId);
    console.log(`👨‍💼 Seller ${sellerId} joined notification room: ${sellerId}`);
  });

  socket.on("disconnect", () => {
    console.log("Client Disconnected", socket.id);
  });
});

// Optional: Keep your extra health check if needed
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// 5. Start the Server
// ⚠️ IMPORTANT: Change 'app.listen' to 'server.listen'
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.IO initialized`);
});
