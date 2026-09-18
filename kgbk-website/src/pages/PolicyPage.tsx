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
    <div className="max-w-7xl mx-auto px-5 md:px-8 py-14 md:py-20">
      <div className="mb-10 text-center">
        <p className="eyebrow text-gold mb-3">Our Policies</p>
        <h1 className="font-display text-3xl md:text-5xl">Store Policies</h1>
      </div>

      {/* Mobile: dropdown selector (a sidebar column doesn't fit narrow screens) */}
      <div className="lg:hidden mb-8 text-center">
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

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_1fr] gap-10 lg:gap-8 items-start">
        {/* Column 1: categories -- desktop only */}
        <div className="hidden lg:block sticky top-28 space-y-1">
          {policies.map((p) => (
            <button
              key={p.slug}
              onClick={() => navigate(`/policies/${p.slug}`)}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors ${
                p.slug === active.slug ? "bg-wine text-ivory font-medium" : "text-charcoal/70 hover:bg-beige/40"
              }`}
            >
              {p.title}
            </button>
          ))}
        </div>

        {/* Column 2: image */}
        <motion.div
          key={`${active.slug}-image`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-sm aspect-[4/3] lg:aspect-auto lg:h-full lg:min-h-[420px] lg:sticky lg:top-28 min-w-0"
        >
          {active.image ? (
            <img src={active.image} alt={active.title} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-beige" />
          )}
        </motion.div>

        {/* Column 3: FAQ accordion */}
        <motion.div key={`${active.slug}-faq`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }} className="min-w-0">
          <h2 className="font-display text-2xl mb-1">{active.title}</h2>
          <p className="text-xs text-charcoal/40 mb-6">
            Last updated {new Date(active.updatedAt).toLocaleDateString("en-IN", { year: "numeric", month: "long" })}
          </p>

          <div className="space-y-3">
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
    </div>
  );
}
