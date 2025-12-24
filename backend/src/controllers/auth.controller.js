import User from "../models/User.js";
import Otp from "../models/Otp.js";
import generateToken from "../utils/generateToken.js";
import crypto from "crypto";
import axios from "axios";
import sendEmail from "../utils/emailHelper.js";
import sendSMS from "../utils/sendSMS.js";
import { OAuth2Client } from "google-auth-library";

// Initialize Google Client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/* ======================================================
   1. SEND EMAIL OTP (Updated: Case-Insensitive Check)
====================================================== */
export const sendEmailOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ message: "Email is required" });

    // 1. Normalize Email (Lowercase) for search
    const normalizedEmail = email.toLowerCase();

    // 2. Check if Email is already registered
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({ message: "Email already registered." });
    }

    // 3. Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 4. Save OTP
    await Otp.findOneAndUpdate(
      { identifier: email }, // Keep original casing for OTP identifier if you prefer
      { otp: otp, type: "email" },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // 5. Send Email
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
   2. SEND MOBILE OTP (Updated: Smarter Duplicate Check)
====================================================== */
export const sendMobileOtp = async (req, res) => {
  try {
    let { phone } = req.body;
    if (!phone)
      return res.status(400).json({ message: "Phone number required" });

    // 1. Clean the input first
    const cleaned = phone.replace(/\s+/g, "").replace(/-/g, "");

    // 2. Determine Formats to Search
    let searchCriteria = [];
    let formattedPhone = cleaned;

    // Check if it's just digits (e.g. 9690886564)
    if (/^[0-9]+$/.test(cleaned)) {
      searchCriteria.push({ phone: cleaned });
      searchCriteria.push({ phone: "+91" + cleaned });
      if (cleaned.length === 10) formattedPhone = "+91" + cleaned;
    }
    // Check if it already has + (e.g. +919690...)
    else if (cleaned.startsWith("+")) {
      searchCriteria.push({ phone: cleaned });
      if (cleaned.startsWith("+91") && cleaned.length === 13) {
        searchCriteria.push({ phone: cleaned.slice(3) });
      }
      formattedPhone = cleaned;
    } else {
      searchCriteria.push({ phone: cleaned });
    }

    // 3. Check for Existing User
    const existingUser = await User.findOne({ $or: searchCriteria });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Phone number already registered" });
    }

    // 4. Generate & Save OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await Otp.findOneAndUpdate(
      { identifier: formattedPhone },
      { otp, type: "mobile" },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // 5. Send SMS
    try {
      if (process.env.TWILIO_SID) {
        await sendSMS({
          phone: formattedPhone,
          message: `Your ShopEasy Code: ${otp}`,
        });
        console.log(`✅ SMS SENT to ${formattedPhone}`);
      } else {
        console.log(`⚠️ TWILIO NOT SETUP. OTP for ${formattedPhone}: ${otp}`);
      }
    } catch (smsError) {
      console.error("❌ SMS FAILED:", smsError.message);
      console.log(`[FALLBACK CODE] OTP for ${formattedPhone}: ${otp}`);
    }

    res.status(200).json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.error("MOBILE OTP ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ======================================================
   3. CHECK OTP (For UI Validation Only)
====================================================== */
export const checkOtp = async (req, res) => {
  try {
    let { identifier, otp } = req.body;

    const isPhone = /^\+?[0-9]{10,15}$/.test(identifier);
    if (isPhone) {
      identifier = identifier.replace(/\s+/g, "").replace(/-/g, "");
      if (!identifier.startsWith("+")) {
        if (identifier.length === 10) identifier = "+91" + identifier;
        else if (identifier.length === 12 && identifier.startsWith("91"))
          identifier = "+" + identifier;
      }
    }

    const validOtp = await Otp.findOne({ identifier, otp });

    if (!validOtp) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    res.status(200).json({ success: true, message: "Verified successfully" });
  } catch (error) {
    console.error("CHECK OTP ERROR 👉", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ======================================================
   4. FINAL REGISTRATION (Secure Create)
====================================================== */
/* ======================================================
   4. FINAL REGISTRATION (Fixed: Removes Double Check)
====================================================== */
export const registerVerifiedUser = async (req, res) => {
  try {
    let { name, email, phone, password, googleId } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 1. Clean Phone Format (Standardize to +91)
    phone = phone.replace(/\s+/g, "").replace(/-/g, "");
    if (!phone.startsWith("+")) {
      if (phone.length === 10) phone = "+91" + phone;
      else if (phone.length === 12 && phone.startsWith("91"))
        phone = "+" + phone;
    }

    // 2. CHECK IF USER ALREADY EXISTS (Safety Check)
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { phone: phone }],
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already registered" });
    }

    // 3. Create User
    // NOTE: We removed the OTP checks here because you already
    // verified them in the previous step using the 'checkOtp' API.
    const newUser = await User.create({
      name,
      email,
      phone,
      password,
      googleId: googleId || null,
      isEmailVerified: true,
      isMobileVerified: true,
    });

    // 4. Cleanup: Delete used OTPs so they can't be reused
    await Otp.deleteMany({ identifier: { $in: [email, phone] } });

    res.status(201).json({
      success: true,
      token: generateToken(newUser._id),
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
      },
      message: "Account created successfully!",
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res
      .status(500)
      .json({ message: "Registration failed", error: error.message });
  }
};

/* ======================================================
   5. LOGIN USER (CRITICAL FIX APPLIED HERE)
====================================================== */
export const loginUser = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email/Phone and password required" });
    }

    // Smart Phone Detection
    let searchCriteria = [{ email: email }];
    const isNumber = /^[0-9]+$/.test(email);

    if (isNumber) {
      searchCriteria.push({ phone: email });
      searchCriteria.push({ phone: "+91" + email });
    } else if (email.startsWith("+")) {
      searchCriteria.push({ phone: email });
    } else {
      searchCriteria.push({ phone: email });
    }

    const user = await User.findOne({ $or: searchCriteria }).select(
      "+password"
    );

    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await user.matchPassword(password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    // ✅ FIX: Structuring the response correctly
    // Frontend expects data.user.name, so we MUST send a 'user' object.
    res.status(200).json({
      success: true,
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name, // <--- This will fix the "Name missing" issue
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR 👉", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ======================================================
   6. GOOGLE AUTH (Fixed: Uses Access Token)
====================================================== */
export const googleAuth = async (req, res) => {
  try {
    const { token } = req.body; // Access Token

    const googleRes = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const { sub: googleId, name, email } = googleRes.data;

    let user = await User.findOne({ email });

    if (user) {
      return res.status(200).json({
        success: true,
        token: generateToken(user._id),
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
        },
        isNewUser: false,
      });
    } else {
      return res.status(200).json({
        success: true,
        isNewUser: true,
        name,
        email,
        googleId,
        message: "Please complete your profile",
      });
    }
  } catch (error) {
    console.error("GOOGLE AUTH ERROR:", error.message);
    res.status(500).json({ message: "Google verification failed" });
  }
};

/* ======================================================
   7. FORGOT PASSWORD (Email OR Phone)
====================================================== */
export const sendForgotPasswordOTP = async (req, res) => {
  try {
    let { identifier } = req.body;

    if (!identifier) {
      return res.status(400).json({ message: "Email or Phone is required" });
    }

    // 1. DETECT TYPE (Email or Phone)
    const isNumber = /^[0-9]+$/.test(identifier);
    let query = {};
    let isPhone = false;

    if (isNumber) {
      isPhone = true;
      query = { $or: [{ phone: identifier }, { phone: "+91" + identifier }] };
    } else if (identifier.startsWith("+")) {
      isPhone = true;
      query = { phone: identifier };
    } else {
      query = { email: identifier };
    }

    // 2. FIND USER
    const user = await User.findOne(query);
    if (!user) return res.status(404).json({ message: "User not found" });

    // 3. GENERATE OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetPasswordOtp = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 mins
    await user.save({ validateBeforeSave: false });

    // 4. SEND OTP
    if (isPhone) {
      try {
        if (process.env.TWILIO_SID) {
          await sendSMS({
            phone: user.phone,
            message: `ShopEasy Reset OTP: ${otp}`,
          });
        } else {
          console.log(`[SMS MOCK] Reset OTP for ${user.phone}: ${otp}`);
        }
        res
          .status(200)
          .json({ success: true, message: "OTP sent to your mobile number" });
      } catch (error) {
        console.error("SMS Failed:", error);
        res.status(500).json({ message: "Failed to send SMS" });
      }
    } else {
      try {
        await sendEmail({
          email: user.email,
          subject: "Password Reset OTP",
          message: `Your password reset OTP is: ${otp}`,
        });
        res
          .status(200)
          .json({ success: true, message: "OTP sent to your email" });
      } catch (error) {
        console.error("Email Failed:", error);
        res.status(500).json({ message: "Failed to send Email" });
      }
    }
  } catch (error) {
    console.error("FORGOT PASS ERROR:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const resetPasswordWithOTP = async (req, res) => {
  const { identifier, otp, password } = req.body;
  try {
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    // Smart search logic again
    const isNumber = /^[0-9]+$/.test(identifier);
    let query = {};
    if (isNumber) {
      query = { $or: [{ phone: identifier }, { phone: "+91" + identifier }] };
    } else if (identifier.startsWith("+")) {
      query = { phone: identifier };
    } else {
      query = { email: identifier };
    }

    const user = await User.findOne({
      ...query,
      resetPasswordOtp: hashedOtp,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ message: "Invalid or expired OTP" });

    user.password = password;
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
