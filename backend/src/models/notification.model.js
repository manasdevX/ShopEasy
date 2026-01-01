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
      // "order": New orders, "alert": Cancellations/Returns, "info": General
      enum: ["order", "alert", "info", "promotion", "system"],
      default: "info",
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    // ✅ CHANGED: renamed from 'isRead' to 'read' to match Controller logic
    read: {
      type: Boolean,
      default: false,
    },
    // ✅ CHANGED: Type ObjectId allows for better DB querying later
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
