import Order from "../models/Order.js";

// @desc    Create new order
// @route   POST /api/orders
// @access  Private (Customer)
export const addOrderItems = async (req, res) => {
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
    res.status(400);
    throw new Error("No order items");
  } else {
    // Note: 'user' comes from the 'protect' middleware
    const order = new Order({
      orderItems,
      user: req.user._id,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    });

    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
  }
};

// @desc    Get Order by ID
// @route   GET /api/orders/:id
// @access  Private (User/Seller)
export const getOrderById = async (req, res) => {
  // Populate user name/email and populate the seller info inside order items
  const order = await Order.findById(req.params.id)
    .populate("user", "name email")
    .populate({
      path: "orderItems.product",
      select: "name image",
    });

  if (order) {
    res.json(order);
  } else {
    res.status(404).json({ message: "Order not found" });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private (Customer)
export const getMyOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id });
  res.json(orders);
};

// @desc    Get orders for the logged-in Seller
// @route   GET /api/orders/seller-orders
// @access  Private (Seller)
export const getSellerOrders = async (req, res) => {
  try {
    // 1. Find orders where at least one item belongs to this seller
    const orders = await Order.find({ "orderItems.seller": req.seller._id })
      .populate("user", "id name")
      .sort({ createdAt: -1 });

    // 2. Filter the items to ONLY show products belonging to this seller
    // (So they don't see other sellers' items in the same order)
    const sellerOrders = orders.map((order) => {
      const sellerItems = order.orderItems.filter(
        (item) => item.seller.toString() === req.seller._id.toString()
      );

      // Return a clean structure for the dashboard
      return {
        _id: order._id,
        user: order.user,
        shippingAddress: order.shippingAddress,
        createdAt: order.createdAt,
        totalPrice: order.totalPrice, // Note: This is total order price, you might want to calculate specific item total on frontend
        items: sellerItems,
        status: order.status,
      };
    });

    res.json(sellerOrders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update Status of a specific Order Item (For Multi-Vendor)
// @route   PUT /api/orders/:id/status
// @access  Private (Seller)
export const updateOrderItemStatus = async (req, res) => {
  const { status, productId } = req.body; // e.g., "Shipped"

  const order = await Order.findById(req.params.id);

  if (order) {
    // Find the specific item in the order
    const item = order.orderItems.find(
      (i) =>
        i.product.toString() === productId &&
        i.seller.toString() === req.seller._id.toString()
    );

    if (item) {
      item.itemStatus = status;
      await order.save();
      res.json(order);
    } else {
      res.status(404).json({ message: "Item not found or not authorized" });
    }
  } else {
    res.status(404).json({ message: "Order not found" });
  }
};

// @desc    Update Order Item Status (Seller Only)
// @route   PUT /api/orders/:id/status
// @access  Private (Seller)
// @desc    Update Order Item Status (Seller Only)
// @route   PUT /api/orders/:id/status
// @access  Private (Seller)
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // SAFE COMPARISON: Handles both String and ObjectId formats
    const item = order.orderItems.find((item) => {
      const itemSellerId = item.seller._id
        ? item.seller._id.toString()
        : item.seller.toString();
      const currentSellerId = req.seller._id.toString();
      return itemSellerId === currentSellerId;
    });

    if (item) {
      item.itemStatus = status;
      if (status === "Delivered") {
        item.deliveredAt = Date.now();
      }

      await order.save();
      res.json({ message: "Order status updated", status: item.itemStatus });
    } else {
      res.status(404).json({ message: "Item not found or not authorized" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
