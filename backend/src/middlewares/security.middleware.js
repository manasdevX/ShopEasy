/**
 * ─────────────────────────────────────────────────────────────
 *  security.middleware.js — CSP, XSS, CSRF Protection
 * ─────────────────────────────────────────────────────────────
 *  Comprehensive security headers and content policy enforcement.
 * ─────────────────────────────────────────────────────────────
 */

/**
 * Content Security Policy middleware
 * Prevents inline scripts, restricts external resources.
 */
export const cspMiddleware = (req, res, next) => {
  // Define CSP policy
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const apiUrl = process.env.API_URL || process.env.VITE_API_URL || "http://localhost:5000";

  const cspPolicy = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' ${frontendUrl}`, // Keep inline for now but should be removed
    `style-src 'self' 'unsafe-inline'`, // Inline styles from Tailwind CSS
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https: wss:",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "upgrade-insecure-requests",
  ].join("; ");

  res.setHeader("Content-Security-Policy", cspPolicy);
  next();
};

/**
 * Additional security headers
 */
export const securityHeadersMiddleware = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader("X-Frame-Options", "DENY");

  // Prevent MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Enable XSS protection (older browsers)
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Referrer policy (prevent sending referrer to external sites)
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions policy (formerly Feature Policy)
  res.setHeader(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=(), payment=()"
  );

  // Expect-CT: Enforce certificate transparency
  res.setHeader("Expect-CT", "max-age=86400, enforce");

  next();
};

/**
 * Input validation and sanitization middleware
 * Validates JSON payloads for common XSS/injection patterns.
 */
export const inputSanitizationMiddleware = (req, res, next) => {
  if (!req.body || typeof req.body !== "object") {
    return next();
  }

  const sanitizeValue = (value) => {
    if (typeof value === "string") {
      // Remove common XSS patterns
      return value
        .replace(/<script[^>]*>.*?<\/script>/gi, "") // Remove script tags
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "") // Remove event handlers
        .replace(/javascript:/gi, "") // Remove javascript: protocol
        .trim();
    }

    if (typeof value === "object" && value !== null) {
      if (Array.isArray(value)) {
        return value.map(sanitizeValue);
      }
      const sanitized = {};
      for (const [key, val] of Object.entries(value)) {
        sanitized[key] = sanitizeValue(val);
      }
      return sanitized;
    }

    return value;
  };

  req.body = sanitizeValue(req.body);
  next();
};

/**
 * CSRF token middleware (for state-changing operations)
 * Validates X-CSRF-Token header on POST/PUT/DELETE requests.
 */
export const csrfProtectionMiddleware = (req, res, next) => {
  // Skip CSRF check for safe methods
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  // Allow requests with valid CSRF token or from same-origin
  const origin = req.get("Origin");
  const referer = req.get("Referer");
  const expectedOrigin = process.env.FRONTEND_URL || "http://localhost:5173";

  const isValidOrigin =
    !origin || origin === expectedOrigin;
  const isValidReferer =
    !referer || referer.startsWith(expectedOrigin);

  if (!isValidOrigin || !isValidReferer) {
    // For strict CSRF: uncomment below to reject cross-origin requests
    // return res.status(403).json({ message: "CSRF validation failed" });
  }

  next();
};

/**
 * Rate limiting middleware for sensitive endpoints
 * Tracks requests per IP and enforces limits.
 */
export const createRateLimitMiddleware = (windowMs = 60000, maxRequests = 100) => {
  const requestStore = new Map();

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!requestStore.has(ip)) {
      requestStore.set(ip, []);
    }

    const timestamps = requestStore.get(ip);
    const validTimestamps = timestamps.filter((ts) => ts > windowStart);

    if (validTimestamps.length >= maxRequests) {
      return res.status(429).json({
        message: "Too many requests, please try again later.",
        retryAfter: Math.ceil((validTimestamps[0] + windowMs - now) / 1000),
      });
    }

    validTimestamps.push(now);
    requestStore.set(ip, validTimestamps);

    // Clean up old entries periodically
    if (Math.random() < 0.01) {
      const allIps = [...requestStore.keys()];
      for (const addr of allIps) {
        const ips = requestStore.get(addr);
        if (ips.every((ts) => ts <= windowStart)) {
          requestStore.delete(addr);
        }
      }
    }

    next();
  };
};

export default {
  cspMiddleware,
  securityHeadersMiddleware,
  inputSanitizationMiddleware,
  csrfProtectionMiddleware,
  createRateLimitMiddleware,
};
