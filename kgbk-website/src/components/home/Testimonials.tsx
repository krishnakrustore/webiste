import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";
import { useTestimonials } from "../../hooks/useContent";
import SectionHeading from "../ui/SectionHeading";
import GoogleReviewBadge from "../ui/GoogleReviewBadge";

export default function Testimonials() {
  const { testimonials } = useTestimonials(true);
  if (testimonials.length === 0) return null;

  return (
    <section className="py-14 md:py-20 bg-offwhite">
      <div className="max-w-[1440px] mx-auto px-5 md:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
          <SectionHeading eyebrow="What our customers say" title="Customer Testimonials" />
          <GoogleReviewBadge />
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
              className="bg-white rounded-xl p-6 border border-charcoal/5 shadow-sm relative"
            >
              <Quote size={26} className="text-gold/30 mb-4" />
              <div className="flex text-gold mb-3">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} size={13} fill={s < t.rating ? "currentColor" : "none"} strokeWidth={1.5} />
                ))}
              </div>
              <p className="text-sm text-charcoal/70 leading-relaxed mb-6">&ldquo;{t.message}&rdquo;</p>
              <div className="flex items-center gap-3">
                {t.avatar ? (
                  <img src={t.avatar} alt={t.name} className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-wine/10 text-wine flex items-center justify-center text-sm font-medium">
                    {t.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-charcoal/45">{t.location} &middot; {t.source}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
