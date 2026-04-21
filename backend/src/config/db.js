import mongoose from "mongoose";

const LOCAL_MONGO_URI = "mongodb://127.0.0.1:27017/shopeasy";
const MONGO_TIMEOUT_MS = Number(process.env.MONGO_TIMEOUT_MS || 12000);

mongoose.set("strictQuery", true);

const sanitizeMongoUri = (uri = "") =>
  uri.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:***@");

const getMongoUriCandidates = () => {
  const candidates = [
    process.env.MONGO_URI,
    process.env.MONGO_FALLBACK_URI,
    process.env.NODE_ENV === "production" ? null : LOCAL_MONGO_URI,
  ]
    .map((item) => item?.trim())
    .filter(Boolean);

  return [...new Set(candidates)];
};

const connectDB = async () => {
  const candidates = getMongoUriCandidates();

  if (!candidates.length) {
    throw new Error("No MongoDB URI configured. Set MONGO_URI in backend/.env");
  }

  const attemptErrors = [];

  for (const uri of candidates) {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: MONGO_TIMEOUT_MS,
        connectTimeoutMS: MONGO_TIMEOUT_MS,
      });

      console.log(`✅ MongoDB connected: ${sanitizeMongoUri(uri)}`);
      return true;
    } catch (error) {
      attemptErrors.push({ uri: sanitizeMongoUri(uri), message: error.message });
      console.error(
        `⚠️ MongoDB connection failed for ${sanitizeMongoUri(uri)} -> ${error.message}`
      );
    }
  }

  const formattedReasons = attemptErrors
    .map((entry) => `${entry.uri} => ${entry.message}`)
    .join(" | ");

  throw new Error(
    `MongoDB is unavailable. Check Atlas IP whitelist, DB user/password, and DNS. Attempts: ${formattedReasons}`
  );
};

export default connectDB;
