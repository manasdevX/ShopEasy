import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller", // Links notification to a specific seller
      required: true,
    },
    type: {
      type: String,
      enum: ["order", "alert", "promotion", "system"], // Maps to icons (Box, AlertCircle, Tag)
      default: "system",
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    relatedId: {
      type: String, // Optional: Store Order ID or Product ID here for linking
    },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
