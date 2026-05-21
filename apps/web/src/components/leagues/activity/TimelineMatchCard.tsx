/**
 * TimelineMatchCard — match riche en mode "Timeline" du tab Activité.
 *
 * Réutilise `MatchHistoryCard` pour le corps (avatars + ELO + photo + cups)
 * et ajoute un footer indiquant la provenance : chip event cliquable (→
 * `/event/:id`) si rattaché, sinon label "— Hors événement".
 */

import { useNavigate } from "react-router-dom";
import { FolderOpen } from "lucide-react";
import type { Event, Match, Player } from "@/types";
import { MatchHistoryCard } from "@/components/design-system/MatchHistoryCard";

export interface TimelineMatchCardProps {
  match: Match;
  event: Event | null;
  players: Player[];
  /**
   * Mig 032 — true when the parent league has anti-cheat enabled. Propagates
   * to MatchHistoryCard so the "Validé" badge surfaces on confirmed matches
   * (the pending/rejected badges show regardless — they aren't visual noise).
   */
  antiCheatEnabled?: boolean;
}

function resolveTeam(
  ids: string[],
  players: Player[],
): Array<{ id: string; name: string }> {
  const map = new Map(players.map((p) => [p.id, p.name]));
  return ids.map((id) => ({ id, name: map.get(id) ?? "?" }));
}

export const TimelineMatchCard = ({
  match,
  event,
  players,
  antiCheatEnabled = false,
}: TimelineMatchCardProps) => {
  const navigate = useNavigate();

  const teamA = resolveTeam(match.teamA, players);
  const teamB = resolveTeam(match.teamB, players);

  return (
    <div className="space-y-1">
      <MatchHistoryCard
        teamA={teamA}
        teamB={teamB}
        scoreA={match.scoreA}
        scoreB={match.scoreB}
        date={match.date}
        eloChanges={match.eloChanges}
        isLive={match.is_live}
        cupsRemaining={match.cups_remaining}
        photoUrl={match.photo_url}
        status={match.status}
        antiCheatEnabled={antiCheatEnabled}
      />
      {event ? (
        <button
          type="button"
          onClick={() => navigate(`/event/${event.id}`)}
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-navy-deep border border-card/50 hover:border-electric-blue text-cool-gray hover:text-electric-blue text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-electric-blue"
          aria-label={`Ouvrir l'événement ${event.name}`}
        >
          <FolderOpen size={12} aria-hidden="true" />
          <span className="truncate max-w-[200px]">{event.name}</span>
        </button>
      ) : (
        <p className="text-xs text-cool-gray italic px-1">— Hors événement</p>
      )}
    </div>
  );
};
