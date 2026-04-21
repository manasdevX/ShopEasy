import React, { useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import {
  Bot,
  MessageCircle,
  Send,
  Sparkles,
  Trash2,
  User,
  X,
  Loader2,
  ChevronDown,
  Flame,
  Tag,
  Smartphone,
  Package,
  ShieldCheck,
  Truck,
  Percent,
  LayoutGrid,
  Star,
  Shirt,
} from "lucide-react";
import ProductMessage from "./ProductMessage";
import OrderMessage from "./OrderMessage";

// ── Constants ──

const CHAT_SESSION_KEY = "shopeasy_chat_session_id";
const CHAT_MESSAGES_KEY = "shopeasy_chat_messages";

// Use proper markdown list syntax (dash + space) for correct rendering
const INITIAL_MESSAGE = {
  id: "assistant-initial",
  role: "assistant",
  type: "TEXT",
  message: `Hey! 👋 I'm **ShopEasy AI**, your personal shopping assistant.

I can help you with:

- 🔍 **Find & recommend** products by name, category, or budget
- 📦 **Track your orders** in real-time
- 💰 **Compare prices** and find the best deals
- ❓ **Answer questions** about shipping, returns & payments

What are you looking for today?`,
};

const QUICK_ACTIONS = [
  {
    label: "Trending Now",
    sub: "Popular picks",
    prompt: "Show me what's trending right now",
    icon: Flame,
    gradient: "from-rose-500 to-orange-500",
    bg: "bg-rose-50 dark:bg-rose-500/10",
    border: "border-rose-200 dark:border-rose-500/20",
    text: "text-rose-600 dark:text-rose-400",
  },
  {
    label: "Best Deals",
    sub: "Top discounts",
    prompt: "Show me products with the best discounts and deals",
    icon: Percent,
    gradient: "from-emerald-500 to-teal-500",
    bg: "bg-emerald-50 dark:bg-emerald-500/10",
    border: "border-emerald-200 dark:border-emerald-500/20",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  {
    label: "Smartphones",
    sub: "Latest phones",
    prompt: "Show me the best smartphones",
    icon: Smartphone,
    gradient: "from-blue-500 to-indigo-500",
    bg: "bg-blue-50 dark:bg-blue-500/10",
    border: "border-blue-200 dark:border-blue-500/20",
    text: "text-blue-600 dark:text-blue-400",
  },
  {
    label: "Top Rated",
    sub: "4★ and above",
    prompt: "Show me top rated products with best reviews",
    icon: Star,
    gradient: "from-amber-500 to-yellow-500",
    bg: "bg-amber-50 dark:bg-amber-500/10",
    border: "border-amber-200 dark:border-amber-500/20",
    text: "text-amber-600 dark:text-amber-400",
  },
  {
    label: "Track Order",
    sub: "Order status",
    prompt: "Where is my order? Show me my recent orders",
    icon: Package,
    gradient: "from-violet-500 to-purple-500",
    bg: "bg-violet-50 dark:bg-violet-500/10",
    border: "border-violet-200 dark:border-violet-500/20",
    text: "text-violet-600 dark:text-violet-400",
  },
  {
    label: "All Categories",
    sub: "Browse shop",
    prompt: "What product categories do you have?",
    icon: LayoutGrid,
    gradient: "from-slate-500 to-zinc-600",
    bg: "bg-slate-100 dark:bg-slate-500/10",
    border: "border-slate-200 dark:border-slate-500/20",
    text: "text-slate-600 dark:text-slate-400",
  },
];

const FOLLOW_UP_SUGGESTIONS = [
  { label: "🚚 Shipping Policy", prompt: "What is your shipping policy?" },
  { label: "↩️ Returns", prompt: "How do returns and refunds work?" },
  { label: "💳 Payment Options", prompt: "What payment methods do you accept?" },
];

// ── Helpers ──

const createId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const toProductPayload = (products = []) =>
  products.map((item) => ({
    id: item.id,
    name: item.name,
    price: item.price,
    mrp: item.mrp,
    link: item.link || `/product/${item.id}`,
    thumbnail: item.thumbnail,
    availability: item.availability,
    rating: item.rating,
    numReviews: item.numReviews,
    discountPercentage: item.discountPercentage,
    brand: item.brand,
  }));

const appendAssistantText = (messages, assistantMessageId, text) =>
  messages.map((entry) =>
    entry.id === assistantMessageId ? { ...entry, message: text } : entry
  );

const parseSseBlock = (block) => {
  let eventName = "message";
  const dataParts = [];

  for (const line of block.split("\n")) {
    if (line.startsWith("event:")) {
      eventName = line.slice(6).trim();
      continue;
    }
    if (line.startsWith("data:")) {
      dataParts.push(line.slice(5).trim());
    }
  }

  if (!dataParts.length) return null;

  try {
    return {
      eventName,
      payload: JSON.parse(dataParts.join("\n")),
    };
  } catch {
    return {
      eventName,
      payload: { text: dataParts.join("\n") },
    };
  }
};

// ── Typing Indicator ──

const TypingIndicator = ({ status }) => (
  <div className="flex items-start gap-2.5">
    <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/20">
      <Bot size={13} className="text-white" />
    </div>
    <div className="bg-white dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/80 dark:border-slate-700/80 rounded-2xl rounded-tl-md px-3.5 py-2.5 shadow-sm">
      <div className="flex items-center gap-2">
        {status === "tools" ? (
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-orange-500">
            <Loader2 size={12} className="animate-spin" />
            Searching products...
          </span>
        ) : (
          <>
            <div className="flex gap-1">
              <span
                className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
            <span className="text-[11px] font-medium text-slate-400">
              Thinking...
            </span>
          </>
        )}
      </div>
    </div>
  </div>
);

// ── Timestamp helper ──

const MessageTime = ({ id }) => {
  // Extract timestamp from id (first part before dash)
  const ts = parseInt(id?.split("-")?.[0]);
  if (!ts || isNaN(ts)) return null;
  const d = new Date(ts);
  return (
    <span className="text-[9px] text-slate-400 dark:text-slate-600 mt-1 block select-none">
      {d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
    </span>
  );
};

// ── Main ChatBot Component ──

const ChatBot = () => {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem(CHAT_MESSAGES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      /* ignore */
    }
    return [INITIAL_MESSAGE];
  });
  const [loading, setLoading] = useState(false);
  const [toolStatus, setToolStatus] = useState(null); // null | "tools" | "thinking"
  const [sessionId, setSessionId] = useState(
    () => localStorage.getItem(CHAT_SESSION_KEY) || null
  );
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const chatEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  // Persist session ID
  useEffect(() => {
    if (sessionId) {
      localStorage.setItem(CHAT_SESSION_KEY, sessionId);
    } else {
      localStorage.removeItem(CHAT_SESSION_KEY);
    }
  }, [sessionId]);

  // Persist messages
  useEffect(() => {
    try {
      sessionStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify(messages));
    } catch {
      /* ignore */
    }
  }, [messages]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Scroll detection
  const handleScroll = useCallback(() => {
    const c = chatContainerRef.current;
    if (!c) return;
    setShowScrollBtn(c.scrollHeight - c.scrollTop - c.clientHeight > 100);
  }, []);

  const scrollToBottom = () =>
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });

  // ── Apply chat response payload ──

  const applyChatPayload = useCallback((assistantMessageId, payload) => {
    if (!payload) return;
    if (payload.sessionId) setSessionId(payload.sessionId);

    setMessages((prev) => {
      // Update the text of the placeholder assistant message
      let updated = appendAssistantText(
        prev,
        assistantMessageId,
        payload.reply || ""
      );

      // Remove the assistant bubble if reply is empty (prevents empty bubbles)
      if (!payload.reply || !payload.reply.trim()) {
        updated = updated.filter((m) => m.id !== assistantMessageId);
      }

      const structured = [];

      if (payload.ui?.products?.length) {
        structured.push({
          id: createId(),
          role: "assistant",
          type: "PRODUCT_RECOMMENDATION",
          summary: payload.ui?.label || "Recommended Products",
          products: toProductPayload(payload.ui.products),
        });
      }

      if (payload.ui?.orders?.length) {
        structured.push({
          id: createId(),
          role: "assistant",
          type: "ORDER_SUMMARY",
          summary: "Your Orders",
          orders: payload.ui.orders,
        });
      }

      // If we have no text AND no structured data, add a default message
      if (
        (!payload.reply || !payload.reply.trim()) &&
        structured.length === 0
      ) {
        updated.push({
          id: assistantMessageId,
          role: "assistant",
          type: "TEXT",
          message: "I found some results for you! 👇",
        });
      }

      return [...updated, ...structured];
    });

    if (!isOpen) {
      setUnreadCount((prev) => prev + 1);
    }
  }, [isOpen]);

  // ── Streaming sender ──

  const sendStreamMessage = async (
    text,
    assistantMessageId,
    activeSessionId
  ) => {
    const response = await fetch(`${API_URL}/api/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      credentials: "include",
      body: JSON.stringify({
        message: text,
        sessionId: activeSessionId,
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error("Streaming unavailable");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let streamedText = "";
    let finalPayload = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split("\n\n");
      buffer = blocks.pop() || "";

      for (const block of blocks) {
        const parsed = parseSseBlock(block.trim());
        if (!parsed) continue;

        switch (parsed.eventName) {
          case "meta":
            if (parsed.payload?.sessionId)
              setSessionId(parsed.payload.sessionId);
            break;

          case "tool_start":
            setToolStatus("tools");
            break;

          case "tool_end":
            setToolStatus("thinking");
            break;

          case "chunk":
            streamedText += parsed.payload?.text || "";
            setMessages((prev) =>
              appendAssistantText(prev, assistantMessageId, streamedText)
            );
            break;

          case "done":
            finalPayload = parsed.payload;
            break;

          case "error":
            throw new Error(parsed.payload?.message || "Stream error");
        }
      }
    }

    if (finalPayload) return finalPayload;

    if (streamedText) {
      return {
        sessionId: activeSessionId,
        reply: streamedText,
        ui: {},
      };
    }

    return null;
  };

  // ── Fallback sender ──

  const sendFallbackMessage = async (text, activeSessionId) => {
    const { data } = await axios.post(
      `${API_URL}/api/chat/message`,
      { message: text, sessionId: activeSessionId },
      {
        headers: { ...getAuthHeaders() },
        withCredentials: true,
      }
    );
    return data;
  };

  // ── Main send ──

  const handleSend = async (forcedText = null) => {
    const textToSend = String(forcedText || input || "").trim();
    if (!textToSend || loading) return;

    setInput("");
    setLoading(true);
    setToolStatus("thinking");

    const assistantMessageId = createId();
    const userMessage = {
      id: createId(),
      role: "user",
      type: "TEXT",
      message: textToSend,
    };

    const pendingAssistant = {
      id: assistantMessageId,
      role: "assistant",
      type: "TEXT",
      message: "",
    };

    setMessages((prev) => [...prev, userMessage, pendingAssistant]);

    const activeSessionId =
      sessionId || localStorage.getItem(CHAT_SESSION_KEY) || null;

    try {
      let payload = null;

      try {
        payload = await sendStreamMessage(
          textToSend,
          assistantMessageId,
          activeSessionId
        );
      } catch {
        payload = await sendFallbackMessage(textToSend, activeSessionId);
      }

      if (!payload) {
        payload = await sendFallbackMessage(textToSend, activeSessionId);
      }

      applyChatPayload(assistantMessageId, payload);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) =>
        appendAssistantText(
          prev,
          assistantMessageId,
          "I'm having trouble connecting right now. Please try again in a moment. 🔄"
        )
      );
    } finally {
      setLoading(false);
      setToolStatus(null);
    }
  };

  // ── Clear ──

  const clearChat = () => {
    const active = sessionId;
    setMessages([INITIAL_MESSAGE]);
    setInput("");
    setSessionId(null);
    sessionStorage.removeItem(CHAT_MESSAGES_KEY);

    if (!active) return;
    axios
      .delete(`${API_URL}/api/chat/session/${active}`, {
        headers: { ...getAuthHeaders() },
        withCredentials: true,
      })
      .catch(() => {});
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isInitialState = messages.length === 1 && !loading;

  return (
    <div
      className="fixed bottom-4 right-4 z-[9999] font-sans"
      id="shopeasy-chatbot"
    >
      {/* ── Toggle Button ── */}
      <button
        id="chatbot-toggle"
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative w-14 h-14 rounded-2xl shadow-2xl transition-all duration-300 active:scale-90 hover:scale-105 flex items-center justify-center ${
          isOpen
            ? "bg-slate-800 hover:bg-slate-700 shadow-slate-800/30"
            : "bg-gradient-to-br from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 shadow-orange-500/30"
        }`}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? (
          <X size={22} className="text-white" />
        ) : (
          <>
            <MessageCircle size={22} className="text-white" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white shadow-sm">
                {unreadCount}
              </span>
            )}
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white animate-pulse" />
          </>
        )}
      </button>

      {/* ── Chat Window ── */}
      {isOpen && (
        <div
          className="absolute bottom-[68px] right-0 w-[92vw] sm:w-[400px] h-[min(660px,calc(100vh-120px))] bg-white dark:bg-[#0c1021] rounded-2xl shadow-2xl shadow-black/20 flex flex-col overflow-hidden border border-slate-200/60 dark:border-slate-800/60"
          style={{
            animation: "chatSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* ── Header ── */}
          <div className="px-4 py-3 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-600/30">
                <Bot size={18} />
              </div>
              <div>
                <h3 className="font-bold text-[13px] tracking-tight leading-none">
                  ShopEasy AI
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                  <span className="text-[9px] text-green-400 font-semibold uppercase tracking-widest">
                    Online
                  </span>
                </div>
              </div>
            </div>

            <button
              id="chatbot-clear"
              onClick={clearChat}
              className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-red-400 transition-all duration-200"
              title="Clear conversation"
            >
              <Trash2 size={16} />
            </button>
          </div>

          {/* ── Messages ── */}
          <div
            ref={chatContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-3 py-4 space-y-4 bg-gradient-to-b from-slate-50 to-white dark:from-[#0b0f1a] dark:to-[#0c1021] relative"
          >
            {messages.map((msg) => {
              // Skip empty text messages
              if (msg.type === "TEXT" && !msg.message) return null;

              const isUser = msg.role === "user";
              const isStructured =
                msg.type === "PRODUCT_RECOMMENDATION" ||
                msg.type === "ORDER_SUMMARY";

              return (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${
                    isUser ? "flex-row-reverse" : "flex-row"
                  }`}
                  style={{ animation: "chatFadeIn 0.25s ease-out" }}
                >
                  {/* Avatar — shown for ALL message types */}
                  {!isStructured && (
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isUser
                          ? "bg-slate-200 dark:bg-slate-700"
                          : "bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-sm"
                      }`}
                    >
                      {isUser ? (
                        <User size={13} />
                      ) : (
                        <Bot size={13} />
                      )}
                    </div>
                  )}

                  {/* Content */}
                  <div
                    className={`max-w-[82%] ${
                      isUser ? "items-end" : "items-start"
                    }`}
                  >
                    {msg.type === "TEXT" && msg.message && (
                      <div>
                        <div
                          className={`px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
                            isUser
                              ? "bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-tr-md shadow-sm"
                              : "bg-white dark:bg-slate-800/80 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 rounded-tl-md shadow-sm"
                          }`}
                        >
                          <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-headings:my-1.5 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0 prose-strong:text-inherit">
                            <ReactMarkdown>{msg.message}</ReactMarkdown>
                          </div>
                        </div>
                        {msg.id !== "assistant-initial" && (
                          <MessageTime id={msg.id} />
                        )}
                      </div>
                    )}

                    {msg.type === "PRODUCT_RECOMMENDATION" && (
                      <ProductMessage data={msg} />
                    )}

                    {msg.type === "ORDER_SUMMARY" && (
                      <OrderMessage data={msg} />
                    )}
                  </div>
                </div>
              );
            })}

            {/* Quick Actions Grid */}
            {isInitialState && (
              <div className="pl-9 pt-2 space-y-3">
                {/* Main Action Cards - 2x3 Grid */}
                <div>
                  <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-2">
                    Quick Actions
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {QUICK_ACTIONS.map(({ label, sub, prompt, icon: Icon, gradient, bg, border, text }) => (
                      <button
                        key={label}
                        onClick={() => handleSend(prompt)}
                        className={`group relative flex items-center gap-2 px-2.5 py-2 rounded-xl ${bg} ${border} border hover:shadow-md transition-all duration-200 active:scale-[0.97] overflow-hidden text-left`}
                      >
                        <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-sm`}>
                          <Icon size={13} className="text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-[11px] font-bold ${text} leading-tight truncate`}>
                            {label}
                          </p>
                          <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-tight">
                            {sub}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Secondary Chips */}
                <div>
                  <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-1.5">
                    Support
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {FOLLOW_UP_SUGGESTIONS.map(({ label, prompt }) => (
                      <button
                        key={label}
                        onClick={() => handleSend(prompt)}
                        className="px-2 py-1 rounded-md text-[10px] font-medium border border-slate-200/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-800/40 hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:border-orange-300/60 text-slate-500 dark:text-slate-400 hover:text-orange-600 transition-all duration-150 active:scale-95"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Typing / Tool Indicator */}
            {loading && <TypingIndicator status={toolStatus} />}

            <div ref={chatEndRef} />
          </div>

          {/* Scroll-to-bottom */}
          {showScrollBtn && (
            <button
              onClick={scrollToBottom}
              className="absolute bottom-[68px] left-1/2 -translate-x-1/2 w-7 h-7 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-lg flex items-center justify-center hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-all z-10"
            >
              <ChevronDown size={14} className="text-slate-500" />
            </button>
          )}

          {/* ── Input ── */}
          <div className="px-3 py-2.5 bg-white dark:bg-[#0c1021] border-t border-slate-200/60 dark:border-slate-800/60 shrink-0">
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                id="chatbot-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search products, track orders..."
                className="w-full pl-3.5 pr-11 py-2.5 bg-slate-100/80 dark:bg-slate-800/60 rounded-xl text-[13px] outline-none dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-orange-500/30 transition-all duration-200 border border-transparent focus:border-orange-500/20"
                disabled={loading}
              />
              <button
                id="chatbot-send"
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className="absolute right-1.5 w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white rounded-lg disabled:opacity-30 transition-all duration-200 flex items-center justify-center shadow-sm active:scale-90"
              >
                {loading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
              </button>
            </div>
            <p className="text-center text-[8px] text-slate-400 dark:text-slate-600 mt-1.5 font-medium tracking-wide">
              Powered by ShopEasy AI
            </p>
          </div>
        </div>
      )}

      {/* ── Animations ── */}
      <style>{`
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes chatFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ChatBot;
