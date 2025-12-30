import Order from "../models/Order.js";

// @desc    Create new order (Direct COD or General)
// @route   POST /api/orders
// @access  Private (Customer)
export const addOrderItems = async (req, res) => {
  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    } = req.body;

    if (orderItems && orderItems.length === 0) {
      return res.status(400).json({ message: "No order items" });
    }

    // ✅ FIX: Ensure every item includes the required 'seller' ID from the request
    // This prevents the "Path `seller` is required" validation error
    const mappedOrderItems = orderItems.map((item) => ({
      ...item,
      product: item.product || item._id, // Ensure product ID is mapped
      qty: item.qty || item.quantity, // Ensure qty is mapped
      seller: item.seller, // Explicitly mapping the seller ID
    }));

    const order = new Order({
      user: req.user._id, // Set by protect middleware
      orderItems: mappedOrderItems,
      // ✅ FIX: Ensure address fields match the schema requirements
      shippingAddress: {
        address: shippingAddress.address,
        city: shippingAddress.city,
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country || "India", // Default required field
      },
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      // Default statuses for new orders
      isPaid: paymentMethod === "COD" ? false : true,
      paidAt: paymentMethod === "COD" ? null : Date.now(),
      status: "Processing",
    });

    const createdOrder = await order.save();
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
// @route   GET /api/orders/seller-orders
// @access  Private (Seller)
export const getSellerOrders = async (req, res) => {
  try {
    // 1. Find orders where at least one item belongs to this seller
    const orders = await Order.find({ "orderItems.seller": req.seller._id })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    // 2. Filter items to ONLY show products belonging to this seller
    const sellerOrders = orders.map((order) => {
      const sellerItems = order.orderItems.filter(
        (item) => item.seller.toString() === req.seller._id.toString()
      );

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
        totalPrice: order.totalPrice,
        items: sellerItems,
        status: order.status,
      };
    });

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

    const item = order.orderItems.find((item) => {
      const itemSellerId = item.seller._id
        ? item.seller._id.toString()
        : item.seller.toString();

      const isOwner = itemSellerId === req.seller._id.toString();

      return productId
        ? isOwner && item.product.toString() === productId
        : isOwner;
    });

    if (item) {
      item.itemStatus = status;

      if (status === "Delivered") {
        item.deliveredAt = Date.now();
      }

      const allDelivered = order.orderItems.every(
        (i) => i.itemStatus === "Delivered"
      );

      if (allDelivered) {
        order.isDelivered = true;
        order.deliveredAt = Date.now();
        order.status = "Delivered";
      } else if (status === "Shipped") {
        order.status = "Shipped";
      }

      await order.save();
      res.json({
        message: "Order status updated successfully",
        itemStatus: item.itemStatus,
        orderStatus: order.status,
      });
    } else {
      res.status(403).json({
        message: "Item not found or unauthorized",
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
