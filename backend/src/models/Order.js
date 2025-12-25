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
        // === CRITICAL FIX: Reference the 'Seller' Model ===
        seller: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Seller", // Points to the 'sellers' collection
          required: true,
        },
        // Track status per item (useful if one order has items from multiple sellers)
        itemStatus: {
          type: String,
          default: "Processing", // Processing, Shipped, Delivered, Cancelled
        },
      },
    ],

    shippingAddress: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
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

    // 🔹 Pricing Breakdown
    itemsPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    taxPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },

    // 🔹 Payment Status
    isPaid: {
      type: Boolean,
      required: true,
      default: false,
    },
    paidAt: {
      type: Date,
    },

    // 🔹 Fulfillment Status (Global for the whole order)
    isDelivered: {
      type: Boolean,
      required: true,
      default: false,
    },
    deliveredAt: {
      type: Date,
    },
    status: {
      type: String,
      required: true,
      default: "Processing",
    },
  },
  {
    timestamps: true, // Auto-creates createdAt and updatedAt
  }
);

export default mongoose.model("Order", orderSchema);
