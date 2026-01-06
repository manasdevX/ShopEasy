import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
// ❌ Remove SocketProvider import to avoid duplication (it's already in App.jsx)
// import { SocketProvider } from "./context/SocketContext";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  /* ✅ REMOVED React.StrictMode to stop double-firing in dev */
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <BrowserRouter>
      {/* ✅ REMOVED SocketProvider from here. 
         It is already inside App.jsx. Keeping it here would cause 
         TWO socket connections (Duplicate Toasts).
      */}
      <App />
    </BrowserRouter>
  </GoogleOAuthProvider>
);
