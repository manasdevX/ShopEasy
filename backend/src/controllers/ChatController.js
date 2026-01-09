import Product from "../models/Product.js";

/**
 * ShopEasy AI Agent (Safe, No APIs, No Hanging)
 */
export const handleChat = async (req, res) => {
  try {
    console.log("--- ShopEasy AI Agent ---");

    const message = req.body.message || "";
    const text = message.toLowerCase();

    // -------------------------
    // 1️⃣ Greeting intent
    // -------------------------
    if (/^(hi|hello|hey)/.test(text)) {
      return res.status(200).json({
        reply:
          "👋 Hi! I can help you find products, browse categories, or filter by price. What are you looking for?",
      });
    }

    // -------------------------
    // 2️⃣ Price filter intent
    // -------------------------
    const priceMatch = text.match(/under\s*(\d+)/);
    if (priceMatch) {
      const maxPrice = Number(priceMatch[1]);

      const products = await Product.find({ price: { $lte: maxPrice } })
        .limit(5)
        .select("_id name price");

      return res.status(200).json({
        reply: buildTextResponse(products),
      });
    }

    // -------------------------
    // 3️⃣ Category intent
    // -------------------------
    const categories = ["phone", "laptop", "shoe", "electronics", "clothing"];
    const category = categories.find((c) => text.includes(c));

    if (category) {
      const products = await Product.find({
        category: { $regex: category, $options: "i" },
      })
        .limit(5)
        .select("_id name price");

      return res.status(200).json({
        reply: buildTextResponse(products),
      });
    }

    // -------------------------
    // 4️⃣ Default search
    // -------------------------
    const products = await Product.find({
      name: { $regex: message, $options: "i" },
    })
      .limit(5)
      .select("_id name price");

    return res.status(200).json({
      reply: buildTextResponse(products),
    });

  } catch (err) {
    console.error("AI AGENT ERROR:", err);
    return res.status(500).json({
      reply: "Something went wrong. Please try again.",
    });
  }
};

// -------------------------
// Helper
// -------------------------
function buildTextResponse(products) {
  if (!products || products.length === 0) {
    return "😕 I couldn’t find matching products. Try another keyword.";
  }

  let reply = "Here are some products you might like:\n\n";

  products.forEach((p) => {
    reply += `• ${p.name} – ₹${p.price}\n`;
    reply += `👉 /product/${p._id}\n\n`;
  });

  reply += `Showing ${products.length} results based on your search.`;

  return reply;
}
