/**
 * LiveMatchBadge — animated LIVE indicator.
 *
 * Phase D.4 — Beer Pong ELO redesign.
 *
 * Renders a pulsing lime dot + "LIVE" label when a match is active.
 * Uses only Tailwind tokens — no hardcoded colors (invariant #4).
 */

interface LiveMatchBadgeProps {
  /** Whether the match is currently live. If false, renders nothing. */
  isLive: boolean;
  className?: string;
}

export function LiveMatchBadge({ isLive, className = "" }: LiveMatchBadgeProps) {
  if (!isLive) return null;

  return (
    <span
      data-testid="live-match-badge"
      className={`inline-flex items-center gap-1.5 ${className}`}
      aria-label="Match en direct"
    >
      {/* Pulsing dot */}
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-lime" />
      </span>
      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-lime">
        LIVE
      </span>
    </span>
  );
}
