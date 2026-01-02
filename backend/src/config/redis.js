import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

const getRedisUrl = () => {
  // 1. If a full URL is provided in env, use it directly (Best for overriding)
  if (process.env.REDIS_URL) return process.env.REDIS_URL;

  // 2. Otherwise, construct it from parts
  const host = process.env.REDIS_HOST?.trim();
  const port = process.env.REDIS_PORT || 6379;
  const pass = process.env.REDIS_PASSWORD;

  // ⚠️ CHANGE: Default to 'redis' (plaintext) instead of forcing 'rediss'
  // If you enable SSL in Redis Labs later, add REDIS_TLS=true to your env variables
  const protocol = process.env.REDIS_TLS === 'true' ? 'rediss' : 'redis';

  return `${protocol}://default:${pass}@${host}:${port}`;
};

const redisURL = getRedisUrl();
console.log(`🔌 Connecting to Redis at: ${redisURL.split('@')[1]} (Protocol: ${redisURL.split(':')[0]})`);

const redisClient = createClient({
  url: redisURL,
  socket: {
    connectTimeout: 20000,
    keepAlive: 10000,
    reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
    // Only enable TLS options if the URL actually specifies 'rediss://'
    tls: redisURL.startsWith("rediss://"),
    rejectUnauthorized: false, 
  },
});

redisClient.on("error", (err) => {
  console.error(`❌ Redis Client Error:`, err.message);
});

redisClient.on("connect", () => console.log("✅ Cloud Redis Connected Successfully"));

const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  } catch (err) {
    console.error("💀 Critical Redis Connection Failure:", err.message);
  }
};

connectRedis();

export default redisClient;
