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

/* ======================================================
   1. SEND EMAIL OTP (Role-Based Check)
====================================================== */
export const sendEmailOtp = async (req, res) => {
  try {
    const { email, type } = req.body;

    if (!email) return res.status(400).json({ message: "Email is required" });

    const normalizedEmail = email.toLowerCase();

    if (type === "seller") {
      const existingSeller = await Seller.findOne({ email: normalizedEmail });
      if (existingSeller) {
        return res
          .status(400)
          .json({ message: "Email already registered as Seller." });
      }
    } else {
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered." });
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await Otp.findOneAndUpdate(
      { identifier: email },
      { otp: otp, type: "email" },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const message = `Your ShopEasy verification code is: ${otp}\n\nThis code expires in 5 minutes.`;
    await sendEmail({
      email: email,
      subject: "Verify your Email",
      message: message,
    });

    res.status(200).json({ success: true, message: "OTP sent to email" });
  } catch (error) {
    console.error("SEND EMAIL OTP ERROR 👉", error);
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
    let searchCriteria = [];
    let formattedPhone = cleaned;

    if (/^[0-9]+$/.test(cleaned)) {
      searchCriteria.push({ phone: cleaned }, { phone: "+91" + cleaned });
      if (cleaned.length === 10) formattedPhone = "+91" + cleaned;
    } else {
      searchCriteria.push({ phone: cleaned });
      formattedPhone = cleaned;
    }

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
export const checkOtp = async (req, res) => {
  try {
    let { identifier, otp } = req.body;
    const validOtp = await Otp.findOne({ identifier, otp });
    if (!validOtp)
      return res.status(400).json({ message: "Invalid or expired OTP" });
    res.status(200).json({ success: true, message: "Verified successfully" });
  } catch (error) {
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
      email,
      phone,
      password,
      googleId: googleId || null,
      isEmailVerified: true,
      isMobileVerified: true,
    });

    const token = generateToken(newUser._id);

    // Save to generic Session model
    await Session.create({
      user: newUser._id,
      refreshToken: token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      userAgent: req.headers["user-agent"],
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
    let { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user._id);

    // Save to generic Session model
    await Session.create({
      user: user._id,
      refreshToken: token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      userAgent: req.headers["user-agent"],
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
    let Model = role === "seller" ? Seller : User;
    let user = await Model.findOne({ email });

    if (user) {
      const authToken = generateToken(user._id);

      // ✅ SELLER SESSION ISOLATION
      if (role === "seller") {
        await SellerSession.create({
          seller: user._id,
          refreshToken: authToken,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 Days
          userAgent: req.headers["user-agent"],
        });

        if (req.session) {
          req.session.sellerId = user._id;
          req.session.role = "seller";
          await new Promise((resolve) => req.session.save(resolve));
        }
      } else {
        // Customer Session
        await Session.create({
          user: user._id,
          refreshToken: authToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          userAgent: req.headers["user-agent"],
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
      return res
        .status(200)
        .json({ success: true, isNewUser: true, name, email, googleId });
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
    const user = await User.findOne({ email: identifier });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOtp = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await user.save();

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
    const user = await User.findOne({
      email: identifier,
      resetPasswordOtp: hashedOtp,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: "Invalid OTP" });
    user.password = password;
    user.resetPasswordOtp = undefined;
    await user.save();
    res.status(200).json({ success: true, message: "Updated" });
  } catch (error) {
    res.status(500).json({ message: "Error" });
  }
};

/* ======================================================
   8. LOGOUT (Clean up both generic and seller sessions)
====================================================== */
export const logoutUser = async (req, res) => {
  try {
    const token =
      req.cookies.accessToken || req.headers.authorization?.split(" ")[1];

    if (token) {
      // Clear from BOTH collections to be safe during logout
      await Promise.all([
        Session.findOneAndDelete({ refreshToken: token }),
        SellerSession.findOneAndDelete({ refreshToken: token }),
      ]);
    }

    if (req.session) {
      req.session.destroy();
    }

    res.clearCookie("accessToken", {
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
   9. GET ME (Role-Agnostic Profile Fetch)
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
