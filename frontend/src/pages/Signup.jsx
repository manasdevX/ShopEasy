import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import Navbar from "../components/Navbar";
import AuthFooter from "../components/AuthFooter";

export default function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name && identifier && password) {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      
      {/* Header */}
      <Navbar />

      {/* Signup Card */}
      <div className="flex-grow flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">

          <h1 className="text-3xl font-bold text-center text-orange-500 mb-2">
            ShopEasy
          </h1>
          <p className="text-center text-gray-600 mb-6">
            Create your account
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Email or Phone Number
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter email or phone"
                className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <button className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600">
              Sign Up
            </button>
          </form>

          <p className="mt-6 text-center text-sm">
            Already have an account?{" "}
            <Link to="/login" className="text-orange-500 hover:underline">
              Login
            </Link>
          </p>

        </div>
      </div>

      {/* Footer */}
      <AuthFooter />
    </div>
  );
}
