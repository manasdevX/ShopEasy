import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Seller from "../models/seller.js"; // ✅ Import Seller Model

// ======================================================
// 1. PROTECT (For Customers & Admins)
//    - Verifies token against 'User' collection
// ======================================================
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // Verify Token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch User (Customers/Admins)
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

// ======================================================
// 2. PROTECT SELLER (For Vendors Only)
//    - Verifies token against 'Seller' collection
// ======================================================
export const protectSeller = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch Seller
      // We use 'req.seller' so it doesn't conflict with 'req.user'
      req.seller = await Seller.findById(decoded.id).select("-password");

      if (!req.seller) {
        return res
          .status(401)
          .json({ message: "Not authorized, seller not found" });
      }

      if (!req.seller.isActive) {
        return res
          .status(403)
          .json({ message: "Seller account is inactive/suspended." });
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

// ======================================================
// 3. ADMIN (Role Check)
//    - Must be placed AFTER 'protect'
// ======================================================
export const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({ message: "Not authorized as an admin" });
  }
};
