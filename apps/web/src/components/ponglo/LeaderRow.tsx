/**
 * LeaderRow — Everything ELO DS (§5.3)
 *
 * Full leaderboard row: rank # + PAvatar (with rank-delta badge) + name +
 * Sparkline + ΔELO + ELO. "MOI" badge highlights the current user's row.
 *
 * Built on top of PAvatar + Sparkline (DS primitives) rather than wrapping ListRow,
 * since the leaderboard needs a tighter layout with sparklines.
 *
 * Visual convention shared with PlayerCard variant `leaderRow`:
 * - rank delta (▲/▼ + places) → small overlay badge on the avatar (top-left)
 * - ELO delta (±N) → left of the ELO so the ELO column stays right-aligned
 */

import { TrendingDown, TrendingUp } from 'lucide-react';
import { PAvatar } from './PAvatar';
import { Sparkline } from './Sparkline';

export interface LeaderboardPlayer {
  id: string;
  name: string;
  elo: number;
  delta?: number;
  /** Variation de rang vs dernier match (>0 monté, <0 descendu, 0/undefined masqué). */
  rankDelta?: number;
  eloHistory?: number[];
  avatarUrl?: string;
}

export interface LeaderRowProps {
  rank: number;
  player: LeaderboardPlayer;
  /** Highlight this row as the current user */
  isMe?: boolean;
  onClick?: () => void;
}

/** Ring color by rank */
function rankRing(rank: number): string | undefined {
  if (rank === 1) return '#FFD400'; // ping-yellow
  if (rank === 2) return '#A8B0C0'; // cool-gray (silver)
  if (rank === 3) return '#CD7F32'; // bronze
  return undefined;
}

const RANK_MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

export function LeaderRow({ rank, player, isMe = false, onClick }: LeaderRowProps) {
  const Wrapper = onClick ? 'button' : 'div';
  const wrapperProps = onClick ? { type: 'button' as const, onClick } : {};
  const ring = rankRing(rank);
  const deltaPositive = (player.delta ?? 0) > 0;
  const deltaZero = (player.delta ?? 0) === 0;

  return (
    <Wrapper
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors ${
        isMe
          ? 'bg-electric-blue/10 border-electric-blue/30'
          : 'bg-navy-soft border-card hover:border-card-muted'
      } ${onClick ? 'cursor-pointer' : ''}`}
      data-testid="leader-row"
      data-rank={rank}
      {...wrapperProps}
    >
      {/* Rank */}
      <div className="flex-shrink-0 w-7 text-center">
        {rank <= 3 ? (
          <span className="text-base">{RANK_MEDAL[rank]}</span>
        ) : (
          <span className="text-xs font-mono text-cool-gray tabular-nums">{rank}</span>
        )}
      </div>

      {/* Avatar (rank-delta badge en haut à gauche) */}
      <div className="relative flex-shrink-0">
        <PAvatar
          name={player.name}
          size={32}
          ring={ring}
          imageUrl={player.avatarUrl}
        />
        {typeof player.rankDelta === 'number' && player.rankDelta !== 0 && (
          <span
            className={`absolute -top-1 -left-1 min-w-[16px] h-[16px] px-0.5 rounded-full flex items-center gap-0.5 justify-center text-[9px] font-mono font-extrabold tabular-nums ring-2 ${
              isMe ? 'ring-electric-blue/40' : 'ring-navy-soft'
            } ${
              player.rankDelta > 0
                ? 'bg-lime text-navy'
                : 'bg-signal-red text-white'
            }`}
            data-testid="leader-row-rank-delta"
            aria-label={`${
              player.rankDelta > 0 ? 'Monté de' : 'Descendu de'
            } ${Math.abs(player.rankDelta)} ${
              Math.abs(player.rankDelta) > 1 ? 'places' : 'place'
            }`}
          >
            {player.rankDelta > 0 ? (
              <TrendingUp size={9} aria-hidden />
            ) : (
              <TrendingDown size={9} aria-hidden />
            )}
            {Math.abs(player.rankDelta)}
          </span>
        )}
      </div>

      {/* Name + badge */}
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span className="text-sm font-bold text-white truncate">{player.name}</span>
        {isMe && (
          <span className="flex-shrink-0 text-[9px] font-mono px-1 rounded bg-white text-navy">
            MOI
          </span>
        )}
      </div>

      {/* Sparkline */}
      {player.eloHistory && player.eloHistory.length >= 2 && (
        <Sparkline
          points={player.eloHistory}
          width={44}
          height={18}
          fill
          className="flex-shrink-0"
        />
      )}

      {/* ΔELO + ELO (delta à gauche pour aligner l'ELO à droite) */}
      <div className="flex-shrink-0 flex items-baseline gap-1.5">
        {player.delta !== undefined && !deltaZero && (
          <span
            className={`text-[10px] font-mono tabular-nums ${
              deltaPositive ? 'text-lime' : 'text-signal-red'
            }`}
          >
            {deltaPositive ? '+' : ''}{player.delta}
          </span>
        )}
        <span className="text-sm font-mono font-bold tabular-nums text-white">
          {player.elo}
        </span>
      </div>
    </Wrapper>
  );
}
