/**
 * ─────────────────────────────────────────────────────────────
 *  monitoring.service.js — System Health & Alert Monitoring
 * ─────────────────────────────────────────────────────────────
 *  Tracks LLM quota, Redis/MongoDB connectivity, and API errors.
 *  Emits alerts when thresholds are exceeded.
 * ─────────────────────────────────────────────────────────────
 */

import mongoose from "mongoose";
import redisClient from "../config/redis.js";
import { getLlmConfig, hasLlmProvider } from "./chat/llmClient.service.js";
import Session from "../models/Session.js";
import SellerSession from "../models/SellerSession.js";

// ── Alert Thresholds ──
const THRESHOLDS = {
  LLM_ERRORS_PER_HOUR: 10,
  LLM_RATE_LIMIT_HITS: 5,
  REDIS_DISCONNECTS: 3,
  MONGO_DISCONNECTS: 2,
  API_ERROR_RATE: 0.1, // 10%
};

// ── In-Memory Metrics ──
let metrics = {
  llmErrors: [],
  llmRateLimits: [],
  redisConnectFailures: [],
  mongoConnectFailures: [],
  apiErrors: [],
  lastAlert: {},
};

const resetHourlyMetrics = () => {
  const now = Date.now();
  const oneHourAgo = now - 3600000;

  metrics.llmErrors = metrics.llmErrors.filter((ts) => ts > oneHourAgo);
  metrics.llmRateLimits = metrics.llmRateLimits.filter((ts) => ts > oneHourAgo);
  metrics.apiErrors = metrics.apiErrors.filter((ts) => ts > oneHourAgo);
};

// Reset every hour
setInterval(resetHourlyMetrics, 3600000);

// ── Alert Dispatch ──
const alertLog = (level, title, details) => {
  const timestamp = new Date().toISOString();
  const alertKey = `${level}:${title}`;

  // Rate-limit alerts to prevent spam (one per alert type per 5 minutes)
  if (metrics.lastAlert[alertKey]) {
    const timeSinceLastAlert = Date.now() - metrics.lastAlert[alertKey];
    if (timeSinceLastAlert < 5 * 60 * 1000) {
      return; // Skip this alert
    }
  }

  metrics.lastAlert[alertKey] = Date.now();

  const severity = level === "ERROR" ? "🚨" : level === "WARN" ? "⚠️" : "ℹ️";

  console.log(`${severity} [${timestamp}] ${level}: ${title}`);
  if (details) {
    console.log(`   → ${JSON.stringify(details)}`);
  }

  // TODO: Integrate with external alerting (Sentry, PagerDuty, Slack, etc.)
  // Example: sendSlackAlert(level, title, details);
};

// ── Public API ──

export const recordLlmError = (error) => {
  metrics.llmErrors.push(Date.now());

  if (metrics.llmErrors.length > THRESHOLDS.LLM_ERRORS_PER_HOUR) {
    alertLog("ERROR", "LLM Errors Threshold Exceeded", {
      count: metrics.llmErrors.length,
      threshold: THRESHOLDS.LLM_ERRORS_PER_HOUR,
      error: error?.message,
    });
  }
};

export const recordLlmRateLimit = (error) => {
  metrics.llmRateLimits.push(Date.now());

  if (metrics.llmRateLimits.length > THRESHOLDS.LLM_RATE_LIMIT_HITS) {
    alertLog("WARN", "LLM Rate Limit Quota Exceeded", {
      count: metrics.llmRateLimits.length,
      threshold: THRESHOLDS.LLM_RATE_LIMIT_HITS,
      recommendation: "Reduce chat requests or upgrade LLM quota",
    });
  }
};

export const recordRedisEvent = (event, error) => {
  if (event === "disconnect") {
    metrics.redisConnectFailures.push(Date.now());
    if (metrics.redisConnectFailures.length > THRESHOLDS.REDIS_DISCONNECTS) {
      alertLog("ERROR", "Redis Connectivity Issues", {
        count: metrics.redisConnectFailures.length,
        threshold: THRESHOLDS.REDIS_DISCONNECTS,
        error: error?.message,
        fallback: "Using in-memory cache",
      });
    }
  } else if (event === "connect") {
    alertLog("INFO", "Redis Reconnected", {});
  }
};

export const recordMongoEvent = (event, error) => {
  if (event === "disconnect") {
    metrics.mongoConnectFailures.push(Date.now());
    if (
      metrics.mongoConnectFailures.length >
      THRESHOLDS.MONGO_DISCONNECTS
    ) {
      alertLog("ERROR", "MongoDB Connectivity Issues", {
        count: metrics.mongoConnectFailures.length,
        threshold: THRESHOLDS.MONGO_DISCONNECTS,
        error: error?.message,
      });
    }
  } else if (event === "connect") {
    alertLog("INFO", "MongoDB Reconnected", {});
  }
};

export const recordApiError = () => {
  metrics.apiErrors.push(Date.now());
};

/**
 * Health check endpoint data
 */
export const getHealthStatus = async () => {
  resetHourlyMetrics();

  const mongoConnected = mongoose.connection.readyState === 1;
  const redisConnected = redisClient.isReady;
  const llmAvailable = hasLlmProvider();
  const llmConfig = getLlmConfig();

  const errorRateMinute = metrics.apiErrors.length / 60; // Rough estimate per second per minute
  const totalErrors = metrics.llmErrors.length + metrics.apiErrors.length;

  return {
    status: mongoConnected && (redisConnected || true) ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    services: {
      mongodb: {
        connected: mongoConnected,
        failureCount: metrics.mongoConnectFailures.length,
      },
      redis: {
        connected: redisConnected,
        failureCount: metrics.redisConnectFailures.length,
        mode: redisConnected ? "connected" : "fallback (in-memory)",
      },
      llm: {
        provider: llmConfig.provider || "none",
        model: llmConfig.model,
        available: llmAvailable,
        recentErrors: metrics.llmErrors.length,
        rateLimitHits: metrics.llmRateLimits.length,
      },
    },
    metrics: {
      apiErrorsLastHour: metrics.apiErrors.length,
      llmErrorsLastHour: metrics.llmErrors.length,
      totalIncidents: totalErrors,
    },
  };
};

/**
 * Setup event listeners for Redis and MongoDB
 */
export const setupMonitoring = () => {
  // Redis events
  if (redisClient) {
    redisClient.on("connect", () => recordRedisEvent("connect"));
    redisClient.on("error", (err) => recordRedisEvent("error", err));
    redisClient.on("end", () => recordRedisEvent("disconnect"));
  }

  // MongoDB events
  if (mongoose.connection) {
    mongoose.connection.on("connected", () =>
      recordMongoEvent("connect")
    );
    mongoose.connection.on("disconnected", () =>
      recordMongoEvent("disconnect")
    );
    mongoose.connection.on("error", (err) =>
      recordMongoEvent("error", err)
    );
  }

  // Optional: Log health status every 30 minutes
  setInterval(async () => {
    const health = await getHealthStatus();
    if (health.status !== "healthy") {
      console.warn("🏥 System Health Report (non-critical):", health);
    }
  }, 30 * 60 * 1000);
};

export default {
  recordLlmError,
  recordLlmRateLimit,
  recordRedisEvent,
  recordMongoEvent,
  recordApiError,
  getHealthStatus,
  setupMonitoring,
};
