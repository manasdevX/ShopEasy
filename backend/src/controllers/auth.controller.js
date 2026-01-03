import User from "../models/User.js";
import Seller from "../models/seller.js";
import Otp from "../models/Otp.js";
import Session from "../models/Session.js"; // ✅ Session Model
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
    const { email, type } = req.body; // 'type' can be 'seller' or 'user' (default)

    if (!email) return res.status(400).json({ message: "Email is required" });

    const normalizedEmail = email.toLowerCase();

    // --- SEPARATION LOGIC ---
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

    // Generate & Save OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

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
      searchCriteria.push({ phone: cleaned });
      searchCriteria.push({ phone: "+91" + cleaned });
      if (cleaned.length === 10) formattedPhone = "+91" + cleaned;
    } else if (cleaned.startsWith("+")) {
      searchCriteria.push({ phone: cleaned });
      if (cleaned.startsWith("+91") && cleaned.length === 13) {
        searchCriteria.push({ phone: cleaned.slice(3) });
      }
      formattedPhone = cleaned;
    } else {
      searchCriteria.push({ phone: cleaned });
    }

    if (type === "seller") {
      const existingSeller = await Seller.findOne({ $or: searchCriteria });
      if (existingSeller) {
        return res
          .status(400)
          .json({ message: "Phone already registered as Seller" });
      }
    } else {
      const existingUser = await User.findOne({ $or: searchCriteria });
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "Phone number already registered" });
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await Otp.findOneAndUpdate(
      { identifier: formattedPhone },
      { otp, type: "mobile" },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

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
   3. CHECK OTP (Generic)
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
   4. FINAL REGISTRATION (For CUSTOMERS/USERS)
====================================================== */
export const registerVerifiedUser = async (req, res) => {
  try {
    let { name, email, phone, password, googleId } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    phone = phone.replace(/\s+/g, "").replace(/-/g, "");
    if (!phone.startsWith("+")) {
      if (phone.length === 10) phone = "+91" + phone;
      else if (phone.length === 12 && phone.startsWith("91"))
        phone = "+" + phone;
    }

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { phone: phone }],
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already registered" });
    }

    const newUser = await User.create({
      name,
      email,
      phone,
      password,
      googleId: googleId || null,
      isEmailVerified: true,
      isMobileVerified: true,
    });

    await Otp.deleteMany({ identifier: { $in: [email, phone] } });

    // --- ✅ Create Session for New User ---
    const token = generateToken(newUser._id);

    await Session.create({
      user: newUser._id,
      refreshToken: token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 Days
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers["user-agent"],
    });

    // ✅ FIXED: Set Cookie on Register so user doesn't log out immediately
    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: true, // Required for SameSite: None
      sameSite: "None", // Required for Cross-Site (Vercel -> Render)
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      token: token,
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
   5. LOGIN USER (Updated with Correct Session Schema)
====================================================== */
export const loginUser = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email/Phone and password required" });
    }

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

    // --- CHECK SESSION LIMIT ---
    const activeSessions = await Session.find({ user: user._id }); // Changed 'userId' to 'user' to match schema
    if (activeSessions.length >= 2) {
      return res
        .status(403)
        .json({ message: "Max sessions reached. Logout from another device." });
    }

    const token = generateToken(user._id);

    // --- ✅ FIXED SESSION CREATION ---
    await Session.create({
      user: user._id,
      refreshToken: token, // Using the JWT as the refresh token for DB storage
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 Days
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers["user-agent"],
    });

    // ✅ FIXED: Cross-Site Cookie Settings
    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: true, // Required for SameSite: None
      sameSite: "None", // Required for Cross-Site (Vercel -> Render)
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
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
   6. GOOGLE AUTH (Updated with Correct Session Schema)
====================================================== */
export const googleAuth = async (req, res) => {
  try {
    const { token, role } = req.body;

    const googleRes = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const { sub: googleId, name, email } = googleRes.data;

    let Model = User;
    if (role === "seller") Model = Seller;

    let user = await Model.findOne({ email });

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }

      // --- CHECK SESSION LIMIT ---
      const activeSessions = await Session.find({ user: user._id }); // Changed 'userId' to 'user'
      if (activeSessions.length >= 2) {
        return res
          .status(403)
          .json({ message: "Max sessions reached on other devices." });
      }

      const authToken = generateToken(user._id);

      // --- ✅ FIXED SESSION CREATION ---
      await Session.create({
        user: user._id,
        refreshToken: authToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 Days
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers["user-agent"],
      });

      // ✅ FIXED: Cross-Site Cookie Settings
      res.cookie("accessToken", authToken, {
        httpOnly: true,
        secure: true, // Required for SameSite: None
        sameSite: "None", // Required for Cross-Site (Vercel -> Render)
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.status(200).json({
        success: true,
        token: authToken,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
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
   7. FORGOT PASSWORD (For CUSTOMERS)
====================================================== */
export const sendForgotPasswordOTP = async (req, res) => {
  try {
    let { identifier } = req.body;

    if (!identifier) {
      return res.status(400).json({ message: "Email or Phone is required" });
    }

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

    const user = await User.findOne(query);
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetPasswordOtp = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

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

/* ======================================================
   8. LOGOUT USER (Cleans DB & Cookies)
====================================================== */
export const logoutUser = async (req, res) => {
  try {
    // 1. Get token from either cookie or headers
    const token =
      req.cookies.accessToken ||
      (req.headers.authorization && req.headers.authorization.split(" ")[1]);

    if (token) {
      // 2. Remove this specific session from MongoDB
      // Note: We use 'refreshToken' field because that's where we saved the token in login/googleAuth
      await Session.findOneAndDelete({ refreshToken: token });
    }

    // 3. Clear the HttpOnly Cookie
    // ✅ FIXED: Must match the settings used during creation
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: true, // Required to clear SameSite: None cookie
      sameSite: "None", // Required to clear Cross-Site cookie
    });

    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("LOGOUT ERROR 👉", error);
    res.status(500).json({ message: "Server error during logout" });
  }
};

/* ======================================================
   9. GET ME (Verify Session & Get Profile)
====================================================== */
export const getMe = async (req, res) => {
  try {
    // The 'protect' middleware already attached the user to req.user
    // and verified the session exists in the Session collection.
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
