import { useMemo } from "react";
import type { Match } from "@/types";
import {
  computeBestAlly,
  computeFormTrend,
  computeNemesis,
  computeWinRateByFormat,
} from "@/utils/playerStatsAdvanced";
import { computeTopRivalries } from "@/utils/contextStats";
import type { DisplaySource, DisplaySourcePlayer } from "../types";
import type { StatCardData, StatSubject } from "../components/StatRevealCard";

const MIN_TOGETHER = 3;
const MIN_AGAINST = 3;
/** Un adversaire doit avoir battu le joueur au moins ça pour être sa "bête noire". */
const MIN_NEMESIS_WINS = 2;
/** Nombre min de matchs joués pour qu'un joueur soit éligible au focus.
 *  À 1 → dès qu'un joueur a joué au moins une rencontre, il peut apparaître
 *  en focus (au minimum la tuile "Bilan", plus les autres si la data suit). */
const MIN_PLAYED = 1;
/** Nombre min de matchs sur un format pour qu'il soit jugé "favori" — sinon
 *  l'info repose sur trop peu de signal pour être pertinente. */
const MIN_FORMAT_MATCHES = 3;

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
  if (best && worst && best.aId === worst.aId && best.bId === worst.bId) {
    worst = null;
  }
  return { best, worst };
}

/** Série en cours (run en tête des résultats récents, le plus récent en 1er). */
function leadingStreak(recent: boolean[]): { n: number; win: boolean } | null {
  if (recent.length === 0) return null;
  const win = recent[0];
  let n = 0;
  for (const r of recent) {
    if (r === win) n += 1;
    else break;
  }
  return n >= 2 ? { n, win } : null;
}

export type FocusTileColor = "white" | "lime" | "signal-red" | "electric-blue" | "ping-yellow";

export interface FocusTile {
  label: string;
  value: string;
  sub?: string;
  color: FocusTileColor;
}

export interface PlayerFocus {
  player: DisplaySourcePlayer;
  tiles: FocusTile[];
}

export interface DuoRivalryStats {
  /** Cartes globales déterministes pour la scène "Duos" (meilleur/pire binôme,
   *  plus grande rivalité). Toujours les mêmes. */
  globalCards: StatCardData[];
  /** Joueurs éligibles à une scène "Focus joueur". */
  eligiblePlayerIds: string[];
  /** Construit le focus d'un joueur : grand sujet + tuiles de stats perso. */
  playerFocusFor: (playerId: string) => PlayerFocus | null;
  /** Au moins un binôme/rivalité global → inclure la scène "Duos". */
  duosAvailable: boolean;
  /** Au moins un joueur avec un focus intéressant → inclure la scène "Focus joueur". */
  focusAvailable: boolean;
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

    // --- Cartes globales (scène Duos) ---
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
      .filter((p) => p.wins + p.losses >= MIN_PLAYED)
      .map((p) => p.id);

    // --- Focus joueur ---
    const playerFocusFor = (playerId: string): PlayerFocus | null => {
      const player = players.find((p) => p.id === playerId);
      if (!player) return null;
      const tiles: FocusTile[] = [];

      // Bilan (toujours)
      tiles.push({
        label: "Bilan",
        value: `${player.wins}V ${player.losses}D`,
        sub: `${player.winRate}% de victoires`,
        color: "white",
      });

      // Série en cours
      const streak = leadingStreak(player.recentResults);
      if (streak) {
        tiles.push({
          label: "Série en cours",
          value: `${streak.n}${streak.win ? "V" : "D"}`,
          sub: streak.win ? "victoires d'affilée" : "défaites d'affilée",
          color: streak.win ? "lime" : "signal-red",
        });
      }

      // Meilleur allié
      const ally = computeBestAlly(playerId, matches, MIN_TOGETHER);
      if (ally) {
        tiles.push({
          label: "Meilleur allié",
          value: nameOf(ally.playerId),
          sub: `${ally.winRate}% ensemble (${ally.matchesPlayed} matchs)`,
          color: "electric-blue",
        });
      }

      // Bête noire
      const nem = computeNemesis(playerId, matches, MIN_AGAINST);
      if (nem && nem.losses >= MIN_NEMESIS_WINS) {
        tiles.push({
          label: "Bête noire",
          value: nameOf(nem.playerId),
          sub: `t'a battu ${nem.losses} fois sur ${nem.matchesPlayed}`,
          color: "signal-red",
        });
      }

      // Format favori
      const formats = computeWinRateByFormat(playerId, matches)
        .filter((f) => f.matches >= MIN_FORMAT_MATCHES)
        .sort((a, b) => b.matches - a.matches);
      if (formats[0]) {
        tiles.push({
          label: "Format favori",
          value: formats[0].format,
          sub: `${formats[0].winRate}% sur ${formats[0].matches} matchs`,
          color: "ping-yellow",
        });
      }

      // Forme récente
      const form = computeFormTrend(playerId, matches);
      if (form.lifetimeMatches >= 5 && form.recentMatches >= 3) {
        tiles.push({
          label: "Forme",
          value: `${form.delta >= 0 ? "+" : ""}${form.delta}%`,
          sub: form.delta >= 0 ? "en progression" : "en perte de vitesse",
          color: form.delta >= 0 ? "lime" : "signal-red",
        });
      }

      return { player, tiles };
    };

    // Aligné sur le fallback de PlayerFocusScene : ≥ 1 tuile suffit ("Bilan"
    // est toujours présente dès qu'un joueur a joué un match).
    const focusAvailable = eligiblePlayerIds.some(
      (id) => (playerFocusFor(id)?.tiles.length ?? 0) >= 1,
    );

    return {
      globalCards,
      eligiblePlayerIds,
      playerFocusFor,
      duosAvailable: globalCards.length > 0,
      focusAvailable,
    };
  }, [matches, players]);
}
