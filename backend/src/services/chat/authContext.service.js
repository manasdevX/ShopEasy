/**
 * ─────────────────────────────────────────────────────────────
 *  authContext.service.js — Optional Auth for Chat
 * ─────────────────────────────────────────────────────────────
 *  Extracts the current user from the request WITHOUT blocking
 *  unauthenticated users. The chat system works for both
 *  guests and logged-in users — authenticated users get
 *  access to order tracking and personalized features.
 * ─────────────────────────────────────────────────────────────
 */

import jwt from "jsonwebtoken";
import Session from "../../models/Session.js";
import User from "../../models/User.js";

/**
 * Extract JWT token from Authorization header or cookies.
 */
const extractToken = (req) => {
  if (req.headers.authorization?.startsWith("Bearer")) {
    return req.headers.authorization.split(" ")[1];
  }
  return req.cookies?.accessToken || null;
};

/**
 * Attempt to resolve the current user without failing.
 * Returns the user document if authenticated, null otherwise.
 *
 * This is intentionally permissive — the chatbot should work
 * for everyone, but authenticated users get enhanced features
 * like order tracking and personalized recommendations.
 */
export const getOptionalChatUser = async (req) => {
  const token = extractToken(req);
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Validate session exists in DB (prevents use of revoked tokens)
    const validSession = await Session.findOne({
      user: decoded.id,
      refreshToken: token,
    }).select("_id");

    if (!validSession) return null;

    const user = await User.findById(decoded.id)
      .select("_id name email isBlocked role recentlyViewed interests")
      .lean();

    if (!user || user.isBlocked) return null;

    return user;
  } catch (error) {
    // Silently fail — user simply isn't authenticated
    return null;
  }
};
