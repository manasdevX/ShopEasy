import dotenv from "dotenv";
import mongoose from "mongoose";
import Session from "../src/models/Session.js";
import SellerSession from "../src/models/SellerSession.js";

dotenv.config();

const now = new Date();
const uri = process.env.MONGO_URI;
if (!uri) throw new Error("MONGO_URI not set");

await mongoose.connect(uri);

const prune = async (Model, field, limit) => {
  const grouped = await Model.aggregate([
    { $match: { expiresAt: { $gt: now } } },
    { $sort: { createdAt: -1 } },
    { $group: { _id: "$" + field, ids: { $push: "$_id" }, count: { $sum: 1 } } },
    { $match: { count: { $gt: limit } } },
  ]);

  let deleted = 0;
  for (const g of grouped) {
    const removeIds = g.ids.slice(limit);
    if (removeIds.length) {
      const res = await Model.deleteMany({ _id: { $in: removeIds } });
      deleted += res.deletedCount || 0;
    }
  }

  return { affectedAccounts: grouped.length, deleted };
};

const users = await prune(Session, "user", 2);
const sellers = await prune(SellerSession, "seller", 2);

console.log(JSON.stringify({ users, sellers }, null, 2));
await mongoose.disconnect();
