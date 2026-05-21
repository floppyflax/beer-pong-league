/**
 * EventGroupCard — card collapsible représentant un event dans le mode
 * "Par event" du tab Activité d'une ligue. Header avec status pill + titre +
 * metadata, body (si déplié) avec jusqu'à 3 MiniMatchCard, footer avec CTA
 * "Ouvrir l'événement →".
 *
 * Variants :
 *   - `hero`  : event vedette (premier in_progress ou finished récent).
 *               border lime renforcée, pulse dot animé.
 *   - `muted` : autres events. Mêmes infos, moins d'emphase visuelle.
 */

import { useId, useState, type KeyboardEvent } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { Event, Match, Player } from "@/types";
import { getEventLifecycle, type EventLifecycle } from "@/utils/eventLifecycle";
import { MiniMatchCard } from "./MiniMatchCard";

export type EventGroupCardVariant = "hero" | "muted";

export interface EventGroupCardProps {
  event: Event;
  matches: Match[];
  players: Player[];
  variant: EventGroupCardVariant;
  defaultExpanded: boolean;
  onOpen: () => void;
}

const MAX_VISIBLE_MATCHES = 3;

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
  const visibleMatches = sortedMatches.slice(0, MAX_VISIBLE_MATCHES);
  const remainingCount = Math.max(0, sortedMatches.length - MAX_VISIBLE_MATCHES);

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

  return (
    <div
      role="region"
      aria-label={`Événement: ${event.name}`}
      className={containerClass}
      data-testid="event-group-card"
    >
      <button
        type="button"
        onClick={toggle}
        onKeyDown={handleHeaderKey}
        aria-expanded={expanded}
        aria-controls={bodyId}
        className="w-full text-left px-3 py-3 flex items-center gap-3 hover:bg-navy-deep/40 transition-colors focus:outline-none focus:ring-2 focus:ring-electric-blue focus:ring-inset"
      >
        <div className="flex-1 min-w-0">
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
        </div>
        <span className="text-cool-gray flex-shrink-0" aria-hidden="true">
          {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </span>
      </button>

      {expanded && (
        <div id={bodyId} className="px-3 pb-3">
          <div className="border-t border-card/30 pt-2">
            {sortedMatches.length === 0 ? (
              <p className="text-xs text-cool-gray italic py-2">
                {isInProgress
                  ? "En attente du premier match"
                  : "Aucun match enregistré"}
              </p>
            ) : (
              <div className="space-y-0.5">
                {visibleMatches.map((m) => (
                  <MiniMatchCard key={m.id} match={m} players={players} />
                ))}
                {remainingCount > 0 && (
                  <button
                    type="button"
                    onClick={onOpen}
                    className="text-xs text-cool-gray hover:text-white transition-colors pt-1"
                  >
                    + {remainingCount}{" "}
                    {remainingCount === 1 ? "autre match" : "autres matchs"}
                  </button>
                )}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onOpen}
            className="mt-3 text-electric-blue text-sm font-bold hover:text-electric-blue-deep transition-colors focus:outline-none focus:ring-2 focus:ring-electric-blue rounded"
          >
            Ouvrir l&apos;événement →
          </button>
        </div>
      )}
    </div>
  );
};
