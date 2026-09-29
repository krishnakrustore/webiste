import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { usePolicies } from "../hooks/useContent";

export default function PolicyPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { policies, loading } = usePolicies();
  const [openIndex, setOpenIndex] = useState(0);

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
    <div className="max-w-6xl mx-auto px-5 md:px-8 py-12 md:py-16">
      <div className="mb-10 text-center">
        <p className="eyebrow text-gold mb-3">Our Policies</p>
        <h1 className="font-display text-3xl md:text-5xl">Store Policies</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] gap-10 lg:gap-14 items-start">
        {/* Left: image with the policy list directly underneath it */}
        <div className="min-w-0 lg:sticky lg:top-28">
          <motion.div
            key={`${active.slug}-image`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative overflow-hidden rounded-sm aspect-[4/3]"
          >
            {active.image ? (
              <img src={active.image} alt={active.title} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-beige" />
            )}
          </motion.div>

          <nav aria-label="Store policies" className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {policies.map((p) => (
              <button
                key={p.slug}
                onClick={() => navigate(`/policies/${p.slug}`)}
                aria-current={p.slug === active.slug ? "page" : undefined}
                className={`text-left px-3.5 py-2.5 rounded-lg text-[13px] leading-snug border transition-colors ${
                  p.slug === active.slug
                    ? "bg-wine text-ivory border-wine font-medium"
                    : "border-charcoal/10 text-charcoal/75 hover:border-gold hover:text-wine"
                }`}
              >
                {p.title}
              </button>
            ))}
          </nav>
        </div>

        {/* Right: FAQ accordion */}
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
