import { useMemo } from "react";
import type { Match, Player } from "@/types";
import type { DisplaySourcePlayer } from "../types";

/**
 * Dérive `recentResults`, `rankDelta`, `eloDelta`, `rank` et `winRate` pour
 * chaque joueur à partir de la liste triée par ELO et de l'historique des
 * matchs.
 *
 * - `recentResults` : 5 derniers matchs du joueur, le plus récent en premier.
 *   `true` = victoire.
 * - `eloDelta` : delta du dernier match terminé (lit `match.eloChanges`).
 * - `rankDelta` : variation de rang depuis l'état d'avant le dernier match.
 *   Calculé en reconstruisant l'ELO "pré-dernier-match" et en re-rankant.
 *   Positif = le joueur a gagné des places (donc apparu plus haut maintenant).
 *   `0` = a joué le dernier match mais resté sur place (badge "="). Un joueur
 *   dépassé sans avoir joué garde son ▲/▼ (cohérent avec le reveal de match).
 *   `undefined` (pas de badge) = n'a ni joué ni changé de rang.
 *
 * Conçu pour le mode diffusion : c'est un dérivé pur de la donnée déjà
 * disponible dans `events`/`leagues`, pas une requête supplémentaire.
 */
export function deriveDisplayPlayers(
  players: Player[],
  matches: Match[],
): DisplaySourcePlayer[] {
  if (players.length === 0) return [];

  const sortedByElo = [...players].sort((a, b) => {
    if (b.elo !== a.elo) return b.elo - a.elo;
    return a.name.localeCompare(b.name);
  });

  // matches le plus récent en premier
  const matchesDesc = [...matches].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const lastMatch = matchesDesc[0];
  const eloDeltaByPlayer: Record<string, number> = {};
  if (lastMatch?.eloChanges) {
    for (const [pid, change] of Object.entries(lastMatch.eloChanges)) {
      eloDeltaByPlayer[pid] = change;
    }
  }

  // Recent results par joueur (max 5)
  const recentByPlayer: Record<string, boolean[]> = {};
  for (const m of matchesDesc) {
    const winA = m.scoreA > m.scoreB;
    for (const pid of m.teamA) {
      if (!recentByPlayer[pid]) recentByPlayer[pid] = [];
      if (recentByPlayer[pid].length < 5) recentByPlayer[pid].push(winA);
    }
    for (const pid of m.teamB) {
      if (!recentByPlayer[pid]) recentByPlayer[pid] = [];
      if (recentByPlayer[pid].length < 5) recentByPlayer[pid].push(!winA);
    }
  }

  // Rang "avant dernier match" : on retire les eloChanges du dernier match
  // de chaque joueur impacté, on re-trie, on lit le rang.
  const prevRankByPlayer: Record<string, number> = {};
  if (lastMatch) {
    const beforeLastMatch = players.map((p) => {
      const delta = eloDeltaByPlayer[p.id] ?? 0;
      return { id: p.id, name: p.name, eloBefore: p.elo - delta };
    });
    const sortedBefore = [...beforeLastMatch].sort((a, b) => {
      if (b.eloBefore !== a.eloBefore) return b.eloBefore - a.eloBefore;
      return a.name.localeCompare(b.name);
    });
    sortedBefore.forEach((p, idx) => {
      prevRankByPlayer[p.id] = idx + 1;
    });
  }

  return sortedByElo.map((p, idx) => {
    const rank = idx + 1;
    const total = p.wins + p.losses;
    const winRate = total > 0 ? Math.round((p.wins / total) * 100) : 0;
    const recent = recentByPlayer[p.id] ?? [];
    const eloDelta = eloDeltaByPlayer[p.id];
    const prevRank = prevRankByPlayer[p.id];
    const played = eloDelta !== undefined; // participant du dernier match
    const rankDelta =
      prevRank === undefined
        ? undefined
        : prevRank !== rank
          ? prevRank - rank // a bougé (joueur ou non dépassé) → ▲/▼
          : played
            ? 0 // a joué mais resté sur place → "="
            : undefined; // n'a pas joué → pas de badge

    return {
      id: p.id,
      name: p.name,
      elo: p.elo,
      rank,
      rankDelta,
      eloDelta,
      wins: p.wins,
      losses: p.losses,
      winRate,
      recentResults: recent,
    };
  });
}

/** Hook React pour mémoïser. Source de vérité : `deriveDisplayPlayers`. */
export function useDisplayRankings(
  players: Player[],
  matches: Match[],
): DisplaySourcePlayer[] {
  return useMemo(() => deriveDisplayPlayers(players, matches), [players, matches]);
}
