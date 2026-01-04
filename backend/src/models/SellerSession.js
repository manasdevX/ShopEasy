import mongoose from "mongoose";

const sellerSessionSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
    },
    refreshToken: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    userAgent: String,
    ipAddress: String,
  },
  { timestamps: true }
);

// Auto-delete expired sessions from MongoDB
sellerSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const SellerSession = mongoose.model("SellerSession", sellerSessionSchema);
export default SellerSession;
