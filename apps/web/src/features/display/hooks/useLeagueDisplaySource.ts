import { useMemo } from "react";
import { useLeague } from "@/context/LeagueContext";
import { isMatchValidated } from "@/utils/matchStatus";
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

  // Matchs validés uniquement, le plus récent en premier. Réplique la porte
  // serveur (apply_match_elo) : sous anti-cheat un match pending/rejected ne
  // doit pas nourrir la diffusion. Le classement (recentResults/deltas) et le
  // feed des derniers matchs en dérivent — la projection reste alignée sur le
  // classement officiel.
  const matchesDesc = useMemo(() => {
    if (!league) return [];
    return [...league.matches]
      .filter((m) => isMatchValidated(m, league.anti_cheat_enabled))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [league]);

  const displayPlayers = useDisplayRankings(league?.players ?? [], matchesDesc);

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
