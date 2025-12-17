import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import CategorySidebar from "../components/CategorySidebar";
import ProductCard from "../components/ProductCard";
import Footer from "../components/Footer";

const products = [
  {
    id: 1,
    title: "Wireless Headphones",
    price: 2999,
    image: "https://via.placeholder.com/200"
  },
  {
    id: 2,
    title: "Smart Watch",
    price: 4999,
    image: "https://via.placeholder.com/200"
  },
  {
    id: 3,
    title: "Bluetooth Speaker",
    price: 1999,
    image: "https://via.placeholder.com/200"
  },
  {
    id: 4,
    title: "Gaming Mouse",
    price: 1499,
    image: "https://via.placeholder.com/200"
  }
];

export default function Home() {
  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section className="bg-orange-400 py-10 text-center">
        <h1 className="text-4xl font-bold text-black">
          Shop Smart. Shop Easy.
        </h1>
        <p className="mt-2 text-lg text-black">
          Best deals on electronics, fashion & more
        </p>
      </section>

      {/* Login / Signup CTA */}
      <section className="px-6 mt-6">
        <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col md:flex-row items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              Welcome to ShopEasy
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              Sign in to get personalized recommendations and offers
            </p>
          </div>

          <div className="mt-4 md:mt-0 flex gap-4">
            <Link
              to="/login"
              className="px-6 py-2 border border-orange-500 text-orange-500 rounded-lg font-medium hover:bg-orange-50 transition"
            >
              Login
            </Link>

            <Link
              to="/signup"
              className="px-6 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="px-6 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          
          {/* Sidebar */}
          <CategorySidebar />

          {/* Products */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                Featured Products
              </h2>

              <button className="text-orange-500 font-medium hover:underline">
                View all →
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
