import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    refreshToken: {
      type: String,
      required: true,
    },
    ipAddress: {
      type: String, // Useful for security alerts (e.g., "New login from ...")
    },
    userAgent: {
      type: String, // Useful to show "Chrome on Windows" to the user
    },
    isValid: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // 🟢 Auto-delete exactly at the 'expiresAt' time
    },
  },
  { timestamps: true }
);

// This creates the model
const Session = mongoose.model("Session", sessionSchema);

// ✅ THIS IS THE CRITICAL LINE THAT WAS MISSING
export default Session;
