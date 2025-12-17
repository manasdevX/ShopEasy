import { Link } from "react-router-dom";
import {
  ShoppingCart,
  User,
  Store,
  ChevronDown,
  Search
} from "lucide-react";

export default function Navbar() {
  return (
    <header className="w-full">

      {/* Top Navbar */}
      <div className="bg-gray-900 px-6 py-3 flex items-center gap-6">
        <Link
          to="/"
          className="text-orange-500 text-2xl font-bold"
        >
          ShopEasy
        </Link>

        <div className="flex flex-1 bg-white rounded-md overflow-hidden">
          <input
            type="text"
            placeholder="Search for products, brands and more"
            className="px-4 py-2 w-full outline-none"
          />
          <button className="px-4 bg-orange-500 text-white">
            <Search size={18} />
          </button>
        </div>

        <div className="flex items-center gap-6 text-white">
          <Link
            to="/login"
            className="flex items-center gap-1 hover:text-orange-400"
          >
            <User size={18} />
            <span>Login</span>
            <ChevronDown size={14} />
          </Link>

          <Link
            to="/cart"
            className="flex items-center gap-1 hover:text-orange-400"
          >
            <ShoppingCart size={18} />
            <span>Cart</span>
          </Link>

          <div className="flex items-center gap-1 cursor-pointer hover:text-orange-400">
            <Store size={18} />
            <span>Become a Seller</span>
          </div>
        </div>
      </div>

      {/* Category Bar */}
      <div className="bg-white border-b px-6 py-3 hidden md:flex justify-between text-sm font-medium">
        {[
          "Minutes",
          "Mobiles & Tablets",
          "Fashion",
          "Electronics",
          "TVs & Appliances",
          "Home & Furniture",
          "Beauty, Food & More",
          "Grocery"
        ].map((cat) => (
          <div
            key={cat}
            className="flex items-center gap-1 cursor-pointer hover:text-orange-500"
          >
            <span>{cat}</span>
            <ChevronDown size={14} />
          </div>
        ))}
      </div>

    </header>
  );
}
