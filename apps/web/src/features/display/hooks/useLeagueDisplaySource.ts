import { useMemo } from "react";
import { useLeague } from "@/context/LeagueContext";
import type { DisplaySource } from "../types";
import { useDisplayRankings } from "./useDisplayRankings";

/**
 * Adapter qui assemble un `DisplaySource` à partir d'un leagueId.
 *
 * Contrairement à l'event, la league a déjà ses joueurs et matchs en mémoire
 * (chargés dans LeagueContext). Pas de chargement asynchrone.
 */
export function useLeagueDisplaySource(leagueId: string | undefined): DisplaySource | null {
  const { leagues } = useLeague();

  const league = useMemo(
    () => (leagueId ? leagues.find((l) => l.id === leagueId) : undefined),
    [leagues, leagueId],
  );

  const displayPlayers = useDisplayRankings(
    league?.players ?? [],
    league?.matches ?? [],
  );

  const matchesDesc = useMemo(() => {
    if (!league) return [];
    return [...league.matches].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [league]);

  const joinUrl = useMemo(() => {
    if (!league) return "";
    return `${window.location.origin}/league/${league.id}`;
  }, [league]);

  return useMemo<DisplaySource | null>(() => {
    if (!league) return null;
    const subtitle = league.type === "season" ? "Saison" : "Ligue";
    return {
      kind: "league",
      name: league.name,
      joinUrl,
      joinCode: league.joinCode,
      isLive: !league.endedAt,
      subtitle,
      players: displayPlayers,
      matches: matchesDesc,
      matchesPlayedCount: league.matches.length,
      isLoading: false,
      sourceId: league.id,
      exitPath: `/league/${league.id}`,
    };
  }, [league, joinUrl, displayPlayers, matchesDesc]);
}
