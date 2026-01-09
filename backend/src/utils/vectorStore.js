import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const generateEmbedding = async (text) => {
  try {
    if (!text || !text.trim()) return null;

    const result = await genAI.models.embedContent({
      model: "text-embedding-004",
      contents: [
        {
          role: "user",
          parts: [{ text }],
        },
      ],
    });

    // ✅ CORRECT EXTRACTION
    const vector = result?.embeddings?.[0]?.values;

    if (!vector || vector.length === 0) {
      return null;
    }

    return vector;
  } catch (err) {
    console.error("❌ Embedding Error:", err.message);
    return null;
  }
};
