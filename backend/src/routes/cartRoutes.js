import express from "express";
import Cart from "../models/Cart.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// @route   GET /api/cart
// @desc    Get logged-in user's cart
router.get("/", verifyToken, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id }).populate(
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
// @desc    Sync local cart with database
router.post("/sync", verifyToken, async (req, res) => {
  const { localItems } = req.body;

  try {
    let cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
      cart = new Cart({ userId: req.user.id, items: localItems });
    } else {
      localItems.forEach((localItem) => {
        const itemIndex = cart.items.findIndex(
          (item) => item.product.toString() === localItem.product
        );

        if (itemIndex > -1) {
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
    const cart = await Cart.findOne({ userId: req.user.id });

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

export default router;
