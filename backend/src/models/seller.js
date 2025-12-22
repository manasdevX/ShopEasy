import mongoose from "mongoose";

const sellerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter your name"],
  },
  email: {
    type: String,
    required: [true, "Please enter your email"],
    unique: true,
  },
  password: {
    type: String,
    required: [true, "Please enter your password"],
    select: false,
  },
  phone: {
    type: String,
    required: [true, "Please enter your phone number"],
  },
  // 👇 NEW FIELDS ADDED
  businessName: {
    type: String,
    required: [true, "Please enter your business name"],
    unique: true,
  },
  businessType: {
    type: String,
    required: [true, "Please select business type"], // e.g. "Private Limited"
  },
  gstin: {
    type: String,
    unique: true,
    sparse: true,
  },
  address: {
    pincode: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
  },
  role: {
    type: String,
    default: "seller",
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Seller", sellerSchema);
