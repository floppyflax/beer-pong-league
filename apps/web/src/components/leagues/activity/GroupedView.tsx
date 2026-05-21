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
 */

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trophy } from "lucide-react";
import type { Event, Match, Player } from "@/types";
import { getEventLifecycle } from "@/utils/eventLifecycle";
import { EmptyState } from "@/components/EmptyState";
import { PButton } from "@/components/ponglo/PButton";
import { EventGroupCard } from "./EventGroupCard";
import { OrphanMatchesSection } from "./OrphanMatchesSection";

export interface GroupedViewProps {
  events: Event[];
  orphanMatches: Match[];
  players: Player[];
  leagueId: string;
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
  leagueId,
}: GroupedViewProps) => {
  const navigate = useNavigate();

  const sortedEvents = useMemo(() => sortEvents(events), [events]);
  const heroEventId = useMemo(
    () => findHeroEventId(sortedEvents),
    [sortedEvents],
  );

  const goToCreateEvent = () =>
    navigate(`/create-event?leagueId=${leagueId}`);

  // Empty state global : ni event, ni match libre.
  if (sortedEvents.length === 0 && orphanMatches.length === 0) {
    return (
      <EmptyState
        icon={Trophy}
        title="Aucune activité"
        description="Crée un événement ou enregistre un match libre pour démarrer."
        action={
          <PButton
            variant="primary"
            size="md"
            icon={<Plus size={16} />}
            onClick={goToCreateEvent}
          >
            Créer un événement
          </PButton>
        }
      />
    );
  }

  return (
    <div className="space-y-2">
      {sortedEvents.map((event) => {
        const isHero = event.id === heroEventId;
        return (
          <EventGroupCard
            key={event.id}
            event={event}
            matches={event.matches ?? []}
            players={players}
            variant={isHero ? "hero" : "muted"}
            defaultExpanded={isHero}
            onOpen={() => navigate(`/event/${event.id}`)}
          />
        );
      })}

      {orphanMatches.length > 0 && (
        <OrphanMatchesSection matches={orphanMatches} players={players} />
      )}

      <button
        type="button"
        onClick={goToCreateEvent}
        className="w-full bg-navy-soft hover:bg-navy-deep text-white font-bold py-3 rounded-lg mt-2 border border-card/50 focus:outline-none focus:ring-2 focus:ring-electric-blue transition-colors"
      >
        <Plus size={16} className="inline mr-2" />
        Créer un événement
      </button>
    </div>
  );
};
