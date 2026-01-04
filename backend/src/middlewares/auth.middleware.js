import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Seller from "../models/seller.js";
import Session from "../models/Session.js";
import SellerSession from "../models/SellerSession.js";

/* ======================================================
    1. PROTECT (For Customers & Admins)
    Checks generic Session model to enforce session limits.
====================================================== */
export const protect = async (req, res, next) => {
  let token;

  // Extract Token from Header or Cookies
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    /**
     * 🔍 SESSION VALIDATION
     * Even if JWT is valid, we check MongoDB. If the session was deleted
     * by our "checkSessionLimit" logic, this will fail.
     */
    const sessionExists = await Session.findOne({
      user: decoded.id,
      refreshToken: token,
    });

    if (!sessionExists) {
      return res.status(401).json({
        message: "Session expired or logged out from another device",
      });
    }

    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    if (req.user.isBlocked) {
      return res
        .status(403)
        .json({ message: "Account blocked. Contact support." });
    }

    next();
  } catch (error) {
    console.error("User Auth Middleware Error:", error.message);
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Token expired, please login again" });
    }
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};

/* ======================================================
    2. PROTECT SELLER (Isolated for Vendors)
    ✅ FIXED: Perfectly synced with SellerSession & Express Session
====================================================== */
export const protectSeller = async (req, res, next) => {
  let token;

  // 1. Extract Token
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  // 🔵 STEP A: JWT + DATABASE SESSION CHECK
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check the isolated SellerSession model
      const sessionExists = await SellerSession.findOne({
        seller: decoded.id,
        refreshToken: token,
      });

      if (sessionExists) {
        req.seller = await Seller.findById(decoded.id).select("-password");

        if (req.seller) {
          if (!req.seller.isActive) {
            return res
              .status(403)
              .json({ message: "Seller account suspended." });
          }

          // ✅ SYNC: Ensure Express Session is aware of this seller for Socket.io
          if (req.session && !req.session.sellerId) {
            req.session.sellerId = req.seller._id;
            req.session.role = "seller";
          }
          return next();
        }
      }
    } catch (error) {
      console.log("Seller JWT check failed, checking fallback...");
    }
  }

  // 🟢 STEP B: EXPRESS SESSION FALLBACK
  // Useful for routes where the frontend relies on cookies/shopeasy.sid only
  if (req.session && req.session.sellerId) {
    try {
      req.seller = await Seller.findById(req.session.sellerId).select(
        "-password"
      );
      if (req.seller && req.seller.isActive) {
        return next();
      }
    } catch (error) {
      console.error("Seller Session Fallback Error:", error.message);
    }
  }

  // ❌ STEP C: ALL AUTH FAILED
  return res.status(401).json({
    message: "Seller session expired. Please login again.",
    redirect: "/Seller/login",
  });
};

/* ======================================================
    3. ADMIN ROLE CHECK
====================================================== */
export const admin = (req, res, next) => {
  if (req.user && (req.user.role === "admin" || req.user.isAdmin)) {
    next();
  } else {
    res.status(403).json({ message: "Not authorized as an admin" });
  }
};

/* ======================================================
    4. OPTIONAL SELLER AUTH
    For pages that change layout if a seller is logged in but don't require it.
====================================================== */
export const optionalSellerAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const sessionExists = await SellerSession.findOne({
        seller: decoded.id,
        refreshToken: token,
      });

      if (sessionExists) {
        req.seller = await Seller.findById(decoded.id).select("-password");
      }
    } catch (error) {
      // Silent fail
    }
  }

  if (!req.seller && req.session?.sellerId) {
    try {
      req.seller = await Seller.findById(req.session.sellerId).select(
        "-password"
      );
    } catch (error) {
      // Silent fail
    }
  }

  next();
};
