import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { SocketProvider } from "./context/SocketContext";
import App from "./App";
import "./index.css";

// Use ReactDOM.createRoot for React 18+ rendering
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* Provides Google Login Context via the Client ID from Environment Variables */}
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      {/* Enables client-side routing throughout the application */}
      <BrowserRouter>
        {/* Handles global WebSocket connections and real-time notifications */}
        <SocketProvider>
          {/* Main App component which manages global Toaster and Routes */}
          <App />
        </SocketProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
