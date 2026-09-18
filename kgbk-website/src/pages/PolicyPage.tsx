import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Plus, Minus } from "lucide-react";
import { usePolicies } from "../hooks/useContent";

export default function PolicyPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { policies, loading } = usePolicies();
  const [openIndex, setOpenIndex] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  const active = policies.find((p) => p.slug === slug) ?? policies[0];

  useEffect(() => {
    if (!loading && policies.length > 0 && !slug) {
      navigate(`/policies/${policies[0].slug}`, { replace: true });
    }
  }, [loading, policies, slug, navigate]);

  useEffect(() => {
    if (active) document.title = `${active.title} | Krishna Gari Battala Kottu`;
    setOpenIndex(0);
  }, [active]);

  if (loading) {
    return <div className="max-w-6xl mx-auto px-5 py-32 text-center text-charcoal/50">Loading...</div>;
  }

  if (!active) {
    return (
      <div className="max-w-lg mx-auto px-5 py-32 text-center">
        <p className="font-display text-2xl mb-4">No policies available yet</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-5 md:px-8 py-14 md:py-20">
      <div className="mb-10 text-center">
        <p className="eyebrow text-gold mb-3">Our Policies</p>
        <h1 className="font-display text-3xl md:text-5xl mb-6">Store Policies</h1>

        {/* Category dropdown selector */}
        <div className="relative inline-block max-w-full">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="inline-flex items-center gap-2.5 rounded-full border border-charcoal/15 bg-ivory px-6 py-3 text-sm font-medium text-wine hover:border-gold transition-colors"
          >
            {active.title}
            <ChevronDown size={15} className={`transition-transform duration-300 ${menuOpen ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-20 w-64 rounded-xl border border-charcoal/10 bg-ivory shadow-[0_16px_40px_-12px_rgba(20,20,20,0.25)] py-2 max-h-80 overflow-y-auto"
                >
                  {policies.map((p) => (
                    <button
                      key={p.slug}
                      onClick={() => {
                        navigate(`/policies/${p.slug}`);
                        setMenuOpen(false);
                      }}
                      className={`w-full text-left px-5 py-2.5 text-sm transition-colors ${
                        p.slug === active.slug ? "text-wine font-medium bg-champagne/30" : "text-charcoal/70 hover:bg-beige/40"
                      }`}
                    >
                      {p.title}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      <motion.div key={active.slug} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="text-center mb-8">
          <h2 className="font-display text-2xl md:text-3xl mb-2">{active.title}</h2>
          <p className="text-xs text-charcoal/40">
            Last updated {new Date(active.updatedAt).toLocaleDateString("en-IN", { year: "numeric", month: "long" })}
          </p>
        </div>

        <div className="relative overflow-hidden rounded-sm aspect-[21/9] md:aspect-[3/1] mb-10 max-w-4xl mx-auto">
          {active.image ? (
            <img src={active.image} alt={active.title} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-beige" />
          )}
        </div>

        <div className="max-w-3xl mx-auto space-y-3">
          {active.sections.map((s, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={s.heading} className="border border-charcoal/10 rounded-lg overflow-hidden bg-ivory">
                <button
                  onClick={() => setOpenIndex(isOpen ? -1 : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="font-display text-lg text-wine">{s.heading}</span>
                  {isOpen ? <Minus size={16} className="text-gold shrink-0" /> : <Plus size={16} className="text-charcoal/40 shrink-0" />}
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 text-charcoal/70 leading-relaxed">{s.body}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
