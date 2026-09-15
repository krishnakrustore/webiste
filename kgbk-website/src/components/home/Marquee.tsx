const WORDS = [
  "Banarasi Silk", "Kanchipuram", "Organza", "Tissue Silk", "Handloom Cotton",
  "Zari Brocade", "Ikat Weave", "Chikankari", "Kolkata Jamdani", "Chanderi",
];

export default function Marquee() {
  return (
    <div className="relative overflow-hidden bg-wine-dark py-2.5 border-y border-gold/25">
      <div className="flex whitespace-nowrap w-max" style={{ animation: "marquee-scroll 32s linear infinite" }}>
        {[...WORDS, ...WORDS].map((w, i) => (
          <span key={i} className="flex items-center gap-5 px-5 text-ivory/80 text-sm font-medium tracking-wide shrink-0">
            {w} <span className="text-gold text-[10px]">&#10022;</span>
          </span>
        ))}
      </div>
    </div>
  );
}
