import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, ShieldCheck, Check, Minus, Plus, Trash2, CreditCard, Smartphone, Landmark, Wallet, RotateCcw, BadgeCheck } from "lucide-react";
import { useCart } from "../context/CartContext";
import { OrdersApi, PaymentsApi } from "../api/orders";
import { ApiError } from "../api/client";
import { BUSINESS_CONFIG } from "../config/business";

const INDIAN_STATES = [
  "Andhra Pradesh", "Telangana", "Karnataka", "Tamil Nadu", "Kerala", "Maharashtra",
  "Delhi", "Gujarat", "Rajasthan", "West Bengal", "Uttar Pradesh", "Other",
];

const FREE_SHIPPING_THRESHOLD = 2999;
const FLAT_SHIPPING_FEE = 99;
const STEPS = ["Cart", "Shipping", "Payment"] as const;

const TRUST_BADGES = [
  { icon: ShieldCheck, label: "100% Safe & Secure Payments" },
  { icon: RotateCcw, label: "7-Day Easy Returns" },
  { icon: BadgeCheck, label: "100% Authentic Products" },
];

const PAYMENT_METHODS = [
  { icon: CreditCard, label: "Credit / Debit Card" },
  { icon: Smartphone, label: "UPI" },
  { icon: Wallet, label: "Wallets" },
  { icon: Landmark, label: "Net Banking" },
];

export default function Checkout() {
  const { items, subtotal, updateQuantity, removeItem, clear } = useCart();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    customerName: "", email: "", phone: "",
    addressLine1: "", addressLine2: "", city: "", state: "Telangana", pincode: "", country: "India",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Checkout | Krishna Gari Battala Kottu";
  }, []);

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-5 py-24 text-center">
        <p className="font-display text-2xl mb-4">Your cart is empty</p>
        <Link to="/collection" className="text-wine underline">Continue shopping</Link>
      </div>
    );
  }

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_FEE;
  const total = subtotal + shippingFee;

  function goToPayment(e: FormEvent) {
    e.preventDefault();
    setStep(2);
  }

  async function handlePay() {
    setError("");
    setSubmitting(true);
    try {
      const order = await OrdersApi.create({
        ...form,
        addressLine2: form.addressLine2 || undefined,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      });

      let payment;
      try {
        payment = await PaymentsApi.createRazorpayOrder(order.id);
      } catch {
        // Razorpay not configured yet -- the order is safely saved as
        // "pending" in the database; let the shop follow up manually via
        // WhatsApp/phone rather than losing the order entirely.
        clear();
        navigate(`/order-confirmation/${order.id}`, { state: { paymentUnavailable: true } });
        return;
      }

      const razorpay = new window.Razorpay({
        key: payment.keyId,
        amount: payment.amount,
        currency: payment.currency,
        name: BUSINESS_CONFIG.name,
        description: `Order ${payment.orderNumber}`,
        order_id: payment.razorpayOrderId,
        prefill: { name: payment.customerName, email: payment.email, contact: payment.phone },
        theme: { color: "#7a1a2c" },
        handler: async (response) => {
          try {
            await PaymentsApi.verify({ orderId: order.id, ...response });
            clear();
            navigate(`/order-confirmation/${order.id}`);
          } catch {
            setError("Payment succeeded but verification failed. Please contact us with your order number: " + payment.orderNumber);
          }
        },
        modal: { ondismiss: () => setSubmitting(false) },
      });
      razorpay.open();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  const inputClass = "w-full bg-white border border-charcoal/15 rounded-lg px-4 py-3 text-sm outline-none focus:border-gold transition-colors";
  const labelClass = "text-xs font-medium text-charcoal/55 mb-1.5 block";

  return (
    <div className="max-w-6xl mx-auto px-5 md:px-8 py-8 md:py-12">
      {/* Stepper */}
      <div className="flex items-center justify-center gap-2 sm:gap-4 mb-8 md:mb-10">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0 transition-colors ${
                i < step ? "bg-wine text-ivory" : i === step ? "bg-wine text-ivory" : "bg-beige/60 text-charcoal/40"
              }`}>
                {i < step ? <Check size={13} /> : i + 1}
              </div>
              <span className={`text-sm ${i <= step ? "text-charcoal font-medium" : "text-charcoal/40"}`}>{label}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`w-8 sm:w-16 h-px ${i < step ? "bg-wine" : "bg-charcoal/15"}`} />}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-8 md:gap-12">
        <div className="min-w-0">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="cart" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.25 }}>
                <h1 className="font-display text-2xl md:text-3xl mb-5">Cart ({items.length} item{items.length !== 1 ? "s" : ""})</h1>
                <div className="bg-white rounded-xl border border-charcoal/8 divide-y divide-charcoal/8">
                  {items.map((item) => (
                    <div key={item.productId} className="flex gap-4 p-4">
                      <div className="w-16 h-20 rounded-lg bg-beige shrink-0 overflow-hidden">
                        {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2">{item.name}</p>
                        <p className="text-sm text-wine font-medium mt-1">&#8377;{(item.price * item.quantity).toLocaleString("en-IN")}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center border border-charcoal/15 rounded-full">
                            <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="p-1.5 hover:text-wine" aria-label="Decrease quantity"><Minus size={13} /></button>
                            <span className="text-xs w-6 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="p-1.5 hover:text-wine" aria-label="Increase quantity"><Plus size={13} /></button>
                          </div>
                          <button onClick={() => removeItem(item.productId)} className="text-charcoal/40 hover:text-red-600 transition-colors text-xs inline-flex items-center gap-1">
                            <Trash2 size={13} /> Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => setStep(1)} className="w-full mt-6 rounded-full bg-wine text-ivory py-4 text-sm font-medium hover:bg-wine-dark transition-colors">
                  Proceed to Shipping
                </button>
              </motion.div>
            )}

            {step === 1 && (
              <motion.form key="shipping" onSubmit={goToPayment} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25 }} className="space-y-5">
                <h1 className="font-display text-2xl md:text-3xl">Shipping Details</h1>
                <div className="bg-white rounded-xl border border-charcoal/8 p-5 grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Full Name</label>
                    <input required className={inputClass} value={form.customerName} onChange={(e) => set("customerName", e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Email</label>
                    <input required type="email" className={inputClass} value={form.email} onChange={(e) => set("email", e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Phone</label>
                    <input required type="tel" className={inputClass} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Address Line 1</label>
                    <input required className={inputClass} value={form.addressLine1} onChange={(e) => set("addressLine1", e.target.value)} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Address Line 2 (optional)</label>
                    <input className={inputClass} value={form.addressLine2} onChange={(e) => set("addressLine2", e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>City</label>
                    <input required className={inputClass} value={form.city} onChange={(e) => set("city", e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>State</label>
                    <select required className={inputClass} value={form.state} onChange={(e) => set("state", e.target.value)}>
                      {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Pincode</label>
                    <input required inputMode="numeric" pattern="[0-9]{6}" className={inputClass} value={form.pincode} onChange={(e) => set("pincode", e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Country</label>
                    <input disabled className={`${inputClass} opacity-60`} value={form.country} />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(0)} className="rounded-full border border-charcoal/15 px-6 py-3.5 text-sm">Back</button>
                  <button type="submit" className="flex-1 rounded-full bg-wine text-ivory py-3.5 text-sm font-medium hover:bg-wine-dark transition-colors">
                    Continue to Payment
                  </button>
                </div>
              </motion.form>
            )}

            {step === 2 && (
              <motion.div key="payment" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25 }} className="space-y-5">
                <h1 className="font-display text-2xl md:text-3xl">Payment</h1>

                <div className="bg-white rounded-xl border border-charcoal/8 p-5">
                  <p className="text-xs text-charcoal/45 mb-3 uppercase tracking-wide">Shipping to</p>
                  <p className="text-sm text-charcoal/75 leading-relaxed">
                    {form.customerName} &middot; {form.phone}<br />
                    {form.addressLine1}{form.addressLine2 ? `, ${form.addressLine2}` : ""}, {form.city}, {form.state} - {form.pincode}
                  </p>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {PAYMENT_METHODS.map((m) => (
                    <div key={m.label} className="bg-white rounded-lg border border-charcoal/8 p-3 flex flex-col items-center gap-1.5 text-center">
                      <m.icon size={17} className="text-wine" />
                      <span className="text-[10px] text-charcoal/55 leading-tight">{m.label}</span>
                    </div>
                  ))}
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)} className="rounded-full border border-charcoal/15 px-6 py-3.5 text-sm">Back</button>
                  <button onClick={handlePay} disabled={submitting} className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-wine text-ivory py-3.5 text-sm font-medium hover:bg-wine-dark transition-colors disabled:opacity-60">
                    <Lock size={15} /> {submitting ? "Processing..." : `Pay ₹${total.toLocaleString("en-IN")}`}
                  </button>
                </div>
                <p className="text-[11px] text-charcoal/40 flex items-center gap-1.5 justify-center">
                  <ShieldCheck size={13} /> Secure checkout powered by Razorpay
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Summary sidebar */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-xl border border-charcoal/8 p-6 h-fit lg:sticky lg:top-24 min-w-0">
          <p className="font-display text-xl mb-5">Price Details</p>
          <div className="space-y-2 text-sm mb-5">
            <div className="flex justify-between text-charcoal/60"><span>Subtotal</span><span>&#8377;{subtotal.toLocaleString("en-IN")}</span></div>
            <div className="flex justify-between text-charcoal/60">
              <span>Shipping</span>
              <span>{shippingFee === 0 ? "Free" : `₹${shippingFee}`}</span>
            </div>
            <div className="flex justify-between text-base font-medium pt-2 border-t border-charcoal/10">
              <span>Estimated Total</span><span className="text-wine">&#8377;{total.toLocaleString("en-IN")}</span>
            </div>
          </div>
          <div className="space-y-2.5 pt-4 border-t border-charcoal/10">
            {TRUST_BADGES.map((b) => (
              <div key={b.label} className="flex items-center gap-2.5 text-xs text-charcoal/55">
                <b.icon size={14} className="text-wine shrink-0" /> {b.label}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
