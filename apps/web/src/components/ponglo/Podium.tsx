/**
 * Podium — Everything ELO DS (§5.3)
 *
 * Top-3 leaderboard podium. Layout: 2nd (left) · 1st (center, tallest) · 3rd (right).
 * Column heights: default [78, 56, 44]px. Ring colors: ping-yellow/cool-gray/bronze.
 * Background card: electric-blue per spec.
 */

import { TrendingDown, TrendingUp } from 'lucide-react';
import { PAvatar } from './PAvatar';

export interface PodiumPlayer {
  id: string;
  name: string;
  elo: number;
  /** ELO change after the most recent match (positive, negative, or 0/undefined). */
  delta?: number | null;
  /** Rank change vs previous match (>0 climbed, <0 dropped, 0/undefined hidden). */
  rankDelta?: number | null;
  avatar?: string;
}

export interface PodiumProps {
  /** Exactly 3 players, ordered: [1st, 2nd, 3rd] */
  top3: PodiumPlayer[];
  /** Column heights in px [2nd, 1st, 3rd] — default [56, 78, 44] */
  heights?: [number, number, number];
  /** Optional context label (e.g. league name) */
  scope?: string;
  className?: string;
}

const RINGS: string[] = [
  '#FFD400', // ping-yellow (1st)
  '#A8B0C0', // cool-gray (2nd / silver)
  '#CD7F32', // bronze (3rd)
];

const RANK_LABEL = ['🥇', '🥈', '🥉'];

export function Podium({
  top3,
  heights = [56, 78, 44],
  scope,
  className,
}: PodiumProps) {
  if (top3.length < 3) return null;

  // Columns displayed left → center → right = [2nd, 1st, 3rd] — visual order.
  // `heights` is in the same order: [2nd, 1st, 3rd], so we read it directly.
  const displayOrder: [number, number, number] = [1, 0, 2];

  return (
    <div
      className={`rounded-lg bg-electric-blue p-4 ${className ?? ''}`}
      data-testid="podium"
    >
      {scope && (
        <div className="text-center text-[10px] font-mono uppercase tracking-wider text-white/60 mb-3">
          {scope}
        </div>
      )}

      <div className="flex items-end justify-center gap-3">
        {displayOrder.map((playerIdx, colIdx) => {
          const player = top3[playerIdx];
          const barHeight = heights[colIdx];
          const rank = playerIdx + 1;
          const ring = RINGS[playerIdx];

          return (
            <div
              key={player.id}
              className="flex flex-col items-center gap-1"
              data-testid={`podium-rank-${rank}`}
            >
              {/* Avatar (couronne sur le 1er) */}
              <div className="relative">
                <PAvatar
                  name={player.name}
                  size={rank === 1 ? 48 : 40}
                  ring={ring}
                  imageUrl={player.avatar}
                />
                {rank === 1 && (
                  <span
                    className="absolute -top-3 -left-2 text-[20px] leading-none select-none drop-shadow-[0_2px_2px_rgba(0,0,0,0.4)]"
                    style={{ transform: "rotate(-45deg)" }}
                    aria-hidden
                  >
                    👑
                  </span>
                )}
              </div>

              {/* Medal */}
              <span className="text-lg leading-none">{RANK_LABEL[playerIdx]}</span>

              {/* Name */}
              <span className="text-[10px] font-bold text-white/90 max-w-[64px] text-center truncate">
                {player.name}
              </span>

              {/* ELO + delta */}
              <div className="flex items-baseline gap-1">
                <span className="text-[11px] font-mono font-bold text-lime tabular-nums">
                  {player.elo}
                </span>
                {typeof player.delta === "number" && player.delta !== 0 && (
                  <span
                    className={`text-[9px] font-mono font-bold tabular-nums ${
                      player.delta > 0 ? "text-lime" : "text-signal-red"
                    }`}
                  >
                    {player.delta > 0 ? "+" : ""}
                    {player.delta}
                  </span>
                )}
              </div>

              {/* Rank delta (▲/▼ + places) */}
              {typeof player.rankDelta === "number" && player.rankDelta !== 0 && (
                <span
                  className={`flex items-center gap-0.5 text-[9px] font-mono font-bold tabular-nums ${
                    player.rankDelta > 0 ? "text-lime" : "text-signal-red"
                  }`}
                  data-testid={`podium-rank-delta-${rank}`}
                  aria-label={`${
                    player.rankDelta > 0 ? "Monté de" : "Descendu de"
                  } ${Math.abs(player.rankDelta)} ${
                    Math.abs(player.rankDelta) > 1 ? "places" : "place"
                  }`}
                >
                  {player.rankDelta > 0 ? (
                    <TrendingUp size={10} aria-hidden />
                  ) : (
                    <TrendingDown size={10} aria-hidden />
                  )}
                  {Math.abs(player.rankDelta)}
                </span>
              )}

              {/* Pedestal bar */}
              <div
                className="w-16 rounded-t-sm bg-white/10 border-t border-white/20 flex items-center justify-center"
                style={{ height: barHeight }}
              >
                <span className="text-xl font-bold text-white/80 font-display">
                  {rank}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
