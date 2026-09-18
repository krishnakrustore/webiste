import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail } from "lucide-react";
import { BUSINESS_CONFIG } from "../../config/business";
import CornerMotif from "../ui/CornerMotif";

function InstagramIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M15 8h2V4h-2a4 4 0 0 0-4 4v2H9v4h2v6h4v-6h2.5l.5-4H15V8a1 1 0 0 1 1-1z" />
    </svg>
  );
}

const cols = [
  {
    title: "Shop",
    links: [
      { label: "Fabrics", to: "/collection/fabrics" },
      { label: "Sarees", to: "/collection/sarees" },
      { label: "Wedding Collection", to: "/collection/wedding-collection" },
      { label: "All Collections", to: "/collection" },
    ],
  },
  {
    title: "Know More",
    links: [
      { label: "About Us", to: "/about" },
      { label: "Our Blog", to: "/blog" },
      { label: "Work With Us", to: "/careers" },
      { label: "Our Stores", to: "/contact" },
      { label: "Track Your Order", to: "/track-order" },
    ],
  },
  {
    title: "Quick Links",
    links: [
      { label: "Payment Policy", to: "/policies/payment-policy" },
      { label: "Privacy Policy", to: "/policies/privacy-policy" },
      { label: "Shipping Policy", to: "/policies/shipping-policy" },
      { label: "Return & Exchange Policy", to: "/policies/returns-exchange" },
      { label: "Terms of Service", to: "/policies/terms-of-service" },
    ],
  },
];

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6, delay },
  };
}

export default function Footer() {
  return (
    <footer className="bg-charcoal text-ivory/80 pt-20 pb-8 relative overflow-hidden">
      <CornerMotif className="absolute -bottom-16 -right-16 w-72 h-72 text-gold/10" />
      <div className="max-w-[1440px] mx-auto px-5 md:px-8 relative">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-16">
          <motion.div {...fadeUp(0)} className="md:col-span-4">
            <div className="flex items-center gap-2.5 mb-1">
              <img
                src="/logo.png"
                alt="Krishna Gari Battala Kottu"
                className="h-8 w-auto"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
              <span className="font-display text-3xl text-ivory">Krishna Gari</span>
            </div>
            <p className="eyebrow text-[10px] text-gold-light mt-1 mb-5">Battala Kottu</p>
            <p className="text-sm leading-relaxed text-ivory/55 max-w-xs">
              A Hyderabad textile house curating fine silks, handwoven sarees and
              designer fabrics for life&rsquo;s most meaningful occasions.
            </p>
            <div className="flex gap-4 mt-6">
              {BUSINESS_CONFIG.instagram && (
                <a href={BUSINESS_CONFIG.instagram} target="_blank" rel="noopener noreferrer" className="text-ivory/60 hover:text-gold-light transition-colors">
                  <InstagramIcon />
                </a>
              )}
              {BUSINESS_CONFIG.facebook && (
                <a href={BUSINESS_CONFIG.facebook} target="_blank" rel="noopener noreferrer" className="text-ivory/60 hover:text-gold-light transition-colors">
                  <FacebookIcon />
                </a>
              )}
            </div>
          </motion.div>

          <div className="md:col-span-5 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {cols.map((col, i) => (
              <motion.div key={col.title} {...fadeUp(0.1 + i * 0.08)}>
                <p className="eyebrow text-[11px] text-gold-light mb-4">{col.title}</p>
                <ul className="space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link to={l.to} className="text-sm text-ivory/60 hover:text-ivory transition-colors">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          <motion.div {...fadeUp(0.35)} className="md:col-span-3">
            <p className="eyebrow text-[11px] text-gold-light mb-4">Customer Care</p>
            <a href={BUSINESS_CONFIG.mapsUrl} target="_blank" rel="noopener noreferrer" className="flex gap-2.5 text-sm text-ivory/60 hover:text-ivory transition-colors mb-3">
              <MapPin size={15} className="mt-0.5 shrink-0 text-gold" />
              <span>
                {BUSINESS_CONFIG.address.line1}, {BUSINESS_CONFIG.address.line2}
                <br />
                {BUSINESS_CONFIG.address.city} - {BUSINESS_CONFIG.address.pincode}
                <br />
                {BUSINESS_CONFIG.address.landmark}
              </span>
            </a>
            <a href={`tel:${BUSINESS_CONFIG.phone}`} className="flex items-center gap-2.5 text-sm text-ivory/60 hover:text-ivory transition-colors mb-3">
              <Phone size={15} className="text-gold" />
              {BUSINESS_CONFIG.phone}
            </a>
            <a href={`mailto:${BUSINESS_CONFIG.email}`} className="flex items-center gap-2.5 text-sm text-ivory/60 hover:text-ivory transition-colors">
              <Mail size={15} className="text-gold" />
              {BUSINESS_CONFIG.email}
            </a>
          </motion.div>
        </div>

        <span className="thread-line w-full opacity-30" />
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ivory/40">
          <p>&copy; {new Date().getFullYear()} Krishna Gari Battala Kottu. All rights reserved.</p>
          <p>Crafted in Hyderabad</p>
        </div>
      </div>
    </footer>
  );
}
