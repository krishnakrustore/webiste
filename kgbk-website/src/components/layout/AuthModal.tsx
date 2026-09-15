import { useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User } from "lucide-react";
import { useCustomerAuth } from "../../context/CustomerAuthContext";
import { ApiError } from "../../api/client";

export default function AuthModal() {
  const { authOpen, closeAuth, login, register } = useCustomerAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(form.email, form.password);
      } else {
        await register(form.name, form.email, form.phone, form.password);
      }
      setForm({ name: "", email: "", phone: "", password: "" });
      closeAuth();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = "w-full bg-beige/30 border border-charcoal/12 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-gold transition-colors";
  const labelClass = "text-xs font-medium text-charcoal/55 mb-1.5 block";

  return (
    <AnimatePresence>
      {authOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] bg-charcoal/45 backdrop-blur-sm flex items-center justify-center px-5"
          onClick={closeAuth}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-ivory rounded-2xl p-6 shadow-2xl relative"
          >
            <button onClick={closeAuth} aria-label="Close" className="absolute top-4 right-4 text-charcoal/40 hover:text-wine">
              <X size={18} />
            </button>

            <div className="w-10 h-10 rounded-full bg-wine/10 text-wine flex items-center justify-center mb-3">
              <User size={17} />
            </div>
            <p className="font-display text-xl mb-1">{mode === "login" ? "Log In" : "Create an Account"}</p>
            <p className="text-sm text-charcoal/55 mb-5">
              {mode === "login" ? "Access your wishlist and order history." : "Save your wishlist and track orders faster."}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <>
                  <div>
                    <label className={labelClass}>Full Name</label>
                    <input required className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Phone</label>
                    <input required type="tel" className={inputClass} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
                  </div>
                </>
              )}
              <div>
                <label className={labelClass}>Email</label>
                <input required type="email" className={inputClass} value={form.email} onChange={(e) => set("email", e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Password</label>
                <input required type="password" minLength={6} className={inputClass} value={form.password} onChange={(e) => set("password", e.target.value)} />
              </div>
              {error && <p className="text-xs text-red-600">{error}</p>}
              <button type="submit" disabled={submitting} className="w-full rounded-full bg-wine text-ivory py-3 text-sm font-medium hover:bg-wine-dark transition-colors disabled:opacity-60">
                {submitting ? "Please wait..." : mode === "login" ? "Log In" : "Create Account"}
              </button>
            </form>

            <p className="text-xs text-charcoal/50 text-center mt-5">
              {mode === "login" ? "New here?" : "Already have an account?"}{" "}
              <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }} className="text-wine font-medium hover:underline">
                {mode === "login" ? "Create an account" : "Log in"}
              </button>
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
