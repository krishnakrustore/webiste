import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, User } from "lucide-react";
import { useAdminAuth } from "../hooks/useAdminAuth";

export default function AdminLogin() {
  const { login, isAuthenticated } = useAdminAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate("/admin", { replace: true });
  }, [isAuthenticated, navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const ok = await login(username, password);
      if (ok) {
        navigate("/admin");
      } else {
        setError("Incorrect username or password.");
      }
    } catch {
      setError("Could not reach the server. Is the backend running?");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-charcoal px-5 overflow-hidden">
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full brand-glow" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full brand-glow" style={{ background: "radial-gradient(closest-side, var(--color-wine) 0%, transparent 70%)", opacity: 0.5 }} />
      <div className="absolute inset-0 bg-gradient-to-b from-charcoal via-charcoal/95 to-charcoal" />

      <motion.form
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-sm bg-ivory rounded-2xl p-8 shadow-2xl"
      >
        <p className="eyebrow text-gold mb-2 text-center">Krishna Gari Battala Kottu</p>
        <h1 className="font-display text-2xl text-center mb-1">Admin Panel</h1>
        <p className="text-xs text-charcoal/45 text-center mb-8">Manage products &amp; catalogue settings</p>

        <div className="space-y-4 mb-2">
          <div className="relative">
            <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/40" />
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="w-full bg-beige/40 border border-charcoal/10 rounded-lg pl-11 pr-4 py-3 text-sm outline-none focus:border-gold transition-colors"
            />
          </div>
          <div className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/40" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-beige/40 border border-charcoal/10 rounded-lg pl-11 pr-4 py-3 text-sm outline-none focus:border-gold transition-colors"
            />
          </div>
        </div>

        {error && <p className="text-xs text-red-700 mb-2">{error}</p>}

        <button type="submit" disabled={submitting} className="w-full mt-4 rounded-lg bg-wine text-ivory py-3 text-sm font-medium hover:bg-wine-dark transition-colors disabled:opacity-60">
          {submitting ? "Logging in..." : "Log In"}
        </button>

        <p className="text-[11px] text-charcoal/40 text-center mt-6 leading-relaxed">
          Development credentials &mdash; username <strong>admin</strong>, password <strong>admin123</strong>.
          <br />Change this after first login in a real deployment.
        </p>
      </motion.form>
    </div>
  );
}
