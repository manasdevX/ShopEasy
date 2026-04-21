/**
 * Legacy adapter — maintains backward compatibility for any
 * code importing from the old aiAgent module.
 */
import {
  detectIntent,
  extractPriceBudget,
  extractSearchQuery,
} from "../services/chat/intent.service.js";

export const analyzeIntent = (message = "") => ({
  type: detectIntent(message),
  maxPrice: extractPriceBudget(message),
  query: extractSearchQuery(message),
});
