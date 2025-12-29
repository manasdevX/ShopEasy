import mongoose from "mongoose";
import dotenv from "dotenv";
import axios from "axios";
import Product from "./src/models/Product.js";
import Seller from "./src/models/seller.js";

dotenv.config();

const TARGET_COUNT = 2000; // How many products you want

const seedMultiplier = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🔥 MongoDB Connected");

    const sellers = await Seller.find({});
    if (!sellers.length) {
      console.error("❌ No sellers found.");
      process.exit(1);
    }

    console.log("⏳ Fetching base data from DummyJSON...");
    const { data } = await axios.get("https://dummyjson.com/products?limit=0");
    const baseProducts = data.products;

    console.log(
      `📦 Got ${baseProducts.length} base products. Multiplying to reach ${TARGET_COUNT}...`
    );

    const finalProducts = [];

    // We loop until we reach the target count
    while (finalProducts.length < TARGET_COUNT) {
      for (const item of baseProducts) {
        if (finalProducts.length >= TARGET_COUNT) break;

        // Assign to random seller
        const seller = sellers[Math.floor(Math.random() * sellers.length)];

        // Randomize price slightly (Variation between 90% and 110% of original)
        const variance = Math.random() * 0.4 + 0.8;
        const price = Math.floor(item.price * 84 * variance);
        const discount = item.discountPercentage || 10;
        const mrp = Math.floor(price * (100 / (100 - discount)));

        // Create a unique name variation
        const variations = [
          "Pro",
          "Max",
          "Lite",
          "2024",
          "Refurbished",
          "Limited Edition",
          "Deal",
        ];
        const suffix =
          variations[Math.floor(Math.random() * variations.length)];
        const uniqueName = `${item.title} ${suffix}`;

        finalProducts.push({
          seller: seller._id,
          name: uniqueName, // Unique name
          description: item.description,
          price: price, // Unique price
          mrp: mrp,
          category: item.category,
          brand: item.brand || "Generic",
          stock: Math.floor(Math.random() * 100),
          countInStock: 50,
          thumbnail: item.thumbnail,
          images: item.images,
          tags: [
            item.category,
            item.brand,
            ...item.title.toLowerCase().split(" "),
          ],
          rating: (Math.random() * 2 + 3).toFixed(1), // Random rating 3.0 - 5.0
          numReviews: Math.floor(Math.random() * 500),
          isFeatured: Math.random() > 0.9,
          isBestSeller: Math.random() > 0.9,
        });
      }
    }

    await Product.deleteMany({});
    console.log("🧹 Old products cleared");

    // Bulk insert in chunks to prevent memory issues
    const CHUNK_SIZE = 500;
    for (let i = 0; i < finalProducts.length; i += CHUNK_SIZE) {
      await Product.insertMany(finalProducts.slice(i, i + CHUNK_SIZE));
      console.log(`💾 Inserted ${i} -> ${i + CHUNK_SIZE}`);
    }

    console.log(`✅ SUCCESS: Created ${finalProducts.length} products!`);
    process.exit();
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

seedMultiplier();
