import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// --- USER PAGES ---
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Account from "./pages/Account";
import ForgotPassword from "./pages/ForgotPassword";
import SearchResults from "./pages/SearchResults";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart"; // ✅ Added Cart Import

// --- SELLER PAGES ---
import SellerLanding from "./pages/Seller/Landing";
import SellerSignup from "./pages/Seller/Signup"; // Step 1
import SellerLogin from "./pages/Seller/Login";
import SellerForgotPassword from "./pages/Seller/ForgotPassword";
import SellerRegister from "./pages/Seller/Register"; // Step 2 (Business)
import BankDetails from "./pages/Seller/BankDetails"; // Step 3 (Bank & Create)
import Dashboard from "./pages/Seller/Dashboard";
import Products from "./pages/Seller/Products";
import AddProduct from "./pages/Seller/AddProduct";
import EditProduct from "./pages/Seller/EditProduct";
import SellerOrders from "./pages/Seller/Orders";

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
        {/* --- User / Customer Routes --- */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/account" element={<Account />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Search & Discovery */}
        <Route path="/search" element={<SearchResults />} />
        <Route path="/product/:id" element={<ProductDetails />} />

        {/* ✅ Production Cart Route */}
        <Route path="/cart" element={<Cart />} />

        {/* --- Seller Journey Routes --- */}
        <Route path="/Seller/Landing" element={<SellerLanding />} />
        <Route path="/Seller/Dashboard" element={<Dashboard />} />

        {/* Product Management */}
        <Route path="/Seller/products" element={<Products />} />
        <Route path="/Seller/orders" element={<SellerOrders />} />
        <Route path="/Seller/add-product" element={<AddProduct />} />

        {/* ✅ Corrected route with :id parameter */}
        <Route path="/Seller/edit-product/:id" element={<EditProduct />} />

        {/* Seller Auth Flow */}
        <Route path="/Seller/login" element={<SellerLogin />} />
        <Route
          path="/Seller/forgot-password"
          element={<SellerForgotPassword />}
        />

        {/* Registration Steps (Deferred Flow) */}
        <Route path="/Seller/signup" element={<SellerSignup />} />
        <Route path="/Seller/register" element={<SellerRegister />} />
        <Route path="/Seller/bank-details" element={<BankDetails />} />

        {/* Fallback for safety */}
        <Route path="/Seller/setup" element={<SellerRegister />} />
      </Routes>
    </>
  );
}
