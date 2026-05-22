/**
 * useLeagueEventParticipants — charge en parallèle les participants
 * de tous les events passés en paramètre. Sert au tab Activité d'une
 * ligue : les `match.teamA/teamB` des events sont remappés en
 * `event_memberships.id` (cf. EventsRepository), donc `league.players`
 * ne suffit pas pour résoudre les noms.
 *
 * Retour : `Map<eventId, Player[]>` que les consumers peuvent passer
 * aux match cards via `players={participantsByEvent.get(event.id) ?? []}`.
 */

import { useEffect, useMemo, useState } from 'react';
import type { Event, Player } from '@/types';
import { databaseService } from '@/services/DatabaseService';

export const useLeagueEventParticipants = (
  events: Event[],
): Map<string, Player[]> => {
  const [byEvent, setByEvent] = useState<Map<string, Player[]>>(new Map());

  // Stabilise la dépendance sur les IDs (l'array `events` se recrée à chaque
  // render du context, mais on ne veut recharger que si la liste change).
  const sortedIds = useMemo(
    () => events.map((e) => e.id).sort(),
    [events],
  );
  const idsKey = sortedIds.join(',');

  useEffect(() => {
    if (sortedIds.length === 0) {
      setByEvent(new Map());
      return;
    }
    let cancelled = false;

    Promise.all(
      sortedIds.map(async (eventId) => {
        try {
          const participants = await databaseService.loadEventParticipants(
            eventId,
          );
          const mapped: Player[] = participants.map((p) => ({
            id: p.id,
            name: p.name,
            elo: p.elo,
            wins: p.wins,
            losses: p.losses,
            matchesPlayed: p.matchesPlayed,
            streak: 0,
          }));
          return [eventId, mapped] as const;
        } catch {
          return [eventId, [] as Player[]] as const;
        }
      }),
    ).then((pairs) => {
      if (cancelled) return;
      setByEvent(new Map(pairs));
    });

    return () => {
      cancelled = true;
    };
  }, [idsKey, sortedIds]);

  return byEvent;
};
