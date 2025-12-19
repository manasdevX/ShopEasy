import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  identifier: { type: String, required: true }, // Stores Email OR Phone
  otp: { type: String, required: true },
  type: { type: String, enum: ["email", "mobile"], required: true },
  createdAt: { type: Date, default: Date.now, index: { expires: 300 } }, // Auto-delete after 5 mins
});

export default mongoose.model("Otp", otpSchema);
