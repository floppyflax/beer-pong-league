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
 * Variation de rang vs dernier match — calcule, pour chaque **participant du
 * dernier match**, de combien de places il a monté (>0), descendu (<0) ou s'il
 * est resté sur place (0) par rapport à l'avant-dernier match.
 *
 * Le rang précédent est reconstruit en retirant `lastMatch.eloChanges[playerId]`
 * à l'ELO courant de **tous** les joueurs du classement (0 par défaut pour les
 * non-participants), puis en re-triant. Mais seuls les joueurs présents dans
 * `lastMatch.teamA`/`teamB` sont retournés : un non-participant que le match a
 * fait reculer/avancer n'apparaît PAS dans la Map (évite d'afficher un "resté
 * sur place" sur toute la majorité des joueurs non concernés par le match).
 *
 * Retourne une Map vide si aucun match ou si le dernier match n'a pas
 * d'`eloChanges` (match non-ranked / non-confirmé).
 *
 * Convention de lecture côté UI : `undefined` (absent) = n'a pas joué → aucun
 * badge ; `0` = a joué et resté sur place → badge neutre ; `≠0` = ▲/▼ places.
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
  const participants = new Set([...lastMatch.teamA, ...lastMatch.teamB]);

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
    if (!participants.has(s.id)) return;
    const previousRank = i + 1;
    result.set(s.id, previousRank - s.currentRank);
  });

  return result;
}
