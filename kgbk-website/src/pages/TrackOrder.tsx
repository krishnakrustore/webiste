import { useEffect, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Search, Package } from "lucide-react";
import { OrdersApi } from "../api/orders";
import { ApiError } from "../api/client";
import type { Order } from "../types/product";

const STATUS_LABEL: Record<Order["status"], string> = {
  pending: "Payment Pending",
  paid: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function TrackOrder() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Track Your Order | Krishna Gari Battala Kottu";
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setOrder(null);
    setLoading(true);
    try {
      const found = await OrdersApi.lookup(orderNumber.trim(), email.trim());
      setOrder(found);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full bg-white border border-charcoal/15 rounded-lg px-4 py-3 text-sm outline-none focus:border-gold transition-colors";
  const labelClass = "text-xs font-medium text-charcoal/55 mb-1.5 block";

  return (
    <div className="max-w-lg mx-auto px-5 md:px-8 py-16 md:py-24">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <p className="eyebrow text-gold mb-3">Order Status</p>
        <h1 className="font-display text-3xl md:text-4xl mb-2">Track Your Order</h1>
        <p className="text-charcoal/60 mb-8">Enter your order number and the email used at checkout.</p>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-charcoal/8 p-6 space-y-4 mb-8">
          <div>
            <label className={labelClass}>Order Number</label>
            <input required className={inputClass} placeholder="KGBK-XXXXXXXX" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input required type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-wine text-ivory py-3 text-sm font-medium hover:bg-wine-dark transition-colors disabled:opacity-60">
            <Search size={15} /> {loading ? "Searching..." : "Track Order"}
          </button>
        </form>

        {order && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-charcoal/8 p-6">
            <div className="flex items-center gap-3 mb-5">
              <Package size={20} className="text-wine" />
              <div>
                <p className="font-medium">{order.orderNumber}</p>
                <p className="text-xs text-charcoal/45">Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
              </div>
              <span className="ml-auto text-xs px-3 py-1.5 rounded-full bg-wine/10 text-wine font-medium">{STATUS_LABEL[order.status]}</span>
            </div>
            <div className="space-y-2 mb-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm text-charcoal/70">
                  <span>{item.name} &times; {item.quantity}</span>
                  <span>&#8377;{(item.price * item.quantity).toLocaleString("en-IN")}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-charcoal/10 pt-3 flex justify-between font-medium">
              <span>Total</span>
              <span className="text-wine">&#8377;{order.total.toLocaleString("en-IN")}</span>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
