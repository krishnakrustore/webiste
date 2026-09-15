import { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Clock } from "lucide-react";
import { OrdersApi } from "../api/orders";
import type { Order } from "../types/product";
import WhatsAppButton from "../components/ui/WhatsAppButton";

export default function OrderConfirmation() {
  const { id } = useParams();
  const location = useLocation();
  const paymentUnavailable = Boolean((location.state as { paymentUnavailable?: boolean } | null)?.paymentUnavailable);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Order Confirmation | Krishna Gari Battala Kottu";
    if (!id) return;
    OrdersApi.get(id).then(setOrder).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="max-w-2xl mx-auto px-5 py-32 text-center text-charcoal/40">Loading...</div>;

  if (!order) {
    return (
      <div className="max-w-lg mx-auto px-5 py-32 text-center">
        <p className="font-display text-2xl mb-4">Order not found</p>
        <Link to="/" className="text-wine underline">Back to home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-16 md:py-24 text-center">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
        {paymentUnavailable ? (
          <Clock size={48} className="mx-auto mb-5 text-gold" />
        ) : (
          <CheckCircle2 size={48} className="mx-auto mb-5 text-green-700" />
        )}
        <p className="eyebrow text-gold mb-2">{paymentUnavailable ? "Order Received" : "Order Confirmed"}</p>
        <h1 className="font-display text-3xl md:text-4xl mb-3">
          {paymentUnavailable ? "Thank you! We'll confirm payment with you shortly." : "Thank you for your order!"}
        </h1>
        <p className="text-charcoal/60 mb-1">Order number</p>
        <p className="font-display text-2xl text-wine mb-8">{order.orderNumber}</p>

        {paymentUnavailable && (
          <p className="text-sm text-charcoal/60 max-w-md mx-auto mb-8 leading-relaxed">
            Online payment isn&rsquo;t live on the site yet, so your order has been saved and our team will reach out on WhatsApp
            to confirm payment and delivery details.
          </p>
        )}
      </motion.div>

      <div className="bg-white rounded-xl border border-charcoal/8 p-6 text-left mb-8">
        <div className="space-y-3 mb-5">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-charcoal/70">{item.name} &times; {item.quantity}</span>
              <span>&#8377;{(item.price * item.quantity).toLocaleString("en-IN")}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-charcoal/10 pt-3 space-y-1.5 text-sm">
          <div className="flex justify-between text-charcoal/60"><span>Subtotal</span><span>&#8377;{order.subtotal.toLocaleString("en-IN")}</span></div>
          <div className="flex justify-between text-charcoal/60"><span>Shipping</span><span>{order.shippingFee === 0 ? "Free" : `₹${order.shippingFee}`}</span></div>
          <div className="flex justify-between font-medium text-base pt-1"><span>Total</span><span className="text-wine">&#8377;{order.total.toLocaleString("en-IN")}</span></div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 justify-center">
        <Link to="/collection" className="rounded-full border border-wine text-wine px-6 py-3 text-sm hover:bg-wine hover:text-ivory transition-colors">
          Continue Shopping
        </Link>
        <WhatsAppButton
          message={`Hello, I'd like to follow up on my order ${order.orderNumber}.`}
          label="Message Us on WhatsApp"
        />
      </div>
    </div>
  );
}
