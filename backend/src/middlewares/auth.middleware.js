import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Seller from "../models/seller.js";
import Session from "../models/Session.js"; // ✅ Matches export default

/* ======================================================
   1. PROTECT (For Customers & Admins)
====================================================== */
export const protect = async (req, res, next) => {
  let token;

  // Check for token in Headers or Cookies
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken; // Support for HttpOnly cookies
  }

  if (token) {
    try {
      // 1. Verify Token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 2. NEW: Check if this session exists in DB
      // 🔴 WAS: { userId: decoded.id, token }
      // 🟢 FIX: Matches Session Model fields
      const sessionExists = await Session.findOne({
        user: decoded.id,       // Changed 'userId' -> 'user'
        refreshToken: token,    // Changed 'token' -> 'refreshToken'
      });

      if (!sessionExists) {
        return res
          .status(401)
          .json({
            message: "Session expired or logged out from another device",
          });
      }

      // 3. Fetch User (Customers/Admins)
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res
          .status(401)
          .json({ message: "Not authorized, user not found" });
      }

      if (req.user.isBlocked) {
        return res
          .status(403)
          .json({ message: "Account blocked. Contact support." });
      }

      next();
    } catch (error) {
      console.error("Auth Middleware Error:", error.message);
      if (error.name === "TokenExpiredError") {
        return res
          .status(401)
          .json({ message: "Session expired, please login again" });
      }
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

/* ======================================================
   2. PROTECT SELLER (For Vendors Only)
====================================================== */
export const protectSeller = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // NEW: Check if this session exists in DB
      // 🔴 WAS: { userId: decoded.id, token }
      // 🟢 FIX: Matches Session Model fields
      const sessionExists = await Session.findOne({
        user: decoded.id,       // Changed 'userId' -> 'user'
        refreshToken: token,    // Changed 'token' -> 'refreshToken'
      });

      if (!sessionExists) {
        return res
          .status(401)
          .json({
            message: "Session expired or logged out from another device",
          });
      }

      // Fetch Seller
      req.seller = await Seller.findById(decoded.id).select("-password");

      if (!req.seller) {
        return res
          .status(401)
          .json({ message: "Not authorized, seller not found" });
      }

      if (!req.seller.isActive) {
        return res
          .status(403)
          .json({ message: "Seller account is inactive or suspended." });
      }

      next();
    } catch (error) {
      console.error("Seller Auth Error:", error.message);
      if (error.name === "TokenExpiredError") {
        return res
          .status(401)
          .json({ message: "Session expired, please login again" });
      }
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res
      .status(401)
      .json({ message: "Not authorized as seller, no token" });
  }
};

/* ======================================================
   3. ADMIN (Role Check)
====================================================== */
export const admin = (req, res, next) => {
  if (req.user && (req.user.role === "admin" || req.user.isAdmin)) {
    next();
  } else {
    res.status(403).json({ message: "Not authorized as an admin" });
  }
};
