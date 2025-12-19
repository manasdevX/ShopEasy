import User from "../models/User.js";
import Otp from "../models/Otp.js";
import generateToken from "../utils/generateToken.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import axios from "axios";
import sendEmail from "../utils/sendEmail.js";
import sendSMS from "../utils/sendSMS.js"; // ✅ UNCOMMENTED: Real SMS Provider

/* ======================================================
   1. SEND EMAIL OTP (Inline Verification)
   - Checks if email exists
   - Sends OTP
====================================================== */
export const sendEmailOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Check if Email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Email already registered. Please Login." });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save/Update OTP in Database (Identifier = Email)
    await Otp.findOneAndUpdate(
      { identifier: email },
      { otp: otp, type: "email" },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Send Email
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
   2. SEND MOBILE OTP (Inline Verification)
   - Checks if phone exists
   - Sends REAL SMS using Twilio
====================================================== */
export const sendMobileOtp = async (req, res) => {
  try {
    let { phone } = req.body;
    if (!phone)
      return res.status(400).json({ message: "Phone number required" });

    // ==========================================
    // 1. CLEAN & FORMAT PHONE NUMBER STRICTLY
    // ==========================================

    // Remove all spaces, dashes, or parentheses
    phone = phone.replace(/\s+/g, "").replace(/-/g, "");

    // Check if user entered country code (e.g. 9198765...)
    if (!phone.startsWith("+")) {
      // If they typed "919876543210" (12 digits), just add '+'
      if (phone.length === 12 && phone.startsWith("91")) {
        phone = "+" + phone;
      }
      // If they typed "9876543210" (10 digits), add '+91'
      else if (phone.length === 10) {
        phone = "+91" + phone;
      }
    }
    // Result is always strict E.164 format: +919876543210

    // ==========================================

    const existingUser = await User.findOne({ phone });
    if (existingUser)
      return res.status(400).json({ message: "Phone already registered" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP
    await Otp.findOneAndUpdate(
      { identifier: phone },
      { otp, type: "mobile" },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Try Sending SMS
    try {
      if (process.env.TWILIO_SID) {
        await sendSMS({ phone, message: `Your ShopEasy Code: ${otp}` });
        console.log(`✅ SMS SENT to ${phone}`);
      } else {
        console.log(`⚠️ TWILIO NOT SETUP. OTP for ${phone}: ${otp}`);
      }
    } catch (smsError) {
      console.error("❌ SMS FAILED:", smsError.message);
      // Fallback: If it fails, log the OTP so you can still sign up manually
      console.log(`[FALLBACK CODE] OTP for ${phone}: ${otp}`);
    }

    res.status(200).json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.error("MOBILE OTP ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};
/* ======================================================
   3. CHECK OTP (For UI Validation Only)
   - Verifies if the entered OTP is correct
   - Does NOT delete the OTP (we need it for final registration)
====================================================== */
/* ======================================================
   3. CHECK OTP (Fixed to match Phone Format)
====================================================== */
export const checkOtp = async (req, res) => {
  try {
    let { identifier, otp } = req.body; // identifier = email OR phone

    // 1. If identifier looks like a phone number, Clean & Format it!
    // (Matches the logic in sendMobileOtp)
    const isPhone = /^\+?[0-9]{10,15}$/.test(identifier);

    if (isPhone) {
      // Remove spaces/dashes
      identifier = identifier.replace(/\s+/g, "").replace(/-/g, "");

      // Force add +91 (or your country code) if missing
      if (!identifier.startsWith("+")) {
        if (identifier.length === 10) {
          identifier = "+91" + identifier;
        } else if (identifier.length === 12 && identifier.startsWith("91")) {
          identifier = "+" + identifier;
        }
      }
    }

    // 2. Check Database
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
   - Verifies BOTH OTPs one last time securely
   - Creates the User Account
====================================================== */
/* ======================================================
   4. FINAL REGISTRATION (Fixed Phone Format)
====================================================== */
export const registerVerifiedUser = async (req, res) => {
  try {
    let { name, email, phone, password, emailOtp, mobileOtp } = req.body;

    if (!name || !email || !phone || !password || !emailOtp || !mobileOtp) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // ==========================================
    // 1. CLEAN & FORMAT PHONE NUMBER (Crucial Fix)
    // ==========================================
    phone = phone.replace(/\s+/g, '').replace(/-/g, '');
    if (!phone.startsWith("+")) {
      if (phone.length === 10) {
         phone = "+91" + phone; // Add country code
      } else if (phone.length === 12 && phone.startsWith("91")) {
         phone = "+" + phone;
      }
    }
    // ==========================================

    // 2. Verify Email OTP AGAIN (Security Check)
    const validEmailOtp = await Otp.findOne({ identifier: email, otp: emailOtp });
    if (!validEmailOtp) {
      return res.status(400).json({ message: "Invalid or expired Email OTP" });
    }

    // 3. Verify Mobile OTP AGAIN (Security Check)
    const validMobileOtp = await Otp.findOne({ identifier: phone, otp: mobileOtp });
    if (!validMobileOtp) {
      return res.status(400).json({ message: "Invalid or expired Mobile OTP" });
    }

    // 4. Create User
    const newUser = await User.create({
      name,
      email,
      phone,
      password,
      isEmailVerified: true,
      isMobileVerified: true,
    });

    // 5. Cleanup Used OTPs
    await Otp.deleteMany({ identifier: { $in: [email, phone] } });

    // 6. Login User & Return Token
    res.status(201).json({
      success: true,
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      token: generateToken(newUser._id),
      message: "Account created successfully!",
    });

  } catch (error) {
    console.error("REGISTER ERROR 👉", error);
    res.status(500).json({ message: "Registration failed", error: error.message });
  }
};

/* ======================================================
   EXISTING: LOGIN USER (Supports Email OR Phone)
====================================================== */
/* =========================
   LOGIN USER (Fixed for Phone Formats)
========================= */
export const loginUser = async (req, res) => {
  try {
    let { email, password } = req.body; // 'email' holds the input (email or phone)

    if (!email || !password) {
      return res.status(400).json({ message: "Email/Phone and password required" });
    }

    // --- SMART PHONE DETECTION ---
    // If the input looks like a phone number (digits only), check variations
    let searchCriteria = [{ email: email }];
    
    // Regex to check if input is purely numbers (e.g. 9690886564)
    const isNumber = /^[0-9]+$/.test(email);

    if (isNumber) {
        // Search for raw number AND number with +91
        searchCriteria.push({ phone: email });
        searchCriteria.push({ phone: "+91" + email }); 
    } else if (email.startsWith("+")) {
        // If they typed +91..., search that specifically
        searchCriteria.push({ phone: email });
    } else {
        // Fallback: search phone field anyway just in case
        searchCriteria.push({ phone: email });
    }

    // --- DATABASE SEARCH ---
    // Find a user matching ANY of these criteria
    const user = await User.findOne({
      $or: searchCriteria
    }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // --- PASSWORD CHECK ---
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // --- SUCCESS ---
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("LOGIN ERROR 👉", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ======================================================
   EXISTING: GOOGLE AUTH
====================================================== */
export const googleAuth = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "No token provided" });

    const googleRes = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const { email, name, picture } = googleRes.data;
    let user = await User.findOne({ email });

    if (!user) {
      const dummyPassword = await bcrypt.hash(Math.random().toString(36), 12);
      user = await User.create({
        name,
        email,
        avatar: picture,
        password: dummyPassword,
        isEmailVerified: true,
        isMobileVerified: true,
      });
    }

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("GOOGLE AUTH ERROR", error);
    res.status(401).json({ message: "Google authentication failed" });
  }
};

/* ======================================================
   EXISTING: FORGOT PASSWORD
====================================================== */
export const sendForgotPasswordOTP = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetPasswordOtp = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 mins

    await user.save({ validateBeforeSave: false });

    await sendEmail({
      email: user.email,
      subject: "Password Reset OTP",
      message: `Your password reset OTP is: ${otp}`,
    });

    res.status(200).json({ success: true, message: "OTP sent to email" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const resetPasswordWithOTP = async (req, res) => {
  const { email, otp, password } = req.body;
  try {
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    const user = await User.findOne({
      email,
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
