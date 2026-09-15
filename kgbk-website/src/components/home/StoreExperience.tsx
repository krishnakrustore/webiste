import { motion } from "framer-motion";
import { MapPin, Clock, ArrowUpRight } from "lucide-react";
import { BUSINESS_CONFIG } from "../../config/business";

export default function StoreExperience() {
  return (
    <section id="store" className="py-14 md:py-20 bg-ivory">
      <div className="max-w-[1440px] mx-auto px-5 md:px-8 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-sm aspect-[4/3] md:aspect-auto md:h-full md:min-h-[420px] order-2 md:order-1 min-w-0"
        >
          <iframe
            title="Krishna Gari Battala Kottu location"
            src="https://www.google.com/maps?q=Jubilee+Hills+Peddamma+Temple+Hyderabad&output=embed"
            className="absolute inset-0 w-full h-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="order-1 md:order-2 min-w-0"
        >
          <p className="eyebrow text-gold mb-4">Come see us</p>
          <h2 className="font-display text-4xl md:text-5xl leading-[1.1] mb-6">Visit Us in Jubilee Hills</h2>
          <span className="thread-line w-16 mb-8 block" />

          <div className="space-y-5 mb-9">
            <div className="flex gap-3">
              <MapPin size={18} className="text-gold mt-0.5 shrink-0" />
              <p className="text-charcoal/70 leading-relaxed">
                Krishna Gari Battala Kottu<br />
                {BUSINESS_CONFIG.address.line1}, {BUSINESS_CONFIG.address.line2}<br />
                {BUSINESS_CONFIG.address.city} - {BUSINESS_CONFIG.address.pincode}<br />
                {BUSINESS_CONFIG.address.landmark}
              </p>
            </div>
            <div className="flex gap-3">
              <Clock size={18} className="text-gold mt-0.5 shrink-0" />
              <div className="text-charcoal/70 leading-relaxed">
                {BUSINESS_CONFIG.hours.map((h) => (
                  <p key={h.days}>{h.days}: {h.time}</p>
                ))}
              </div>
            </div>
          </div>

          <motion.a
            href={BUSINESS_CONFIG.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2.5 rounded-full border border-wine text-wine px-7 py-3.5 text-sm font-medium hover:bg-wine hover:text-ivory transition-colors duration-300"
          >
            Get Directions <ArrowUpRight size={15} />
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}
