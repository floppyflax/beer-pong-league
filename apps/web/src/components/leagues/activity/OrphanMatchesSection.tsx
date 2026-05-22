/**
 * OrphanMatchesSection — section "Matchs hors événement" du mode "Par event".
 * Affiche les matchs de la ligue qui ne sont rattachés à aucun event,
 * via la card unifiée `LeagueMatchCard`.
 */

import type { Match, Player } from "@/types";
import { LeagueMatchCard } from "./LeagueMatchCard";

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

      {sorted.map((match) => (
        <LeagueMatchCard
          key={match.id}
          match={match}
          players={players}
          antiCheatEnabled={antiCheatEnabled}
          testId="orphan-match-card"
        />
      ))}
    </section>
  );
};
