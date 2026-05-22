/**
 * GroupedView — mode "Par event" du tab Activité. Liste les events de la
 * ligue triés par lifecycle puis date, avec le 1er in_progress (ou un
 * finished récent) en vedette ("hero"). En bas, une section "Matchs hors
 * événement" pour les matchs libres de la ligue.
 *
 * Le tri respecte la règle :
 *   1. in_progress  → par dernière activité (max match.date) desc
 *   2. not_started  → par event.date asc (le plus proche en premier)
 *   3. finished     → par event.date desc
 *
 * Les participants de chaque event sont passés via `participantsByEvent`
 * pour que les match cards résolvent correctement les noms (les ids des
 * teamA/teamB d'un match d'event sont des `event_memberships.id`, distincts
 * de `league.players[].id`).
 */

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy } from "lucide-react";
import type { Event, Match, Player } from "@/types";
import { getEventLifecycle } from "@/utils/eventLifecycle";
import { EmptyState } from "@/components/EmptyState";
import { EventGroupCard } from "./EventGroupCard";
import { OrphanMatchesSection } from "./OrphanMatchesSection";

export interface GroupedViewProps {
  events: Event[];
  orphanMatches: Match[];
  players: Player[];
  leagueId: string;
  participantsByEvent: Map<string, Player[]>;
  /** Mig 032 — propagated to OrphanMatchesSection for the "Validé" badge. */
  antiCheatEnabled?: boolean;
}

const FINISHED_RECENT_WINDOW_MS = 24 * 60 * 60 * 1000;

function lastMatchTime(event: Event): number {
  if (!event.matches || event.matches.length === 0) {
    return event.startedAt ? new Date(event.startedAt).getTime() : 0;
  }
  return event.matches.reduce((max, m) => {
    const t = new Date(m.date).getTime();
    return t > max ? t : max;
  }, 0);
}

function sortEvents(events: Event[]): Event[] {
  const groups: Record<string, Event[]> = {
    in_progress: [],
    not_started: [],
    paused: [],
    finished: [],
  };
  events.forEach((e) => {
    const lc = getEventLifecycle(e);
    groups[lc].push(e);
  });

  groups.in_progress.sort((a, b) => lastMatchTime(b) - lastMatchTime(a));
  groups.not_started.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  groups.paused.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  groups.finished.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return [
    ...groups.in_progress,
    ...groups.not_started,
    ...groups.paused,
    ...groups.finished,
  ];
}

function findHeroEventId(sortedEvents: Event[]): string | null {
  const inProgress = sortedEvents.find(
    (e) => getEventLifecycle(e) === "in_progress",
  );
  if (inProgress) return inProgress.id;

  const now = Date.now();
  const recentFinished = sortedEvents.find((e) => {
    if (getEventLifecycle(e) !== "finished") return false;
    const lastActivity = lastMatchTime(e) || new Date(e.date).getTime();
    return now - lastActivity < FINISHED_RECENT_WINDOW_MS;
  });
  return recentFinished?.id ?? null;
}

export const GroupedView = ({
  events,
  orphanMatches,
  players,
  participantsByEvent,
  antiCheatEnabled = false,
}: GroupedViewProps) => {
  const navigate = useNavigate();

  const sortedEvents = useMemo(() => sortEvents(events), [events]);
  const heroEventId = useMemo(
    () => findHeroEventId(sortedEvents),
    [sortedEvents],
  );

  // Empty state global : ni event, ni match libre.
  if (sortedEvents.length === 0 && orphanMatches.length === 0) {
    return (
      <EmptyState
        icon={Trophy}
        title="Aucune activité"
        description="Aucun événement ni match libre pour le moment."
      />
    );
  }

  return (
    <div className="space-y-2">
      {sortedEvents.map((event) => {
        const isHero = event.id === heroEventId;
        const eventPlayers = participantsByEvent.get(event.id) ?? [];
        return (
          <EventGroupCard
            key={event.id}
            event={event}
            matches={event.matches ?? []}
            players={eventPlayers}
            variant={isHero ? "hero" : "muted"}
            defaultExpanded={isHero}
            onOpen={() => navigate(`/event/${event.id}`)}
          />
        );
      })}

      {orphanMatches.length > 0 && (
        <OrphanMatchesSection
          matches={orphanMatches}
          players={players}
          antiCheatEnabled={antiCheatEnabled}
        />
      )}
    </div>
  );
};
