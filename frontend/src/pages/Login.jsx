import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import Navbar from "../components/Navbar";
import AuthFooter from "../components/AuthFooter";

export default function Login() {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (identifier && password) {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      
      {/* Header */}
      <Navbar />

      {/* Login Section */}
      <div className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">

          <h1 className="text-3xl font-bold text-center text-orange-500 mb-2">
            ShopEasy
          </h1>
          <p className="text-center text-gray-600 mb-6">
            Login to your account
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="Enter password"
                className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-sm text-orange-500 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <button className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600">
              Login
            </button>
          </form>

          <div className="flex items-center my-6">
            <div className="flex-grow h-px bg-gray-300" />
            <span className="px-3 text-sm text-gray-500">OR</span>
            <div className="flex-grow h-px bg-gray-300" />
          </div>

          <button className="w-full border py-2 rounded-lg hover:bg-gray-100">
            Login with OTP
          </button>

          <p className="mt-6 text-center text-sm">
            New to ShopEasy?{" "}
            <Link to="/signup" className="text-orange-500 hover:underline">
              Create an account
            </Link>
          </p>

        </div>
      </div>

      {/* Footer */}
      <AuthFooter />
    </div>
  );
}
