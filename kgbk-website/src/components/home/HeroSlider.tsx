import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useBanners } from "../../hooks/useContent";
import ban1 from "../../assets/banners/ban1.png";
import ban2 from "../../assets/banners/ban2.png";
import ban3 from "../../assets/banners/ban3.png";

// Fallback slides shown until Admin > Banners has at least one active
// banner -- keeps the hero from ever being empty.
const FALLBACK_SLIDES = [
  { src: ban1, to: "/collection", alt: "Everyday collection" },
  { src: ban2, to: "/collection/wedding-collection", alt: "Wedding collection" },
  { src: ban3, to: "/collection/silk-collection", alt: "Silk collection" },
];

const AUTO_MS = 6500;

export default function HeroSlider() {
  const { banners, loading } = useBanners(true);
  const [index, setIndex] = useState(0);

  const slides = useMemo(
    () => (banners.length > 0 ? banners.map((b) => ({ src: b.image, to: b.link || "/collection", alt: b.alt || "Featured collection" })) : FALLBACK_SLIDES),
    [banners]
  );

  const next = useCallback(() => setIndex((i) => (i + 1) % slides.length), [slides.length]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + slides.length) % slides.length), [slides.length]);

  useEffect(() => {
    if (index >= slides.length) setIndex(0);
  }, [slides.length, index]);

  useEffect(() => {
    const t = setInterval(next, AUTO_MS);
    return () => clearInterval(t);
  }, [next]);

  if (loading) {
    return <section className="w-full h-[62vh] sm:h-[76vh] max-h-[680px] min-h-[420px] bg-charcoal animate-pulse" />;
  }

  const slide = slides[index];

  return (
    <section className="relative w-full overflow-hidden bg-charcoal h-[62vh] sm:h-[76vh] max-h-[680px] min-h-[420px]">
      <AnimatePresence mode="sync">
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          <Link to={slide.to} className="block absolute inset-0">
            <img
              src={slide.src}
              alt={slide.alt}
              className="absolute inset-0 w-full h-full object-cover object-left sm:object-center"
            />
          </Link>
        </motion.div>
      </AnimatePresence>

      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous slide"
            className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-ivory/85 backdrop-blur-sm flex items-center justify-center text-charcoal transition-all duration-300 hover:bg-ivory hover:scale-105"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={next}
            aria-label="Next slide"
            className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-ivory/85 backdrop-blur-sm flex items-center justify-center text-charcoal transition-all duration-300 hover:bg-ivory hover:scale-105"
          >
            <ChevronRight size={18} />
          </button>

          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => setIndex(i)}
                className="relative h-1.5 rounded-full overflow-hidden bg-ivory/40"
                style={{ width: i === index ? 26 : 7, transition: "width 0.4s ease" }}
              >
                {i === index && (
                  <motion.span
                    key={index}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: AUTO_MS / 1000, ease: "linear" }}
                    className="absolute inset-0 bg-gold origin-left"
                  />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
