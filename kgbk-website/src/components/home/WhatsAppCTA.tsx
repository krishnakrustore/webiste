import { motion } from "framer-motion";
import WhatsAppButton from "../ui/WhatsAppButton";
import CornerMotif from "../ui/CornerMotif";
import { buildGeneralEnquiryMessage } from "../../config/business";

export default function WhatsAppCTA() {
  return (
    <section className="py-14 md:py-16 bg-wine relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, white 1px, transparent 1px)", backgroundSize: "26px 26px" }} />
      <CornerMotif className="absolute -top-10 -left-10 w-56 h-56 text-gold/15" />
      <CornerMotif className="absolute -bottom-14 -right-14 w-64 h-64 text-gold/10" />
      <motion.div
        className="absolute top-1/2 left-1/2 w-[36rem] h-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full brand-glow"
        style={{ opacity: 0.35 }}
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="relative max-w-3xl mx-auto px-5 text-center">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="eyebrow text-gold-light mb-4"
        >
          Let&rsquo;s talk fabric
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.08 }}
          className="font-display text-ivory text-4xl md:text-5xl leading-tight mb-6"
        >
          Found Something You Love?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.16 }}
          className="text-ivory/70 leading-relaxed mb-10 max-w-md mx-auto"
        >
          Talk directly to our team about availability, colours, pricing and details.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.24 }}
        >
          <WhatsAppButton message={buildGeneralEnquiryMessage()} size="lg" showArrow label="Chat on WhatsApp" className="!bg-ivory !text-wine hover:!bg-gold-light" />
        </motion.div>
      </div>
    </section>
  );
}
