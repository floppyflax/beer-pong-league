/**
 * EventGroupCard — card collapsible représentant un event dans le mode
 * "Par event" du tab Activité d'une ligue. Header avec status pill + titre +
 * metadata + icône flèche d'ouverture, body (si déplié) avec tous les
 * matchs de l'event au format `LeagueMatchCard` (identique aux matchs hors
 * événement et à la timeline).
 *
 * Variants :
 *   - `hero`  : event vedette (premier in_progress ou finished récent).
 *               border lime renforcée, pulse dot animé.
 *   - `muted` : autres events. Mêmes infos, moins d'emphase visuelle.
 */

import { useId, useState, type KeyboardEvent, type MouseEvent } from "react";
import { ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import type { Event, Match, Player } from "@/types";
import { getEventLifecycle, type EventLifecycle } from "@/utils/eventLifecycle";
import { LeagueMatchCard } from "./LeagueMatchCard";

export type EventGroupCardVariant = "hero" | "muted";

export interface EventGroupCardProps {
  event: Event;
  matches: Match[];
  players: Player[];
  variant: EventGroupCardVariant;
  defaultExpanded: boolean;
  onOpen: () => void;
}

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
});

function formatEventDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const today = new Date();
  const sameDay =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();
  if (sameDay) return "Aujourd'hui";
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate()
  ) {
    return "Hier";
  }
  return dateFormatter.format(date);
}

function lifecycleStatus(lifecycle: EventLifecycle): {
  label: string;
  pillClass: string;
} {
  switch (lifecycle) {
    case "in_progress":
      return { label: "En cours", pillClass: "bg-lime/20 text-lime" };
    case "not_started":
      return {
        label: "À venir",
        pillClass: "bg-ping-yellow/20 text-ping-yellow",
      };
    case "paused":
      return { label: "En pause", pillClass: "bg-cool-gray/20 text-cool-gray" };
    case "finished":
      return { label: "Terminé", pillClass: "bg-cool-gray/20 text-cool-gray" };
  }
}

export const EventGroupCard = ({
  event,
  matches,
  players,
  variant,
  defaultExpanded,
  onOpen,
}: EventGroupCardProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const bodyId = useId();

  const lifecycle = getEventLifecycle(event);
  const status = lifecycleStatus(lifecycle);
  const isInProgress = lifecycle === "in_progress";

  // Tri matchs du plus récent au plus ancien.
  const sortedMatches = [...matches].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  // Container styles — hero = border lime renforcée, muted = atténuée.
  const containerClass =
    variant === "hero" && isInProgress
      ? "bg-navy-soft border border-lime/50 rounded-card overflow-hidden"
      : isInProgress
        ? "bg-navy-soft border border-lime/20 rounded-card overflow-hidden"
        : "bg-navy-soft border border-card/50 rounded-card overflow-hidden";

  const toggle = () => setExpanded((v) => !v);

  const handleHeaderKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
  };

  const handleOpen = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onOpen();
  };

  const handleOpenKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen();
    }
  };

  return (
    <div
      role="region"
      aria-label={`Événement: ${event.name}`}
      className={containerClass}
      data-testid="event-group-card"
    >
      <div className="w-full px-3 py-3 flex items-center gap-2">
        <button
          type="button"
          onClick={toggle}
          onKeyDown={handleHeaderKey}
          aria-expanded={expanded}
          aria-controls={bodyId}
          className="flex-1 min-w-0 text-left hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-electric-blue rounded"
        >
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold ${status.pillClass}`}
            >
              {variant === "hero" && isInProgress && (
                <span
                  className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse"
                  aria-hidden="true"
                />
              )}
              {status.label}
            </span>
          </div>
          <h3 className="font-archivo font-extrabold uppercase text-base text-white truncate">
            {event.name}
          </h3>
          <p className="font-mono text-xs text-cool-gray mt-0.5">
            {formatEventDate(event.date)} · {sortedMatches.length}{" "}
            {sortedMatches.length === 1 ? "match" : "matchs"}
            {event.playerIds && event.playerIds.length > 0 && (
              <>
                {" · "}
                {event.playerIds.length}{" "}
                {event.playerIds.length === 1 ? "joueur" : "joueurs"}
              </>
            )}
          </p>
        </button>
        <button
          type="button"
          onClick={handleOpen}
          onKeyDown={handleOpenKey}
          aria-label={`Ouvrir l'événement ${event.name}`}
          className="flex-shrink-0 p-2 rounded-full text-electric-blue hover:bg-electric-blue/10 transition-colors focus:outline-none focus:ring-2 focus:ring-electric-blue"
        >
          <ArrowRight size={18} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={toggle}
          aria-label={expanded ? "Réduire" : "Déplier"}
          aria-expanded={expanded}
          aria-controls={bodyId}
          className="flex-shrink-0 p-1 text-cool-gray hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-electric-blue rounded"
        >
          {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {expanded && (
        <div id={bodyId} className="px-3 pb-3">
          <div className="border-t border-card/30 pt-3">
            {sortedMatches.length === 0 ? (
              <p className="text-xs text-cool-gray italic py-2">
                {isInProgress
                  ? "En attente du premier match"
                  : "Aucun match enregistré"}
              </p>
            ) : (
              <div className="space-y-2">
                {sortedMatches.map((m) => (
                  <LeagueMatchCard
                    key={m.id}
                    match={m}
                    players={players}
                    antiCheatEnabled={event.anti_cheat_enabled ?? false}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
