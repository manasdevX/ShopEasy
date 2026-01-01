import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { createNotification } from "./notification.controller.js";

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
    const itemsToUpdate = []; // Queue for stock deduction

    const mappedOrderItems = orderItems.map((item) => {
      const productId = item.product || item._id;
      const realProduct = productMap[productId];
      const orderQty = item.qty || item.quantity;

      if (!realProduct) {
        throw new Error(`Product not found: ${productId}`);
      }

      // 🛑 STOCK CHECK: Prevent Overselling
      if (realProduct.stock < orderQty) {
        throw new Error(
          `Not enough stock for ${realProduct.name}. Only ${realProduct.stock} left.`
        );
      }

      const itemTotal = realProduct.price * orderQty;
      calculatedItemsPrice += itemTotal;

      // Add to queue for later update
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
      user: req.user._id, // ✅ Links order to user
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

    // 5. ✅ DEDUCT STOCK FROM DB
    for (const item of itemsToUpdate) {
      item.product.stock -= item.qty;
      await item.product.save();
    }

    // 6. Notify Sellers (DB & Socket)
    const sellersToNotify = [
      ...new Set(mappedOrderItems.map((item) => item.seller.toString())),
    ];

    for (const sellerId of sellersToNotify) {
      if (sellerId) {
        // A. Database Notification
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

        // B. ⚡ Real-time Socket Alert
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
    const order = await Order.findById(req.params.id)
      .populate("user", "name email")
      .populate({
        path: "orderItems.product",
        select: "name thumbnail price",
      });

    if (order) {
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
    const orders = await Order.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel Order (Customer)
// @route   PUT /api/orders/:id/cancel
// @access  Private (Customer)
export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Only allow cancellation if status is Processing or Pending
    if (order.status !== "Processing" && order.status !== "Pending") {
      return res
        .status(400)
        .json({ message: "Cannot cancel order at this stage" });
    }

    order.status = "Cancelled";
    order.orderItems.forEach((item) => (item.itemStatus = "Cancelled"));

    // 💰 REFUND LOGIC FOR CANCELLATION
    // If paid online -> Mark refunded.
    // If COD -> No refund needed (not paid yet).
    if (order.paymentMethod !== "COD" && order.isPaid) {
      order.isRefunded = true;
      order.refundedAt = Date.now();
    }

    await order.save();

    // ✅ RESTORE STOCK
    for (const item of order.orderItems) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock += item.qty;
        await product.save();
      }
    }

    // ✅ Notify Sellers (DB & Socket)
    const sellersToNotify = [
      ...new Set(order.orderItems.map((item) => item.seller.toString())),
    ];

    for (const sellerId of sellersToNotify) {
      // A. Database Notification
      await createNotification(
        sellerId,
        "alert",
        "Order Cancelled ❌",
        `Order #${order._id
          .toString()
          .slice(-6)
          .toUpperCase()} was cancelled by the customer.`,
        order._id
      );

      // B. ⚡ Real-time Socket Alert
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

// @desc    Request Return (Customer)
// @route   PUT /api/orders/:id/return
// @access  Private (Customer)
export const requestReturn = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "Delivered") {
      return res
        .status(400)
        .json({ message: "Order must be delivered to request return" });
    }

    order.status = "Return Requested";
    order.orderItems.forEach((item) => (item.itemStatus = "Return Requested"));

    await order.save();

    // ✅ Notify Sellers (DB & Socket)
    const sellersToNotify = [
      ...new Set(order.orderItems.map((item) => item.seller.toString())),
    ];

    for (const sellerId of sellersToNotify) {
      // A. Database Notification
      await createNotification(
        sellerId,
        "alert",
        "Return Requested ↩️",
        `Return requested for Order #${order._id
          .toString()
          .slice(-6)
          .toUpperCase()}`,
        order._id
      );

      // B. ⚡ Real-time Socket Alert
      if (req.io) {
        req.io.to(sellerId).emit("order_alert", {
          message: `Return Requested for Order #${order._id
            .toString()
            .slice(-6)
            .toUpperCase()}`,
          type: "info",
        });
      }
    }

    res.json({ message: "Return requested successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get orders for Seller
// @route   GET /api/orders/seller-orders
// @access  Private (Seller)
export const getSellerOrders = async (req, res) => {
  try {
    const { status, search } = req.query;

    const orders = await Order.find({ "orderItems.seller": req.seller._id })
      .populate("user", "name email")
      .populate({
        path: "orderItems.product",
        select: "name thumbnail",
      })
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
      else if (itemStatuses.every((s) => s === "Returned"))
        derivedStatus = "Returned";
      else if (itemStatuses.includes("Return Requested"))
        derivedStatus = "Return Requested"; // Explicitly handle this
      else if (itemStatuses.includes("Shipped")) derivedStatus = "Shipped";
      else derivedStatus = "Processing";

      return {
        _id: order._id,
        user: order.user,
        shippingAddress: order.shippingAddress,
        paymentMethod: order.paymentMethod,
        isPaid: order.isPaid,
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

    if (status && status !== "All") {
      sellerOrders = sellerOrders.filter((o) => o.status === status);
    }

    // ✅ Search Logic
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
// @route   PUT /api/orders/:id/status
// @access  Private (Seller)
export const updateOrderStatus = async (req, res) => {
  try {
    const { status, productId } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    let updatedCount = 0;

    order.orderItems.forEach((item) => {
      const itemSellerId = item.seller._id
        ? item.seller._id.toString()
        : item.seller.toString();

      const isOwner = itemSellerId === req.seller._id.toString();
      const isTarget = productId ? item.product.toString() === productId : true;

      if (isOwner && isTarget) {
        item.itemStatus = status;
        updatedCount++;

        if (status === "Delivered") {
          item.deliveredAt = Date.now();
        }
      }
    });

    if (updatedCount === 0) {
      return res
        .status(403)
        .json({ message: "Item not found or unauthorized" });
    }

    // Check Global Order Status
    const allDelivered = order.orderItems.every(
      (i) => i.itemStatus === "Delivered"
    );

    if (allDelivered) {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
      order.status = "Delivered";

      // ✅ Auto-Update Payment for COD
      if (order.paymentMethod === "COD") {
        order.isPaid = true;
        order.paidAt = Date.now();
      }
    } else if (order.orderItems.some((i) => i.itemStatus === "Shipped")) {
      order.status = "Shipped";
    }

    await order.save();

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

    res.json({
      message: "Order status updated successfully",
      status: status,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Handle Return Request (Approve/Reject)
// @route   PUT /api/orders/handle-return
// @access  Private (Seller)
// ✅ NEW: Handles Refund Logic, Stock Restoration & Status
export const handleReturnRequest = async (req, res) => {
  try {
    const { orderId, status } = req.body; // "Returned" (Approved) or "Delivered" (Rejected)
    const order = await Order.findById(orderId);

    if (!order) return res.status(404).json({ message: "Order not found" });

    // Validate Status (Only act if Return is actually requested)
    if (order.status !== "Return Requested") {
      return res
        .status(400)
        .json({ message: "Order is not waiting for return approval" });
    }

    let updatedCount = 0;

    // 1. Update Items
    order.orderItems.forEach((item) => {
      // Only update items belonging to this seller that are requested for return
      if (
        item.seller.toString() === req.seller._id.toString() &&
        item.itemStatus === "Return Requested"
      ) {
        item.itemStatus = status;
        updatedCount++;
      }
    });

    if (updatedCount === 0) {
      return res
        .status(400)
        .json({ message: "No pending return requests found." });
    }

    // 2. Check Global Status
    const allReturned = order.orderItems.every(
      (i) => i.itemStatus === "Returned"
    );
    if (allReturned) order.status = "Returned";

    // If rejected (set back to Delivered), check if all are Delivered
    const allDelivered = order.orderItems.every(
      (i) => i.itemStatus === "Delivered"
    );
    if (allDelivered) order.status = "Delivered";

    // 3. 💰 REFUND LOGIC & STOCK RESTORATION (If Approved)
    if (status === "Returned") {
      // Restore Stock
      for (const item of order.orderItems) {
        if (item.seller.toString() === req.seller._id.toString()) {
          const product = await Product.findById(item.product);
          if (product) {
            product.stock += item.qty;
            await product.save();
          }
        }
      }

      // Mark Refunded if Paid
      // (COD orders are considered 'paid' once delivered, so they are eligible for refund on return)
      if (order.isPaid && !order.isRefunded) {
        order.isRefunded = true;
        order.refundedAt = Date.now();
      }
    }

    await order.save();

    // 4. Notify Customer via Socket
    if (req.io) {
      req.io.to(order.user.toString()).emit("order_alert", {
        message: `Your return for Order #${order._id
          .toString()
          .slice(-6)
          .toUpperCase()} was ${
          status === "Returned" ? "APPROVED" : "REJECTED"
        }.`,
        type: status === "Returned" ? "success" : "error",
      });
    }

    // 5. Notify Seller (Self) via Socket (Optional confirmation)
    if (req.io) {
      req.io.to(req.seller._id.toString()).emit("order_alert", {
        message: `Return ${
          status === "Returned" ? "Approved" : "Rejected"
        } for Order #${order._id.toString().slice(-6).toUpperCase()}`,
        type: "success",
      });
    }

    res.json({
      message: `Return request ${
        status === "Returned" ? "Approved & Refund Processed" : "Rejected"
      }`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
