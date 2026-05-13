/**
 * ─────────────────────────────────────────────────────────────
 *  sessionManagement.service.js — Token Rotation & Session Limits
 * ─────────────────────────────────────────────────────────────
 *  Enforces session limits per user, rotates refresh tokens,
 *  and provides robust session revocation.
 * ─────────────────────────────────────────────────────────────
 */

import Session from "../models/Session.js";
import SellerSession from "../models/SellerSession.js";
import User from "../models/User.js";
import Seller from "../models/seller.js";

const MAX_CONCURRENT_SESSIONS_USER = 5;
const MAX_CONCURRENT_SESSIONS_SELLER = 3;

/**
 * Create a new session and enforce session limits.
 * Removes oldest sessions if limit exceeded.
 */
export const createSession = async (userId, refreshToken, userType = "user") => {
  const sessionModel = userType === "seller" ? SellerSession : Session;
  const userField = userType === "seller" ? "seller" : "user";
  const maxSessions =
    userType === "seller"
      ? MAX_CONCURRENT_SESSIONS_SELLER
      : MAX_CONCURRENT_SESSIONS_USER;

  // Create new session
  const newSession = await sessionModel.create({
    [userField]: userId,
    refreshToken,
    createdAt: new Date(),
  });

  // Fetch all sessions for this user, sorted by creation
  const allSessions = await sessionModel
    .find({ [userField]: userId })
    .sort({ createdAt: -1 })
    .lean();

  // If over limit, delete oldest sessions
  if (allSessions.length > maxSessions) {
    const sessionsToDelete = allSessions.slice(maxSessions);
    const idsToDelete = sessionsToDelete.map((s) => s._id);
    await sessionModel.deleteMany({ _id: { $in: idsToDelete } });

    console.log(
      `[Session Mgmt] Revoked ${sessionsToDelete.length} old sessions for ${userType} ${userId} (limit: ${maxSessions})`
    );
  }

  return newSession;
};

/**
 * Validate an existing session
 */
export const validateSession = async (userId, refreshToken, userType = "user") => {
  const sessionModel = userType === "seller" ? SellerSession : Session;
  const userField = userType === "seller" ? "seller" : "user";

  const session = await sessionModel.findOne({
    [userField]: userId,
    refreshToken,
  });

  return session ? true : false;
};

/**
 * Rotate refresh token: revoke old and create new
 */
export const rotateRefreshToken = async (
  userId,
  oldToken,
  newToken,
  userType = "user"
) => {
  const sessionModel = userType === "seller" ? SellerSession : Session;
  const userField = userType === "seller" ? "seller" : "user";

  // Find and update the session with the new token
  const updatedSession = await sessionModel.findOneAndUpdate(
    { [userField]: userId, refreshToken: oldToken },
    { refreshToken: newToken, lastRotatedAt: new Date() },
    { new: true }
  );

  if (updatedSession) {
    console.log(
      `[Token Rotation] Rotated refresh token for ${userType} ${userId}`
    );
  }

  return updatedSession;
};

/**
 * Revoke a specific session
 */
export const revokeSession = async (userId, refreshToken, userType = "user") => {
  const sessionModel = userType === "seller" ? SellerSession : Session;
  const userField = userType === "seller" ? "seller" : "user";

  const result = await sessionModel.deleteOne({
    [userField]: userId,
    refreshToken,
  });

  if (result.deletedCount > 0) {
    console.log(
      `[Session Revocation] Revoked session for ${userType} ${userId}`
    );
  }

  return result.deletedCount > 0;
};

/**
 * Revoke all sessions for a user (logout from all devices)
 */
export const revokeAllUserSessions = async (userId, userType = "user") => {
  const sessionModel = userType === "seller" ? SellerSession : Session;
  const userField = userType === "seller" ? "seller" : "user";

  const result = await sessionModel.deleteMany({ [userField]: userId });

  console.log(
    `[Session Revocation] Revoked all ${result.deletedCount} sessions for ${userType} ${userId}`
  );

  return result.deletedCount;
};

/**
 * Get active session count for a user
 */
export const getActiveSessions = async (userId, userType = "user") => {
  const sessionModel = userType === "seller" ? SellerSession : Session;
  const userField = userType === "seller" ? "seller" : "user";

  const count = await sessionModel.countDocuments({ [userField]: userId });
  return count;
};

/**
 * List all active sessions for a user
 */
export const listUserSessions = async (userId, userType = "user") => {
  const sessionModel = userType === "seller" ? SellerSession : Session;
  const userField = userType === "seller" ? "seller" : "user";

  const sessions = await sessionModel
    .find({ [userField]: userId })
    .select("createdAt lastRotatedAt")
    .sort({ createdAt: -1 })
    .lean();

  return sessions;
};

/**
 * Cleanup stale sessions (older than 30 days)
 * Run this periodically via a cron job
 */
export const cleanupStaleSessions = async () => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const userSessions = await Session.deleteMany({ createdAt: { $lt: thirtyDaysAgo } });
  const sellerSessions = await SellerSession.deleteMany({ createdAt: { $lt: thirtyDaysAgo } });

  const totalDeleted = userSessions.deletedCount + sellerSessions.deletedCount;

  console.log(`[Session Cleanup] Removed ${totalDeleted} stale sessions`);

  return totalDeleted;
};

/**
 * Enforce session limits during authentication
 * Called when a user logs in
 */
export const enforceSessionLimits = async (userId, userType = "user") => {
  const sessionModel = userType === "seller" ? SellerSession : Session;
  const userField = userType === "seller" ? "seller" : "user";
  const maxSessions =
    userType === "seller"
      ? MAX_CONCURRENT_SESSIONS_SELLER
      : MAX_CONCURRENT_SESSIONS_USER;

  const allSessions = await sessionModel
    .find({ [userField]: userId })
    .sort({ createdAt: -1 })
    .lean();

  if (allSessions.length >= maxSessions) {
    const sessionsToDelete = allSessions.slice(maxSessions - 1);
    const idsToDelete = sessionsToDelete.map((s) => s._id);

    await sessionModel.deleteMany({ _id: { $in: idsToDelete } });

    console.log(
      `[Session Limit] Enforced limit of ${maxSessions} sessions for ${userType} ${userId}`
    );

    return {
      limitEnforced: true,
      removedCount: sessionsToDelete.length,
    };
  }

  return { limitEnforced: false };
};

export default {
  createSession,
  validateSession,
  rotateRefreshToken,
  revokeSession,
  revokeAllUserSessions,
  getActiveSessions,
  listUserSessions,
  cleanupStaleSessions,
  enforceSessionLimits,
};
