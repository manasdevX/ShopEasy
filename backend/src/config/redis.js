import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

const REDIS_ENABLED = process.env.REDIS_ENABLED !== "false";
const redisFallbackStore = new Map();

const normalizeKeys = (keys) => {
  if (Array.isArray(keys)) return keys;
  if (typeof keys === "string") return [keys];
  if (keys == null) return [];
  return [String(keys)];
};

const wildcardToRegExp = (pattern = "*") => {
  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*");

  return new RegExp(`^${escaped}$`);
};

const purgeExpiredFallbackKeys = () => {
  const now = Date.now();

  for (const [key, entry] of redisFallbackStore.entries()) {
    if (!entry.expiresAt || entry.expiresAt > now) continue;
    redisFallbackStore.delete(key);
  }
};

const getRedisUrl = () => {
  if (process.env.REDIS_URL) return process.env.REDIS_URL;

  const host = process.env.REDIS_HOST?.trim();
  if (!host) return null;

  const port = process.env.REDIS_PORT || 6379;
  const pass = process.env.REDIS_PASSWORD;
  const protocol = process.env.REDIS_TLS === "true" ? "rediss" : "redis";

  if (pass) {
    return `${protocol}://default:${pass}@${host}:${port}`;
  }

  return `${protocol}://${host}:${port}`;
};

const redisURL = getRedisUrl();

let nativeRedisClient = null;
let redisReady = false;
let loggedRedisError = false;

const shouldUseNativeRedis = REDIS_ENABLED && Boolean(redisURL);

if (shouldUseNativeRedis) {
  console.log(
    `🔌 Connecting to Redis at: ${redisURL.split("@").pop()} (Protocol: ${
      redisURL.split(":")[0]
    })`
  );

  nativeRedisClient = createClient({
    url: redisURL,
    socket: {
      connectTimeout: 10000,
      keepAlive: 10000,
      reconnectStrategy: (retries) => {
        // Avoid endless spam loops in development when host/port is invalid.
        if (retries >= 2) return false;
        return Math.min((retries + 1) * 250, 1000);
      },
      tls: redisURL.startsWith("rediss://"),
      rejectUnauthorized: false,
    },
  });

  nativeRedisClient.on("ready", () => {
    redisReady = true;
    loggedRedisError = false;
    console.log("✅ Redis connected successfully");
  });

  nativeRedisClient.on("end", () => {
    redisReady = false;
  });

  nativeRedisClient.on("error", (err) => {
    redisReady = false;
    if (loggedRedisError) return;

    loggedRedisError = true;
    console.error(
      `⚠️ Redis unavailable (${err.message}). Falling back to in-memory cache for this process.`
    );
  });
} else {
  const reason = REDIS_ENABLED
    ? "Redis host/url is missing"
    : "REDIS_ENABLED=false";
  console.warn(`⚠️ Redis disabled: ${reason}. Using in-memory cache fallback.`);
}

const connectRedis = async () => {
  if (!nativeRedisClient || nativeRedisClient.isOpen) return;

  try {
    await nativeRedisClient.connect();
  } catch (error) {
    redisReady = false;
    if (!loggedRedisError) {
      loggedRedisError = true;
      console.error(
        `⚠️ Redis connection failed (${error.message}). Using in-memory cache fallback.`
      );
    }
  }
};

connectRedis();

const redisClient = {
  get isOpen() {
    return Boolean(nativeRedisClient?.isOpen && redisReady);
  },

  get isReady() {
    return this.isOpen;
  },

  async connect() {
    await connectRedis();
  },

  on(eventName, callback) {
    if (!nativeRedisClient) return;
    nativeRedisClient.on(eventName, callback);
  },

  async get(key) {
    if (this.isOpen) {
      try {
        return await nativeRedisClient.get(key);
      } catch (error) {
        return null;
      }
    }

    purgeExpiredFallbackKeys();
    const entry = redisFallbackStore.get(key);
    return entry ? entry.value : null;
  },

  async setEx(key, ttlSeconds, value) {
    const safeTtl = Number(ttlSeconds) || 0;

    if (this.isOpen) {
      try {
        await nativeRedisClient.setEx(key, safeTtl, value);
        return "OK";
      } catch (error) {
        // Fall through to in-memory fallback.
      }
    }

    redisFallbackStore.set(key, {
      value,
      expiresAt: safeTtl > 0 ? Date.now() + safeTtl * 1000 : null,
    });

    return "OK";
  },

  async del(keys) {
    const keyList = normalizeKeys(keys);
    if (!keyList.length) return 0;

    if (this.isOpen) {
      try {
        return await nativeRedisClient.del(keyList);
      } catch (error) {
        // Fall through to in-memory fallback.
      }
    }

    let deletedCount = 0;
    for (const key of keyList) {
      if (redisFallbackStore.delete(key)) {
        deletedCount += 1;
      }
    }

    return deletedCount;
  },

  async keys(pattern = "*") {
    if (this.isOpen) {
      try {
        return await nativeRedisClient.keys(pattern);
      } catch (error) {
        return [];
      }
    }

    purgeExpiredFallbackKeys();
    const matcher = wildcardToRegExp(pattern);

    return [...redisFallbackStore.keys()].filter((key) => matcher.test(key));
  },
};

export default redisClient;
