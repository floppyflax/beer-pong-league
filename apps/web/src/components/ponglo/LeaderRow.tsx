/**
 * LeaderRow — Everything ELO DS (§5.3)
 *
 * Full leaderboard row: rank # + PAvatar + name + Sparkline + ELO + delta.
 * "MOI" badge highlights the current user's row.
 *
 * Built on top of PAvatar + Sparkline (DS primitives) rather than wrapping ListRow,
 * since the leaderboard needs a tighter layout with sparklines.
 */

import { PAvatar } from './PAvatar';
import { Sparkline } from './Sparkline';

export interface LeaderboardPlayer {
  id: string;
  name: string;
  elo: number;
  delta?: number;
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

      {/* Avatar */}
      <PAvatar
        name={player.name}
        size={32}
        ring={ring}
        imageUrl={player.avatarUrl}
      />

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

      {/* ELO */}
      <div className="flex-shrink-0 flex flex-col items-end">
        <span className="text-sm font-mono font-bold tabular-nums text-lime">
          {player.elo}
        </span>
        {player.delta !== undefined && !deltaZero && (
          <span
            className={`text-[10px] font-mono tabular-nums ${
              deltaPositive ? 'text-lime' : 'text-signal-red'
            }`}
          >
            {deltaPositive ? '+' : ''}{player.delta}
          </span>
        )}
      </div>
    </Wrapper>
  );
}
