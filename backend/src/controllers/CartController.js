import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

// @desc    Sync/Merge LocalStorage cart with Database cart
// @route   POST /api/cart/sync
// @access  Private
export const syncCart = async (req, res) => {
  try {
    const { localItems } = req.body; // Array of { product: id, quantity: num }
    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: localItems });
    } else {
      // Merge logic: Update existing or add new
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
      await cart.save();
    }

    // Populate product details for the frontend
    const updatedCart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product",
      "name price thumbnail stock"
    );
    res.json(updatedCart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged in user cart
// @route   GET /api/cart
// @access  Private
export const getUserCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product",
      "name price thumbnail stock"
    );
    if (cart) {
      res.json(cart);
    } else {
      res.json({ items: [] });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
