import express from "express";
import {
  addToCart,
  getUserCart,
  syncCart,
  updateCartItem,
  removeCartItem,
} from "../controllers/CartController.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

/* BASE ROUTE: /api/cart
  Defined in app.js via app.use("/api/cart", cartRoutes)
*/

// 1. Get Logged-in User's Cart
// GET /api/cart
router.get("/", protect, getUserCart);

// 2. Add Item to Cart
// POST /api/cart/add
router.post("/add", protect, addToCart);

// 3. Sync Local Cart (on Login)
// POST /api/cart/sync
router.post("/sync", protect, syncCart);

// 4. Update Item Quantity
// PUT /api/cart/:id (e.g., /api/cart/65b2f...)
router.put("/:id", protect, updateCartItem);

// 5. Remove Item
// DELETE /api/cart/:id
router.delete("/:id", protect, removeCartItem);

export default router;
