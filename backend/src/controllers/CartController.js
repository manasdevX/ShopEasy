import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

// @desc    Add item to cart (Used by "Quick Add" button)
// @route   POST /api/cart/add
// @access  Private
export const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const userId = req.user._id;

    // 1. Validate Product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // 2. Find or Create Cart
    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = await Cart.create({
        user: userId,
        items: [{ product: productId, quantity }],
      });
    } else {
      // 3. Check if product exists in cart
      const itemIndex = cart.items.findIndex(
        (item) => item.product.toString() === productId
      );

      if (itemIndex > -1) {
        // Product exists, update quantity
        cart.items[itemIndex].quantity += quantity;
      } else {
        // Product does not exist, push new item
        cart.items.push({ product: productId, quantity });
      }
      await cart.save();
    }

    // 4. Calculate Total Count for Navbar Badge
    const totalItems = cart.items.reduce((acc, item) => acc + item.quantity, 0);

    res.status(200).json({
      success: true,
      message: `${product.name} added to cart!`,
      cartCount: totalItems, // Vital for instant Navbar update
      cart,
    });
  } catch (error) {
    console.error("Add to Cart Error:", error);
    res.status(500).json({ message: "Failed to add item to cart" });
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

    // Safety Check: Remove "Ghost Items" (products deleted from DB)
    const validItems = cart.items.filter((item) => item.product !== null);

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

// @desc    Sync/Merge LocalStorage cart with Database cart
// @route   POST /api/cart/sync
// @access  Private
export const syncCart = async (req, res) => {
  try {
    const { localItems } = req.body; // Expecting Array
    const userId = req.user._id;

    // 1. If no local items, just return existing DB cart
    if (!localItems || localItems.length === 0) {
      return getUserCart(req, res);
    }

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = await Cart.create({ user: userId, items: localItems });
    } else {
      // Merge Logic
      for (const localItem of localItems) {
        const itemIndex = cart.items.findIndex(
          (item) => item.product.toString() === localItem.product
        );

        if (itemIndex > -1) {
          // Sum quantities
          cart.items[itemIndex].quantity += localItem.quantity;
        } else {
          // Add new item
          cart.items.push(localItem);
        }
      }
      await cart.save();
    }

    // 2. Populate and Clean
    let populatedCart = await Cart.findOne({ user: userId }).populate(
      "items.product",
      "name price images category stock"
    );

    // 3. Safety Check: Remove ghost items
    const validItems = populatedCart.items.filter(
      (item) => item.product !== null
    );

    if (validItems.length !== populatedCart.items.length) {
      populatedCart.items = validItems;
      await populatedCart.save();
    }

    res.json(populatedCart);
  } catch (error) {
    console.error("Sync Error:", error);
    res.status(500).json({ message: "Failed to sync cart" });
  }
};

// @desc    Update item quantity
// @route   PUT /api/cart/:id
// @access  Private
export const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const productId = req.params.id;
    const userId = req.user._id;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex > -1) {
      if (quantity > 0) {
        cart.items[itemIndex].quantity = quantity;
      } else {
        // Remove if quantity is 0
        cart.items.splice(itemIndex, 1);
      }
      await cart.save();

      // Calculate new total for frontend
      const totalItems = cart.items.reduce(
        (acc, item) => acc + item.quantity,
        0
      );

      res.json({ success: true, cart, cartCount: totalItems });
    } else {
      res.status(404).json({ message: "Item not found in cart" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:id
// @access  Private
export const removeCartItem = async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.user._id;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );

    await cart.save();

    // Calculate new total for frontend
    const totalItems = cart.items.reduce((acc, item) => acc + item.quantity, 0);

    res.json({ success: true, cart, cartCount: totalItems });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
