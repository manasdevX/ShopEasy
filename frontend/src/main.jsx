import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster } from "react-hot-toast";
import { SocketProvider } from "./context/SocketContext"; // ✅ Import the Socket Provider
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <SocketProvider>
          {" "}
          {/* ✅ Wrap App to enable real-time alerts */}
          <App />
          <Toaster position="bottom-right" reverseOrder={false} />{" "}
          {/* ✅ Essential for popups */}
        </SocketProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
