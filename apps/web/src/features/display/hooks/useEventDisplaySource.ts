import { useEffect, useMemo, useState } from "react";
import { useLeague } from "@/context/LeagueContext";
import { databaseService } from "@/services/DatabaseService";
import type { Player } from "@/types";
import type { DisplaySource } from "../types";
import { useDisplayRankings } from "./useDisplayRankings";

/**
 * Adapter qui assemble un `DisplaySource` à partir d'un eventId.
 *
 * Charge les `event_participants` côté DB (nécessaire pour les events
 * autonomes ou avec joueurs invités), puis calcule le ranking local de
 * l'event via `getEventLocalRanking`. Mémoïse l'output.
 */
export function useEventDisplaySource(eventId: string | undefined): DisplaySource | null {
  const { events, leagues, getEventLocalRanking } = useLeague();

  const event = useMemo(
    () => (eventId ? events.find((e) => e.id === eventId) : undefined),
    [events, eventId],
  );

  const [participants, setParticipants] = useState<Player[]>([]);
  const [avatarById, setAvatarById] = useState<Record<string, string>>({});
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(true);

  useEffect(() => {
    if (!eventId) {
      setParticipants([]);
      setIsLoadingParticipants(false);
      return;
    }
    let cancelled = false;
    setIsLoadingParticipants(true);
    databaseService
      .loadEventParticipants(eventId)
      .then((raw) => {
        if (cancelled) return;
        setParticipants(
          raw.map((p) => ({
            id: p.id,
            name: p.name,
            elo: p.elo,
            wins: p.wins,
            losses: p.losses,
            matchesPlayed: p.matchesPlayed,
            streak: 0,
          })),
        );
        const avatars: Record<string, string> = {};
        for (const p of raw) {
          if (p.avatarUrl) avatars[p.id] = p.avatarUrl;
        }
        setAvatarById(avatars);
      })
      .catch(() => {
        if (!cancelled) setParticipants([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingParticipants(false);
      });
    return () => {
      cancelled = true;
    };
    // Recharge sur changement d'eventId ou de nombre de matchs (un match
    // nouveau = potentiellement de nouveaux participants ou stats à jour).
  }, [eventId, event?.matches?.length]);

  const sortedPlayers = useMemo(() => {
    if (!event) return [] as Player[];
    return getEventLocalRanking(event.id, participants);
  }, [event, participants, getEventLocalRanking]);

  const displayPlayersRaw = useDisplayRankings(sortedPlayers, event?.matches ?? []);

  // Injecte la photo du joueur (event_participants.avatar_url) quand dispo.
  const displayPlayers = useMemo(
    () =>
      displayPlayersRaw.map((p) =>
        avatarById[p.id] ? { ...p, avatarUrl: avatarById[p.id] } : p,
      ),
    [displayPlayersRaw, avatarById],
  );

  const matchesDesc = useMemo(() => {
    if (!event) return [];
    return [...event.matches].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [event]);

  const joinUrl = useMemo(() => {
    if (!event) return "";
    return `${window.location.origin}/event/${event.id}/join`;
  }, [event]);

  // League associée (utile pour fallback de noms / contexte)
  const league = useMemo(
    () =>
      event?.leagueId
        ? leagues.find((l) => l.id === event.leagueId)
        : undefined,
    [event, leagues],
  );

  return useMemo<DisplaySource | null>(() => {
    if (!event) return null;
    const subtitle = new Date(event.date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    return {
      kind: "event",
      name: event.name,
      joinUrl,
      joinCode: event.joinCode,
      isLive: !event.isFinished,
      subtitle: league ? `${subtitle} · ${league.name}` : subtitle,
      players: displayPlayers,
      matches: matchesDesc,
      matchesPlayedCount: event.matches.length,
      isLoading: isLoadingParticipants && displayPlayers.length === 0,
      sourceId: event.id,
      exitPath: `/event/${event.id}`,
    };
  }, [
    event,
    league,
    joinUrl,
    displayPlayers,
    matchesDesc,
    isLoadingParticipants,
  ]);
}
