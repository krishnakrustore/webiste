import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import WhatsAppButton from "../components/ui/WhatsAppButton";
import { buildGeneralEnquiryMessage } from "../config/business";

export default function ComingSoon({ title, eyebrow, body }: { title: string; eyebrow: string; body: string }) {
  useEffect(() => {
    document.title = `${title} | Krishna Gari Battala Kottu`;
  }, [title]);

  return (
    <div className="max-w-lg mx-auto px-5 py-24 md:py-32 text-center">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <p className="eyebrow text-gold mb-3">{eyebrow}</p>
        <h1 className="font-display text-3xl md:text-4xl mb-4">{title}</h1>
        <p className="text-charcoal/60 leading-relaxed mb-9">{body}</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <WhatsAppButton message={buildGeneralEnquiryMessage()} label="Message Us on WhatsApp" />
          <Link to="/collection" className="rounded-full border border-wine text-wine px-6 py-3 text-sm hover:bg-wine hover:text-ivory transition-colors">
            Browse Collection
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
