import Product from "../models/Product.js";

/**
 * Attempt to atomically decrement stock for each item.
 * items: [{ product: <id>, qty: <number> }]
 * On partial failure, previously decremented items are rolled back.
 */
export const reserveStock = async (items) => {
  const succeeded = [];
  try {
    for (const it of items) {
      const prodId = it.product?._id || it.product;
      const qty = Number(it.qty || it.quantity || 0);

      const updated = await Product.findOneAndUpdate(
        { _id: prodId, stock: { $gte: qty } },
        [
          { $set: { stock: { $subtract: ["$stock", qty] } } },
          // After stage 1, $stock is already the new value — set isAvailable false when it reaches 0
          { $set: { isAvailable: { $gt: ["$stock", 0] } } },
        ],
        { new: true }
      );

      if (!updated) {
        // rollback previous successful decrements
        for (const s of succeeded) {
          try {
            await Product.findByIdAndUpdate(s.product, { $inc: { stock: s.qty } });
          } catch (err) {
            // best-effort rollback; log and continue
            console.error("Stock rollback failed for", s.product, err?.message || err);
          }
        }
        return { success: false, failedProduct: prodId };
      }

      succeeded.push({ product: prodId, qty });
    }

    return { success: true, updated: succeeded };
  } catch (err) {
    // rollback on unexpected error
    for (const s of succeeded) {
      try {
        await Product.findByIdAndUpdate(s.product, { $inc: { stock: s.qty } });
      } catch (e) {
        console.error("Stock rollback failed during exception for", s.product, e?.message || e);
      }
    }
    throw err;
  }
};

export const releaseStock = async (items) => {
  for (const it of items) {
    const prodId = it.product?._id || it.product;
    const qty = Number(it.qty || it.quantity || 0);
    try {
      await Product.findByIdAndUpdate(prodId, [
        { $set: { stock: { $add: ["$stock", qty] } } },
        { $set: { isAvailable: { $gt: ["$stock", 0] } } },
      ]);
    } catch (err) {
      console.error("Failed to release stock for", prodId, err?.message || err);
    }
  }
};

export default { reserveStock, releaseStock };
