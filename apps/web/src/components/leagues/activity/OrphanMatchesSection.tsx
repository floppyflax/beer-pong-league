/**
 * OrphanMatchesSection — section "Matchs hors événement" du mode "Par event".
 * Affiche les matchs de la ligue qui ne sont rattachés à aucun event.
 *
 * Le rendu reprend le pattern adopté par main (#31 / #32) :
 * `MatchTeamsRow` pour le bloc équipes + ELO, footer timestamp +
 * photo/cups via `MatchEnrichedDisplay`.
 */

import { CheckCircle2, Hourglass, XCircle } from "lucide-react";
import type { Match, Player } from "@/types";
import { MatchEnrichedDisplay } from "@/components/MatchEnrichedDisplay";
import { LiveMatchBadge } from "@/components/live/LiveMatchBadge";
import { MatchTeamsRow } from "@/components/match/MatchTeamsRow";
import { formatRelativeTime } from "@/utils/dateUtils";

export interface OrphanMatchesSectionProps {
  matches: Match[];
  players: Player[];
  /**
   * Mig 032 — drives the visibility of the "Validé" badge on confirmed
   * matches. Pending and rejected badges show regardless (they aren't
   * visual noise — they ARE actionable / soft-deleted state).
   */
  antiCheatEnabled?: boolean;
}

export const OrphanMatchesSection = ({
  matches,
  players,
  antiCheatEnabled = false,
}: OrphanMatchesSectionProps) => {
  const sorted = [...matches].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <section aria-label="Matchs hors événement" className="space-y-2">
      <div className="flex items-center gap-3 pt-2">
        <span className="text-xs uppercase tracking-wider text-cool-gray font-bold">
          Matchs hors événement ({sorted.length})
        </span>
        <span className="flex-1 h-px bg-card/30" aria-hidden="true" />
      </div>

      {sorted.map((match) => {
        const teamAPlayers = players.filter((p) => match.teamA.includes(p.id));
        const teamBPlayers = players.filter((p) => match.teamB.includes(p.id));
        const winnerA = match.scoreA > match.scoreB;

        return (
          <div
            key={match.id}
            className={`bg-navy-soft p-4 rounded-xl border ${match.is_live ? "border-lime/50" : "border-card/50"}`}
            data-testid="orphan-match-card"
          >
            <LiveMatchBadge
              isLive={Boolean(match.is_live)}
              className="mb-2"
            />
            {/* Mig 032 — anti-cheat status badges (mirror EventDashboard /
                MatchHistoryCard). "Validé" only when league anti-cheat ON
                — otherwise visual noise on every match. */}
            {match.status === "pending" && (
              <div
                className="mb-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-ping-yellow/15 text-ping-yellow text-[10px] font-bold uppercase tracking-wide"
                data-testid="match-status-pending"
                aria-label="Match en attente de validation"
              >
                <Hourglass size={11} aria-hidden="true" />
                En attente de validation
              </div>
            )}
            {match.status === "rejected" && (
              <div
                className="mb-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-signal-red/15 text-signal-red text-[10px] font-bold uppercase tracking-wide"
                data-testid="match-status-rejected"
                aria-label="Match refusé"
              >
                <XCircle size={11} aria-hidden="true" />
                Refusé
              </div>
            )}
            {match.status === "confirmed" && antiCheatEnabled && (
              <div
                className="mb-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-lime/15 text-lime text-[10px] font-bold uppercase tracking-wide"
                data-testid="match-status-validated"
                aria-label="Match validé"
              >
                <CheckCircle2 size={11} aria-hidden="true" />
                Validé
              </div>
            )}
            <MatchTeamsRow
              teamAPlayers={teamAPlayers}
              teamBPlayers={teamBPlayers}
              winner={winnerA ? "A" : "B"}
              eloChanges={match.eloChanges}
            />
            <div className="flex items-center justify-between gap-3 mt-3">
              <div className="text-xs text-cool-gray">
                {formatRelativeTime(match.date)}
              </div>
              <MatchEnrichedDisplay
                photoUrl={match.photo_url}
                cupsRemaining={match.cups_remaining}
              />
            </div>
          </div>
        );
      })}
    </section>
  );
};
