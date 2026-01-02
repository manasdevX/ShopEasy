import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { toast } from "react-hot-toast";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  // 🔴 OLD LOGIC: const user = JSON.parse(localStorage.getItem("user"));

  // 🟢 NEW LOGIC: Check for EITHER Seller OR User
  let currentUser = null;
  try {
    currentUser = JSON.parse(
      localStorage.getItem("sellerUser") || localStorage.getItem("user")
    );
  } catch (error) {
    console.error("Socket Context Parsing Error:", error);
  }

  const currentUserId = currentUser?._id;

  useEffect(() => {
    // Only connect if we have a valid user ID
    if (currentUserId) {
      // 1. Establish Connection to Render Backend
      // NOTE: Using environment variable is safer, but hardcoded URL works for now
      const newSocket = io(
        import.meta.env.VITE_API_URL || "https://shopeasy-suxa.onrender.com",
        {
          query: { userId: currentUserId }, // Sends the ID (Seller or User) to backend
          transports: ["websocket"], // Required for stable connection
        }
      );

      newSocket.on("connect", () => {
        console.log(`✅ Socket Connected: ${newSocket.id}`);
        // Manually emit the join event just in case the handshake query missed it
        newSocket.emit("join_seller_room", currentUserId);
      });

      // 2. 🔔 Listen for "order_alert" (Popups only)
      newSocket.on("order_alert", (data) => {
        console.log("📦 Socket received order_alert:", data);

        // Trigger Toast Notification
        if (data.type === "success") {
          toast.success(data.message, {
            duration: 6000,
            icon: "📦",
            style: {
              background: "#10B981", // Emerald Green
              color: "#fff",
              fontWeight: "bold",
            },
          });
        } else if (data.type === "error") {
          toast.error(data.message, {
            duration: 6000,
            icon: "❌",
          });
        } else {
          toast(data.message, {
            duration: 4000,
            icon: "ℹ️",
          });
        }
      });

      // 3. 🔔 Listen for "new_notification" (Updates Bell Icon/History)
      newSocket.on("new_notification", (notification) => {
        console.log("🔔 New Notification Received:", notification);
        toast(notification.title, {
          icon: "🔔",
          duration: 4000,
          style: {
            border: "1px solid #3b82f6",
            padding: "16px",
            color: "#3b82f6",
          },
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
  }, [currentUserId]); // Re-run if the user ID changes (login/logout)

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
