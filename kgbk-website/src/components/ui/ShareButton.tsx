import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Share2, MessageCircle, Link2, Check } from "lucide-react";

// lucide-react no longer ships brand glyphs, so these are drawn directly.
function FacebookIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M14 13.5h2.5l1-4H14V7.5c0-1.03 0-2 2-2h1.5V2.14C17.17 2.1 15.95 2 14.66 2 11.98 2 10 3.64 10 6.7V9.5H7v4h3V22h4v-8.5Z" />
    </svg>
  );
}

function XIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.9 2H22l-7.6 8.7L23.3 22H16.6l-5.2-6.8L5.4 22H2.3l8.1-9.3L1.5 2h6.9l4.7 6.2L18.9 2Zm-1.2 18h1.7L7.4 4h-1.8l12.1 16Z" />
    </svg>
  );
}

export default function ShareButton({ title }: { title: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const url = typeof window !== "undefined" ? window.location.href : "";

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard access denied -- ignore, link remains shareable via the other options
    }
  }

  const links = [
    { label: "Facebook", icon: FacebookIcon, href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
    { label: "X", icon: XIcon, href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}` },
    { label: "WhatsApp", icon: MessageCircle, href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}` },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Share this product"
        className="w-9 h-9 rounded-full border border-charcoal/15 flex items-center justify-center text-charcoal/60 hover:border-wine hover:text-wine transition-colors"
      >
        <Share2 size={15} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 flex flex-col gap-1 bg-ivory rounded-xl shadow-xl border border-charcoal/8 p-2 z-20"
          >
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-charcoal/70 hover:bg-beige/40 hover:text-wine transition-colors whitespace-nowrap"
              >
                <l.icon size={14} /> {l.label}
              </a>
            ))}
            <button
              onClick={copyLink}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-charcoal/70 hover:bg-beige/40 hover:text-wine transition-colors whitespace-nowrap"
            >
              {copied ? <Check size={14} /> : <Link2 size={14} />} {copied ? "Copied!" : "Copy Link"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
