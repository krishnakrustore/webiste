import { useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useCustomerAuth } from "../../context/CustomerAuthContext";
import { ApiError } from "../../api/client";
import GoogleSignInButton from "./GoogleSignInButton";

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
            className="w-full max-w-sm bg-ivory rounded-2xl overflow-hidden shadow-2xl relative max-h-[92vh] overflow-y-auto"
          >
            <button onClick={closeAuth} aria-label="Close" className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-charcoal/40 text-ivory flex items-center justify-center hover:bg-charcoal/60 transition-colors">
              <X size={16} />
            </button>

            <div className="relative h-32">
              <img
                src="https://images.pexels.com/photos/30171215/pexels-photo-30171215.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ivory via-ivory/20 to-charcoal/20" />
            </div>

            <div className="p-6 pt-2">
              <p className="font-display text-xl mb-1">{mode === "login" ? "Log In" : "Create an Account"}</p>
              <p className="text-sm text-charcoal/55 mb-5">
                {mode === "login" ? "Access your wishlist and order history." : "Save your wishlist and track orders faster."}
              </p>

              <div className="mb-5">
                <GoogleSignInButton />
              </div>
              <div className="flex items-center gap-3 mb-5">
                <span className="h-px flex-1 bg-charcoal/10" />
                <span className="text-[11px] text-charcoal/40 uppercase tracking-wide">or</span>
                <span className="h-px flex-1 bg-charcoal/10" />
              </div>

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
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
