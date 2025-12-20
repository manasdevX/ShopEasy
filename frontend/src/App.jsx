import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast"; // Added import
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Account from "./pages/Account";
import ForgotPassword from "./pages/ForgotPassword";
import Seller from "./pages/Seller";
import SellerRegister from "./pages/SellerRegister";

export default function App() {
  return (
    <>
      {/* TOASTER CONFIGURATION */}
      <Toaster 
        position="top-right" 
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          // Set duration and base styles
          duration: 3000,
          className: "dark:bg-slate-800 dark:text-white font-sans text-sm",
          style: {
            padding: '16px',
            fontWeight: '600',
            borderRadius: '12px',
            background: '#fff',
            color: '#333',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          },
          // Customizing the Success checkmark to match ShopEasy Orange
          success: {
            iconTheme: {
              primary: '#f97316', // Tailwind orange-500
              secondary: '#fff',
            },
          },
          // Customizing Error icon
          error: {
            iconTheme: {
              primary: '#ef4444', // Tailwind red-500
              secondary: '#fff',
            },
          },
        }}
      />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/account" element={<Account />} />
        <Route path="/seller" element={<Seller />} />
        <Route path="/seller/register" element={<SellerRegister />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Routes>
    </>
  );
}