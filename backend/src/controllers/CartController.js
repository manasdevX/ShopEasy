import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

// @desc    Sync/Merge LocalStorage cart with Database cart
// @route   POST /api/cart/sync
// @access  Private
export const syncCart = async (req, res) => {
  try {
    const { localItems } = req.body; // Expecting Array
    const userId = req.user._id;

    // 1. Validation: If no local items, just return the existing DB cart
    if (!localItems || localItems.length === 0) {
      return getUserCart(req, res); // Reuse the get function
    }

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      // Create new cart if none exists
      cart = await Cart.create({ user: userId, items: localItems });
    } else {
      // Merge logic
      for (const localItem of localItems) {
        const itemIndex = cart.items.findIndex(
          (item) => item.product.toString() === localItem.product
        );

        if (itemIndex > -1) {
          // ✅ FIX: Sum quantities instead of overwriting
          cart.items[itemIndex].quantity += localItem.quantity;
        } else {
          // Add new item
          cart.items.push(localItem);
        }
      }
      await cart.save();
    }

    // 2. Populate and Clean
    // We populate to get product details, but also to check if products still exist
    let populatedCart = await Cart.findOne({ user: userId }).populate(
      "items.product",
      "name price images category stock" // Ensure field names match your Product model
    );

    // 3. Safety Check: Remove items where product is null (deleted from DB)
    const validItems = populatedCart.items.filter(
      (item) => item.product !== null
    );

    if (validItems.length !== populatedCart.items.length) {
      populatedCart.items = validItems;
      await populatedCart.save(); // Update DB to remove ghost items
    }

    res.json(populatedCart);
  } catch (error) {
    console.error("Sync Error:", error);
    res.status(500).json({ message: "Failed to sync cart" });
  }
};

// @desc    Get logged in user cart
// @route   GET /api/cart
// @access  Private
export const getUserCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product",
      "name price images category stock"
    );

    if (!cart) {
      return res.json({ items: [] });
    }

    // Safety Check for Deleted Products (Ghost Items)
    // If a product was deleted by admin, it will be null here. Filter it out.
    const validItems = cart.items.filter((item) => item.product !== null);

    // If we found ghost items, update the DB to clean them up
    if (validItems.length !== cart.items.length) {
      cart.items = validItems;
      await cart.save();
    }

    res.json(cart);
  } catch (error) {
    console.error("Get Cart Error:", error);
    res.status(500).json({ message: "Failed to fetch cart" });
  }
};
