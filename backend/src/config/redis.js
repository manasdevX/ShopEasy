import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

/**
 * Constructing the Connection URL
 * Redis Labs often requires SSL (rediss://).
 * We check if the port is 16760 (common for Redis Labs) or if host contains 'redislabs'.
 */
const isSecure =
  process.env.REDIS_HOST?.includes("redislabs.com") ||
  process.env.REDIS_PORT === "16760";
const protocol = isSecure ? "rediss" : "redis";

const redisURL =
  process.env.REDIS_URL ||
  `${protocol}://default:${
    process.env.REDIS_PASSWORD
  }@${process.env.REDIS_HOST?.trim()}:${process.env.REDIS_PORT}`;

const redisClient = createClient({
  url: redisURL,
  socket: {
    connectTimeout: 10000,
    // Keep-alive settings to prevent Cloud Redis from dropping idle connections
    keepAlive: 5000,
    reconnectStrategy: (retries) => {
      console.log(`🔄 Redis: Reconnection attempt #${retries}`);
      return Math.min(retries * 100, 3000);
    },
  },
});

// --- Lifecycle Event Listeners ---

redisClient.on("error", (err) => {
  console.error("❌ Redis Error:", err.message);
});

redisClient.on("connect", () => {
  console.log("⏳ Redis: Socket connection established...");
});

// ✅ This confirms the handshake and password authentication are finished
redisClient.on("ready", async () => {
  console.log("✅ Cloud Redis: Connected, Authenticated, and Ready!");
  try {
    const ping = await redisClient.ping();
    console.log(`🏓 Redis Health Check: ${ping}`); // Should log "PONG"
  } catch (err) {
    console.error("⚠️ Redis Health Check Failed:", err.message);
  }
});

redisClient.on("end", () => {
  console.log("🔌 Redis: Connection closed");
});

const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      console.log("🚀 Initializing Cloud Redis connection sequence...");
      await redisClient.connect();
    }
  } catch (err) {
    console.error("Critical: Could not connect to Redis Labs:", err.message);
  }
};

connectRedis();

export default redisClient;
