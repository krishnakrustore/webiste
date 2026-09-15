import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Truck, ChevronDown } from "lucide-react";
import { AdminOrdersApi } from "../../api/admin";
import { ApiError } from "../../api/client";
import type { Order, OrderStatus } from "../../types/product";

const STATUS_OPTIONS: OrderStatus[] = ["pending", "paid", "shipped", "delivered", "cancelled"];
const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-700",
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [shippingId, setShippingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Orders | Admin";
    reload();
  }, []);

  async function reload() {
    setLoading(true);
    const data = await AdminOrdersApi.list();
    setOrders(data);
    setLoading(false);
  }

  async function handleStatusChange(id: string, status: OrderStatus) {
    await AdminOrdersApi.updateStatus(id, status);
    reload();
  }

  async function handleShip(id: string) {
    setError("");
    setShippingId(id);
    try {
      await AdminOrdersApi.createShipment(id);
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create shipment.");
    } finally {
      setShippingId(null);
    }
  }

  return (
    <div className="p-6 md:p-10">
      <h1 className="text-2xl font-semibold mb-2">Orders</h1>
      <p className="text-sm text-charcoal/50 mb-8">{orders.length} total orders.</p>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <div className="space-y-4">
        {loading && <p className="text-sm text-charcoal/40">Loading...</p>}
        {!loading && orders.length === 0 && <p className="text-sm text-charcoal/40">No orders yet.</p>}
        {orders.map((o, i) => (
          <motion.div key={o.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="bg-white rounded-xl border border-charcoal/5 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div>
                <p className="font-medium">{o.orderNumber}</p>
                <p className="text-xs text-charcoal/45">{o.customerName} &middot; {o.email} &middot; {o.phone}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <select
                    value={o.status}
                    onChange={(e) => handleStatusChange(o.id, e.target.value as OrderStatus)}
                    className={`appearance-none text-xs font-medium px-3 py-1.5 pr-7 rounded-full outline-none cursor-pointer ${STATUS_COLOR[o.status]}`}
                  >
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
                  </select>
                  <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {o.status === "paid" && !o.shiprocketOrderId && (
                  <button onClick={() => handleShip(o.id)} disabled={shippingId === o.id} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-wine text-wine hover:bg-wine hover:text-ivory transition-colors disabled:opacity-50">
                    <Truck size={12} /> {shippingId === o.id ? "Creating..." : "Ship via Shiprocket"}
                  </button>
                )}
              </div>
            </div>
            <p className="text-xs text-charcoal/50 mb-3">
              {o.addressLine1}{o.addressLine2 ? `, ${o.addressLine2}` : ""}, {o.city}, {o.state} - {o.pincode}
            </p>
            <div className="border-t border-charcoal/8 pt-3 space-y-1">
              {o.items.map((item) => (
                <div key={item.id} className="flex justify-between text-xs text-charcoal/60">
                  <span>{item.name} &times; {item.quantity}</span>
                  <span>&#8377;{(item.price * item.quantity).toLocaleString("en-IN")}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-medium pt-1">
                <span>Total</span>
                <span className="text-wine">&#8377;{o.total.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
