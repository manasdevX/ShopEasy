import Notification from "../models/notification.model.js";

// @desc    Get all notifications for logged-in seller
// @route   GET /api/notifications
// @access  Private (Seller)
export const getNotifications = async (req, res) => {
  try {
    const { filter } = req.query; // 'all', 'unread', 'orders'
    const sellerId = req.seller._id;

    let query = { recipient: sellerId };

    // Apply Filters based on UI tabs
    if (filter === "unread") {
      query.read = false; // ✅ MATCHED SCHEMA: 'read' instead of 'isRead'
    } else if (filter === "orders") {
      query.type = "order";
    }

    const notifications = await Notification.find(query).sort({
      createdAt: -1,
    });

    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

// @desc    Mark a single notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private (Seller)
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // Ensure seller owns this notification
    if (notification.recipient.toString() !== req.seller._id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    notification.read = true; // ✅ MATCHED SCHEMA
    await notification.save();

    res.status(200).json(notification);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Mark ALL notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private (Seller)
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.seller._id, read: false }, // ✅ MATCHED SCHEMA
      { $set: { read: true } }
    );
    res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// --- INTERNAL HELPER (Use this in Order Controller) ---
export const createNotification = async (
  recipientId,
  type,
  title,
  message,
  relatedId = null
) => {
  try {
    await Notification.create({
      recipient: recipientId,
      type,
      title,
      message,
      read: false, // ✅ MATCHED SCHEMA
      relatedId,
    });
  } catch (error) {
    console.error("Notification creation failed:", error);
  }
};
