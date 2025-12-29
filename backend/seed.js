import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./src/models/Product.js";
import Seller from "./src/models/seller.js";

dotenv.config();

const TOTAL_PRODUCTS = 10000; // ⚡ 10k Products

// --- EXTENSIVE CATEGORY DATA (50 Categories) ---
const DATA = {
  // --- TECH & GADGETS ---
  Smartphones: {
    nouns: ["Phone 14", "Galaxy S23", "Pixel 7", "Note 12", "Fold Z"],
    brands: ["Apple", "Samsung", "Google", "Xiaomi"],
    adjectives: ["Pro", "Ultra", "5G", "Foldable"],
    imageText: "smartphone", // Keyword for real photo search
  },
  Laptops: {
    nouns: ["MacBook", "ThinkPad", "XPS 13", "Rog Zephyrus", "Spectre"],
    brands: ["Dell", "HP", "Lenovo", "Apple", "Asus"],
    adjectives: ["Ultra-Slim", "Gaming", "Convertible", "Pro"],
    imageText: "laptop",
  },
  Audio: {
    nouns: ["Headphones", "Earbuds", "Soundbar", "Bluetooth Speaker"],
    brands: ["Sony", "Bose", "JBL", "Sennheiser"],
    adjectives: ["Noise-Cancelling", "Wireless", "Bass-Boosted"],
    imageText: "headphones",
  },
  Cameras: {
    nouns: ["DSLR", "Mirrorless", "Action Cam", "Drone", "Lens"],
    brands: ["Canon", "Nikon", "Sony", "GoPro"],
    adjectives: ["4K", "Professional", "Compact", "High-Speed"],
    imageText: "camera",
  },
  Wearables: {
    nouns: ["Smartwatch", "Fitness Band", "VR Headset", "Smart Ring"],
    brands: ["Fitbit", "Garmin", "Apple", "Samsung"],
    adjectives: ["Waterproof", "Health-Tracking", "GPS"],
    imageText: "smartwatch",
  },
  Gaming: {
    nouns: ["Console", "Controller", "Gaming Mouse", "Mechanical Keyboard"],
    brands: ["Sony", "Xbox", "Razer", "Logitech"],
    adjectives: ["RGB", "Pro-Gamer", "Wireless", "Mechanical"],
    imageText: "gaming setup",
  },
  "Computer Accessories": {
    nouns: ["Monitor", "External SSD", "Webcam", "USB Hub", "Mouse Pad"],
    brands: ["Samsung", "SanDisk", "Logitech", "Anker"],
    adjectives: ["High-Speed", "Ergonomic", "4K"],
    imageText: "computer accessories",
  },
  Tablets: {
    nouns: ["iPad", "Galaxy Tab", "Surface Pro", "Kindle"],
    brands: ["Apple", "Samsung", "Microsoft", "Amazon"],
    adjectives: ["Retina", "Lightweight", "Paper-White"],
    imageText: "tablet computer",
  },
  "Printers & Ink": {
    nouns: ["Laser Printer", "InkJet", "3D Printer", "Scanner"],
    brands: ["HP", "Canon", "Epson", "Brother"],
    adjectives: ["Wireless", "All-in-One", "High-Yield"],
    imageText: "printer",
  },
  Networking: {
    nouns: ["Router", "Mesh WiFi", "Switch", "Modem"],
    brands: ["TP-Link", "Netgear", "Linksys", "Asus"],
    adjectives: ["Gigabit", "WiFi 6", "Long-Range"],
    imageText: "wifi router",
  },

  // --- FASHION ---
  "Men's Clothing": {
    nouns: ["T-Shirt", "Jeans", "Jacket", "Suit", "Hoodie"],
    brands: ["Nike", "Zara", "Levis", "Adidas"],
    adjectives: ["Slim-Fit", "Cotton", "Casual", "Formal"],
    imageText: "mens fashion",
  },
  "Women's Clothing": {
    nouns: ["Dress", "Top", "Skirt", "Saree", "Kurti"],
    brands: ["H&M", "Zara", "FabIndia", "Biba"],
    adjectives: ["Elegant", "Floral", "Silk", "Trendy"],
    imageText: "womens dress",
  },
  Footwear: {
    nouns: ["Sneakers", "Boots", "Sandals", "Running Shoes", "Loafers"],
    brands: ["Nike", "Adidas", "Puma", "Bata"],
    adjectives: ["Comfort", "Running", "Leather", "Sport"],
    imageText: "shoes",
  },
  Watches: {
    nouns: ["Analog Watch", "Chronograph", "Digital Watch", "Luxury Watch"],
    brands: ["Rolex", "Casio", "Fossil", "Titan"],
    adjectives: ["Premium", "Water-Resistant", "Gold-Plated"],
    imageText: "wristwatch",
  },
  "Bags & Luggage": {
    nouns: ["Backpack", "Handbag", "Suitcase", "Laptop Bag"],
    brands: ["Samsonite", "American Tourister", "Lavie"],
    adjectives: ["Travel", "Leather", "Durable"],
    imageText: "bag",
  },
  Eyewear: {
    nouns: ["Sunglasses", "Aviators", "Reading Glasses", "Frames"],
    brands: ["Ray-Ban", "Oakley", "Lenskart", "Fastrack"],
    adjectives: ["Polarized", "UV-Protection", "Stylish"],
    imageText: "sunglasses",
  },
  Jewelry: {
    nouns: ["Necklace", "Ring", "Earrings", "Bracelet"],
    brands: ["Tanishq", "Pandora", "CaratLane"],
    adjectives: ["Gold", "Diamond", "Silver", "Handmade"],
    imageText: "jewelry",
  },

  // --- HOME & LIVING ---
  Furniture: {
    nouns: ["Sofa", "Bed", "Dining Table", "Office Chair", "Bookshelf"],
    brands: ["IKEA", "Pepperfry", "Urban Ladder"],
    adjectives: ["Modern", "Ergonomic", "Wooden", "Compact"],
    imageText: "furniture",
  },
  "Kitchen Appliances": {
    nouns: ["Blender", "Microwave", "Air Fryer", "Toaster", "Mixer"],
    brands: ["Philips", "Bajaj", "Prestige", "LG"],
    adjectives: ["Automatic", "Stainless Steel", "Smart"],
    imageText: "kitchen appliance",
  },
  "Home Decor": {
    nouns: ["Lamp", "Vase", "Painting", "Wall Clock", "Rug"],
    brands: ["HomeCentre", "Chumbak", "Decor"],
    adjectives: ["Artistic", "Minimalist", "Vintage"],
    imageText: "home decor",
  },
  Bedding: {
    nouns: ["Bed Sheet", "Pillow", "Comforter", "Mattress"],
    brands: ["Sleepwell", "Bombay Dyeing"],
    adjectives: ["Cotton", "Soft", "Orthopedic"],
    imageText: "bedding",
  },
  Lighting: {
    nouns: ["LED Bulb", "Chandelier", "Desk Lamp", "Smart Light"],
    brands: ["Philips", "Syska", "Wipro"],
    adjectives: ["RGB", "Energy-Saving", "Smart"],
    imageText: "lighting",
  },
  Cleaning: {
    nouns: ["Vacuum Cleaner", "Mop", "Robot Vacuum", "Air Purifier"],
    brands: ["Dyson", "Eureka Forbes", "Xiaomi"],
    adjectives: ["Automatic", "HEPA Filter", "Powerful"],
    imageText: "vacuum cleaner",
  },

  // --- BEAUTY & HEALTH ---
  Skincare: {
    nouns: ["Face Wash", "Moisturizer", "Serum", "Sunscreen"],
    brands: ["Nivea", "Cetaphil", "Minimalist", "Mamaearth"],
    adjectives: ["Hydrating", "Organic", "Glow", "SPF 50"],
    imageText: "skincare product",
  },
  Makeup: {
    nouns: ["Lipstick", "Foundation", "Eyeliner", "Mascara"],
    brands: ["Lakme", "Maybelline", "MAC"],
    adjectives: ["Matte", "Long-Lasting", "Waterproof"],
    imageText: "makeup product",
  },
  "Hair Care": {
    nouns: ["Shampoo", "Conditioner", "Hair Oil", "Hair Dryer"],
    brands: ["Dove", "L'Oreal", "TRESemme", "Dyson"],
    adjectives: ["Smooth", "Anti-Dandruff", "Pro"],
    imageText: "hair care product",
  },
  Fragrances: {
    nouns: ["Perfume", "Deodorant", "Body Mist", "Cologne"],
    brands: ["Fogg", "Engage", "Calvin Klein", "Versace"],
    adjectives: ["Luxury", "Musk", "Fresh"],
    imageText: "perfume bottle",
  },
  "Personal Care": {
    nouns: ["Trimmer", "Shaver", "Epilator", "Electric Toothbrush"],
    brands: ["Philips", "Braun", "Oral-B"],
    adjectives: ["Rechargeable", "Sensitive", "Pro"],
    imageText: "personal care appliance",
  },
  "Health & Supplements": {
    nouns: ["Whey Protein", "Vitamins", "Fish Oil", "Multivitamin"],
    brands: ["Optimum Nutrition", "MuscleBlaze", "HealthKart"],
    adjectives: ["Isolate", "Organic", "Sugar-Free"],
    imageText: "supplement bottle",
  },

  // --- SPORTS & OUTDOORS ---
  Cricket: {
    nouns: ["Bat", "Ball", "Gloves", "Helmet", "Pads"],
    brands: ["SG", "SS", "MRF", "Kookaburra"],
    adjectives: ["English Willow", "Pro", "Leather"],
    imageText: "cricket gear",
  },
  "Fitness Equipment": {
    nouns: ["Dumbbells", "Treadmill", "Yoga Mat", "Resistance Bands"],
    brands: ["Decathlon", "Cockatoo", "BoldFit"],
    adjectives: ["Heavy-Duty", "Anti-Slip", "Home Gym"],
    imageText: "gym equipment",
  },
  Cycling: {
    nouns: ["Mountain Bike", "Helmet", "Gloves", "Lights"],
    brands: ["Hero", "Firefox", "Btwin"],
    adjectives: ["Gear", "Electric", "Off-Road"],
    imageText: "bicycle",
  },
  Camping: {
    nouns: ["Tent", "Sleeping Bag", "Backpack", "Torch"],
    brands: ["Quechua", "Wildcraft", "Coleman"],
    adjectives: ["Waterproof", "Portable", "Thermal"],
    imageText: "camping gear",
  },
  Badminton: {
    nouns: ["Racket", "Shuttlecock", "Net", "Shoes"],
    brands: ["Yonex", "Li-Ning"],
    adjectives: ["Graphite", "Lightweight", "Feather"],
    imageText: "badminton racket",
  },
  Football: {
    nouns: ["Football", "Jersey", "Cleats", "Shin Guards"],
    brands: ["Nike", "Adidas", "Nivia"],
    adjectives: ["Pro", "Official", "Training"],
    imageText: "football gear",
  },

  // --- KIDS & TOYS ---
  Toys: {
    nouns: ["Action Figure", "Doll", "Lego Set", "Remote Car"],
    brands: ["Lego", "Barbie", "Hot Wheels"],
    adjectives: ["Educational", "Fun", "Interactive"],
    imageText: "toys",
  },
  "Baby Care": {
    nouns: ["Diapers", "Baby Wipes", "Stroller", "Baby Oil"],
    brands: ["Pampers", "Himalaya", "Chicco"],
    adjectives: ["Soft", "Gentle", "Organic"],
    imageText: "baby products",
  },
  "School Supplies": {
    nouns: ["Backpack", "Pencil Box", "Notebooks", "Water Bottle"],
    brands: ["Classmate", "Camel", "Milton"],
    adjectives: ["Durable", "Colorful", "Premium"],
    imageText: "school supplies",
  },

  // --- BOOKS & STATIONERY ---
  "Fiction Books": {
    nouns: ["Novel", "Story Book", "Comic", "Thriller"],
    brands: ["Penguin", "HarperCollins"],
    adjectives: ["Bestseller", "Classic", "Mystery"],
    imageText: "novel book",
  },
  "Educational Books": {
    nouns: ["Textbook", "Guide", "Encyclopedia", "Exam Prep"],
    brands: ["Oxford", "Pearson"],
    adjectives: ["Academic", "Comprehensive", "Latest"],
    imageText: "textbook",
  },
  Stationery: {
    nouns: ["Pen Set", "Notebook", "Files", "Calculator"],
    brands: ["Parker", "Classmate", "Casio"],
    adjectives: ["Premium", "Official", "Smooth"],
    imageText: "stationery items",
  },

  // --- AUTOMOTIVE ---
  "Car Accessories": {
    nouns: ["Seat Cover", "Car Perfume", "Dash Cam", "Vacuum"],
    brands: ["Godrej", "Sony", "70mai"],
    adjectives: ["Universal", "Premium", "Smart"],
    imageText: "car accessories",
  },
  "Bike Accessories": {
    nouns: ["Helmet", "Gloves", "Cover", "Lock"],
    brands: ["Steelbird", "Vega", "Studds"],
    adjectives: ["Safety", "Matte Black", "Durable"],
    imageText: "motorcycle helmet",
  },
  "Car Care": {
    nouns: ["Car Wax", "Shampoo", "Microfiber Cloth", "Polish"],
    brands: ["3M", "Turtle Wax", "Formula 1"],
    adjectives: ["Shine", "Scratch-Remover", "Professional"],
    imageText: "car washing",
  },

  // --- GROCERY ---
  Snacks: {
    nouns: ["Chips", "Biscuits", "Noodles", "Chocolates"],
    brands: ["Lays", "Britannia", "Maggi", "Cadbury"],
    adjectives: ["Crunchy", "Spicy", "Family Pack"],
    imageText: "packaged snacks",
  },
  Beverages: {
    nouns: ["Tea", "Coffee", "Juice", "Soft Drink"],
    brands: ["Tata Tea", "Nescafe", "Real", "Coke"],
    adjectives: ["Organic", "Refreshing", "Instant"],
    imageText: "beverage bottle",
  },
  Staples: {
    nouns: ["Rice", "Flour", "Oil", "Pulses"],
    brands: ["India Gate", "Aashirvaad", "Fortune"],
    adjectives: ["Premium", "Whole Grain", "Refined"],
    imageText: "grocery staples",
  },

  // --- OTHERS ---
  "Pet Supplies": {
    nouns: ["Dog Food", "Cat Food", "Leash", "Pet Bed"],
    brands: ["Pedigree", "Whiskas", "Drools"],
    adjectives: ["Healthy", "Comfortable", "Nutritious"],
    imageText: "pet food",
  },
  "Musical Instruments": {
    nouns: ["Guitar", "Keyboard", "Flute", "Drums"],
    brands: ["Yamaha", "Casio", "Fender"],
    adjectives: ["Acoustic", "Electric", "Professional"],
    imageText: "musical instrument",
  },
  Garden: {
    nouns: ["Plant Pot", "Seeds", "Water Can", "Shovel"],
    brands: ["TrustBasket", "Kraft Seeds"],
    adjectives: ["Indoor", "Organic", "Durable"],
    imageText: "gardening tools",
  },
};

const CATEGORIES = Object.keys(DATA);

const sample = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const generateProducts = async () => {
  try {
    if (!process.env.MONGO_URI) throw new Error("MONGO_URI is missing in .env");

    await mongoose.connect(process.env.MONGO_URI);
    console.log("🔥 Connected to Database...");

    // ✅ FIXED: Find ALL Sellers (not just one)
    const sellers = await Seller.find({});

    if (sellers.length === 0) {
      console.error("❌ ERROR: No Sellers found in 'sellers' collection!");
      console.error("👉 Please register at least one Seller account first.");
      process.exit(1);
    }

    console.log(
      `✅ Found ${sellers.length} active sellers to distribute products to.`
    );

    console.log("🧹 Clearing old products...");
    await Product.deleteMany({});

    console.log(
      `🌱 Generating ${TOTAL_PRODUCTS} products with REAL IMAGES across ${CATEGORIES.length} categories...`
    );

    const products = [];

    for (let i = 0; i < TOTAL_PRODUCTS; i++) {
      // 1. Distribute products evenly across all sellers
      const assignedSeller = sellers[i % sellers.length];

      const category = sample(CATEGORIES);
      const catData = DATA[category];

      const noun = sample(catData.nouns);
      const brand = sample(catData.brands);
      const adjective = sample(catData.adjectives);

      const name = `${brand} ${adjective} ${noun}`;
      const price = randomInt(199, 49999);
      const mrp = Math.floor(price * (1 + Math.random() * 0.3));

      // 2. SEARCH TAGS for robust searching
      const tags = [
        brand.toLowerCase(),
        category.toLowerCase(),
        noun.toLowerCase(),
        adjective.toLowerCase(),
        name.toLowerCase(),
        "sale",
        "new",
        "best seller",
      ];

      // 3. REAL IMAGES from LoremFlickr
      // We use the specific keyword (e.g., "laptop", "shoes")
      // ?lock=i ensures the same image appears if you refresh, but it's unique per product ID
      const searchTerm = encodeURIComponent(catData.imageText);
      const img1 = `https://loremflickr.com/600/600/${searchTerm}?lock=${i}`;
      const img2 = `https://loremflickr.com/600/600/${searchTerm}?lock=${
        i + 10000
      }`; // Slightly different image
      const img3 = `https://loremflickr.com/600/600/${searchTerm}?lock=${
        i + 20000
      }`;

      products.push({
        seller: assignedSeller._id, // Assign to different sellers in loop
        name: name,
        description: `Get the best ${category} experience with the ${name} by ${brand}. Features premium ${adjective} build quality. Perfect for daily use.`,
        price: price,
        mrp: mrp,
        category: category,
        brand: brand,
        stock: randomInt(0, 200),
        countInStock: randomInt(0, 200),
        thumbnail: img1,
        images: [img1, img2, img3],
        tags: tags,
        rating: (Math.random() * 2.5 + 2.5).toFixed(1),
        numReviews: randomInt(0, 1000),
        isFeatured: Math.random() > 0.98,
        isBestSeller: Math.random() > 0.95,
        reviews: [],
      });

      if (i % 1000 === 0) console.log(`... Generated ${i} items`);
    }

    // Insert in chunks
    const chunkSize = 500;
    for (let i = 0; i < products.length; i += chunkSize) {
      await Product.insertMany(products.slice(i, i + chunkSize));
      console.log(`💾 Saved items ${i} to ${i + chunkSize}`);
    }

    console.log(
      `✅ SUCCESS! ${TOTAL_PRODUCTS} products created across ${sellers.length} sellers.`
    );
    process.exit();
  } catch (error) {
    console.error("❌ SEEDING FAILED:", error);
    process.exit(1);
  }
};

generateProducts();
