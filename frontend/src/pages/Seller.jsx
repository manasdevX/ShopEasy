import Navbar from "../components/Navbar";
import AuthFooter from "../components/AuthFooter";
import { Link } from "react-router-dom";
import { CheckCircle, Package, Truck, CreditCard } from "lucide-react";

export default function Seller() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
      <Navbar />

      {/* HERO SECTION */}
      <section className="bg-white dark:bg-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Sell Online with <span className="text-orange-500">ShopEasy</span>
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Reach millions of customers across India and grow your business
              with zero setup cost.
            </p>

            <Link
              to="/seller/register"
              className="inline-block bg-orange-500 text-white
                         px-6 py-3 rounded-lg
                         hover:bg-orange-600 transition"
            >
              Start Selling
            </Link>
          </div>

          <div className="hidden md:block">
            <img
              src="https://images.unsplash.com/photo-1556742044-3c52d6e88c62"
              alt="Seller"
              className="rounded-xl shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* WHY SELL SECTION */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Why Sell on ShopEasy?
          </h2>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                icon: <CheckCircle className="text-orange-500" />,
                title: "Zero Setup Cost",
                desc: "No registration or listing fees",
              },
              {
                icon: <Package className="text-orange-500" />,
                title: "Easy Product Listing",
                desc: "List products in minutes",
              },
              {
                icon: <Truck className="text-orange-500" />,
                title: "Pan-India Delivery",
                desc: "Logistics handled by us",
              },
              {
                icon: <CreditCard className="text-orange-500" />,
                title: "Fast Payments",
                desc: "Secure & timely payouts",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800
                           p-6 rounded-xl shadow-sm
                           text-center"
              >
                <div className="flex justify-center mb-4">
                  {item.icon}
                </div>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-gray-50 dark:bg-gray-800 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            How It Works
          </h2>

          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              "Register as Seller",
              "List Your Products",
              "Receive Orders",
              "Ship & Get Paid",
            ].map((step, i) => (
              <div key={i}>
                <div
                  className="w-12 h-12 mx-auto mb-4
                             rounded-full bg-orange-500
                             text-white flex items-center justify-center
                             font-bold"
                >
                  {i + 1}
                </div>
                <p className="text-gray-700 dark:text-gray-300 font-medium">
                  {step}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-white dark:bg-gray-900 text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Ready to Start Selling?
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Join thousands of sellers growing their business on ShopEasy.
        </p>

        <Link
          to="/seller/register"
          className="bg-orange-500 text-white
                     px-8 py-3 rounded-lg
                     hover:bg-orange-600 transition"
        >
          Register as Seller
        </Link>
      </section>

      <AuthFooter />
    </div>
  );
}
