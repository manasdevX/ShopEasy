import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { toast } from "react-hot-toast";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  // Helper function to safely get the ID from localStorage
  const getUserId = () => {
    try {
      const storedSeller = localStorage.getItem("sellerUser");
      const storedUser = localStorage.getItem("user");

      // Only parse if the string exists and isn't literally the string "undefined"
      if (storedSeller && storedSeller !== "undefined") {
        return JSON.parse(storedSeller)?._id;
      }
      if (storedUser && storedUser !== "undefined") {
        return JSON.parse(storedUser)?._id;
      }
    } catch (error) {
      console.error("Socket Context Parsing Error:", error);
    }
    return null;
  };

  useEffect(() => {
    let newSocket = null;
    const currentUserId = getUserId();

    // 1. Establish connection if a valid user ID is found
    if (currentUserId) {
      const socketUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

      newSocket = io(socketUrl, {
        query: { userId: currentUserId },
        transports: ["websocket", "polling"], // Added polling fallback for better compatibility
        withCredentials: true, // ✅ CRITICAL for shopeasy.sid session persistence
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
      });

      newSocket.on("connect", () => {
        console.log(`✅ Socket Connected: ${newSocket.id}`);
        // Re-join room on every connect/reconnect to ensure data delivery
        newSocket.emit("join_seller_room", currentUserId);
      });

      // 2. 📦 Real-time Order Alerts
      newSocket.on("order_alert", (data) => {
        console.log("📦 Order alert received:", data);
        const toastStyle = {
          fontWeight: "bold",
          borderRadius: "12px",
          padding: "16px",
        };

        if (data.type === "success") {
          toast.success(data.message, {
            duration: 6000,
            icon: "📦",
            style: { ...toastStyle, background: "#10B981", color: "#fff" },
          });
        } else {
          toast(data.message, {
            duration: 5000,
            icon: "ℹ️",
            style: toastStyle,
          });
        }
      });

      // 3. 🔔 General Notifications
      newSocket.on("new_notification", (notification) => {
        console.log("🔔 New Notification:", notification);
        toast(notification.title || "New Message", {
          icon: "🔔",
          duration: 4000,
          style: {
            border: "1px solid #3b82f6",
            color: "#1e40af",
            background: "#eff6ff",
            borderRadius: "12px",
          },
        });

        // Inform other components (like Navbar) to refresh unread counts
        window.dispatchEvent(new Event("notification-updated"));
      });

      newSocket.on("connect_error", (err) => {
        console.error("❌ Socket Connection Error:", err.message);
      });

      setSocket(newSocket);
    }

    // 4. Multi-tab Sync Logic
    const handleSync = () => {
      const id = getUserId();
      // User logged out in another tab
      if (!id && newSocket) {
        console.log("🔄 Tab sync: Disconnecting socket due to logout");
        newSocket.disconnect();
        setSocket(null);
      }
      // User logged in via another tab
      else if (id && !newSocket) {
        console.log("🔄 Tab sync: Reloading to initialize socket");
        window.location.reload();
      }
    };

    window.addEventListener("storage", handleSync);

    // 5. Clean up logic
    return () => {
      if (newSocket) {
        console.log("🔌 Cleaning up socket listeners...");
        newSocket.off("connect");
        newSocket.off("order_alert");
        newSocket.off("new_notification");
        newSocket.off("connect_error");
        newSocket.disconnect();
      }
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  return context;
};
