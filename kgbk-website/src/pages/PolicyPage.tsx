import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { POLICIES } from "../data/policies";

export default function PolicyPage() {
  const { slug } = useParams();
  const policy = slug ? POLICIES[slug] : undefined;

  useEffect(() => {
    if (policy) document.title = `${policy.title} | Krishna Gari Battala Kottu`;
  }, [policy]);

  if (!policy) {
    return (
      <div className="max-w-lg mx-auto px-5 py-32 text-center">
        <p className="font-display text-2xl mb-4">Page not found</p>
        <Link to="/" className="text-wine underline">Back to home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-5 md:px-8 py-16 md:py-24">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <p className="eyebrow text-gold mb-3">Policies</p>
        <h1 className="font-display text-3xl md:text-4xl mb-2">{policy.title}</h1>
        <p className="text-xs text-charcoal/40 mb-10">{policy.updated}</p>

        <div className="space-y-8">
          {policy.sections.map((s) => (
            <div key={s.heading}>
              <h2 className="font-display text-xl mb-2 text-wine">{s.heading}</h2>
              <p className="text-charcoal/70 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
