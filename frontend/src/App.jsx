import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// --- USER PAGES ---
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Account from "./pages/Account";
import ForgotPassword from "./pages/ForgotPassword";

// --- SELLER PAGES ---
import SellerLanding from "./pages/Seller/Landing"; // The "Become a Seller" info page
import Dashboard from "./pages/Seller/Dashboard"; // Seller control center
import Products from "./pages/Seller/Products"; // List of seller items
import AddProduct from "./pages/Seller/AddProduct"; // Add new product form
import EditProduct from "./pages/Seller/EditProduct"; // Edit existing product form
import SellerLogin from "./pages/Seller/Login";       // Seller Login 
import SellerRegister from "./pages/Seller/Register"; // Seller-specific Register
import SellerOrders from "./pages/Seller/Orders"; // Seller Orders Management
import SellerSignup from "./pages/Seller/Signup"; // Seller Signup
import SellerForgotPassword from "./pages/Seller/ForgotPassword"; // Seller Forgot Password
import BankDetails from "./pages/Seller/BankDetails"; // Seller Bank Details Verification

export default function App() {
  return (
    <>
      <Toaster
        position="bottom-right"
        gutter={8}
        toastOptions={{
          duration: 3000,
          className: "font-sans text-sm",
          style: {
            padding: "14px 16px",
            fontWeight: 600,
            borderRadius: "12px",
            boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
          },
        }}
      />

      <Routes>
        {/* User Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/account" element={<Account />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        {/* Seller Journey Routes */}
        <Route path="/Seller/Landing" element={<SellerLanding />} />
        <Route path="/Seller/Dashboard" element={<Dashboard />} />
        {/* Product Management */}
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
        {/* Registration Steps */}
        <Route path="/Seller/signup" element={<SellerSignup />} />{" "}
        {/* Step 1 */}
        <Route path="/Seller/register" element={<SellerRegister />} />{" "}
        {/* Step 2 */}
        <Route path="/Seller/bank-details" element={<BankDetails />} />{" "}
        {/* Step 3 */}
        {/* Fallback for safety: if old links point to /setup, redirect to register */}
        <Route path="/Seller/setup" element={<SellerRegister />} />
      </Routes>
    </>
  );
}
