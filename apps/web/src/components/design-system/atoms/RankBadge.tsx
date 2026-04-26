/**
 * RankBadge — top-3 medal badge (gold / silver / bronze).
 *
 * Falls back to a neutral pill for ranks ≥ 4. Used in podiums, leaderboards
 * and display views.
 */

const STYLE_BY_RANK: Record<number, string> = {
  1: "bg-ping-yellow text-navy border-ping-yellow-deep shadow-[0_3px_0_#D9B400]",
  2: "bg-cool-gray text-navy border-cool-gray shadow-[0_3px_0_rgba(0,0,0,0.4)]",
  3: "bg-bronze text-white border-bronze shadow-[0_3px_0_rgba(0,0,0,0.4)]",
};

const FALLBACK = "bg-navy-deep text-cool-gray border-card";

const SIZE = {
  sm: "w-6 h-6 text-xs",
  md: "w-8 h-8 text-sm",
  lg: "w-12 h-12 text-lg",
} as const;

export type RankBadgeSize = keyof typeof SIZE;

export interface RankBadgeProps {
  rank: number;
  size?: RankBadgeSize;
}

export function RankBadge({ rank, size = "md" }: RankBadgeProps) {
  const cls = STYLE_BY_RANK[rank] ?? FALLBACK;
  return (
    <div
      className={`${SIZE[size]} ${cls} rounded-full border-2 flex items-center justify-center font-archivo font-extrabold tabular-nums`}
      aria-label={`Rang ${rank}`}
    >
      {rank}
    </div>
  );
}

export const RANK_BADGE_STYLES = STYLE_BY_RANK;
