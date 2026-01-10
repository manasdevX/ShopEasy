import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Sparkles,
  Truck,
  Zap,
  Trash2,
} from "lucide-react";
import ProductMessage from "./ProductMessage";

// Move this OUTSIDE the component so it's a stable reference
const INITIAL_MESSAGE = {
  role: "assistant",
  type: "TEXT",
  message:
    "Hi! I am your **ShopEasy AI Sales Expert**. How can I help you find the best products today?",
};

const ChatBot = () => {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ... keep your imports and states

const handleSend = async (forcedText = null) => {
    const textToSend = forcedText || input;
    if (!textToSend || !textToSend.trim() || loading) return;

    setInput("");
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", type: "TEXT", message: textToSend }]);

    try {
      const res = await axios.post(`${API_URL}/api/vectors/message`, {
        message: textToSend,
      });

      const rawReply = res.data.reply || "";

      if (rawReply.includes("/product/")) {
        const lines = rawReply.split("\n").map(l => l.trim()).filter(l => l);
        const extractedProducts = [];
        
        for (let i = 0; i < lines.length; i++) {
          const currentLine = lines[i];
          const linkMatch = currentLine.match(/\/product\/[a-z0-9]+/);
          
          if (linkMatch) {
            // Check current and previous 2 lines for context
            const contextLines = [
               lines[i-2] || "", 
               lines[i-1] || "", 
               currentLine
            ].join(" ");

            const priceMatch = contextLines.match(/₹\s*(\d+)/);
            
            let name = "View Product";
            if (priceMatch) {
                const parts = contextLines.split(priceMatch[0]); 
                const rawName = parts[0].split(/•|-|:/).pop(); 
                if (rawName && rawName.length > 3) name = rawName.trim();
            } else {
                const prevLine = lines[i-1] || "";
                name = prevLine.replace(/•|-|:/g, "").trim() || "Product";
            }

            extractedProducts.push({
              id: linkMatch[0].split("/").pop(),
              name: name,
              price: priceMatch ? priceMatch[1] : "Check Price",
              link: linkMatch[0],
            });
          }
        }

        // Detect if this is a category based on keywords or item count
        const isCategorySearch = 
          /category|collection|all|show me|latest/i.test(textToSend) || extractedProducts.length > 2;

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            type: "PRODUCT_RECOMMENDATION",
            products: extractedProducts,
            summary: isCategorySearch 
                ? `Browsing: ${textToSend.replace(/show me|category/gi, "").trim()}` 
                : "Best Match Found"
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", type: "TEXT", message: rawReply },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", type: "TEXT", message: "Sorry, I'm having trouble connecting to the store." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Clear Chat Function
  const clearChat = () => {
    setMessages([INITIAL_MESSAGE]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] font-sans">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative bg-orange-600 hover:bg-orange-500 text-white p-4 rounded-2xl shadow-2xl transition-all active:scale-90"
      >
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
      </button>

      {isOpen && (
        <div className="absolute bottom-20 right-0 w-[90vw] md:w-[400px] h-[min(600px,calc(100vh-185px))] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="p-5 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-600/20">
                <Bot size={22} />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-tight">
                  ShopEasy AI Expert
                </h3>
                <span className="text-[10px] text-green-400 font-bold uppercase tracking-widest">
                  Online
                </span>
              </div>
            </div>
            {/* Trash Icon */}
            <button
              onClick={clearChat}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-50 dark:bg-[#0b0f1a]">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    msg.role === "user"
                      ? "bg-slate-200 dark:bg-slate-800"
                      : "bg-orange-600/10 text-orange-600"
                  }`}
                >
                  {msg.role === "user" ? (
                    <User size={16} />
                  ) : (
                    <Sparkles size={16} />
                  )}
                </div>
                <div
                  className={`max-w-[80%] ${
                    msg.role === "user" ? "items-end" : "items-start"
                  }`}
                >
                  {msg.type === "TEXT" ? (
                    <div
                      className={`p-4 rounded-2xl text-sm ${
                        msg.role === "user"
                          ? "bg-orange-600 text-white rounded-tr-none"
                          : "bg-white dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-none"
                      }`}
                    >
                      <div className="prose prose-sm dark:prose-invert">
                        <ReactMarkdown>{msg.message}</ReactMarkdown>
                      </div>
                    </div>
                  ) : (
                    <ProductMessage data={msg} />
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start gap-3 pl-11">
                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce delay-75" />
                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce delay-150" />
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white dark:bg-slate-900 border-t dark:border-slate-800">
            <div className="relative flex items-center">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
                placeholder="Ask ShopEasy AI..."
                className="w-full pl-4 pr-12 py-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-sm outline-none dark:text-white"
              />
              <button
                onClick={() => handleSend(input)}
                disabled={!input.trim() || loading}
                className="absolute right-2 p-2 bg-orange-600 text-white rounded-xl disabled:opacity-50 transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ChatBot;
