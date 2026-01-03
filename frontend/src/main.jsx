import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { SocketProvider } from "./context/SocketContext";
import App from "./App";
import "./index.css"; 

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <SocketProvider>
          {/* ✅ App now handles the Toaster and Routes exclusively */}
          <App />
        </SocketProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>
);

//trigger: restart deployment
