/**
 * OrphanMatchesSection — section "Matchs hors événement" du mode "Par event".
 * Affiche les matchs de la ligue qui ne sont rattachés à aucun event.
 *
 * Le rendu match est repris à l'identique de l'ancien tab Matchs du
 * LeagueDashboard pour ne pas régresser sur l'affichage photo + cups badge.
 */

import type { Match, Player } from "@/types";
import { MatchEnrichedDisplay } from "@/components/MatchEnrichedDisplay";
import { LiveMatchBadge } from "@/components/live/LiveMatchBadge";

export interface OrphanMatchesSectionProps {
  matches: Match[];
  players: Player[];
}

function resolveNames(ids: string[], players: Player[]): string {
  const map = new Map(players.map((p) => [p.id, p.name]));
  return ids.map((id) => map.get(id) ?? "?").join(", ");
}

export const OrphanMatchesSection = ({
  matches,
  players,
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
        const teamAName = resolveNames(match.teamA, players);
        const teamBName = resolveNames(match.teamB, players);
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
            <div className="flex justify-between items-center text-sm">
              <div
                className={`flex-1 text-right ${
                  winnerA ? "text-white font-bold" : "text-cool-gray"
                }`}
              >
                {winnerA && "🏆 "}
                {teamAName}
              </div>
              <div className="px-4 font-bold text-cool-gray text-xs">VS</div>
              <div
                className={`flex-1 text-left ${
                  !winnerA ? "text-white font-bold" : "text-cool-gray"
                }`}
              >
                {!winnerA && "🏆 "}
                {teamBName}
              </div>
            </div>
            <MatchEnrichedDisplay
              photoUrl={match.photo_url}
              cupsRemaining={match.cups_remaining}
            />
          </div>
        );
      })}
    </section>
  );
};
