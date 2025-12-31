import Order from "../models/Order.js";
import Product from "../models/Product.js"; // ✅ Import Product Model
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
      // Note: itemsPrice, taxPrice, totalPrice are now calculated server-side for security
    } = req.body;

    if (orderItems && orderItems.length === 0) {
      return res.status(400).json({ message: "No order items" });
    }

    // 1. Fetch Real Products from DB (Security Check)
    const productIds = orderItems.map((item) => item.product || item._id);
    const dbProducts = await Product.find({ _id: { $in: productIds } });

    if (dbProducts.length !== orderItems.length) {
      return res
        .status(400)
        .json({ message: "One or more products not found" });
    }

    // Map for quick lookup { productId: productDoc }
    const productMap = {};
    dbProducts.forEach((p) => {
      productMap[p._id.toString()] = p;
    });

    // 2. Map Items with Real DB Data (Price & Seller)
    let calculatedItemsPrice = 0;

    const mappedOrderItems = orderItems.map((item) => {
      const productId = item.product || item._id;
      const realProduct = productMap[productId];

      if (!realProduct) {
        throw new Error(`Product not found: ${productId}`);
      }

      const itemTotal = realProduct.price * (item.qty || item.quantity);
      calculatedItemsPrice += itemTotal;

      return {
        ...item,
        name: realProduct.name, // Ensure name comes from DB
        image: realProduct.thumbnail, // Ensure image comes from DB (mapped to 'image' in schema)
        product: productId,
        qty: item.qty || item.quantity,
        price: realProduct.price, // ✅ Force DB Price
        seller: realProduct.seller, // ✅ Force DB Seller ID
        itemStatus: "Processing",
      };
    });

    // 3. Calculate Final Totals
    const taxPrice = 0; // or calculatedItemsPrice * 0.18
    const totalPrice = calculatedItemsPrice + taxPrice + shippingPrice;

    // 4. Create the Order
    const order = new Order({
      user: req.user._id,
      orderItems: mappedOrderItems,
      shippingAddress: {
        address: shippingAddress.address,
        city: shippingAddress.city,
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country || "India",
        phone: shippingAddress.phone, // Ensure phone is saved
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

    // 5. Trigger Notifications for Sellers
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

// @desc    Get orders for the logged-in Seller
// @route   GET /api/orders/seller-orders?status=...&search=...
// @access  Private (Seller)
export const getSellerOrders = async (req, res) => {
  try {
    const { status, search } = req.query;

    // 1. Find orders where at least one item belongs to this seller
    const orders = await Order.find({ "orderItems.seller": req.seller._id })
      .populate("user", "name email")
      .populate({
        path: "orderItems.product",
        select: "name thumbnail", // Ensure product details are available for UI
      })
      .sort({ createdAt: -1 });

    // 2. Filter items to ONLY show products belonging to this seller
    let sellerOrders = orders.map((order) => {
      const sellerItems = order.orderItems.filter(
        (item) => item.seller.toString() === req.seller._id.toString()
      );

      // Determine the "Seller Status" based on *their* items
      const itemStatuses = sellerItems.map((i) => i.itemStatus);
      let derivedStatus = "Processing"; // Default

      if (itemStatuses.every((s) => s === "Delivered"))
        derivedStatus = "Delivered";
      else if (itemStatuses.every((s) => s === "Cancelled"))
        derivedStatus = "Cancelled";
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
        status: derivedStatus, // Use derived status for filtering
      };
    });

    // 3. Apply Status Filter (Tabs)
    if (status && status !== "All") {
      sellerOrders = sellerOrders.filter((o) => o.status === status);
    }

    // 4. Apply Search Filter (Order ID or Customer Name)
    if (search) {
      const searchRegex = new RegExp(search, "i");
      sellerOrders = sellerOrders.filter(
        (o) =>
          searchRegex.test(o._id) || (o.user && searchRegex.test(o.user.name))
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

    // Find items belonging to this seller and update them
    order.orderItems.forEach((item) => {
      const itemSellerId = item.seller._id
        ? item.seller._id.toString()
        : item.seller.toString();

      const isOwner = itemSellerId === req.seller._id.toString();

      // If productId is provided, update specific item; otherwise update all items for this seller
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

    // Check Global Order Status (if all items from all sellers are delivered)
    const allDelivered = order.orderItems.every(
      (i) => i.itemStatus === "Delivered"
    );

    if (allDelivered) {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
      order.status = "Delivered";

      // ✅ NEW: Auto-Update Payment for COD on Delivery
      if (order.paymentMethod === "COD") {
        order.isPaid = true;
        order.paidAt = Date.now();
      }
    } else if (order.orderItems.some((i) => i.itemStatus === "Shipped")) {
      order.status = "Shipped";
    }

    await order.save();

    // Trigger Confirmation Notification for Seller
    await createNotification(
      req.seller._id,
      "alert", // Icon: Alert/Info
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
