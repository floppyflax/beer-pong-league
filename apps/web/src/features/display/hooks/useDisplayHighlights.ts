import { useMemo } from "react";
import type { Match } from "@/types";
import type { DisplaySource, DisplaySourcePlayer } from "../types";

export type HighlightType =
  | "biggest-elo-gain"
  | "biggest-rank-climb"
  | "current-streak"
  | "upset"
  | "nemesis"
  | "best-pair";

export interface BaseHighlight {
  type: HighlightType;
  /** Étiquette FR uppercase, ex "PLUS GROS GAIN" — affichée comme headline. */
  headline: string;
  /** Phrase humaine, ex "AMAR a engrangé +87 ELO ce soir". */
  tagline: string;
  /** Métrique chiffrée principale en XXL. */
  metric: string;
}

export interface PlayerHighlight extends BaseHighlight {
  kind: "player";
  subject: DisplaySourcePlayer;
}

export interface PairHighlight extends BaseHighlight {
  kind: "pair";
  subjectA: DisplaySourcePlayer;
  subjectB: DisplaySourcePlayer;
}

export type Highlight = PlayerHighlight | PairHighlight;

/* ------------------------- Helpers ------------------------- */

function playerById(
  players: DisplaySourcePlayer[],
  id: string,
): DisplaySourcePlayer | undefined {
  return players.find((p) => p.id === id);
}

function pairKey(a: string, b: string): string {
  return [a, b].sort().join("|");
}

/* ------------------------- Highlights ------------------------- */

/** Plus gros gain ELO cumulé sur la session. */
export function computeBiggestEloGain(
  source: DisplaySource,
): PlayerHighlight | null {
  if (source.matches.length === 0) return null;
  const sumByPlayer: Record<string, number> = {};
  for (const m of source.matches) {
    if (!m.eloChanges) continue;
    for (const [pid, delta] of Object.entries(m.eloChanges)) {
      sumByPlayer[pid] = (sumByPlayer[pid] ?? 0) + delta;
    }
  }
  let bestId: string | null = null;
  let bestDelta = 0;
  for (const [pid, sum] of Object.entries(sumByPlayer)) {
    if (sum > bestDelta) {
      bestDelta = sum;
      bestId = pid;
    }
  }
  if (!bestId || bestDelta <= 0) return null;
  const subject = playerById(source.players, bestId);
  if (!subject) return null;
  return {
    type: "biggest-elo-gain",
    kind: "player",
    subject,
    headline: "Plus gros gain ELO",
    tagline: `${subject.name} a engrangé +${bestDelta} ELO ce soir`,
    metric: `+${bestDelta}`,
  };
}

/** Plus belle remontée au classement (rank de départ - rank actuel). */
export function computeBiggestRankClimb(
  source: DisplaySource,
): PlayerHighlight | null {
  if (source.matches.length === 0) return null;
  // Rank initial = rank si on avait commencé l'event/league à ELO 1000.
  // Approximation simple : rang AVANT le premier match = ordre par ELO -
  // sum(eloChanges) sur tous les matchs.
  const startingElo: Record<string, number> = {};
  const sumByPlayer: Record<string, number> = {};
  for (const m of source.matches) {
    if (!m.eloChanges) continue;
    for (const [pid, delta] of Object.entries(m.eloChanges)) {
      sumByPlayer[pid] = (sumByPlayer[pid] ?? 0) + delta;
    }
  }
  for (const p of source.players) {
    startingElo[p.id] = p.elo - (sumByPlayer[p.id] ?? 0);
  }
  // Ranks à l'origine
  const startingRanks: Record<string, number> = {};
  const sortedStart = [...source.players].sort((a, b) => {
    const ea = startingElo[a.id];
    const eb = startingElo[b.id];
    if (eb !== ea) return eb - ea;
    return a.name.localeCompare(b.name);
  });
  sortedStart.forEach((p, idx) => {
    startingRanks[p.id] = idx + 1;
  });

  let bestId: string | null = null;
  let bestClimb = 0;
  for (const p of source.players) {
    const climb = (startingRanks[p.id] ?? p.rank) - p.rank;
    if (climb > bestClimb) {
      bestClimb = climb;
      bestId = p.id;
    }
  }
  if (!bestId || bestClimb <= 0) return null;
  const subject = playerById(source.players, bestId);
  if (!subject) return null;
  return {
    type: "biggest-rank-climb",
    kind: "player",
    subject,
    headline: "Meilleure remontée",
    tagline: `${subject.name} grimpe de ${bestClimb} ${
      bestClimb > 1 ? "places" : "place"
    }`,
    metric: `+${bestClimb}`,
  };
}

/** Plus longue série de victoires consécutives non interrompue. */
export function computeCurrentStreak(
  source: DisplaySource,
): PlayerHighlight | null {
  if (source.matches.length === 0) return null;
  // matches descending — on parcourt par joueur de leur match le plus récent
  // en arrière jusqu'à une défaite ou la fin.
  const streaks: Record<string, number> = {};
  // Construit la liste des résultats par joueur (récent en premier)
  const resultsByPlayer: Record<string, boolean[]> = {};
  for (const m of source.matches) {
    const winA = m.scoreA > m.scoreB;
    for (const pid of m.teamA) {
      if (!resultsByPlayer[pid]) resultsByPlayer[pid] = [];
      resultsByPlayer[pid].push(winA);
    }
    for (const pid of m.teamB) {
      if (!resultsByPlayer[pid]) resultsByPlayer[pid] = [];
      resultsByPlayer[pid].push(!winA);
    }
  }
  for (const [pid, results] of Object.entries(resultsByPlayer)) {
    let n = 0;
    for (const won of results) {
      if (won) n++;
      else break;
    }
    streaks[pid] = n;
  }
  let bestId: string | null = null;
  let bestStreak = 0;
  for (const [pid, s] of Object.entries(streaks)) {
    if (s > bestStreak) {
      bestStreak = s;
      bestId = pid;
    }
  }
  if (!bestId || bestStreak < 2) return null;
  const subject = playerById(source.players, bestId);
  if (!subject) return null;
  return {
    type: "current-streak",
    kind: "player",
    subject,
    headline: "Série en cours",
    tagline: `${subject.name} enchaîne ${bestStreak} victoires d'affilée`,
    metric: `${bestStreak}W`,
  };
}

/**
 * Upset : un match où le perdant avait ≥ 100 ELO d'avance sur le gagnant.
 * On ranke par ampleur de l'écart (perdant ELO - gagnant ELO).
 */
export function computeUpset(source: DisplaySource): PlayerHighlight | null {
  if (source.matches.length === 0) return null;
  let bestMatch: { match: Match; delta: number } | null = null;
  for (const m of source.matches) {
    const winnerTeam = m.scoreA > m.scoreB ? m.teamA : m.teamB;
    const loserTeam = m.scoreA > m.scoreB ? m.teamB : m.teamA;
    // ELO moyen de chaque équipe AVANT le match (on retire les eloChanges)
    const winnerEloBefore =
      winnerTeam.reduce((acc, pid) => {
        const p = playerById(source.players, pid);
        if (!p) return acc;
        const delta = m.eloChanges?.[pid] ?? 0;
        return acc + (p.elo - delta);
      }, 0) / Math.max(winnerTeam.length, 1);
    const loserEloBefore =
      loserTeam.reduce((acc, pid) => {
        const p = playerById(source.players, pid);
        if (!p) return acc;
        const delta = m.eloChanges?.[pid] ?? 0;
        return acc + (p.elo - delta);
      }, 0) / Math.max(loserTeam.length, 1);
    const delta = loserEloBefore - winnerEloBefore;
    if (delta >= 100 && (!bestMatch || delta > bestMatch.delta)) {
      bestMatch = { match: m, delta };
    }
  }
  if (!bestMatch) return null;
  const winnerTeam =
    bestMatch.match.scoreA > bestMatch.match.scoreB
      ? bestMatch.match.teamA
      : bestMatch.match.teamB;
  const winnerName = winnerTeam
    .map((pid) => playerById(source.players, pid)?.name ?? "Joueur")
    .join(" & ");
  const loserTeam =
    bestMatch.match.scoreA > bestMatch.match.scoreB
      ? bestMatch.match.teamB
      : bestMatch.match.teamA;
  const loserName = loserTeam
    .map((pid) => playerById(source.players, pid)?.name ?? "Joueur")
    .join(" & ");
  // Subject = premier gagnant
  const subject = playerById(source.players, winnerTeam[0]);
  if (!subject) return null;
  return {
    type: "upset",
    kind: "player",
    subject,
    headline: "Surprise du chef",
    tagline: `${winnerName} bat ${loserName} (-${Math.round(bestMatch.delta)} ELO)`,
    metric: `Δ${Math.round(bestMatch.delta)}`,
  };
}

/**
 * Nemesis : un couple (A, B) où A a battu B ≥ 3 fois sur la session.
 * On retourne le couple avec le plus grand nombre de victoires côté A.
 */
export function computeNemesis(source: DisplaySource): PairHighlight | null {
  if (source.matches.length === 0) return null;
  // For each match, on inscrit toutes les paires (winner, loser) dans une map
  const counts: Record<string, { winner: string; loser: string; n: number }> = {};
  for (const m of source.matches) {
    const winners = m.scoreA > m.scoreB ? m.teamA : m.teamB;
    const losers = m.scoreA > m.scoreB ? m.teamB : m.teamA;
    for (const w of winners) {
      for (const l of losers) {
        const key = `${w}>${l}`;
        if (!counts[key]) counts[key] = { winner: w, loser: l, n: 0 };
        counts[key].n++;
      }
    }
  }
  let best: { winner: string; loser: string; n: number } | null = null;
  for (const c of Object.values(counts)) {
    if (c.n >= 3 && (!best || c.n > best.n)) best = c;
  }
  if (!best) return null;
  const subjectA = playerById(source.players, best.winner);
  const subjectB = playerById(source.players, best.loser);
  if (!subjectA || !subjectB) return null;
  return {
    type: "nemesis",
    kind: "pair",
    subjectA,
    subjectB,
    headline: "Nemesis",
    tagline: `${subjectA.name} hante ${subjectB.name} — ${best.n}e victoire`,
    metric: `${best.n}-0`,
  };
}

/**
 * Meilleure paire : duo (A, B) ayant joué ensemble ≥ 3 matchs avec winrate
 * > 70%. Ranke par winrate puis par nombre de matchs.
 */
export function computeBestPair(source: DisplaySource): PairHighlight | null {
  if (source.matches.length === 0) return null;
  const stats: Record<
    string,
    { a: string; b: string; wins: number; total: number }
  > = {};
  for (const m of source.matches) {
    // Toutes les paires de teamA
    for (let i = 0; i < m.teamA.length; i++) {
      for (let j = i + 1; j < m.teamA.length; j++) {
        const k = pairKey(m.teamA[i], m.teamA[j]);
        if (!stats[k]) stats[k] = { a: m.teamA[i], b: m.teamA[j], wins: 0, total: 0 };
        stats[k].total++;
        if (m.scoreA > m.scoreB) stats[k].wins++;
      }
    }
    for (let i = 0; i < m.teamB.length; i++) {
      for (let j = i + 1; j < m.teamB.length; j++) {
        const k = pairKey(m.teamB[i], m.teamB[j]);
        if (!stats[k]) stats[k] = { a: m.teamB[i], b: m.teamB[j], wins: 0, total: 0 };
        stats[k].total++;
        if (m.scoreB > m.scoreA) stats[k].wins++;
      }
    }
  }
  let best: { a: string; b: string; wins: number; total: number; rate: number } | null = null;
  for (const s of Object.values(stats)) {
    if (s.total < 3) continue;
    const rate = s.wins / s.total;
    if (rate <= 0.7) continue;
    if (!best || rate > best.rate || (rate === best.rate && s.total > best.total)) {
      best = { ...s, rate };
    }
  }
  if (!best) return null;
  const subjectA = playerById(source.players, best.a);
  const subjectB = playerById(source.players, best.b);
  if (!subjectA || !subjectB) return null;
  return {
    type: "best-pair",
    kind: "pair",
    subjectA,
    subjectB,
    headline: "Meilleure paire",
    tagline: `${subjectA.name} & ${subjectB.name} — ${best.wins}V/${best.total - best.wins}D ensemble`,
    metric: `${Math.round(best.rate * 100)}%`,
  };
}

/* ------------------------- Hook ------------------------- */

/**
 * Retourne la liste des highlights disponibles, dans l'ordre où ils seront
 * cyclés par `HighlightScene`. Liste vide si rien à montrer (pas de matchs,
 * etc.).
 */
export function useDisplayHighlights(source: DisplaySource | null): Highlight[] {
  return useMemo(() => {
    if (!source) return [];
    const all: (Highlight | null)[] = [
      computeBiggestEloGain(source),
      computeBiggestRankClimb(source),
      computeCurrentStreak(source),
      computeUpset(source),
      computeNemesis(source),
      computeBestPair(source),
    ];
    return all.filter((h): h is Highlight => h !== null);
  }, [source]);
}
