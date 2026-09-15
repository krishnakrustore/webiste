import { useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { BUSINESS_CONFIG, buildGeneralEnquiryMessage } from "../config/business";
import WhatsAppButton from "../components/ui/WhatsAppButton";
import SectionHeading from "../components/ui/SectionHeading";

export default function Contact() {
  useEffect(() => {
    document.title = "Contact | Krishna Gari Battala Kottu";
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-5 md:px-8 py-16 md:py-24">
      <SectionHeading eyebrow="Get in Touch" title="Contact Us" align="center" />

      <div id="store" className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.55 }} className="space-y-7 min-w-0">
          <div className="flex gap-4">
            <MapPin size={20} className="text-gold mt-1 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium mb-1">Studio Address</p>
              <p className="text-charcoal/65 leading-relaxed">
                {BUSINESS_CONFIG.address.line1}, {BUSINESS_CONFIG.address.line2}<br />
                {BUSINESS_CONFIG.address.city} - {BUSINESS_CONFIG.address.pincode}, {BUSINESS_CONFIG.address.state}<br />
                {BUSINESS_CONFIG.address.landmark}
              </p>
              <a href={BUSINESS_CONFIG.mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-sm text-wine underline">
                Get Directions
              </a>
            </div>
          </div>
          <div className="flex gap-4">
            <Phone size={20} className="text-gold mt-1 shrink-0" />
            <div>
              <p className="text-sm font-medium mb-1">Phone</p>
              <a href={`tel:${BUSINESS_CONFIG.phone}`} className="text-charcoal/65 hover:text-wine">{BUSINESS_CONFIG.phone}</a>
            </div>
          </div>
          <div className="flex gap-4">
            <Mail size={20} className="text-gold mt-1 shrink-0" />
            <div>
              <p className="text-sm font-medium mb-1">Email</p>
              <a href={`mailto:${BUSINESS_CONFIG.email}`} className="text-charcoal/65 hover:text-wine">{BUSINESS_CONFIG.email}</a>
            </div>
          </div>
          <div className="flex gap-4">
            <Clock size={20} className="text-gold mt-1 shrink-0" />
            <div>
              <p className="text-sm font-medium mb-1">Studio Hours</p>
              {BUSINESS_CONFIG.hours.map((h) => (
                <p key={h.days} className="text-charcoal/65">{h.days}: {h.time}</p>
              ))}
            </div>
          </div>
          <WhatsAppButton message={buildGeneralEnquiryMessage()} size="lg" showArrow />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.55, delay: 0.1 }} className="rounded-sm overflow-hidden aspect-[4/3] md:aspect-auto md:h-full md:min-h-[320px] min-w-0">
          <iframe
            title="Krishna Gari Battala Kottu location"
            src="https://www.google.com/maps?q=Jubilee+Hills+Peddamma+Temple+Hyderabad&output=embed"
            className="w-full h-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </motion.div>
      </div>
    </div>
  );
}
