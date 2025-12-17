import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";

const products = [
  {
    _id: "1",
    name: "Wireless Headphones",
    thumbnail: "https://via.placeholder.com/200",
    price: 2999,
    mrp: 3999,
    discountPercentage: 25,
    rating: 4.5,
    numReviews: 128,
    stock: 12,
    isAvailable: true,
    isBestSeller: true
  },
  {
    _id: "2",
    name: "Smart Watch",
    thumbnail: "https://via.placeholder.com/200",
    price: 4999,
    mrp: 6999,
    discountPercentage: 28,
    rating: 4.2,
    numReviews: 86,
    stock: 7,
    isAvailable: true,
    isBestSeller: false
  },
  {
    _id: "3",
    name: "Bluetooth Speaker",
    thumbnail: "https://via.placeholder.com/200",
    price: 1999,
    mrp: 2499,
    discountPercentage: 20,
    rating: 4.0,
    numReviews: 64,
    stock: 0,
    isAvailable: false,
    isBestSeller: false
  },
  {
    _id: "4",
    name: "Gaming Mouse",
    thumbnail: "https://via.placeholder.com/200",
    price: 1499,
    mrp: 1999,
    discountPercentage: 25,
    rating: 4.6,
    numReviews: 210,
    stock: 18,
    isAvailable: true,
    isBestSeller: true
  },
  {
    _id: "5",
    name: "Mechanical Keyboard",
    thumbnail: "https://via.placeholder.com/200",
    price: 3499,
    mrp: 4999,
    discountPercentage: 30,
    rating: 4.4,
    numReviews: 97,
    stock: 4,
    isAvailable: true,
    isBestSeller: false
  },
  {
    _id: "6",
    name: "Noise Cancelling Earbuds",
    thumbnail: "https://via.placeholder.com/200",
    price: 3999,
    mrp: 5999,
    discountPercentage: 33,
    rating: 4.3,
    numReviews: 143,
    stock: 9,
    isAvailable: true,
    isBestSeller: true
  }
];

export default function Home() {
  return (
    <div className="bg-gray-100 min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-orange-500 py-14 text-center text-white">
        <h1 className="text-4xl font-bold">
          Shop Smart. Shop Easy.
        </h1>
        <p className="mt-3 text-lg">
          Discover deals across electronics, fashion & more
        </p>
      </section>

      {/* Featured Products */}
      <section className="px-6 mt-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Featured Products
          </h2>

          <Link
            to="/products"
            className="text-orange-500 font-medium hover:underline"
          >
            View all →
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
            />
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
