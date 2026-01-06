import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { io } from "socket.io-client";
import { toast } from "react-hot-toast";
import { useLocation } from "react-router-dom";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [userId, setUserId] = useState(null);
  const location = useLocation();

  /**
   * 1. IDENTITY HELPER
   * Extracts the logged-in ID from LocalStorage
   */
  const getUserId = useCallback(() => {
    try {
      const storedSeller = localStorage.getItem("sellerUser");
      const storedUser = localStorage.getItem("user");

      if (storedSeller && storedSeller !== "undefined") {
        const parsed = JSON.parse(storedSeller);
        // Handle cases where the object might be nested or direct
        return parsed?._id || parsed?.seller?._id;
      }
      if (storedUser && storedUser !== "undefined") {
        return JSON.parse(storedUser)?._id;
      }
    } catch (error) {
      console.error("❌ Socket Context ID Error:", error);
    }
    return null;
  }, []);

  /**
   * 2. AUTH MONITOR
   * Re-checks identity on every route change (Login -> Dashboard)
   */
  useEffect(() => {
    const currentId = getUserId();
    if (currentId !== userId) {
      console.log(`👤 Identity Sync: ${currentId ? "User Detected" : "Guest"}`);
      setUserId(currentId);
    }

    const handleAuthChange = () => setUserId(getUserId());
    window.addEventListener("storage", handleAuthChange);
    window.addEventListener("auth-change", handleAuthChange);

    return () => {
      window.removeEventListener("storage", handleAuthChange);
      window.removeEventListener("auth-change", handleAuthChange);
    };
  }, [getUserId, location.pathname, userId]);

  /**
   * 3. SOCKET CONNECTION ENGINE
   */
  useEffect(() => {
    if (!userId) {
      if (socket) {
        console.log("🔒 User logged out: Disconnecting Socket");
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Initialize Connection
    const socketUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const newSocket = io(socketUrl, {
      query: { userId },
      transports: ["websocket", "polling"],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
    });

    // --- CONNECTION EVENTS ---
    newSocket.on("connect", () => {
      console.log(`✅ Socket Live: ${newSocket.id} | User: ${userId}`);
      setIsConnected(true);
      // Explicitly join the seller room for notifications
      newSocket.emit("join_seller_room", userId);
    });

    newSocket.on("disconnect", () => {
      console.log("❌ Socket Offline");
      setIsConnected(false);
    });

    newSocket.on("connect_error", (err) => {
      console.error("⚠️ Socket Connection Error:", err.message);
      setIsConnected(false);
    });

    // --- REAL-TIME APP EVENTS ---

    // 📦 Instant Order Alerts
    newSocket.on("order_alert", (data) => {
      console.log("🔔 Real-time Alert:", data);

      // Play sound notification
      try {
        const audio = new Audio("/notification.mp3");
        audio.play().catch(() => console.log("Audio muted by browser policy"));
      } catch (e) {}

      const toastStyle = {
        fontWeight: "800",
        borderRadius: "16px",
        padding: "20px",
        fontSize: "14px",
        border: "1px solid rgba(255,255,255,0.1)",
      };

      if (data.type === "success") {
        toast.success(data.message, {
          duration: 8000,
          icon: "🚀",
          style: {
            ...toastStyle,
            background: "#f97316", // ShopEasy Orange
            color: "#fff",
          },
        });
      } else if (data.type === "error") {
        toast.error(data.message, {
          duration: 6000,
          icon: "⚠️",
          style: { ...toastStyle, background: "#ef4444", color: "#fff" },
        });
      } else {
        toast(data.message, {
          duration: 5000,
          icon: "ℹ️",
          style: toastStyle,
        });
      }

      // Signal global refresh for components not using context
      window.dispatchEvent(new Event("refresh-data"));
    });

    // 🔔 General Notifications
    newSocket.on("new_notification", (notification) => {
      toast(notification.title || "New Update", {
        icon: "🔔",
        duration: 4000,
        style: {
          borderRadius: "12px",
          background: "#1e293b",
          color: "#fff",
        },
      });
    });

    setSocket(newSocket);

    // Cleanup on unmount or identity change
    return () => {
      newSocket.off("connect");
      newSocket.off("disconnect");
      newSocket.off("order_alert");
      newSocket.off("new_notification");
      newSocket.disconnect();
    };
  }, [userId]);

  // Memoize value to prevent unnecessary re-renders of children
  const contextValue = useMemo(
    () => ({
      socket,
      isConnected,
      userId,
    }),
    [socket, isConnected, userId]
  );

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
