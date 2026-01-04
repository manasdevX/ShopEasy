import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * ✅ UNIVERSAL LOGOUT
 * Handles both Seller and User logout by clearing local storage
 * and calling the backend to destroy the HttpOnly session cookie.
 */
export const logout = async (role = "user") => {
  try {
    // 1. Tell the backend to destroy the session and clear cookies
    await axios.post(
      `${API_URL}/api/auth/logout`,
      {},
      { withCredentials: true }
    );
  } catch (error) {
    console.error("Logout API failed:", error);
  } finally {
    // 2. Clear role-specific local data
    if (role === "seller") {
      localStorage.removeItem("sellerToken");
      localStorage.removeItem("sellerUser");
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }

    // 3. Force a hard refresh to the login page to kill all socket connections
    window.location.href = role === "seller" ? "/Seller/login" : "/login";
  }
};
