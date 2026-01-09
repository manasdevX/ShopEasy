export const buildResponse = (products, intent) => {
  if (intent.type === "GREETING") {
    return "👋 Hi! I can help you find products, deals, or categories. What are you looking for?";
  }

  if (!products || products.length === 0) {
    return "😕 I couldn’t find matching products. Try another category or keyword.";
  }

  let reply = "Here are some products you might like:\n\n";

  products.forEach((p) => {
    reply += `• **${p.name}** – ₹${p.price}\n`;
    reply += `  👉 /product/${p._id}\n\n`;
  });

  return reply;
};
