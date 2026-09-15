// Recurring mandala flourish -- the site's signature decorative motif,
// echoing the lace/mandala borders on the shop's own banner artwork.
export default function CornerMotif({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" aria-hidden="true">
      <circle cx="60" cy="60" r="58" stroke="currentColor" strokeWidth="0.6" />
      <circle cx="60" cy="60" r="42" stroke="currentColor" strokeWidth="0.6" />
      <circle cx="60" cy="60" r="26" stroke="currentColor" strokeWidth="0.6" />
      {Array.from({ length: 12 }).map((_, i) => (
        <line
          key={i}
          x1="60"
          y1="60"
          x2={60 + 58 * Math.cos((i * Math.PI) / 6)}
          y2={60 + 58 * Math.sin((i * Math.PI) / 6)}
          stroke="currentColor"
          strokeWidth="0.6"
        />
      ))}
    </svg>
  );
}
