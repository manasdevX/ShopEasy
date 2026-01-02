import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

// If your cloud provider gave you a URL like redis://... use that.
// Otherwise, we construct it or use the split config below.
const redisURL =
  process.env.REDIS_URL ||
  `redis://default:${
    process.env.REDIS_PASSWORD
  }@${process.env.REDIS_HOST?.trim()}:${process.env.REDIS_PORT}`;

const redisClient = createClient({
  url: redisURL,
  socket: {
    connectTimeout: 10000,
    // ✅ Keep your logic: reconnect faster but cap at 2 seconds
    reconnectStrategy: (retries) => Math.min(retries * 50, 2000),
  },
});

redisClient.on("error", (err) => {
  console.log(`❌ Redis Error:`, err.message);
});

redisClient.on("connect", () =>
  console.log("✅ Cloud Redis Connected Successfully")
);

const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  } catch (err) {
    console.error("Critical: Could not connect to Redis:", err.message);
  }
};

connectRedis();

export default redisClient;
