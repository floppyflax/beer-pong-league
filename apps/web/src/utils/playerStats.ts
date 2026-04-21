/**
 * Stats d'affichage d'un joueur dérivées de la liste des matchs.
 * Partagé entre `LeagueDashboard` et `TournamentDashboard` (rangées
 * `ListRow variant="player"` avec delta ELO + forme récente).
 *
 * Les matchs doivent être triés **décroissants par date** (plus récent d'abord).
 */

type StatsMatch = {
  date: string;
  teamA: string[];
  teamB: string[];
  scoreA: number;
  scoreB: number;
  eloChanges?: Record<string, number>;
};

/**
 * Delta ELO du dernier match joué par le joueur (undefined s'il n'a jamais joué
 * ou si le match n'a pas `eloChanges`).
 */
export function getDeltaFromLastMatch(
  playerId: string,
  matches: StatsMatch[],
): number | undefined {
  for (const m of matches) {
    if (m.teamA.includes(playerId) || m.teamB.includes(playerId)) {
      const change = m.eloChanges?.[playerId];
      return change !== undefined ? change : undefined;
    }
  }
  return undefined;
}

/**
 * Derniers 5 résultats (true=victoire, false=défaite), du plus récent au plus
 * ancien.
 */
export function getLast5MatchResults(
  playerId: string,
  matches: StatsMatch[],
): boolean[] {
  const results: boolean[] = [];
  for (const m of matches) {
    if (results.length >= 5) break;
    const inA = m.teamA.includes(playerId);
    const inB = m.teamB.includes(playerId);
    if (!inA && !inB) continue;
    const won = (inA && m.scoreA > m.scoreB) || (inB && m.scoreB > m.scoreA);
    results.push(won);
  }
  return results;
}
