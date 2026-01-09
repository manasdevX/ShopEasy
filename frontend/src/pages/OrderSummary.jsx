import React, { useEffect, useState } from "react";
import {
  useNavigate,
  useLocation,
  Link,
  useSearchParams,
} from "react-router-dom";
import {
  CheckCircle2,
  Package,
  Truck,
  ArrowRight,
  Home,
  Download,
  ShoppingBag,
  MapPin,
  ExternalLink,
  RotateCcw,
  Loader2,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";

const API_URL = import.meta.env.VITE_API_URL;

export default function OrderSummary() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // 1. Logic: Determine Order ID (State vs URL)
  // If coming from internal navigation, we might have state.
  // If coming from Payment Gateway redirect, we rely on URL param.
  const stateOrder = location.state?.order || location.state;
  const urlOrderId = searchParams.get("orderId");

  const [order, setOrder] = useState(stateOrder || null);
  // Show loading only if we don't have the order data yet
  const [loading, setLoading] = useState(!stateOrder);

  // 2. Fetch Fresh Data (Vital for Payment Updates)
  useEffect(() => {
    const fetchOrderData = async () => {
      // Determine which ID to use
      const targetId = urlOrderId || stateOrder?._id;

      if (!targetId) {
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/api/orders/${targetId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (res.ok) {
          const freshData = await res.json();
          setOrder(freshData);
        } else {
          console.error("Failed to fetch order details");
        }
      } catch (error) {
        console.error("Error fetching order:", error);
      } finally {
        setLoading(false);
      }
    };

    // Always fetch fresh data to ensure Payment Status is up to date
    fetchOrderData();
  }, [urlOrderId, stateOrder?._id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#030712] text-white flex flex-col items-center justify-center font-sans">
        <ShoppingBag size={64} className="text-slate-700 mb-4" />
        <h2 className="text-2xl font-bold mb-4">No Order Found</h2>
        <p className="text-slate-400 mb-6">
          We couldn't retrieve the order details.
        </p>
        <Link
          to="/"
          className="bg-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-500 transition-colors"
        >
          Return to Shop
        </Link>
      </div>
    );
  }

  // --- HELPER: Get Dynamic Delivery Status Content ---
  const getDeliveryContent = () => {
    const status = order.status;

    // 1. Return Initiated / Returned (Auto-Approved)
    if (status === "Return Initiated" || status === "Returned") {
      return {
        label: "Return Status",
        value: "Return Initiated",
        subtext: "Refund processing has started automatically.",
        color: "text-purple-500",
        bg: "bg-purple-500/10",
        icon: <RotateCcw size={20} className="text-purple-500" />,
      };
    }

    // 2. Return Requested (Legacy/Manual)
    if (status === "Return Requested") {
      return {
        label: "Return Status",
        value: "Return Request Pending",
        subtext: "Waiting for seller approval",
        color: "text-orange-500",
        bg: "bg-orange-500/10",
        icon: <RotateCcw size={20} className="text-orange-500" />,
      };
    }

    // 3. Delivered
    if (status === "Delivered") {
      return {
        label: "Delivery Status",
        value: "Delivered Successfully",
        subtext: `Delivered on ${new Date(
          order.deliveredAt || order.updatedAt
        ).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}`,
        color: "text-green-500",
        bg: "bg-green-500/10",
        icon: <CheckCircle2 size={20} className="text-green-500" />,
      };
    }

    // 4. Cancelled (Smart Logic for Payment Message)
    if (status === "Cancelled") {
      // Default message for COD or Unpaid orders
      let cancelSubtext = "No Payment Deducted";

      // If the order was Paid Online OR explicitly marked as refunded
      if (order.isRefunded || (order.paymentMethod !== "COD" && order.isPaid)) {
        cancelSubtext = "Refund Processed to Original Source";
      }

      return {
        label: "Order Status",
        value: "Order Cancelled",
        subtext: cancelSubtext,
        color: "text-red-500",
        bg: "bg-red-500/10",
        icon: <CheckCircle2 size={20} className="text-red-500" />,
      };
    }

    // 5. Default (Processing/Shipped)
    return {
      label: "Estimated Delivery",
      value: "3-5 Business Days",
      subtext: "Standard Shipping",
      color: "text-slate-300",
      bg: "bg-blue-500/10",
      icon: <Truck size={20} className="text-blue-500" />,
    };
  };

  const deliveryInfo = getDeliveryContent();

  return (
    <div className="min-h-screen bg-[#030712] text-white font-sans">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-12 lg:py-20">
        {/* Header - Dynamic Title based on context */}
        <div className="text-center mb-12 animate-in fade-in zoom-in duration-700">
          <div
            className={`inline-flex items-center justify-center w-20 h-20 rounded-full border mb-6 ${
              order.status === "Returned" || order.status === "Return Initiated"
                ? "bg-purple-500/10 border-purple-500/20"
                : order.status === "Cancelled"
                ? "bg-red-500/10 border-red-500/20"
                : "bg-green-500/10 border-green-500/20"
            }`}
          >
            {order.status === "Returned" ||
            order.status === "Return Initiated" ? (
              <RotateCcw size={48} className="text-purple-500" />
            ) : order.status === "Cancelled" ? (
              <CheckCircle2 size={48} className="text-red-500" />
            ) : (
              <CheckCircle2 size={48} className="text-green-500" />
            )}
          </div>
          <h1 className="text-4xl font-black tracking-tight mb-3">
            {order.status === "Returned" || order.status === "Return Initiated"
              ? "Return Initiated"
              : order.status === "Cancelled"
              ? "Order Cancelled"
              : order.status === "Delivered"
              ? "Order Delivered"
              : "Order Summary"}
          </h1>
          <p className="text-slate-400">
            {order.status === "Returned" || order.status === "Return Initiated"
              ? "Your return has been initiated and refund is processing."
              : order.status === "Cancelled"
              ? "This order has been cancelled."
              : "Thank you for your purchase."}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* 1. Order Information Card */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Package size={20} className="text-blue-500" />
              </div>
              <h3 className="font-bold uppercase text-xs tracking-widest text-slate-300">
                Order Information
              </h3>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Order ID</span>
                <span className="font-mono font-bold text-orange-500 tracking-tighter">
                  {order._id ? order._id.slice(-8).toUpperCase() : "N/A"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total Amount</span>
                <span className="font-bold text-white text-lg">
                  ₹{order.totalPrice?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Payment Method</span>
                <span className="text-blue-400 font-bold uppercase text-[10px] bg-blue-500/10 px-2 py-1 rounded">
                  {order.paymentMethod}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Payment Status</span>
                <span
                  className={
                    order.isPaid
                      ? "text-green-500 font-bold"
                      : "text-orange-500 font-bold"
                  }
                >
                  {order.isPaid ? "Paid" : "Pending (COD)"}
                </span>
              </div>
              {/* Refund Status Display */}
              {(order.isRefunded ||
                (order.status === "Cancelled" &&
                  order.paymentMethod !== "COD" &&
                  order.isPaid)) && (
                <div className="flex justify-between text-sm animate-in fade-in slide-in-from-left-2">
                  <span className="text-slate-500">Refund Status</span>
                  <span className="text-purple-500 font-bold">Processed</span>
                </div>
              )}
            </div>

            {/* Clickable Item List */}
            <div className="mt-6 pt-6 border-t border-slate-800">
              <h4 className="text-[10px] font-black uppercase text-slate-500 mb-3 tracking-widest">
                Items Purchased
              </h4>
              <div className="space-y-4">
                {order.orderItems?.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <Link
                        to={`/product/${item.product}`}
                        className="w-12 h-12 bg-black rounded-lg overflow-hidden border border-slate-800 hover:border-orange-500 transition-colors shrink-0"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </Link>

                      <div className="flex flex-col">
                        <Link
                          to={`/product/${item.product}`}
                          className="text-xs font-bold text-slate-300 hover:text-orange-500 transition-colors line-clamp-1 flex items-center gap-1"
                        >
                          {item.name}{" "}
                          <ExternalLink
                            size={10}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          />
                        </Link>
                        <span className="text-[10px] text-slate-500 font-medium">
                          Price: ₹{item.price?.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-slate-400 block">
                        x{item.qty}
                      </span>
                      <span className="text-[10px] font-bold text-white">
                        ₹{(item.price * item.qty).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Delivery & Return Details Card */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2 rounded-lg ${deliveryInfo.bg}`}>
                {deliveryInfo.icon}
              </div>
              <h3 className="font-bold uppercase text-xs tracking-widest text-slate-300">
                {deliveryInfo.label}
              </h3>
            </div>

            <div className="space-y-6">
              {/* Dynamic Status Box */}
              <div className="bg-black/30 rounded-2xl p-4 border border-slate-800/50">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">
                  Status Update
                </span>
                <span className={`text-sm font-bold ${deliveryInfo.color}`}>
                  {deliveryInfo.value}
                </span>
                <p className="text-xs text-slate-400 mt-1">
                  {deliveryInfo.subtext}
                </p>
              </div>

              {/* Shipping Address */}
              <div className="flex gap-3">
                <MapPin size={16} className="text-slate-500 shrink-0" />
                <div>
                  <p className="text-sm text-white font-bold mb-1">
                    Shipping Address
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {order.shippingAddress?.address} <br />
                    {order.shippingAddress?.city},{" "}
                    {order.shippingAddress?.postalCode} <br />
                    {order.shippingAddress?.country || "India"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
              >
                <Download size={14} /> Download Invoice PDF
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            to="/account"
            state={{ activeTab: "orders" }}
            className="w-full sm:w-auto px-10 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-500 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-blue-600/20 uppercase text-xs tracking-widest"
          >
            Track My Order <ArrowRight size={18} />
          </Link>

          <Link
            to="/"
            className="w-full sm:w-auto px-10 py-4 bg-slate-900 border border-slate-800 text-white font-black rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 active:scale-95 uppercase text-xs tracking-widest"
          >
            <Home size={18} /> Back to Shopping
          </Link>
        </div>

        <p className="text-center text-slate-600 text-[10px] font-bold uppercase tracking-widest mt-16">
          Order Confirmation sent to your registered email
        </p>

        {/* Inside OrderSummary.jsx */}
        {order && order.orderItems && order.orderItems.length > 0 && (
          <section className="max-w-7xl mx-auto pb-20 mt-10">
            <SimilarProducts
              category={order.orderItems[0].category}
              // Extract the nested _id and ensure it's a string
              excludedProductIds={order.orderItems.map((item) =>
                String(item.product?._id || item.product)
              )}
            />
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}

function SimilarProducts({ category, excludedProductIds }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSimilar = async () => {
      if (!category) return;

      try {
        setLoading(true);
        const res = await fetch(
          `${API_URL}/api/products?category=${encodeURIComponent(
            category
          )}&limit=20`
        );

        if (res.ok) {
          const data = await res.json();
          const productList = Array.isArray(data) ? data : data.products || [];

          // 1. Create a Set of IDs to exclude for O(1) lookup speed
          // 2. Ensure everything is a string and trimmed
          const excludeSet = new Set(
            excludedProductIds.map((id) => String(id).trim())
          );

          // 3. Filter out the bought products
          const filtered = productList.filter((p) => {
            const productId = String(p._id).trim();
            return !excludeSet.has(productId);
          });

          // 4. Take only the top 4
          setProducts(filtered.slice(0, 4));
        }
      } catch (error) {
        console.error("Error fetching similar products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSimilar();
    // Use the length or a joined string to avoid infinite loops with arrays
  }, [category, excludedProductIds.join(",")]);

  if (loading) {
    return (
      <div className="mt-20">
        <div className="h-8 w-48 bg-slate-800 rounded animate-pulse mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="aspect-[3/4] bg-slate-900/40 rounded-3xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className="mt-20 animate-in fade-in slide-in-from-bottom-5 duration-1000">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-black uppercase tracking-tighter text-white">
            You Might Also Like
          </h3>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
            Based on your recent purchase
          </p>
        </div>
        <Link
          to={`/search?q=${encodeURIComponent(category)}`}
          className="text-blue-500 text-[10px] font-black uppercase tracking-widest hover:underline"
        >
          View All Products
        </Link>
      </div>

      {/* ✅ RENDERING USING PRODUCTCARD */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </div>
  );
}
