import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, X, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProducts } from "../../hooks/useProducts";
import { productUrl } from "../../utils/productUrl";

export default function SearchOverlay({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const { products } = useProducts();
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.material.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [query, products]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-charcoal/50 backdrop-blur-md flex items-start justify-center pt-24 md:pt-32 px-5"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: -16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.98 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-ivory rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center gap-3 px-6 py-5 border-b border-charcoal/10">
          <Search size={18} className="text-charcoal/50" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search fabrics, sarees, colours..."
            className="flex-1 bg-transparent outline-none font-display text-xl placeholder:text-charcoal/35"
          />
          <button onClick={onClose} aria-label="Close search" className="text-charcoal/50 hover:text-wine">
            <X size={20} />
          </button>
        </div>
        {results.length > 0 && (
          <motion.div initial="hidden" animate="show" className="max-h-80 overflow-y-auto">
            {results.map((p, i) => (
              <motion.button
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => {
                  navigate(productUrl(p));
                  onClose();
                }}
                className="w-full flex items-center gap-4 px-6 py-3 hover:bg-beige/50 transition-colors text-left"
              >
                <img src={p.images[0]?.src} alt="" className="w-12 h-14 object-cover rounded" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-xs text-charcoal/50">{p.category}</p>
                </div>
                <ArrowRight size={15} className="text-gold" />
              </motion.button>
            ))}
          </motion.div>
        )}
        {query && results.length === 0 && (
          <p className="px-6 py-8 text-center text-sm text-charcoal/50">No pieces found for &ldquo;{query}&rdquo;</p>
        )}
      </motion.div>
    </motion.div>
  );
}
