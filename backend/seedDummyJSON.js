import mongoose from "mongoose";
import dotenv from "dotenv";
import axios from "axios";
import Product from "./src/models/Product.js";
import Seller from "./src/models/seller.js";

dotenv.config();

const seedDummyJSON = async () => {
  try {
    // 1. Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🔥 MongoDB Connected");

    // 2. GET ALL REAL SELLERS
    // We fetch every seller currently registered in your app
    const sellers = await Seller.find({});

    if (sellers.length === 0) {
      console.error(
        "❌ No sellers found! Please register at least one seller in your app first."
      );
      process.exit(1);
    }

    console.log(
      `👥 Found ${sellers.length} Real Sellers. Distributing products among them...`
    );

    // 3. Fetch from DummyJSON (limit=0 gets ALL products)
    console.log("⏳ Fetching 190+ products from DummyJSON...");
    const { data } = await axios.get("https://dummyjson.com/products?limit=0");

    // 4. Transform and Distribute Data
    const products = data.products.map((item, index) => {
      // Round-Robin Assignment:
      // Cycle through the sellers array using modulo operator (%)
      // Product 1 -> Seller A, Product 2 -> Seller B, Product 3 -> Seller A...
      const assignedSeller = sellers[index % sellers.length];

      // Convert Price (Approx USD -> INR conversion for realism)
      const price = item.price * 84;

      // Calculate MRP based on the API's discount percentage
      // Formula: MRP = Price / (1 - (discount / 100))
      const discount = item.discountPercentage || 10;
      const mrp = Math.floor(price * (100 / (100 - discount)));

      return {
        seller: assignedSeller._id, // <--- Assigned to a real seller ID
        name: item.title,
        description: item.description,
        price: Math.floor(price),
        mrp: mrp,
        category: item.category, // e.g., "smartphones", "beauty", "furniture"
        brand: item.brand || "Generic",
        stock: item.stock,
        countInStock: item.stock,
        thumbnail: item.thumbnail, // High-quality specific thumbnail
        images: item.images, // Array of real gallery images
        tags: [
          item.category,
          item.brand || "",
          ...item.title.toLowerCase().split(" "),
        ].filter(Boolean),
        rating: item.rating,
        numReviews: Math.floor(Math.random() * 100) + 5, // Random reviews between 5-105
        isFeatured: item.rating > 4.6, // Feature only highly-rated items
        isBestSeller: item.stock < 40, // Mark low stock items as bestsellers
      };
    });

    // 5. Clear Old Data & Insert New
    await Product.deleteMany({});
    console.log("🧹 Old products cleared from database");

    await Product.insertMany(products);
    console.log(
      `✅ SUCCESS: Seeded ${products.length} products across ${sellers.length} sellers!`
    );

    process.exit();
  } catch (error) {
    console.error("❌ Error seeding data:", error);
    process.exit(1);
  }
};

seedDummyJSON();
