import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { toast } from "react-hot-toast";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const user = JSON.parse(localStorage.getItem("user")); // Get logged-in user

  useEffect(() => {
    // Only connect if the user is logged in
    if (user && user._id) {
      // 1. Establish Connection to Render Backend
      const newSocket = io("https://shopeasy-suxa.onrender.com", {
        query: { userId: user._id },
        transports: ["websocket"], // Required for stable connection on cloud platforms
      });

      newSocket.on("connect", () => {
        console.log("✅ Real-time connection established");
      });

      // 2. 🔔 Listen for "order_alert" (Popups only)
      newSocket.on("order_alert", (data) => {
        // Trigger Toast Notification
        if (data.type === "success") {
          toast.success(data.message, {
            duration: 6000,
            icon: "📦",
          });
        } else {
          toast.error(data.message, {
            duration: 6000,
            icon: "⚠️",
          });
        }
      });

      // 3. 🔔 Listen for "new_notification" (Updates Bell Icon/History)
      newSocket.on("new_notification", (notification) => {
        console.log("🔔 New Notification Received:", notification);
        // Optional: Trigger a simple info toast for the notification
        toast(notification.title, {
          icon: "🔔",
          duration: 4000,
        });
      });

      setSocket(newSocket);

      // 4. Cleanup on Unmount or Logout
      return () => {
        newSocket.off("order_alert");
        newSocket.off("new_notification");
        newSocket.close();
      };
    }
  }, [user?._id]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
