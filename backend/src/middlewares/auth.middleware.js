import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Seller from "../models/seller.js";
import Session from "../models/Session.js";
import SellerSession from "../models/SellerSession.js"; // ✅ New Seller-specific session model

/* ======================================================
    1. PROTECT (For Customers & Admins)
====================================================== */
export const protect = async (req, res, next) => {
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

      // Check the generic User Session model
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
      console.error("User Auth Error:", error.message);
      if (error.name === "TokenExpiredError") {
        return res
          .status(401)
          .json({ message: "Session expired, please login again" });
      }
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

/* ======================================================
    2. PROTECT SELLER (Isolated for Vendors)
    ✅ FIXED: Uses SellerSession model for total isolation
====================================================== */
export const protectSeller = async (req, res, next) => {
  let token;

  // 1. Extract Token from Header or Cookies
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  } else if (req.cookies?.sellerAccessToken) {
    token = req.cookies.sellerAccessToken;
  }

  // 🔵 STEP A: JWT LOGIC (Primary for API)
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // ✅ KEY CHANGE: Check SellerSession instead of Session
      const sessionExists = await SellerSession.findOne({
        seller: decoded.id,
        refreshToken: token,
      });

      if (sessionExists) {
        req.seller = await Seller.findById(decoded.id).select("-password");

        if (req.seller && req.seller.isActive) {
          // Sync with Express Session (Cookie-based fallback)
          if (req.session) {
            req.session.sellerId = req.seller._id;
            req.session.role = "seller";
          }
          return next();
        } else if (req.seller && !req.seller.isActive) {
          return res.status(403).json({ message: "Seller account suspended." });
        }
      }
    } catch (error) {
      console.log("Seller JWT Validation failed, checking session...");
    }
  }

  // 🟢 STEP B: EXPRESS SESSION FALLBACK (Cookie-based)
  if (req.session && req.session.sellerId) {
    try {
      req.seller = await Seller.findById(req.session.sellerId).select(
        "-password"
      );
      if (req.seller && req.seller.isActive) {
        return next();
      }
    } catch (error) {
      console.error("Seller Session Error:", error.message);
    }
  }

  // ❌ STEP C: AUTHENTICATION FAILED
  return res.status(401).json({
    message: "Seller session expired. Please login again.",
    redirect: "/Seller/login",
  });
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

/* ======================================================
    4. OPTIONAL SELLER AUTH (For Public Store Pages)
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
