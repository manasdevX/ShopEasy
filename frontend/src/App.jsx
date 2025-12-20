import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Account from "./pages/Account";
import ForgotPassword from "./pages/ForgotPassword";
import Seller from "./pages/Seller";
import SellerRegister from "./pages/SellerRegister";

export default function App() {
  return (
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/account" element={<Account />} />
        <Route path="/seller" element={<Seller />} />
        <Route path="/seller/register" element={<SellerRegister />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Routes>
  );
}