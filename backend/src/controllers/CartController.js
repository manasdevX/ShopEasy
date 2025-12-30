import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

// @desc    Add item to cart
// @route   POST /api/cart/add
// @access  Private
export const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const userId = req.user._id;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = await Cart.create({
        user: userId,
        items: [{ product: productId, quantity }],
      });
    } else {
      const itemIndex = cart.items.findIndex(
        (item) => item.product.toString() === productId
      );

      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += quantity;
      } else {
        cart.items.push({ product: productId, quantity });
      }
      await cart.save();
    }

    const totalItems = cart.items.reduce((acc, item) => acc + item.quantity, 0);

    res.status(200).json({
      success: true,
      message: `${product.name} added to cart!`,
      cartCount: totalItems,
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
    // ✅ CRITICAL FIX: Ensure 'seller' is included in population string
    // This allows the frontend to send the required seller ID to the Order API
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product",
      "name price images category stock seller mrp thumbnail"
    );

    if (!cart) {
      return res.json({ items: [] });
    }

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

// @desc    Sync LocalStorage cart with DB cart
// @route   POST /api/cart/sync
// @access  Private
export const syncCart = async (req, res) => {
  try {
    const { localItems } = req.body;
    const userId = req.user._id;

    if (!localItems || localItems.length === 0) {
      return getUserCart(req, res);
    }

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = await Cart.create({ user: userId, items: localItems });
    } else {
      for (const localItem of localItems) {
        const itemIndex = cart.items.findIndex(
          (item) => item.product.toString() === localItem.product
        );

        if (itemIndex > -1) {
          cart.items[itemIndex].quantity += localItem.quantity;
        } else {
          cart.items.push(localItem);
        }
      }
      await cart.save();
    }

    // ✅ CRITICAL FIX: Ensure 'seller' is populated here as well
    let populatedCart = await Cart.findOne({ user: userId }).populate(
      "items.product",
      "name price images category stock seller mrp thumbnail"
    );

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
        cart.items.splice(itemIndex, 1);
      }
      await cart.save();

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

    const totalItems = cart.items.reduce((acc, item) => acc + item.quantity, 0);

    res.json({ success: true, cart, cartCount: totalItems });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
