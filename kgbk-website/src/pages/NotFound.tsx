import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function NotFound() {
  useEffect(() => {
    document.title = "Page Not Found | Krishna Gari Battala Kottu";
  }, []);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-5">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center max-w-md">
        <p className="eyebrow text-gold mb-4">404</p>
        <h1 className="font-display text-4xl md:text-5xl mb-6 leading-tight">This Collection Isn&rsquo;t Here</h1>
        <p className="text-charcoal/60 mb-9">The page you&rsquo;re looking for may have moved, or never existed. Let&rsquo;s get you back to the collection.</p>
        <Link to="/" className="inline-flex items-center gap-2 rounded-full bg-wine text-ivory px-7 py-3.5 text-sm font-medium hover:bg-wine-dark transition-colors">
          Return Home
        </Link>
      </motion.div>
    </div>
  );
}
