/**
 * MatchRow — Everything ELO DS (§5.3)
 *
 * Match history or live match row. Two variants:
 * - `history`: border-left lime (won) / signal-red (lost) + personal ELO delta
 * - `match`: neutral score display, no border-left (used in event bracket view)
 */

import { CheckCircle2, Hourglass, XCircle } from 'lucide-react';
import type { Match } from '@/types';

export interface MatchRowProps {
  match: Match;
  variant: 'history' | 'match';
  /** Current player perspective — determines won/lost coloring in history variant */
  userPerspective?: 'won' | 'lost';
  /** Current player's ID — used to derive perspective if userPerspective not given */
  currentPlayerId?: string;
  /** Player name lookup for displaying team names */
  playerNames?: Record<string, string>;
  className?: string;
  /**
   * Mig 030 — anti-cheat status. When omitted, defaults to the value on
   * `match.status` (if present) or `'confirmed'`. Drives the inline badge.
   */
  status?: 'pending' | 'confirmed' | 'rejected';
  /**
   * Mig 030 — when the parent event/league has `anti_cheat_enabled = true`,
   * confirmed matches get a "Validé" badge. Default `false` — no badge on
   * confirmed for legacy/non-anti-cheat contexts.
   */
  antiCheatEnabled?: boolean;
}

function formatPlayerList(ids: string[], names?: Record<string, string>): string {
  if (!names) return ids.slice(0, 2).join(', ');
  return ids.map((id) => names[id] ?? id.slice(0, 6)).join(' & ');
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
    });
  } catch {
    return dateStr;
  }
}

export function MatchRow({
  match,
  variant,
  userPerspective,
  currentPlayerId,
  playerNames,
  className,
  status,
  antiCheatEnabled = false,
}: MatchRowProps) {
  const effectiveStatus = status ?? match.status ?? 'confirmed';
  // Derive perspective from currentPlayerId if not explicitly given
  const effectivePerspective =
    userPerspective ??
    (currentPlayerId
      ? match.teamA.includes(currentPlayerId)
        ? match.scoreA > match.scoreB
          ? 'won'
          : 'lost'
        : match.teamB.includes(currentPlayerId)
          ? match.scoreB > match.scoreA
            ? 'won'
            : 'lost'
          : undefined
      : undefined);

  const teamALabel = formatPlayerList(match.teamA, playerNames);
  const teamBLabel = formatPlayerList(match.teamB, playerNames);

  // Personal ELO delta for history variant
  const personalDelta =
    currentPlayerId && match.eloChanges
      ? match.eloChanges[currentPlayerId]
      : undefined;

  const borderColor =
    variant === 'history' && effectivePerspective
      ? effectivePerspective === 'won'
        ? 'border-l-lime'
        : 'border-l-signal-red'
      : 'border-l-transparent';

  const outcomeLabel =
    variant === 'history' && effectivePerspective
      ? effectivePerspective === 'won'
        ? 'Victoire'
        : 'Défaite'
      : null;

  const outcomeLabelClass =
    effectivePerspective === 'won'
      ? 'text-lime'
      : 'text-signal-red';

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 bg-navy-soft rounded-lg border border-card border-l-4 ${borderColor} ${className ?? ''}`}
      data-testid="match-row"
    >
      {/* Date */}
      <div className="flex-shrink-0 text-[10px] font-mono text-cool-gray w-12">
        {formatDate(match.date)}
      </div>

      {/* Teams + score */}
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-white truncate font-medium">{teamALabel}</span>
          <span className="text-cool-gray font-mono tabular-nums flex-shrink-0">
            {match.scoreA} – {match.scoreB}
          </span>
          <span className="text-white truncate font-medium">{teamBLabel}</span>
        </div>
      </div>

      {/* Status badge (mig 030 — anti-cheat) */}
      {effectiveStatus === 'pending' && (
        <span
          className="flex-shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-ping-yellow/15 text-ping-yellow text-[9px] font-bold uppercase tracking-wide"
          data-testid="match-row-status-pending"
          aria-label="Match en attente de validation"
        >
          <Hourglass size={10} aria-hidden="true" />
          En attente de validation
        </span>
      )}
      {effectiveStatus === 'rejected' && (
        <span
          className="flex-shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-signal-red/15 text-signal-red text-[9px] font-bold uppercase tracking-wide"
          data-testid="match-row-status-rejected"
          aria-label="Match refusé"
        >
          <XCircle size={10} aria-hidden="true" />
          Refusé
        </span>
      )}
      {effectiveStatus === 'confirmed' && antiCheatEnabled && (
        <span
          className="flex-shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-lime/15 text-lime text-[9px] font-bold uppercase tracking-wide"
          data-testid="match-row-status-validated"
          aria-label="Match validé"
        >
          <CheckCircle2 size={10} aria-hidden="true" />
          Validé
        </span>
      )}

      {/* Outcome + delta (history variant) */}
      {variant === 'history' && (
        <div className="flex-shrink-0 flex flex-col items-end gap-0.5">
          {outcomeLabel && (
            <span className={`text-[10px] font-bold uppercase tracking-wide ${outcomeLabelClass}`}>
              {outcomeLabel}
            </span>
          )}
          {personalDelta !== undefined && personalDelta !== 0 && (
            <span
              className={`text-[10px] font-mono tabular-nums ${
                personalDelta > 0 ? 'text-lime' : 'text-signal-red'
              }`}
            >
              {personalDelta > 0 ? '+' : ''}{personalDelta} ELO
            </span>
          )}
        </div>
      )}
    </div>
  );
}
