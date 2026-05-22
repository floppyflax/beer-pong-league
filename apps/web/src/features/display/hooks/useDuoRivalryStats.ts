import { useMemo } from "react";
import type { Match } from "@/types";
import {
  computeBestAlly,
  computeNemesis,
} from "@/utils/playerStatsAdvanced";
import { computeTopRivalries } from "@/utils/contextStats";
import type { DisplaySource } from "../types";
import type { StatCardData, StatSubject } from "../components/StatRevealCard";

const MIN_TOGETHER = 3;
const MIN_AGAINST = 3;
/** Un adversaire doit avoir battu le joueur au moins ça pour être sa "bête noire". */
const MIN_NEMESIS_WINS = 2;

interface PairStat {
  aId: string;
  bId: string;
  wins: number;
  total: number;
  winRate: number;
}

function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/** Agrège toutes les paires de coéquipiers (≥ MIN_TOGETHER ensemble) et renvoie
 *  le meilleur et le pire binôme par winrate. Pur. */
export function computePairExtremes(matches: Match[]): {
  best: PairStat | null;
  worst: PairStat | null;
} {
  const stats = new Map<string, { aId: string; bId: string; wins: number; total: number }>();
  const addTeam = (ids: string[], won: boolean) => {
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const k = pairKey(ids[i], ids[j]);
        const [first, second] = k.split("|");
        const e = stats.get(k) ?? { aId: first, bId: second, wins: 0, total: 0 };
        e.total += 1;
        if (won) e.wins += 1;
        stats.set(k, e);
      }
    }
  };
  for (const m of matches) {
    if (m.scoreA === m.scoreB) continue;
    const winA = m.scoreA > m.scoreB;
    addTeam(m.teamA, winA);
    addTeam(m.teamB, !winA);
  }

  let best: PairStat | null = null;
  let worst: PairStat | null = null;
  for (const e of stats.values()) {
    if (e.total < MIN_TOGETHER) continue;
    const winRate = Math.round((e.wins / e.total) * 100);
    const stat: PairStat = { ...e, winRate };
    if (!best || winRate > best.winRate || (winRate === best.winRate && e.total > best.total)) {
      best = stat;
    }
    if (!worst || winRate < worst.winRate || (winRate === worst.winRate && e.total > worst.total)) {
      worst = stat;
    }
  }
  // Si une seule paire éligible, ne pas afficher best ET worst identiques.
  if (best && worst && best.aId === worst.aId && best.bId === worst.bId) {
    worst = null;
  }
  return { best, worst };
}

export interface DuoRivalryStats {
  /** Cartes globales déterministes (meilleur/pire binôme, plus grande rivalité). */
  globalCards: StatCardData[];
  /** Joueurs avec assez de matchs pour une stat par-joueur. */
  eligiblePlayerIds: string[];
  nemesisCardFor: (playerId: string) => StatCardData | null;
  bestAllyCardFor: (playerId: string) => StatCardData | null;
  /** true s'il existe au moins une carte affichable (pour inclure la scène). */
  available: boolean;
  /** Tire un set aléatoire de `max` cartes (mix global + par-joueur random). */
  buildCards: (max?: number, rng?: () => number) => StatCardData[];
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function useDuoRivalryStats(source: DisplaySource | null): DuoRivalryStats {
  const matches = source?.matches ?? [];
  const players = source?.players ?? [];

  return useMemo(() => {
    const nameOf = (id: string) =>
      players.find((p) => p.id === id)?.name ?? "Joueur";
    const subjectOf = (id: string): StatSubject => {
      const p = players.find((sp) => sp.id === id);
      return { id, name: p?.name ?? "Joueur", avatarUrl: p?.avatarUrl };
    };

    // --- Cartes globales ---
    const globalCards: StatCardData[] = [];
    const { best, worst } = computePairExtremes(matches);
    if (best) {
      globalCards.push({
        key: "best-pair",
        accent: "best-pair",
        headline: "Meilleur binôme",
        metric: `${best.winRate}%`,
        tagline: `${nameOf(best.aId)} & ${nameOf(best.bId)} · ${best.wins}V ensemble`,
        subjects: [subjectOf(best.aId), subjectOf(best.bId)],
        pairMode: "and",
      });
    }
    if (worst) {
      globalCards.push({
        key: "worst-pair",
        accent: "worst-pair",
        headline: "Pire binôme",
        metric: `${worst.winRate}%`,
        tagline: `${nameOf(worst.aId)} & ${nameOf(worst.bId)} · ${worst.total - worst.wins}D ensemble`,
        subjects: [subjectOf(worst.aId), subjectOf(worst.bId)],
        pairMode: "and",
      });
    }
    const riv = computeTopRivalries(matches, players, 1)[0];
    if (riv) {
      globalCards.push({
        key: "rivalry",
        accent: "rivalry",
        headline: "Plus grande rivalité",
        metric: `${riv.winsA}–${riv.winsB}`,
        tagline: `${riv.playerAName} vs ${riv.playerBName} · ${riv.matchesPlayed} duels`,
        subjects: [subjectOf(riv.playerAId), subjectOf(riv.playerBId)],
        pairMode: "vs",
      });
    }

    const eligiblePlayerIds = players
      .filter((p) => p.wins + p.losses >= MIN_TOGETHER)
      .map((p) => p.id);

    const nemesisCardFor = (playerId: string): StatCardData | null => {
      const n = computeNemesis(playerId, matches, MIN_AGAINST);
      // n.losses = défaites du joueur contre cet adversaire = victoires de l'adversaire sur lui
      if (!n || n.losses < MIN_NEMESIS_WINS) return null;
      return {
        key: `nemesis-${playerId}`,
        accent: "nemesis",
        headline: `La bête noire de ${nameOf(playerId)}`,
        metric: `${n.losses}`,
        tagline: `bat ${nameOf(playerId)} ${n.losses} fois sur ${n.matchesPlayed}`,
        subjects: [subjectOf(n.playerId)],
      };
    };

    const bestAllyCardFor = (playerId: string): StatCardData | null => {
      const a = computeBestAlly(playerId, matches, MIN_TOGETHER);
      if (!a) return null;
      return {
        key: `ally-${playerId}`,
        accent: "best-ally",
        headline: `Meilleur allié de ${nameOf(playerId)}`,
        metric: `${a.winRate}%`,
        tagline: `${nameOf(playerId)} gagne le plus avec ${nameOf(a.playerId)}`,
        subjects: [subjectOf(a.playerId)],
      };
    };

    const buildCards = (
      max: number = 3,
      rng: () => number = Math.random,
    ): StatCardData[] => {
      const pool: StatCardData[] = [...globalCards];
      // Ajoute des cartes par-joueur sur quelques joueurs tirés au hasard.
      for (const pid of shuffle(eligiblePlayerIds, rng).slice(0, 4)) {
        const n = nemesisCardFor(pid);
        if (n) pool.push(n);
        const a = bestAllyCardFor(pid);
        if (a) pool.push(a);
      }
      // Dé-doublonne par accent pour éviter 2 "bête noire" côte à côte.
      const seen = new Set<string>();
      const deduped = shuffle(pool, rng).filter((c) => {
        if (seen.has(c.accent)) return false;
        seen.add(c.accent);
        return true;
      });
      return deduped.slice(0, max);
    };

    const available =
      globalCards.length > 0 ||
      eligiblePlayerIds.some((id) => nemesisCardFor(id) || bestAllyCardFor(id));

    return {
      globalCards,
      eligiblePlayerIds,
      nemesisCardFor,
      bestAllyCardFor,
      available,
      buildCards,
    };
  }, [matches, players]);
}
