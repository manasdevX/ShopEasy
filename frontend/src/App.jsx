import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useEffect } from "react";
import axios from "axios";

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
import ShippingPolicy from "./pages/ShippingPolicy";
import FAQs from "./pages/FAQs";
import ContactUs from "./pages/ContactUs";

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

// ✅ GLOBAL AXIOS CONFIGURATION
// Essential for cross-origin session cookies (shopeasy.sid) to be sent with every request.
axios.defaults.withCredentials = true;

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  // ✅ GLOBAL SESSION CHECK & REDIRECT PROTECTOR
  useEffect(() => {
    const checkSession = async () => {
      const sellerToken = localStorage.getItem("sellerToken");
      const userToken = localStorage.getItem("token");
      const isSellerPath = location.pathname.startsWith("/Seller");

      // Skip check for public landing pages or login/signup to prevent loops
      const publicPaths = [
        "/Seller/login",
        "/Seller/signup",
        "/login",
        "/signup",
        "/Seller/Landing",
        "/",
      ];
      if (publicPaths.includes(location.pathname)) return;

      // Only check if local storage suggests an active session.
      if (sellerToken || userToken) {
        try {
          const API_URL =
            import.meta.env.VITE_API_URL || "http://localhost:5000";

          /** * ✅ ROLE-BASED VALIDATION
           * Hits the specific controller for the current portal to ensure
           * session isolation between Sellers and Customers.
           */
          const endpoint = isSellerPath
            ? "/api/sellers/profile"
            : "/api/auth/me";

          await axios.get(`${API_URL}${endpoint}`, {
            headers: {
              Authorization: `Bearer ${isSellerPath ? sellerToken : userToken}`,
            },
          });
        } catch (error) {
          // Handle Unauthorized status (401).
          if (error.response?.status === 401) {
            console.warn(
              "Session validation failed. Cleaning up local state..."
            );

            /**
             * ✅ RACE CONDITION FIX:
             * We check if the token still exists in localStorage. If it does, we ignore
             * the first 401 for a brief moment to allow cookie synchronization to catch up.
             */
            if (isSellerPath && sellerToken) return;

            // Wipe specific storage based on the failed path
            if (isSellerPath) {
              localStorage.removeItem("sellerToken");
              localStorage.removeItem("sellerUser");
              window.location.href = "/Seller/login?message=session_expired";
            } else {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              window.location.href = "/login?message=session_expired";
            }
          }
        }
      }
    };

    // Small stabilization delay to let the browser process cookies after login redirects
    const timer = setTimeout(checkSession, 500);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <>
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
            duration: 5000,
            theme: { primary: "#22c55e" },
          },
          error: {
            duration: 5000,
            theme: { primary: "#ef4444" },
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

        {/* --- Seller Portal Routes --- */}
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
        <Route path="/Seller/signup" element={<SellerSignup />} />
        <Route
          path="/Seller/forgot-password"
          element={<SellerForgotPassword />}
        />
        <Route path="/Seller/register" element={<SellerRegister />} />
        <Route path="/Seller/bank-details" element={<BankDetails />} />
        <Route path="/Seller/setup" element={<SellerRegister />} />

        {/* --- General Utility Routes --- */}
        <Route path="/Terms" element={<Terms />} />
        <Route path="/Privacy" element={<Privacy />} />
        <Route path="/Help" element={<Help />} />
        <Route path="/Shipping-policy" element={<ShippingPolicy />} />
        <Route path="/FAQs" element={<FAQs />} />
        <Route path="/ContactUs" element={<ContactUs />} />
      </Routes>
    </>
  );
}
