/**
 * TimelineMatchCard — match en mode "Timeline" du tab Activité.
 *
 * Réutilise `LeagueMatchCard` pour le corps (même format que les matchs
 * d'event et hors événement) et ajoute un footer indiquant la provenance :
 * chip event cliquable (→ `/event/:id`) si rattaché, sinon label
 * "— Hors événement".
 */

import { useNavigate } from "react-router-dom";
import { FolderOpen } from "lucide-react";
import type { Event, Match, Player } from "@/types";
import { LeagueMatchCard } from "./LeagueMatchCard";

export interface TimelineMatchCardProps {
  match: Match;
  event: Event | null;
  players: Player[];
  /**
   * Mig 032 — true when the parent league has anti-cheat enabled. Propagates
   * to LeagueMatchCard so the "Validé" badge surfaces on confirmed matches
   * (the pending/rejected badges show regardless — they aren't visual noise).
   */
  antiCheatEnabled?: boolean;
}

export const TimelineMatchCard = ({
  match,
  event,
  players,
  antiCheatEnabled = false,
}: TimelineMatchCardProps) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-1">
      <LeagueMatchCard
        match={match}
        players={players}
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
