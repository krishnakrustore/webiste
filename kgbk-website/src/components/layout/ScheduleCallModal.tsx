import { useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, PhoneCall } from "lucide-react";
import { ScheduleCallApi } from "../../api/content";

export default function ScheduleCallModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ name: "", phone: "", preferredTime: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await ScheduleCallApi.create(form);
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again, or reach us on WhatsApp instead.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = "w-full bg-beige/30 border border-charcoal/12 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-gold transition-colors";
  const labelClass = "text-xs font-medium text-charcoal/55 mb-1.5 block";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] bg-charcoal/45 backdrop-blur-sm flex items-center justify-center px-5"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm bg-ivory rounded-2xl p-6 shadow-2xl relative"
        >
          <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 text-charcoal/40 hover:text-wine">
            <X size={18} />
          </button>

          {done ? (
            <div className="text-center py-6">
              <CheckCircle2 size={40} className="mx-auto mb-4 text-green-700" />
              <p className="font-display text-xl mb-2">Request Received</p>
              <p className="text-sm text-charcoal/60">We&rsquo;ll call you at your preferred time. Thank you!</p>
            </div>
          ) : (
            <>
              <PhoneCall size={22} className="text-wine mb-3" />
              <p className="font-display text-xl mb-1">Schedule a Call</p>
              <p className="text-sm text-charcoal/55 mb-5">Tell us when to call you and we&rsquo;ll reach out.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className={labelClass}>Name</label>
                  <input required className={inputClass} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className={labelClass}>Phone</label>
                  <input required type="tel" className={inputClass} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                </div>
                <div>
                  <label className={labelClass}>Preferred Time</label>
                  <input required placeholder="e.g. Today, 5-6 PM" className={inputClass} value={form.preferredTime} onChange={(e) => setForm((f) => ({ ...f, preferredTime: e.target.value }))} />
                </div>
                <div>
                  <label className={labelClass}>Notes (optional)</label>
                  <textarea rows={2} className={inputClass} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
                </div>
                {error && <p className="text-xs text-red-600">{error}</p>}
                <button type="submit" disabled={submitting} className="w-full rounded-full bg-wine text-ivory py-3 text-sm font-medium hover:bg-wine-dark transition-colors disabled:opacity-60">
                  {submitting ? "Sending..." : "Request Call"}
                </button>
              </form>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
