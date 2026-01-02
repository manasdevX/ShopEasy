import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useEffect } from "react"; // ✅ Added for session sync
import axios from "axios"; // ✅ Added for global config

// --- USER PAGES ---
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import UpdatePassword from "./pages/UpdatePassword";
import UpdateEmail from "./pages/UpdateEmail";
import Account from "./pages/Account";
import ForgotPassword from "./pages/ForgotPassword";
import SearchResults from "./pages/SearchResults";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Payment from "./pages/Payment";
import OrderSummary from "./pages/OrderSummary";
import Reviews from "./pages/Reviews";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Help from "./pages/Help";

// --- SELLER PAGES ---
import SellerLanding from "./pages/Seller/Landing";
import SellerSignup from "./pages/Seller/Signup";
import SellerLogin from "./pages/Seller/Login";
import SellerForgotPassword from "./pages/Seller/ForgotPassword";
import SellerRegister from "./pages/Seller/Register";
import BankDetails from "./pages/Seller/BankDetails";
import Dashboard from "./pages/Seller/Dashboard";
import Products from "./pages/Seller/Products";
import AddProduct from "./pages/Seller/AddProduct";
import EditProduct from "./pages/Seller/EditProduct";
import SellerOrders from "./pages/Seller/Orders";
import Notifications from "./pages/Seller/Notification";
import Settings from "./pages/Seller/Settings";

// ✅ 1. Global Axios Configuration
axios.defaults.withCredentials = true;

export default function App() {
  // ✅ 2. Session Integrity Check
  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

    const verifyAuth = async () => {
      // If we have a user in localstorage, verify with backend if session is still alive
      if (localStorage.getItem("user") || localStorage.getItem("sellerUser")) {
        try {
          // You should create a simple /me or /verify route on your backend
          await axios.get(`${API_URL}/api/auth/me`);
        } catch (err) {
          if (err.response?.status === 401) {
            // Session expired or killed by backend (e.g., 3rd device logged in)
            localStorage.clear();
            window.location.href = "/login?message=session_expired";
          }
        }
      }
    };

    verifyAuth();
  }, []);

  return (
    <>
      {/* 🟢 Improved Toaster for Socket.io Alerts */}
      <Toaster
        position="bottom-right"
        gutter={8}
        toastOptions={{
          duration: 4000,
          className: "font-sans text-sm",
          style: {
            padding: "14px 16px",
            fontWeight: 600,
            borderRadius: "12px",
            boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
          },
          success: {
            duration: 6000,
            theme: {
              primary: "#22c55e",
            },
          },
        }}
      />

      <Routes>
        {/* --- User / Customer Routes --- */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/update-password" element={<UpdatePassword />} />
        <Route path="/update-email" element={<UpdateEmail />} />
        <Route path="/account" element={<Account />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/search" element={<SearchResults />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/product/:id/reviews" element={<Reviews />} />
        <Route path="/OrderSummary" element={<OrderSummary />} />
        <Route path="/cart" element={<Cart />} />

        {/* --- Seller Journey Routes --- */}
        <Route path="/Seller/Landing" element={<SellerLanding />} />
        <Route path="/Seller/Dashboard" element={<Dashboard />} />
        <Route path="/Seller/Notifications" element={<Notifications />} />
        <Route path="/Seller/Settings" element={<Settings />} />
        <Route path="/Seller/products" element={<Products />} />
        <Route path="/Seller/orders" element={<SellerOrders />} />
        <Route path="/Seller/add-product" element={<AddProduct />} />
        <Route path="/Seller/edit-product/:id" element={<EditProduct />} />

        {/* Seller Auth Flow */}
        <Route path="/Seller/login" element={<SellerLogin />} />
        <Route
          path="/Seller/forgot-password"
          element={<SellerForgotPassword />}
        />
        <Route path="/Seller/signup" element={<SellerSignup />} />
        <Route path="/Seller/register" element={<SellerRegister />} />
        <Route path="/Seller/bank-details" element={<BankDetails />} />
        <Route path="/Seller/setup" element={<SellerRegister />} />

        {/* General */}
        <Route path="/Terms" element={<Terms />} />
        <Route path="/Privacy" element={<Privacy />} />
        <Route path="/Help" element={<Help />} />
      </Routes>
    </>
  );
}
