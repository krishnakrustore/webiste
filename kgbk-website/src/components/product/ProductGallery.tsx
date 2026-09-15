import { useRef, useState, type MouseEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ZoomIn } from "lucide-react";
import type { ProductImage } from "../../types/product";

export default function ProductGallery({ images }: { images: ProductImage[] }) {
  const [active, setActive] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [zooming, setZooming] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const current = images[active];

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)) });
  }

  return (
    <div className="flex flex-col-reverse md:flex-row gap-4">
      <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-visible md:w-20 shrink-0">
        {images.map((img, i) => (
          <button
            key={img.id}
            onClick={() => setActive(i)}
            className={`relative shrink-0 w-16 h-20 md:w-full md:h-24 rounded-sm overflow-hidden border-2 transition-colors duration-250 ${
              active === i ? "border-gold" : "border-transparent opacity-70 hover:opacity-100"
            }`}
          >
            <img src={img.src} alt={img.alt} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

      <div
        ref={frameRef}
        className="relative flex-1 aspect-[4/5] rounded-sm overflow-hidden bg-beige group hidden md:block"
        style={{ cursor: "zoom-in" }}
        onMouseEnter={() => setZooming(true)}
        onMouseLeave={() => setZooming(false)}
        onMouseMove={handleMouseMove}
        onClick={() => setFullscreen(true)}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={current?.src}
            src={current?.src}
            alt={current?.alt}
            initial={{ opacity: 0 }}
            animate={{ opacity: zooming ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </AnimatePresence>
        {zooming && current && (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${current.src})`,
              backgroundSize: "220%",
              backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
              backgroundRepeat: "no-repeat",
            }}
          />
        )}
        <div className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-ivory/85 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <ZoomIn size={16} className="text-charcoal" />
        </div>
      </div>

      {/* Mobile: plain tap-to-fullscreen image, no hover-zoom */}
      <button
        onClick={() => setFullscreen(true)}
        aria-label="View fullscreen"
        className="relative flex-1 aspect-[4/5] rounded-sm overflow-hidden bg-beige md:hidden"
      >
        <img src={current?.src} alt={current?.alt} className="absolute inset-0 w-full h-full object-cover" />
      </button>

      <AnimatePresence>
        {fullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-charcoal/95 flex items-center justify-center p-6"
            onClick={() => setFullscreen(false)}
          >
            <button className="absolute top-6 right-6 text-ivory" aria-label="Close">
              <X size={26} />
            </button>
            <motion.img
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={current?.src}
              alt={current?.alt}
              className="max-h-[85vh] max-w-full object-contain rounded-sm"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
