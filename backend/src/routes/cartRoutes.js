const express = require("express");
const router = express.Router();
const Cart = require("../models/Cart");
const { verifyToken } = require("../middleware/auth"); // Your auth middleware

// @route   GET /api/cart
// @desc    Get logged-in user's cart
router.get("/", verifyToken, async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user.id }).populate(
      "items.product"
    );
    if (!cart) {
      return res.status(200).json({ items: [] });
    }
    res.json(cart);
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

// @route   POST /api/cart/sync
// @desc    Sync local cart with database (Crucial for Login/Update)
router.post("/sync", verifyToken, async (req, res) => {
  const { localItems } = req.body; // Array of { product: id, quantity: num }

  try {
    let cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
      cart = new Cart({ userId: req.user.id, items: localItems });
    } else {
      // Merge Logic: If item exists, update qty; if not, add new
      localItems.forEach((localItem) => {
        const itemIndex = cart.items.findIndex(
          (item) => item.product.toString() === localItem.product
        );

        if (itemIndex > -1) {
          // If syncing from a "Merge" at login, you might want: + localItem.quantity
          // If syncing from a "Quantity Change" in Cart.jsx, you want: = localItem.quantity
          cart.items[itemIndex].quantity = localItem.quantity;
        } else {
          cart.items.push(localItem);
        }
      });
    }

    await cart.save();
    res.status(200).json(cart);
  } catch (err) {
    res.status(500).json({ message: "Sync failed" });
  }
});

// @route   DELETE /api/cart/:productId
// @desc    Remove an item from cart
router.delete("/:productId", verifyToken, async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user.id });
    if (cart) {
      cart.items = cart.items.filter(
        (item) => item.product.toString() !== req.params.productId
      );
      await cart.save();
    }
    res.json({ message: "Item removed" });
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

// @route   POST /api/cart/clear
// @desc    Clear cart after successful order
router.post("/clear", verifyToken, async (req, res) => {
  try {
    await Cart.findOneAndDelete({ userId: req.user.id });
    res.json({ message: "Cart cleared" });
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

module.exports = router;
