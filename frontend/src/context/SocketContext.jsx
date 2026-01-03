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
      // Use the environment variable for the backend URL
      const socketUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

      newSocket = io(socketUrl, {
        query: { userId: currentUserId },
        transports: ["websocket"],
        withCredentials: true, // ✅ CRITICAL: Matches backend CORS for session persistence
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      newSocket.on("connect", () => {
        console.log(`✅ Socket Connected: ${newSocket.id}`);
        // Ensure seller/user joins their specific room for private broadcasts
        newSocket.emit("join_seller_room", currentUserId);
      });

      // 2. 📦 Listen for "order_alert" (Real-time Order Popups)
      newSocket.on("order_alert", (data) => {
        console.log("📦 Socket received order_alert:", data);

        if (data.type === "success") {
          toast.success(data.message, {
            duration: 6000,
            icon: "📦",
            style: {
              background: "#10B981",
              color: "#fff",
              fontWeight: "bold",
              borderRadius: "12px",
            },
          });
        } else if (data.type === "error") {
          toast.error(data.message, {
            duration: 6000,
            icon: "❌",
            style: { borderRadius: "12px" },
          });
        } else {
          toast(data.message, {
            duration: 4000,
            icon: "ℹ️",
            style: { borderRadius: "12px" },
          });
        }
      });

      // 3. 🔔 Listen for "new_notification" (Updates Bell Icon/Badge)
      newSocket.on("new_notification", (notification) => {
        console.log("🔔 New Notification Received:", notification);
        toast(notification.title || "New Notification", {
          icon: "🔔",
          duration: 4000,
          style: {
            border: "1px solid #3b82f6",
            padding: "16px",
            color: "#3b82f6",
            background: "#fff",
            borderRadius: "12px",
          },
        });

        // ✅ Immediate UI Sync: Tell Navbar to refresh the notification dot
        window.dispatchEvent(new Event("notification-updated"));
      });

      newSocket.on("connect_error", (err) => {
        console.error("❌ Socket Connection Error:", err.message);
      });

      setSocket(newSocket);
    }

    // 4. Handle Login/Logout sync across multiple browser tabs
    const handleSync = () => {
      const id = getUserId();
      // If user logged out in another tab, clean up connection
      if (!id && newSocket) {
        newSocket.disconnect();
        setSocket(null);
      }
      // If user logged in, refresh to establish fresh authenticated state
      else if (id && !newSocket) {
        window.location.reload();
      }
    };

    window.addEventListener("storage", handleSync);

    // 5. Cleanup on Unmount
    return () => {
      if (newSocket) {
        console.log("🔌 Socket Disconnecting...");
        newSocket.off("connect");
        newSocket.off("order_alert");
        newSocket.off("new_notification");
        newSocket.off("connect_error");
        newSocket.disconnect();
      }
      window.removeEventListener("storage", handleSync);
    };
  }, []); // Empty dependencies ensure listener handles cross-tab sync

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    // This is optional but helpful for debugging
    console.warn("useSocket must be used within a SocketProvider");
  }
  return context;
};
