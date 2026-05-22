import { useMemo } from "react";
import type { Match } from "@/types";
import type { DisplaySource, DisplaySourcePlayer } from "../types";

export type HighlightType =
  | "biggest-elo-gain"
  | "biggest-rank-climb"
  | "current-streak"
  | "upset";

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

// Les highlights de la scène "Highlight" sont des moments JOUEUR. Les stats
// duo/rivalité vivent dans la scène "Duos & Rivalités" (useDuoRivalryStats).
export type Highlight = PlayerHighlight;

/* ------------------------- Helpers ------------------------- */

function playerById(
  players: DisplaySourcePlayer[],
  id: string,
): DisplaySourcePlayer | undefined {
  return players.find((p) => p.id === id);
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

/* ------------------------- Hook ------------------------- */

/**
 * Retourne la liste des moments marquants JOUEUR disponibles (gain ELO,
 * remontée, série, upset). Liste vide si rien à montrer. Les stats duo/rivalité
 * sont gérées séparément par `useDuoRivalryStats`.
 */
export function useDisplayHighlights(source: DisplaySource | null): Highlight[] {
  return useMemo(() => {
    if (!source) return [];
    const all: (Highlight | null)[] = [
      computeBiggestEloGain(source),
      computeBiggestRankClimb(source),
      computeCurrentStreak(source),
      computeUpset(source),
    ];
    return all.filter((h): h is Highlight => h !== null);
  }, [source]);
}
