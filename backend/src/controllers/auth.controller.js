import User from "../models/User.js";
import Seller from "../models/seller.js";
import Otp from "../models/Otp.js";
import Session from "../models/Session.js"; // Customer Sessions
import SellerSession from "../models/SellerSession.js"; // ✅ Seller Sessions
import generateToken from "../utils/generateToken.js";
import crypto from "crypto";
import axios from "axios";
import sendEmail from "../utils/emailHelper.js";
import sendSMS from "../utils/sendSMS.js";

/**
 * 🟢 SESSION LIMITER HELPER
 * Blocks login if the maximum number of concurrent sessions is reached.
 * Returns a 403 Forbidden error to be handled by the frontend toast.
 */
const checkSessionLimit = async (Model, queryKey, id, limit = 2) => {
  const sessionCount = await Model.countDocuments({ [queryKey]: id });

  if (sessionCount >= limit) {
    const error = new Error(
      `Maximum of ${limit} active sessions reached. Please logout from another device first.`
    );
    error.statusCode = 403; // Forbidden
    throw error;
  }
};

/* ======================================================
   1. SEND EMAIL OTP (Role-Based Check)
====================================================== */
export const sendEmailOtp = async (req, res) => {
  try {
    const { email, type } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const normalizedEmail = email.toLowerCase().trim();

    if (type === "seller") {
      const existingSeller = await Seller.findOne({ email: normalizedEmail });
      if (existingSeller)
        return res
          .status(400)
          .json({ message: "Email already registered as Seller." });
    } else {
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser)
        return res.status(400).json({ message: "Email already registered." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await Otp.findOneAndUpdate(
      { identifier: normalizedEmail },
      { otp, type: "email" },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await sendEmail({
      email: normalizedEmail,
      subject: "Verify your Email",
      message: `Your ShopEasy verification code is: ${otp}\n\nThis code expires in 5 minutes.`,
    });

    res.status(200).json({ success: true, message: "OTP sent to email" });
  } catch (error) {
    res.status(500).json({ message: "Failed to send OTP" });
  }
};

/* ======================================================
   2. SEND MOBILE OTP (Role-Based Check)
====================================================== */
export const sendMobileOtp = async (req, res) => {
  try {
    let { phone, type } = req.body;
    if (!phone)
      return res.status(400).json({ message: "Phone number required" });

    const cleaned = phone.replace(/\s+/g, "").replace(/-/g, "");
    let searchCriteria = [{ phone: cleaned }, { phone: "+91" + cleaned }];
    let formattedPhone = cleaned.length === 10 ? "+91" + cleaned : cleaned;

    if (type === "seller") {
      const existingSeller = await Seller.findOne({ $or: searchCriteria });
      if (existingSeller)
        return res.status(400).json({ message: "Phone registered as Seller" });
    } else {
      const existingUser = await User.findOne({ $or: searchCriteria });
      if (existingUser)
        return res
          .status(400)
          .json({ message: "Phone number already registered" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.findOneAndUpdate(
      { identifier: formattedPhone },
      { otp, type: "mobile" },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (process.env.TWILIO_SID) {
      await sendSMS({
        phone: formattedPhone,
        message: `Your ShopEasy Code: ${otp}`,
      });
    }

    res.status(200).json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ======================================================
   3. CHECK OTP (Generic)
====================================================== */
/* ======================================================
   3. CHECK OTP (Generic)
====================================================== */
export const checkOtp = async (req, res) => {
  try {
    let { identifier, otp } = req.body;
    
    // 1. First, standard normalization (trim/lowercase)
    let normalizedIdentifier = identifier.trim().toLowerCase();

    // 2. Check if this looks like a phone number (digits/plus only)
    // If it's NOT an email (doesn't contain @), assume it's a phone number
    if (!normalizedIdentifier.includes('@')) {
       // Clean any non-digit/non-plus chars (like spaces or dashes)
       const cleaned = normalizedIdentifier.replace(/[^0-9+]/g, "");
       
       // Apply the SAME formatting logic as sendMobileOtp
       // If it's exactly 10 digits, assume India (+91)
       if (cleaned.length === 10 && /^\d+$/.test(cleaned)) {
          normalizedIdentifier = "+91" + cleaned;
       } else {
          normalizedIdentifier = cleaned;
       }
    }

    // 3. Query with the correctly formatted identifier
    const validOtp = await Otp.findOne({
      identifier: normalizedIdentifier,
      otp,
    });

    if (!validOtp)
      return res.status(400).json({ message: "Invalid or expired OTP" });

    // Optional: Delete OTP after successful use to prevent reuse
    // await Otp.deleteOne({ _id: validOtp._id });

    res.status(200).json({ success: true, message: "Verified successfully" });
  } catch (error) {
    console.error("Check OTP Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ======================================================
   4. FINAL REGISTRATION (For CUSTOMERS/USERS)
====================================================== */
export const registerVerifiedUser = async (req, res) => {
  try {
    let { name, email, phone, password, googleId } = req.body;
    const newUser = await User.create({
      name,
      email: email.toLowerCase().trim(),
      phone,
      password,
      googleId: googleId || null,
      isEmailVerified: true,
      isMobileVerified: true,
    });

    const token = generateToken(newUser._id);

    // 🔴 BLOCK Check during registration
    try {
      await checkSessionLimit(Session, "user", newUser._id, 2);
    } catch (limitError) {
      return res
        .status(limitError.statusCode)
        .json({ message: limitError.message });
    }

    await Session.create({
      user: newUser._id,
      refreshToken: token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    });

    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({ success: true, token, user: newUser });
  } catch (error) {
    res.status(500).json({ message: "Registration failed" });
  }
};

/* ======================================================
   5. LOGIN USER (Customer Portal)
====================================================== */
export const loginUser = async (req, res) => {
  try {
    let { email: identifier, password } = req.body;
    if (!identifier || !password)
      return res.status(400).json({ message: "Credentials required" });

    const cleanIdentifier = identifier.trim().toLowerCase();
    const user = await User.findOne({
      $or: [
        { email: cleanIdentifier },
        { phone: identifier },
        { phone: cleanIdentifier },
        { phone: "+91" + identifier.replace(/\D/g, "") },
      ],
    }).select("+password");

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 🔴 HARD BLOCK: Check if user already has 2 active sessions
    try {
      await checkSessionLimit(Session, "user", user._id, 2);
    } catch (limitError) {
      return res
        .status(limitError.statusCode)
        .json({ message: limitError.message });
    }

    const token = generateToken(user._id);

    await Session.create({
      user: user._id,
      refreshToken: token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    });

    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ success: true, token, user });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ======================================================
   6. GOOGLE AUTH (Role-Aware Isolation)
====================================================== */
export const googleAuth = async (req, res) => {
  try {
    const { token: googleToken, role } = req.body;
    const googleRes = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: `Bearer ${googleToken}` },
      }
    );

    const { sub: googleId, name, email } = googleRes.data;
    const normalizedEmail = email.toLowerCase().trim();
    let Model = role === "seller" ? Seller : User;
    let user = await Model.findOne({ email: normalizedEmail });

    if (user) {
      const authToken = generateToken(user._id);

      // 🔴 HARD BLOCK: check limit before creating new Google session
      try {
        if (role === "seller") {
          await checkSessionLimit(SellerSession, "seller", user._id, 2);
        } else {
          await checkSessionLimit(Session, "user", user._id, 2);
        }
      } catch (limitError) {
        return res
          .status(limitError.statusCode)
          .json({ message: limitError.message });
      }

      if (role === "seller") {
        await SellerSession.create({
          seller: user._id,
          refreshToken: authToken,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          userAgent: req.headers["user-agent"],
          ipAddress: req.ip,
        });

        if (req.session) {
          req.session.sellerId = user._id;
          req.session.role = "seller";
          await new Promise((resolve) => req.session.save(resolve));
        }
      } else {
        await Session.create({
          user: user._id,
          refreshToken: authToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          userAgent: req.headers["user-agent"],
          ipAddress: req.ip,
        });
      }

      res.cookie("accessToken", authToken, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res
        .status(200)
        .json({ success: true, token: authToken, user, isNewUser: false });
    } else {
      return res.status(200).json({
        success: true,
        isNewUser: true,
        name,
        email: normalizedEmail,
        googleId,
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Google Auth Failed" });
  }
};

/* ======================================================
   7. FORGOT & RESET PASSWORD
====================================================== */
export const sendForgotPasswordOTP = async (req, res) => {
  try {
    const { identifier } = req.body;
    const normalizedId = identifier.trim().toLowerCase();
    const user = await User.findOne({
      $or: [{ email: normalizedId }, { phone: identifier }],
    });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOtp = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    await sendEmail({
      email: user.email,
      subject: "Reset OTP",
      message: `Code: ${otp}`,
    });
    res.status(200).json({ success: true, message: "OTP sent" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const resetPasswordWithOTP = async (req, res) => {
  try {
    const { identifier, otp, password } = req.body;
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
    const normalizedId = identifier.trim().toLowerCase();

    const user = await User.findOne({
      $or: [{ email: normalizedId }, { phone: identifier }],
      resetPasswordOtp: hashedOtp,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: "Invalid OTP" });
    user.password = password;
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    res.status(200).json({ success: true, message: "Updated" });
  } catch (error) {
    res.status(500).json({ message: "Error" });
  }
};

/* ======================================================
   8. LOGOUT (Purges all session traces)
====================================================== */
export const logoutUser = async (req, res) => {
  try {
    const token =
      req.cookies.accessToken || req.headers.authorization?.split(" ")[1];

    // 1. Delete from custom models
    if (token) {
      await Promise.all([
        Session.findOneAndDelete({ refreshToken: token }),
        SellerSession.findOneAndDelete({ refreshToken: token }),
      ]);
    }

    // 2. Destroy Express Session (shopeasy.sid)
    if (req.session) {
      req.session.destroy((err) => {
        if (err) console.error("Session destruction error:", err);
      });
    }

    // 3. Clear Cookies
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    });
    res.clearCookie("shopeasy.sid", {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    });

    res.status(200).json({ success: true, message: "Logged out" });
  } catch (error) {
    res.status(500).json({ message: "Logout error" });
  }
};

/* ======================================================
   9. GET ME
====================================================== */
export const getMe = async (req, res) => {
  try {
    const user = req.user || req.seller;
    if (!user) return res.status(401).json({ message: "Not authorized" });
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
