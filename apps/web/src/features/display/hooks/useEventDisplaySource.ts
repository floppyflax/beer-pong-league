import { useEffect, useMemo, useRef, useState } from "react";
import { useLeague } from "@/context/LeagueContext";
import { databaseService } from "@/services/DatabaseService";
import type { Player } from "@/types";
import { isMatchValidated } from "@/utils/matchStatus";
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
  // Tick incrémenté par un setInterval pour forcer un re-fetch périodique
  // des participants (un nouveau joueur qui rejoint sans avoir encore joué
  // ne change pas `event.matches.length` — il faut poller indépendamment).
  // Aligné sur la cadence de `useDisplayAutoRefresh` (10s par défaut).
  const [refreshTick, setRefreshTick] = useState(0);
  // Premier chargement réussi → on n'affiche plus le spinner sur les refresh
  // périodiques (sinon l'écran flash toutes les 10s).
  const hasLoadedOnceRef = useRef(false);

  useEffect(() => {
    if (!eventId) return;
    const id = setInterval(() => {
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "hidden"
      ) {
        return;
      }
      setRefreshTick((t) => t + 1);
    }, 10_000);
    return () => clearInterval(id);
  }, [eventId]);

  useEffect(() => {
    if (!eventId) {
      setParticipants([]);
      setIsLoadingParticipants(false);
      hasLoadedOnceRef.current = false;
      return;
    }
    let cancelled = false;
    if (!hasLoadedOnceRef.current) setIsLoadingParticipants(true);
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
        hasLoadedOnceRef.current = true;
      })
      .catch(() => {
        if (!cancelled && !hasLoadedOnceRef.current) setParticipants([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingParticipants(false);
      });
    return () => {
      cancelled = true;
    };
    // Recharge sur :
    // - changement d'eventId
    // - nouveau match (matches.length) — stats à jour
    // - tick périodique — nouveaux participants qui ont rejoint sans match
  }, [eventId, event?.matches?.length, refreshTick]);

  // League parente — pour le fallback de noms / contexte ET la détection
  // anti-cheat : un event sans flag hérite de celui de sa league (même règle
  // que getEventLocalRanking).
  const league = useMemo(
    () =>
      event?.leagueId
        ? leagues.find((l) => l.id === event.leagueId)
        : undefined,
    [event, leagues],
  );
  const antiCheat = !!event?.anti_cheat_enabled || !!league?.anti_cheat_enabled;

  // Matchs validés uniquement, le plus récent en premier. Réplique la porte
  // serveur (apply_match_elo) : un match pending/rejected ne nourrit pas la
  // diffusion. Le feed, l'anim de révélation et les recentResults/deltas en
  // dérivent. Le rang lui-même vient déjà de getEventLocalRanking (filtré).
  const matchesDesc = useMemo(() => {
    if (!event) return [];
    return [...event.matches]
      .filter((m) => isMatchValidated(m, antiCheat))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [event, antiCheat]);

  const sortedPlayers = useMemo(() => {
    if (!event) return [] as Player[];
    return getEventLocalRanking(event.id, participants);
  }, [event, participants, getEventLocalRanking]);

  const displayPlayersRaw = useDisplayRankings(sortedPlayers, matchesDesc);

  // Injecte la photo du joueur (event_participants.avatar_url) quand dispo.
  const displayPlayers = useMemo(
    () =>
      displayPlayersRaw.map((p) =>
        avatarById[p.id] ? { ...p, avatarUrl: avatarById[p.id] } : p,
      ),
    [displayPlayersRaw, avatarById],
  );

  const joinUrl = useMemo(() => {
    if (!event) return "";
    return `${window.location.origin}/event/${event.id}/join`;
  }, [event]);

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
