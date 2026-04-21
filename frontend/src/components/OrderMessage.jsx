import { Link } from "react-router-dom";
import {
  PackageCheck,
  Clock3,
  Truck,
  CircleDollarSign,
  ArrowRight,
  ShoppingBag,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  XCircle,
} from "lucide-react";

const STATUS_CONFIG = {
  Processing: {
    bg: "bg-amber-100 dark:bg-amber-500/20",
    text: "text-amber-700 dark:text-amber-400",
    icon: Clock3,
  },
  Shipped: {
    bg: "bg-sky-100 dark:bg-sky-500/20",
    text: "text-sky-700 dark:text-sky-400",
    icon: Truck,
  },
  Delivered: {
    bg: "bg-emerald-100 dark:bg-emerald-500/20",
    text: "text-emerald-700 dark:text-emerald-400",
    icon: CheckCircle2,
  },
  Cancelled: {
    bg: "bg-rose-100 dark:bg-rose-500/20",
    text: "text-rose-700 dark:text-rose-400",
    icon: XCircle,
  },
  "Return Initiated": {
    bg: "bg-violet-100 dark:bg-violet-500/20",
    text: "text-violet-700 dark:text-violet-400",
    icon: RotateCcw,
  },
  Returned: {
    bg: "bg-slate-200 dark:bg-slate-700",
    text: "text-slate-700 dark:text-slate-300",
    icon: AlertCircle,
  },
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const OrderMessage = ({ data }) => {
  if (!data?.orders?.length) return null;

  return (
    <div
      className="w-full max-w-[310px] rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 backdrop-blur-sm shadow-lg overflow-hidden"
      style={{ animation: "chatFadeIn 0.3s ease-out" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <div className="flex items-center gap-1.5">
          <PackageCheck size={12} />
          <span className="text-[10px] font-bold uppercase tracking-widest">
            {data.summary || "Order Updates"}
          </span>
        </div>
        <span className="text-[9px] font-bold bg-white/15 px-1.5 py-0.5 rounded-full">
          {data.orders.length}
        </span>
      </div>

      {/* List */}
      <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/40">
        {data.orders.map((order) => {
          const config =
            STATUS_CONFIG[order.status] || STATUS_CONFIG.Processing;
          const StatusIcon = config.icon;

          return (
            <div
              key={order.id}
              className="p-3 space-y-2 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-black text-slate-900 dark:text-white">
                  Order #{order.shortId}
                </p>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${config.bg} ${config.text}`}
                >
                  <StatusIcon size={9} />
                  {order.status}
                </span>
              </div>

              {order.items?.length > 0 && (
                <div className="space-y-1">
                  {order.items.slice(0, 2).map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 text-[10px] text-slate-600 dark:text-slate-400"
                    >
                      <ShoppingBag
                        size={9}
                        className="shrink-0 text-slate-400"
                      />
                      <span className="truncate">{item.name}</span>
                      <span className="text-slate-400 shrink-0">
                        ×{item.qty}
                      </span>
                    </div>
                  ))}
                  {order.items.length > 2 && (
                    <p className="text-[9px] text-slate-400 pl-4">
                      +{order.items.length - 2} more item(s)
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock3 size={9} className="text-slate-400" />
                  {formatDate(order.createdAt)}
                </span>
                <span className="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200">
                  <CircleDollarSign size={9} className="text-orange-500" />₹
                  {Number(order.totalPrice).toLocaleString("en-IN")}
                </span>
                <span className="text-[9px] text-slate-400">
                  {order.paymentMethod}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700/40">
        <Link
          to="/account?tab=orders"
          className="flex items-center justify-center gap-1 text-[10px] font-bold text-orange-600 hover:text-orange-500 dark:text-orange-400 dark:hover:text-orange-300 transition-colors"
        >
          View All Orders
          <ArrowRight size={10} />
        </Link>
      </div>
    </div>
  );
};

export default OrderMessage;
