import { Link } from "react-router-dom";
import { useState } from "react";
import { ShoppingCart, User, Store, ChevronDown, Search } from "lucide-react";

const CATEGORY_DATA = {
  "Mobiles & Tablets": ["Smartphones", "Tablets", "Accessories", "Power Banks"],
  Fashion: ["Men", "Women", "Kids", "Footwear", "Accessories"],
  Electronics: ["Laptops", "Headphones", "Cameras", "Gaming", "Wearables"],
  "TVs & Appliances": [
    "Televisions",
    "Refrigerators",
    "Washing Machines",
    "Air Conditioners",
  ],
  "Home & Furniture": [
    "Furniture",
    "Home Decor",
    "Lighting",
    "Kitchen & Dining",
  ],
  "Beauty, Food & More": ["Makeup", "Skincare", "Nutrition", "Personal Care"],
  Grocery: ["Fruits & Vegetables", "Snacks", "Staples", "Household Essentials"],
};

export default function Navbar() {
  const [activeCategory, setActiveCategory] = useState(null);
  const isLoggedIn = false;

  return (
    <header className="relative w-full z-50">
      {/* 🔹 TOP NAVBAR (UNCHANGED) */}
      <div className="bg-gray-900 px-6 py-3 flex items-center gap-6">
        <Link to="/" className="text-orange-500 text-2xl font-bold">
          ShopEasy
        </Link>

        <div className="flex flex-1 bg-white rounded-md overflow-hidden">
          <input
            type="text"
            placeholder="Search for products, brands and more"
            className="px-4 py-2 w-full outline-none text-gray-800"
          />
          <button className="px-4 bg-orange-500 text-white">
            <Search size={18} />
          </button>
        </div>

        <div className="flex items-center gap-6 text-white">
          {/* ACCOUNT / LOGIN */}
          {!isLoggedIn ? (
            <Link
              to="/login"
              className="flex items-center gap-1 hover:text-orange-400"
            >
              <User size={18} />
              <span>Login</span>
              <ChevronDown size={14} />
            </Link>
          ) : (
              <Link
                to="/account"
                className="flex items-center gap-1 hover:text-orange-400"
              >
                <User size={18} />
                <span>Account</span>
              </Link>
          )}

          <Link
            to="/cart"
            className="flex items-center gap-1 hover:text-orange-400"
          >
            <ShoppingCart size={18} />
            Cart
          </Link>

          <div className="flex items-center gap-1 cursor-pointer hover:text-orange-400">
            <Store size={18} />
            Become a Seller
          </div>
        </div>
      </div>

      <div className="bg-white border-b px-6 py-3 hidden md:flex justify-between text-sm font-medium">
        {Object.keys(CATEGORY_DATA).map((category) => {
          let positionClass = "left-1/2 -translate-x-1/2";

          if (category === "Mobiles & Tablets") {
            positionClass = "left-0 translate-x-0";
          } else if (category === "Grocery") {
            positionClass = "right-0 translate-x-0";
          }

          return (
            <div
              key={category}
              className="relative flex items-center gap-1 cursor-pointer hover:text-orange-500"
              onMouseEnter={() => setActiveCategory(category)}
              onMouseLeave={() => setActiveCategory(null)}
            >
              <span>{category}</span>
              <ChevronDown size={14} />

              {activeCategory === category && (
                <div
                  className={`absolute top-full
            ${positionClass}
            w-56 bg-white shadow-lg rounded-md z-50`}
                  onMouseEnter={() => setActiveCategory(category)}
                >
                  <div className="p-4">
                    {CATEGORY_DATA[category].map((item) => (
                      <div
                        key={item}
                        className="py-1 text-gray-800 hover:text-orange-500"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </header>
  );
}
