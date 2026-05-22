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
import type { Event, League, Match } from "@/types";
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

  // Le feed se construit ENTIÈREMENT depuis `league.matches`, qui portent le
  // delta ELO du contexte LIGUE (cf. LeaguesRepository) et incluent les matchs
  // d'events rattachés (via `matches.league_id`). On les regroupe par
  // `eventId` pour le mode groupé et on rattache les métadonnées d'event.
  // Important : ne PAS lire `event.matches` (delta du contexte EVENT) ni
  // dédupliquer — sinon les matchs d'event rattachés apparaîtraient en double
  // (groupe event + "hors événement") avec le mauvais delta.
  const { groupedEvents, orphanMatches, timelineEntries } = useMemo(() => {
    const byEvent = new Map<string, Match[]>();
    const orphans: Match[] = [];
    for (const m of league.matches) {
      if (m.eventId) {
        const list = byEvent.get(m.eventId) ?? [];
        list.push(m);
        byEvent.set(m.eventId, list);
      } else {
        orphans.push(m);
      }
    }
    const eventById = new Map(leagueEvents.map((e) => [e.id, e]));
    const grouped: Event[] = leagueEvents.map((e) => ({
      ...e,
      matches: byEvent.get(e.id) ?? [],
    }));
    const timeline: TimelineMatchEntry[] = league.matches.map((m) => ({
      match: m,
      event: m.eventId ? eventById.get(m.eventId) ?? null : null,
    }));
    return {
      groupedEvents: grouped,
      orphanMatches: orphans,
      timelineEntries: timeline,
    };
  }, [league.matches, leagueEvents]);

  return (
    <div className="space-y-3">
      {hasEvents && (
        <ViewModeSwitcher value={effectiveMode} onChange={setViewMode} />
      )}

      {effectiveMode === "grouped" ? (
        <GroupedView
          events={groupedEvents}
          orphanMatches={orphanMatches}
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
