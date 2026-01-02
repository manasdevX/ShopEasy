import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

// This line cleans the host string just in case there is a stray port or space
const cleanHost = process.env.REDIS_HOST?.split(":")[0]?.trim();

const redisClient = createClient({
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: cleanHost,
    port: Number(process.env.REDIS_PORT) || 16760,
    connectTimeout: 10000, // Give it time to connect on Render
    reconnectStrategy: (retries) => Math.min(retries * 50, 2000), // Auto-reconnect
  },
});

redisClient.on("error", (err) => {
  // If this still fails, it will log the specific host it tried to reach
  console.log(`❌ Redis Error [Host: ${cleanHost}]:`, err.message);
});

redisClient.on("connect", () => console.log("✅ Redis Connected Successfully"));

const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error("Critical: Could not connect to Redis:", err.message);
  }
};

connectRedis();

export default redisClient;
