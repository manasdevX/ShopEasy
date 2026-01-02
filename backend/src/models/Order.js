import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    // The Customer who placed the order
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Array of items in the order
    orderItems: [
      {
        name: { type: String, required: true },
        qty: { type: Number, required: true },
        image: { type: String, required: true },
        price: { type: Number, required: true },
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        // Reference the 'Seller' Model
        seller: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Seller",
          required: true,
        },
        // Track status per item (with strict enum validation)
        itemStatus: {
          type: String,
          default: "Processing",
          enum: [
            "Processing",
            "Shipped",
            "Delivered",
            "Cancelled",
            "Return Requested",
            "Return Initiated", // ✅ Correctly Added
            "Returned",
          ],
        },
      },
    ],

    shippingAddress: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
      phone: { type: String, required: true },
    },

    paymentMethod: {
      type: String,
      required: true,
    },

    paymentResult: {
      id: { type: String },
      status: { type: String },
      update_time: { type: String },
      email_address: { type: String },
    },

    itemsPrice: { type: Number, required: true, default: 0.0 },
    taxPrice: { type: Number, required: true, default: 0.0 },
    shippingPrice: { type: Number, required: true, default: 0.0 },
    totalPrice: { type: Number, required: true, default: 0.0 },

    isPaid: { type: Boolean, required: true, default: false },
    paidAt: { type: Date },

    // ✅ Fields for tracking refunds
    isRefunded: {
      type: Boolean,
      default: false,
    },
    refundedAt: {
      type: Date,
    },

    isDelivered: { type: Boolean, required: true, default: false },
    deliveredAt: { type: Date },

    // Global Order Status (with strict enum validation)
    status: {
      type: String,
      required: true,
      default: "Processing",
      enum: [
        "Processing",
        "Shipped",
        "Delivered",
        "Cancelled",
        "Return Requested",
        "Return Initiated", // ✅ Correctly Added
        "Returned",
      ],
    },
  },
  {
    timestamps: true,
  }
);

// ✅ FIXED EXPORT STATEMENT
export default mongoose.model("Order", orderSchema);
