import { ShoppingCart, Search, User } from "lucide-react";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
      {/* Logo */}
      <Link to="/" className="text-2xl font-bold text-orange-400">ShopEasy</Link>

      {/* Search */}
      <div className="hidden md:flex items-center bg-white rounded-lg overflow-hidden w-1/2">
        <input
          type="text"
          placeholder="Search for products..."
          className="px-4 py-2 w-full outline-none text-black"
        />
        <button className="bg-orange-400 p-2">
          <Search className="text-black" />
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-6">
        <User className="cursor-pointer" />
        <div className="relative cursor-pointer">
          <ShoppingCart />
          <span className="absolute -top-2 -right-2 bg-orange-400 text-black text-xs px-1 rounded-full">
            0
          </span>
        </div>
      </div>
    </nav>
  );
}
