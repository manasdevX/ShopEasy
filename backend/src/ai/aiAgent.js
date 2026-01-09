// Simple NLP + Rule-based AI Agent

export const analyzeIntent = (message) => {
  const text = message.toLowerCase();

  // Greeting
  if (/^(hi|hello|hey)/.test(text)) {
    return { type: "GREETING" };
  }

  // Price intent
  const priceMatch = text.match(/under\s*(\d+)/);
  if (priceMatch) {
    return {
      type: "PRICE_FILTER",
      maxPrice: Number(priceMatch[1]),
    };
  }

  // Category intent
  const categories = ["phone", "laptop", "shoe", "electronics", "clothing"];
  for (const cat of categories) {
    if (text.includes(cat)) {
      return { type: "CATEGORY", category: cat };
    }
  }

  // Default product search
  return { type: "SEARCH", query: text };
};
