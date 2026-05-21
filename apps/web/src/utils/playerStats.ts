/**
 * Stats d'affichage d'un joueur dérivées de la liste des matchs.
 * Partagé entre `LeagueDashboard` et `EventDashboard` (rangées
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

/**
 * Variation de rang vs dernier match — calcule, pour chaque joueur du
 * classement courant (`playersSortedByElo`, déjà trié ELO desc), de combien
 * de places il a monté (>0) ou descendu (<0) depuis l'avant-dernier match.
 *
 * Le calcul reconstruit l'ELO avant le dernier match en retirant
 * `lastMatch.eloChanges[playerId]` à chaque joueur (0 par défaut pour les
 * non-participants), puis re-trie pour obtenir le rang précédent.
 *
 * Retourne une Map vide si aucun match ou si le dernier match n'a pas
 * d'`eloChanges` (match non-ranked / non-confirmé).
 *
 * Un delta de 0 reste présent dans la Map — laisser le consommateur décider
 * de l'afficher ou non.
 */
export function getRankDeltasFromLastMatch(
  playersSortedByElo: { id: string; elo: number }[],
  matches: StatsMatch[],
): Map<string, number> {
  const result = new Map<string, number>();
  if (playersSortedByElo.length === 0) return result;

  const lastMatch = matches[0];
  if (!lastMatch || !lastMatch.eloChanges) return result;
  const eloChanges = lastMatch.eloChanges;

  const snapshot = playersSortedByElo.map((p, i) => ({
    id: p.id,
    currentRank: i + 1,
    prevElo: p.elo - (eloChanges[p.id] ?? 0),
    currentIndex: i,
  }));

  const sortedByPrev = [...snapshot].sort((a, b) => {
    if (b.prevElo !== a.prevElo) return b.prevElo - a.prevElo;
    return a.currentIndex - b.currentIndex;
  });

  sortedByPrev.forEach((s, i) => {
    const previousRank = i + 1;
    result.set(s.id, previousRank - s.currentRank);
  });

  return result;
}
