import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

/**
 * Validates if the product details are consistent and generates new tags.
 * @param {Buffer} imageBuffer - The primary product image buffer.
 * @param {string} mimeType - The mime type of the image.
 * @param {string} title - The product title.
 * @param {string} category - The product category.
 * @param {string[]} userTags - The tags provided by the seller.
 * @param {string} description - The product description.
 * @returns {Promise<{ isValid: boolean, reason: string, generatedTags: string[] }>}
 */
export const validateProductImageAndTitle = async (imageBuffer, mimeType, title, category, userTags, description) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.warn("⚠️ AI Validation skipped: GEMINI_API_KEY not found.");
      return { isValid: true, reason: "", generatedTags: [] };
    }

    const imagePart = {
      inlineData: {
        data: imageBuffer.toString("base64"),
        mimeType: mimeType || "image/jpeg",
      },
    };

    const prompt = `
      You are an ecommerce catalog assistant. 
      Analyze the provided image and product details:
      - Title: "${title}"
      - Category: "${category}"
      - Description: "${description}"
      - User Tags: ${JSON.stringify(userTags)}
      
      Task 1: Verify if the image accurately represents the product title, category, and description.
      Task 2: Check if the description is relevant to the product. Flag it if it's absurdly unrelated, nonsensical, or spam.
      Task 3: Check if the provided tags are relevant.
      Task 4: Generate 5 additional, smart, common search tags for this product.
      
      Return the result strictly in JSON format:
      {
        "isValid": boolean,
        "reason": "short explanation if mismatch or absurdly unrelated details occur",
        "generatedTags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
      }
      
      Rules:
      - Set "isValid" to false ONLY if the image or description is completely unrelated to the title or category (e.g., shoe image for a phone, or description about cooking for a laptop).
      - If details are slightly off but the product is correct, keep "isValid" true but suggest improvements in the "reason".
    `;

    // Use the library's models.generateContent method as seen in llmClient.service.js
    const result = await genAI.models.generateContent({
      model: DEFAULT_MODEL,
      contents: [{
        role: "user",
        parts: [
          { text: prompt },
          imagePart
        ]
      }]
    });

    // Handle response structure (candidates[0].content.parts)
    const parts = result?.candidates?.[0]?.content?.parts || [];
    const text = parts.map(p => p.text).join("") || "";
    
    // Extract JSON from response (handling potential markdown formatting)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn("⚠️ AI returned non-JSON response:", text);
      return { isValid: true, reason: "", generatedTags: [] };
    }

    const data = JSON.parse(jsonMatch[0]);
    
    return {
      isValid: data.isValid !== false,
      reason: data.reason || "",
      generatedTags: Array.isArray(data.generatedTags) ? data.generatedTags : [],
    };
  } catch (error) {
    console.error("❌ AI Validation Error:", error.message);
    // Fallback: allow publishing if AI fails
    return { isValid: true, reason: "", generatedTags: [] };
  }
};
