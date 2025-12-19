import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import axios from "axios";
import sendEmail from "../utils/sendEmail.js";
import sendSMS from "../utils/sendSMS.js"; // Ensure this file exists (from previous step)

/* =========================
   REGISTER USER (Sends Verification Codes)
========================= */
export const registerUser = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // 1️⃣ Validate input
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 2️⃣ Check existing user
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // 3️⃣ Create User (Initially Not Verified)
    // Note: Password hashing is handled by User model pre('save') hook
    const user = await User.create({
      name,
      email,
      phone,
      password,
      isEmailVerified: false,
      isMobileVerified: false,
    });

    // 4️⃣ Generate Verification Tokens
    // -- Email Token --
    const emailToken = crypto.randomBytes(32).toString("hex");
    user.emailVerificationToken = crypto
      .createHash("sha256")
      .update(emailToken)
      .digest("hex");
    user.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // -- Mobile OTP --
    const mobileOtp = Math.floor(100000 + Math.random() * 900000).toString();
    user.mobileOtp = crypto
      .createHash("sha256")
      .update(mobileOtp)
      .digest("hex");
    user.mobileOtpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save({ validateBeforeSave: false });

    // 5️⃣ Send Verification Messages
    // -- Send Email --
    const verifyUrl = `http://localhost:5173/verify-email/${emailToken}`;
    const emailMessage = `Welcome to ShopEasy! Click the link below to verify your email address:\n\n${verifyUrl}\n\nIf you did not create an account, please ignore this email.`;

    try {
      await sendEmail({
        email: user.email,
        subject: "ShopEasy Account Verification",
        message: emailMessage,
      });

      // -- Send SMS (Logged to console in Dev mode) --
      await sendSMS({
        phone: user.phone,
        message: `Your ShopEasy verification code is: ${mobileOtp}`,
      });

      res.status(201).json({
        success: true,
        message:
          "Registration successful! Please check your Email and Mobile for verification codes.",
        userId: user._id, // Frontend needs this for mobile verification
      });
    } catch (error) {
      console.error("Verification Send Error:", error);
      // Optional: Delete user if email fails so they can try again
      // await User.findByIdAndDelete(user._id);
      res.status(500).json({ message: "Could not send verification messages" });
    }
  } catch (error) {
    console.error("REGISTER ERROR 👉", error);
    res.status(500).json({ message: "Registration failed" });
  }
};

/* =========================
   VERIFY EMAIL LINK
========================= */
export const verifyEmail = async (req, res) => {
  try {
    const token = req.params.token;

    // Hash token to compare with DB
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired email token" });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({ message: "Email Verified Successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

/* =========================
   VERIFY MOBILE OTP
========================= */
export const verifyMobile = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({ message: "User ID and OTP are required" });
    }

    // Hash the incoming OTP
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.mobileOtp !== hashedOtp || user.mobileOtpExpire < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.isMobileVerified = true;
    user.mobileOtp = undefined;
    user.mobileOtpExpire = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({ message: "Mobile Number Verified Successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

/* =========================
   LOGIN USER (Checks Verification)
========================= */
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Validate input
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email/Phone and password required" });
    }

    // 2️⃣ Find user
    const user = await User.findOne({
      $or: [{ email }, { phone: email }],
    }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 3️⃣ Check Password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 4️⃣ Check Verification Status
    if (!user.isEmailVerified) {
      return res.status(403).json({
        message: "Email not verified. Please check your inbox.",
        type: "EMAIL_NOT_VERIFIED",
      });
    }

    if (!user.isMobileVerified) {
      return res.status(403).json({
        message: "Mobile not verified. Please verify your phone number.",
        type: "MOBILE_NOT_VERIFIED",
        userId: user._id, // Send back ID so frontend can show OTP input
      });
    }

    // 5️⃣ Success
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

/* =========================
   GOOGLE AUTH
========================= */
export const googleAuth = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "No Google token provided" });
    }

    // Fetch User Info using Axios
    const googleRes = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const { email, name, picture } = googleRes.data;

    let user = await User.findOne({ email });

    if (!user) {
      const dummyPassword = await bcrypt.hash(Math.random().toString(36), 12);
      user = await User.create({
        name,
        email,
        phone: null,
        avatar: picture,
        password: dummyPassword,
        isEmailVerified: true, // Google accounts are implicitly verified
        isMobileVerified: true, // Skip mobile verify for Google login (or force it later)
      });
    }

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("GOOGLE AUTH ERROR 👉", error);
    res.status(401).json({ message: "Google authentication failed" });
  }
};

/* =========================
   FORGOT PASSWORD - SEND OTP
========================= */
export const sendForgotPasswordOTP = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetPasswordOtp = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");

    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 mins

    await user.save({ validateBeforeSave: false });

    const message = `Your password reset OTP is: ${otp}\n\nIt is valid for 10 minutes.`;

    try {
      await sendEmail({
        email: user.email,
        subject: "Password Reset OTP",
        message,
      });
      res.status(200).json({ success: true, message: "OTP sent to email" });
    } catch (err) {
      user.resetPasswordOtp = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ message: "Email could not be sent" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

/* =========================
   FORGOT PASSWORD - RESET
========================= */
export const resetPasswordWithOTP = async (req, res) => {
  const { email, otp, password } = req.body;

  try {
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    const user = await User.findOne({
      email,
      resetPasswordOtp: hashedOtp,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.password = password; // Mongoose will hash this
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};
