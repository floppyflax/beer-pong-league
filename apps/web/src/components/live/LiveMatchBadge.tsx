/**
 * LiveMatchBadge — small status pill for a match or event.
 *
 * Variants:
 *   - `live`: pulsing lime dot + LIVE
 *   - `upcoming`: electric-blue dot + À VENIR
 *   - `finished`: cool-gray dot + TERMINÉ
 *   - `archived`: muted dot + ARCHIVÉ
 *
 * Backwards-compatible: passing `isLive` (boolean) keeps the legacy behavior
 * — true → live, false → nothing.
 */

export type LiveMatchStatus = "live" | "upcoming" | "finished" | "archived";

interface LiveMatchBadgeProps {
  /** Explicit status. Takes precedence over `isLive` when provided. */
  status?: LiveMatchStatus;
  /** Legacy boolean — true ≡ status="live", false ≡ render nothing. */
  isLive?: boolean;
  className?: string;
}

const CONFIG: Record<
  LiveMatchStatus,
  { label: string; dot: string; text: string; pulse: boolean }
> = {
  live: {
    label: "LIVE",
    dot: "bg-lime",
    text: "text-lime",
    pulse: true,
  },
  upcoming: {
    label: "À VENIR",
    dot: "bg-electric-blue",
    text: "text-electric-blue",
    pulse: false,
  },
  finished: {
    label: "TERMINÉ",
    dot: "bg-cool-gray",
    text: "text-cool-gray",
    pulse: false,
  },
  archived: {
    label: "ARCHIVÉ",
    dot: "bg-cool-gray/50",
    text: "text-cool-gray/70",
    pulse: false,
  },
};

export function LiveMatchBadge({
  status,
  isLive,
  className = "",
}: LiveMatchBadgeProps) {
  const resolved: LiveMatchStatus | null =
    status ?? (isLive === true ? "live" : isLive === false ? null : null);

  if (!resolved) return null;

  const cfg = CONFIG[resolved];
  return (
    <span
      data-testid="live-match-badge"
      data-status={resolved}
      className={`inline-flex items-center gap-1.5 ${className}`}
      aria-label={`Statut : ${cfg.label.toLowerCase()}`}
    >
      <span className="relative flex h-2 w-2">
        {cfg.pulse && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full ${cfg.dot} opacity-75`}
          />
        )}
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${cfg.dot}`}
        />
      </span>
      <span
        className={`text-[10px] font-mono font-bold uppercase tracking-widest ${cfg.text}`}
      >
        {cfg.label}
      </span>
    </span>
  );
}
