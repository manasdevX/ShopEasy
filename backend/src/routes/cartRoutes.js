import express from "express";
import Cart from "../models/Cart.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// @route   GET /api/cart
// @desc    Get logged-in user's cart
router.get("/", protect, async (req, res) => {
  try {
    // ✅ FIX: Changed 'userId' to 'user'
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product"
    );

    if (!cart) {
      return res.status(200).json({ items: [] });
    }

    res.json(cart);
  } catch (err) {
    console.error("GET CART ERROR:", err);
    res.status(500).send("Server Error");
  }
});

// @route   POST /api/cart/add
// @desc    Add item to cart
router.post("/add", protect, async (req, res) => {
  const { productId, quantity } = req.body;

  try {
    // ✅ FIX: Changed 'userId' to 'user'
    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = new Cart({
        user: req.user._id, // ✅ FIX: Must match Schema name 'user'
        items: [{ product: productId, quantity }],
      });
    } else {
      const itemIndex = cart.items.findIndex(
        (item) => item.product.toString() === productId
      );

      if (itemIndex > -1) {
        // Product exists? Add to quantity
        cart.items[itemIndex].quantity += quantity;
      } else {
        // New product? Push it
        cart.items.push({ product: productId, quantity });
      }
    }

    await cart.save();

    // Populate to return full details immediately
    const newCart = await Cart.findById(cart._id).populate("items.product");
    res.status(200).json(newCart);
  } catch (err) {
    console.error("ADD CART ERROR:", err); // This helps debug in terminal
    res.status(500).json({ message: "Server Error" });
  }
});

// @route   PUT /api/cart/update
// @desc    Update item quantity
router.put("/update", protect, async (req, res) => {
  const { productId, quantity } = req.body;

  try {
    // ✅ FIX: Changed 'userId' to 'user'
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex > -1) {
      if (quantity > 0) {
        cart.items[itemIndex].quantity = quantity;
      } else {
        cart.items.splice(itemIndex, 1);
      }
      await cart.save();
      const newCart = await Cart.findById(cart._id).populate("items.product");
      res.json(newCart);
    } else {
      res.status(404).json({ message: "Item not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// @route   DELETE /api/cart/remove/:productId
// @desc    Remove an item from cart
router.delete("/remove/:productId", protect, async (req, res) => {
  try {
    // ✅ FIX: Changed 'userId' to 'user'
    const cart = await Cart.findOne({ user: req.user._id });

    if (cart) {
      cart.items = cart.items.filter(
        (item) => item.product.toString() !== req.params.productId
      );
      await cart.save();
      const newCart = await Cart.findById(cart._id).populate("items.product");
      res.json(newCart);
    } else {
      res.status(404).json({ message: "Cart not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

export default router;
