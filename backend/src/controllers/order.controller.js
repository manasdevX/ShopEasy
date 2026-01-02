import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { createNotification } from "./notification.controller.js";
import sendEmail from "../utils/emailHelper.js";
import redisClient from "../config/redis.js"; // <--- IMPORT REDIS

/**
 * Helper: Clear Order Caches
 * Clears the user's order list cache and the specific order detail cache.
 */
const clearOrderCache = async (userId, orderId = null) => {
  try {
    if (userId) {
      await redisClient.del(`orders:user:${userId}`);
    }
    if (orderId) {
      await redisClient.del(`order:detail:${orderId}`);
    }
    console.log(`🧹 Order Cache Cleared for User: ${userId}`);
  } catch (error) {
    console.error("Cache Clear Error:", error);
  }
};

// @desc    Create new order (Direct COD or General)
// @route   POST /api/orders
// @access  Private (Customer)
export const addOrderItems = async (req, res) => {
  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      shippingPrice = 0,
    } = req.body;

    if (orderItems && orderItems.length === 0) {
      return res.status(400).json({ message: "No order items" });
    }

    // 1. Fetch Real Products from DB
    const productIds = orderItems.map((item) => item.product || item._id);
    const dbProducts = await Product.find({ _id: { $in: productIds } });

    if (dbProducts.length !== orderItems.length) {
      return res
        .status(400)
        .json({ message: "One or more products not found" });
    }

    const productMap = {};
    dbProducts.forEach((p) => {
      productMap[p._id.toString()] = p;
    });

    // 2. Map Items & CHECK STOCK
    let calculatedItemsPrice = 0;
    const itemsToUpdate = [];

    const mappedOrderItems = orderItems.map((item) => {
      const productId = item.product || item._id;
      const realProduct = productMap[productId];
      const orderQty = item.qty || item.quantity;

      if (!realProduct) {
        throw new Error(`Product not found: ${productId}`);
      }

      if (realProduct.stock < orderQty) {
        throw new Error(
          `Not enough stock for ${realProduct.name}. Only ${realProduct.stock} left.`
        );
      }

      const itemTotal = realProduct.price * orderQty;
      calculatedItemsPrice += itemTotal;

      itemsToUpdate.push({ product: realProduct, qty: orderQty });

      return {
        ...item,
        name: realProduct.name,
        image: realProduct.thumbnail,
        product: productId,
        qty: orderQty,
        price: realProduct.price,
        seller: realProduct.seller,
        itemStatus: "Processing",
      };
    });

    // 3. Calculate Totals
    const taxPrice = 0;
    const totalPrice = calculatedItemsPrice + taxPrice + shippingPrice;

    // 4. Create Order
    const order = new Order({
      user: req.user._id,
      orderItems: mappedOrderItems,
      shippingAddress: {
        address: shippingAddress.address,
        city: shippingAddress.city,
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country || "India",
        phone: shippingAddress.phone,
      },
      paymentMethod,
      itemsPrice: calculatedItemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      isPaid: paymentMethod === "COD" ? false : true,
      paidAt: paymentMethod === "COD" ? null : Date.now(),
      status: "Processing",
    });

    const createdOrder = await order.save();

    // 5. ✅ DEDUCT STOCK
    for (const item of itemsToUpdate) {
      item.product.stock -= item.qty;
      await item.product.save();
    }

    // ✅ INVALIDATE REDIS CACHE (Clear user's order list)
    await clearOrderCache(req.user._id);

    // 6. ✅ SEND ORDER CONFIRMATION EMAIL
    try {
      const orderItemsHTML = mappedOrderItems
        .map(
          (item) => `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">
              <img src="${item.image}" alt="${
            item.name
          }" width="50" style="border-radius: 5px; display: block;">
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-size: 14px;">
              ${item.name} <br>
              <span style="font-size: 12px; color: #777;">Qty: ${
                item.qty
              }</span>
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">
              ₹${(item.price * item.qty).toLocaleString()}
            </td>
          </tr>`
        )
        .join("");

      const emailMessage = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #2563eb; padding: 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Order Confirmed!</h1>
          </div>
          <div style="padding: 20px;">
            <p>Hi <strong>${req.user.name}</strong>,</p>
            <p>Thank you for shopping with us! We have received your order.</p>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Order ID:</strong> ${
                createdOrder._id
              }</p>
              <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${paymentMethod}</p>
              <p style="margin: 5px 0; font-size: 18px; color: #2563eb;"><strong>Total: ₹${totalPrice.toLocaleString()}</strong></p>
            </div>
            <table style="width: 100%; border-collapse: collapse; text-align: left;">
              ${orderItemsHTML}
            </table>
          </div>
        </div>`;

      await sendEmail({
        email: req.user.email,
        subject: `Order Confirmation - ${createdOrder._id}`,
        message: emailMessage,
      });
    } catch (emailError) {
      console.error("Email failed:", emailError);
    }

    // 7. Notify Sellers (DB & Socket)
    const sellersToNotify = [
      ...new Set(mappedOrderItems.map((item) => item.seller.toString())),
    ];

    for (const sellerId of sellersToNotify) {
      if (sellerId) {
        await createNotification(
          sellerId,
          "order",
          "New Order Received! 📦",
          `You have a new order #${createdOrder._id
            .toString()
            .slice(-6)
            .toUpperCase()} valued at ₹${calculatedItemsPrice}`,
          createdOrder._id
        );

        // ⚡ Real-time Socket Alert
        if (req.io) {
          req.io.to(sellerId).emit("order_alert", {
            message: `New Order #${createdOrder._id
              .toString()
              .slice(-6)
              .toUpperCase()} Received!`,
            type: "success",
          });
        }
      }
    }

    res.status(201).json(createdOrder);
  } catch (error) {
    console.error("ORDER CREATE ERROR:", error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get Order by ID
// @route   GET /api/orders/:id
// @access  Private (User/Seller)
export const getOrderById = async (req, res) => {
  try {
    const cacheKey = `order:detail:${req.params.id}`;

    // 1. Check Redis
    const cachedOrder = await redisClient.get(cacheKey);
    if (cachedOrder) {
      return res.json(JSON.parse(cachedOrder));
    }

    const order = await Order.findById(req.params.id)
      .populate("user", "name email")
      .populate({
        path: "orderItems.product",
        select: "name thumbnail price",
      });

    if (order) {
      // 2. Save to Redis (TTL: 1 hour)
      await redisClient.setEx(cacheKey, 3600, JSON.stringify(order));
      res.json(order);
    } else {
      res.status(404).json({ message: "Order not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private (Customer)
export const getMyOrders = async (req, res) => {
  try {
    const userId = req.user._id;
    const cacheKey = `orders:user:${userId}`;

    // 1. Check Redis
    const cachedOrders = await redisClient.get(cacheKey);
    if (cachedOrders) {
      console.log("⚡ Serving My Orders from Redis");
      return res.json(JSON.parse(cachedOrders));
    }

    // 2. Fetch from DB
    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });

    // 3. Save to Redis
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(orders));

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel Order (Customer) - Restores Stock & Refunds
export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: "Order not found" });

    if (
      order.status !== "Processing" &&
      order.status !== "Pending" &&
      order.status !== "Shipped"
    ) {
      return res
        .status(400)
        .json({ message: "Cannot cancel order at this stage" });
    }

    order.status = "Cancelled";
    order.orderItems.forEach((item) => (item.itemStatus = "Cancelled"));

    if (order.paymentMethod !== "COD" && order.isPaid) {
      order.isRefunded = true;
      order.refundedAt = Date.now();
    }

    for (const item of order.orderItems) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock += item.qty;
        await product.save();
      }
    }

    await order.save();

    // ✅ INVALIDATE REDIS CACHE
    await clearOrderCache(order.user, order._id);

    const sellersToNotify = [
      ...new Set(order.orderItems.map((item) => item.seller.toString())),
    ];
    for (const sellerId of sellersToNotify) {
      await createNotification(
        sellerId,
        "alert",
        "Order Cancelled ❌",
        `Order #${order._id.toString().slice(-6).toUpperCase()} cancelled.`,
        order._id
      );
      if (req.io) {
        req.io.to(sellerId).emit("order_alert", {
          message: `Order #${order._id
            .toString()
            .slice(-6)
            .toUpperCase()} Cancelled!`,
          type: "error",
        });
      }
    }

    res.json({ message: "Order cancelled successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Request Return (Customer) - AUTO APPROVES
export const requestReturn = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.status !== "Delivered")
      return res
        .status(400)
        .json({ message: "Order must be delivered to return" });

    const deliveredDate = new Date(order.updatedAt);
    const diffDays = Math.ceil(
      Math.abs(new Date() - deliveredDate) / (1000 * 60 * 60 * 24)
    );

    if (diffDays > 14)
      return res
        .status(400)
        .json({ message: "Return period (14 days) expired." });

    order.status = "Return Initiated";
    order.orderItems.forEach((item) => (item.itemStatus = "Return Initiated"));

    for (const item of order.orderItems) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock += item.qty;
        await product.save();
      }
    }

    if (order.isPaid && !order.isRefunded) {
      order.isRefunded = true;
      order.refundedAt = Date.now();
    }

    await order.save();

    // ✅ INVALIDATE REDIS CACHE
    await clearOrderCache(order.user, order._id);

    const sellersToNotify = [
      ...new Set(order.orderItems.map((item) => item.seller.toString())),
    ];
    for (const sellerId of sellersToNotify) {
      await createNotification(
        sellerId,
        "alert",
        "Return Initiated ↩️",
        `Order #${order._id.toString().slice(-6).toUpperCase()} returned.`,
        order._id
      );
      if (req.io) {
        req.io.to(sellerId).emit("order_alert", {
          message: `Return for Order #${order._id
            .toString()
            .slice(-6)
            .toUpperCase()} Auto-Approved`,
          type: "info",
        });
      }
    }

    res.json({ message: "Return processed successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get orders for the logged-in Seller
export const getSellerOrders = async (req, res) => {
  try {
    const { status, search } = req.query;

    const orders = await Order.find({ "orderItems.seller": req.seller._id })
      .populate("user", "name email")
      .populate({ path: "orderItems.product", select: "name thumbnail" })
      .sort({ createdAt: -1 });

    let sellerOrders = orders.map((order) => {
      const sellerItems = order.orderItems.filter(
        (item) => item.seller.toString() === req.seller._id.toString()
      );

      const itemStatuses = sellerItems.map((i) => i.itemStatus);
      let derivedStatus = "Processing";

      if (itemStatuses.every((s) => s === "Delivered"))
        derivedStatus = "Delivered";
      else if (itemStatuses.every((s) => s === "Cancelled"))
        derivedStatus = "Cancelled";
      else if (
        itemStatuses.every((s) => s === "Returned" || s === "Return Initiated")
      )
        derivedStatus = "Return Initiated";
      else if (itemStatuses.includes("Shipped")) derivedStatus = "Shipped";

      return {
        _id: order._id,
        user: order.user,
        shippingAddress: order.shippingAddress,
        paymentMethod: order.paymentMethod,
        isPaid: order.isPaid,
        isRefunded: order.isRefunded,
        createdAt: order.createdAt,
        sellerTotal: sellerItems.reduce(
          (acc, item) => acc + item.price * item.qty,
          0
        ),
        totalItems: sellerItems.length,
        items: sellerItems,
        status: derivedStatus,
      };
    });

    if (status && status !== "All")
      sellerOrders = sellerOrders.filter((o) => o.status === status);

    if (search) {
      const searchRegex = new RegExp(search, "i");
      sellerOrders = sellerOrders.filter(
        (o) =>
          searchRegex.test(o._id) ||
          (o.user && searchRegex.test(o.user.name)) ||
          o.items.some((item) => searchRegex.test(item.name))
      );
    }

    res.json(sellerOrders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update Order Item Status (Seller Only)
export const updateOrderStatus = async (req, res) => {
  try {
    const { status, productId } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: "Order not found" });

    let updatedCount = 0;
    order.orderItems.forEach((item) => {
      const itemSellerId = item.seller._id
        ? item.seller._id.toString()
        : item.seller.toString();
      if (
        itemSellerId === req.seller._id.toString() &&
        (!productId || item.product.toString() === productId)
      ) {
        item.itemStatus = status;
        updatedCount++;
        if (status === "Delivered") item.deliveredAt = Date.now();
      }
    });

    if (updatedCount === 0)
      return res.status(403).json({ message: "Unauthorized" });

    const allDelivered = order.orderItems.every(
      (i) => i.itemStatus === "Delivered"
    );
    if (allDelivered) {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
      order.status = "Delivered";
      if (order.paymentMethod === "COD") {
        order.isPaid = true;
        order.paidAt = Date.now();
      }
    } else if (order.orderItems.some((i) => i.itemStatus === "Shipped")) {
      order.status = "Shipped";
    }

    await order.save();

    // ✅ INVALIDATE REDIS CACHE
    await clearOrderCache(order.user, order._id);

    await createNotification(
      req.seller._id,
      "alert",
      "Order Updated",
      `Order #${order._id
        .toString()
        .slice(-6)
        .toUpperCase()} marked as ${status}`,
      order._id
    );

    res.json({ message: "Order status updated successfully", status });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
