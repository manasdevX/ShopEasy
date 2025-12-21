import { toast } from "react-hot-toast";

// ✅ Positive / Success notifications
export const showSuccess = (message) => {
  toast.success(message, {
    style: {
      background: "#ecfdf5", // green-50
      color: "#065f46",      // green-800
      border: "1px solid #6ee7b7", // green-300
    },
    iconTheme: {
      primary: "#10b981", // green-500
      secondary: "#ecfdf5",
    },
  });
};

// ❌ Error / Negative notifications
export const showError = (message) => {
  toast.error(message, {
    style: {
      background: "#fef2f2", // red-50
      color: "#7f1d1d",      // red-900
      border: "1px solid #fecaca", // red-300
    },
    iconTheme: {
      primary: "#ef4444", // red-500
      secondary: "#fef2f2",
    },
  });
};

// ℹ️ Neutral / Info notifications
export const showInfo = (message) => {
  toast(message, {
    style: {
      background: "#eff6ff", // blue-50
      color: "#1e3a8a",      // blue-900
      border: "1px solid #bfdbfe", // blue-300
    },
  });
};
