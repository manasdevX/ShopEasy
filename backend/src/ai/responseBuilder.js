/**
 * Legacy adapter — maintains backward compatibility for any
 * code importing from the old responseBuilder module.
 */
export const buildResponse = (products = [], intent = {}) => {
  if (intent.type === "GENERAL") {
    return "I can help with product recommendations, order tracking, and support questions.";
  }

  if (!products.length) {
    return "I could not find matching products yet. Try a different keyword or budget.";
  }

  const preview = products
    .slice(0, 3)
    .map((product) => `${product.name} (₹${product.price})`)
    .join(" | ");

  return `Top matches: ${preview}`;
};
