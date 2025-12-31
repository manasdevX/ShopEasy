import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// --- USER PAGES ---
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import UpdatePassword from "./pages/UpdatePassword"
import UpdateEmail from "./pages/UpdateEmail"
import Account from "./pages/Account";
import ForgotPassword from "./pages/ForgotPassword";
import SearchResults from "./pages/SearchResults";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart"; // ✅ Added Cart Import
import Payment from "./pages/Payment";
import OrderSummary from "./pages/OrderSummary";
import Reviews from "./pages/Reviews";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Help from "./pages/Help";

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
import Notifications from "./pages/Seller/Notification";
import Settings from "./pages/Seller/Settings";

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
        <Route path="/update-password" element={<UpdatePassword />} />
        <Route path="/update-email" element={<UpdateEmail />} />
        <Route path="/account" element={<Account />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Search & Discovery */}
        <Route path="/search" element={<SearchResults />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/product/:id/reviews" element={<Reviews />} />
        <Route path="/OrderSummary" element={<OrderSummary />} />

        {/* ✅ Production Cart Route */}
        <Route path="/cart" element={<Cart />} />

        {/* --- Seller Journey Routes --- */}
        <Route path="/Seller/Landing" element={<SellerLanding />} />
        <Route path="/Seller/Dashboard" element={<Dashboard />} />
        <Route path="/Seller/Notifications" element={<Notifications />} />
        <Route path="/Seller/Settings" element={<Settings />} />

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

        <Route path="/Terms" element={<Terms />} />
        <Route path="/Privacy" element={<Privacy />} />
        <Route path="/Help" element={<Help />} />
      </Routes>
    </>
  );
}
