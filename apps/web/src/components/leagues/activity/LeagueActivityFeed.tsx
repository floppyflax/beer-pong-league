/**
 * LeagueActivityFeed — container du tab "Activité" du LeagueDashboard.
 *
 * Responsabilités :
 *  - Filtrer les events de la ligue (depuis le tableau global `events`).
 *  - Calculer le default view mode (timeline si 0 event, sinon grouped).
 *  - Persister la pref user (localStorage global, voir useViewModePref).
 *  - Construire les entrées du mode timeline (union events.matches + libres).
 *  - Cacher le switcher quand aucun event (mode timeline forcé).
 */

import { useMemo } from "react";
import type { Event, League } from "@/types";
import { useViewModePref } from "@/hooks/useViewModePref";
import { ViewModeSwitcher } from "./ViewModeSwitcher";
import { GroupedView } from "./GroupedView";
import { TimelineView, type TimelineMatchEntry } from "./TimelineView";

export interface LeagueActivityFeedProps {
  league: League;
  events: Event[];
}

export const LeagueActivityFeed = ({
  league,
  events,
}: LeagueActivityFeedProps) => {
  const leagueEvents = useMemo(() => {
    const ids = new Set(league.events ?? []);
    if (ids.size === 0) return [];
    return events.filter((e) => ids.has(e.id));
  }, [events, league.events]);

  const hasEvents = leagueEvents.length > 0;
  const [viewMode, setViewMode] = useViewModePref(
    hasEvents ? "grouped" : "timeline",
  );

  // Si pas d'events, on force timeline — le mode groupé n'a pas de sens.
  const effectiveMode = hasEvents ? viewMode : "timeline";

  const timelineEntries = useMemo<TimelineMatchEntry[]>(() => {
    const libres: TimelineMatchEntry[] = league.matches.map((m) => ({
      match: m,
      event: null,
    }));
    const fromEvents: TimelineMatchEntry[] = leagueEvents.flatMap((event) =>
      (event.matches ?? []).map((match) => ({ match, event })),
    );
    return [...libres, ...fromEvents];
  }, [league.matches, leagueEvents]);

  return (
    <div className="space-y-3">
      {hasEvents && (
        <ViewModeSwitcher value={effectiveMode} onChange={setViewMode} />
      )}

      {effectiveMode === "grouped" ? (
        <GroupedView
          events={leagueEvents}
          orphanMatches={league.matches}
          players={league.players}
          leagueId={league.id}
        />
      ) : (
        <TimelineView
          entries={timelineEntries}
          players={league.players}
          leagueId={league.id}
        />
      )}
    </div>
  );
};
