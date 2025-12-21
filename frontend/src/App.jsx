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
