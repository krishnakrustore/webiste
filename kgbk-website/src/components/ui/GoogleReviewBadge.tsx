import { Star } from "lucide-react";
import { useSettings } from "../../hooks/useContent";

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 19 13 24 13c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.6C29.7 35 27 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.6 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.6 5.6C41.6 36.6 44 30.8 44 24c0-1.3-.1-2.7-.4-3.5z" />
    </svg>
  );
}

/**
 * Only renders once real review data is set in Admin > Settings -- never
 * shows a fabricated rating or review count as a placeholder.
 */
export default function GoogleReviewBadge({ className = "" }: { className?: string }) {
  const { settings } = useSettings();
  if (!settings || settings.googleReviewCount <= 0) return null;

  return (
    <a
      href={settings.googleReviewUrl || undefined}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-[0_8px_24px_-10px_rgba(0,0,0,0.25)] ${className}`}
    >
      <GoogleIcon />
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-charcoal">{settings.googleRating.toFixed(1)}</span>
        <div className="flex text-gold">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} size={13} fill={i < Math.round(settings.googleRating) ? "currentColor" : "none"} strokeWidth={1.5} />
          ))}
        </div>
        <span className="text-xs text-charcoal/50">{settings.googleReviewCount.toLocaleString("en-IN")} Reviews</span>
      </div>
      {settings.googleReviewUrl && (
        <span className="ml-1 text-xs font-medium bg-charcoal text-ivory px-3 py-1.5 rounded-full">Review Now</span>
      )}
    </a>
  );
}
