import Product from "../models/Product.js";

export const handleChat = async (req, res) => {
  try {
    const message = req.body.message || "";
    const text = message.toLowerCase();

    // 1a. GREETINGS (Hello, Hey, Hi)
    if (/^(hi|hello|hey|greetings|hola)/.test(text)) {
      return res.status(200).json({
        reply: "👋 Hi! I'm your **ShopEasy AI Expert**. I can help you find items in **Electronics**, **Fashion**, **Sports**, and more. What can I find for you today?",
      });
    }

    // 1b. EXIT & THANKS (Bye, Thanks, Exit)
    // This matches: thanks, thank you, bye, goodbye, exit, see ya
    if (/^(bye|goodbye|exit|thanks|thank|tks|see ya)/.test(text)) {
      return res.status(200).json({
        reply: "😊 You're very welcome! I'm glad I could help. Feel free to come back if you need anything else from **ShopEasy**. Have a great day! 👋",
      });
    }

    // 2. DYNAMIC CATEGORY LIST
    const categories = [
      "Electronics", "Fashion", "Home", "Beauty", "Sports", "Kitchen-Accessories",
      "Groceries", "Sports-Accessories", "Smartphones", "Mobile-Accessories",
      "Mens-Watches", "Mens-Shoes", "Womens-Watches", "Womens-Dresses",
      "Womens-Shoes", "Womens-Bags", "Womens-Jewellery", "Sunglasses",
      "Mens-Shirts", "Tops", "Motorcycle", "Home-Decoration", "Fragrances",
      "Vechile", "Laptops", "Furniture", "Skin-Care", "Tablets",
    ];

    // Check if the user mentioned any of your specific categories
    const foundCategory = categories.find(
      (c) =>
        text.includes(c.toLowerCase().replace("-", " ")) ||
        text.includes(c.toLowerCase())
    );

    if (foundCategory) {
      // CHANGE: Split category name by "-" to search each word individually
      const parts = foundCategory.split("-");

      // CHANGE: Use $and to ensure the product matches ALL parts of the category name
      const query = {
        $and: parts.map((part) => ({
          category: { $regex: part, $options: "i" },
        })),
      };

      const products = await Product.find(query)
        .limit(10) // Categories usually need more results than a direct name search
        .select("_id name price");

      if (products.length > 0) {
        return res.status(200).json({
          reply: buildTextResponse(
            products,
            `Category: ${foundCategory.replace("-", " ")}` // Clean display: "Mens Shoes"
          ),
        });
      }
    }

    // 3. PRICE FILTER
    const priceMatch = text.match(/under\s*(\d+)/);
    if (priceMatch) {
      const maxPrice = Number(priceMatch[1]);
      const products = await Product.find({ price: { $lte: maxPrice } })
        .limit(5)
        .select("_id name price");
      return res.status(200).json({
        reply: buildTextResponse(products, `Budget under ₹${maxPrice}`),
      });
    }

    // 4. DEFAULT PRODUCT NAME SEARCH
    const products = await Product.find({
      name: { $regex: message, $options: "i" },
    })
      .limit(5)
      .select("_id name price");

    return res.status(200).json({
      reply: buildTextResponse(products, "Search Results"),
    });

  } catch (err) {
    console.error("AI AGENT ERROR:", err);
    return res.status(500).json({ reply: "Sorry, I encountered an error searching the catalog." });
  }
};

function buildTextResponse(products, context) {
  if (!products || products.length === 0) {
    return `😕 I couldn’t find any products in "${context}". Try another keyword!`;
  }
  let reply = `Found ${products.length} items in ${context}:\n\n`;
  products.forEach((p) => {
    reply += `• ${p.name} – ₹${p.price}\n`;
    reply += `/product/${p._id}\n\n`;
  });
  return reply;
}