/**
 * Stats détaillées au niveau d'un contexte (league ou event).
 *
 * Branché sur `DetailedStatsPanel` (LeagueDashboard + EventDashboard). Toutes
 * les fonctions sont pures et déterministes — la mémoization est laissée au
 * composant consommateur.
 *
 * Conforme invariant #8 (`CLAUDE.md`) : aucune agrégation cross-context.
 */

import type { Match, Player } from "@/types";

export type ContextMatch = Pick<
  Match,
  "id" | "date" | "teamA" | "teamB" | "scoreA" | "scoreB" | "eloChanges"
>;

export type ContextPlayer = Pick<Player, "id" | "name" | "elo">;

export interface TopScorer {
  playerId: string;
  name: string;
  wins: number;
  losses: number;
  matches: number;
  winRate: number;
}

export interface StreakHolder {
  playerId: string;
  name: string;
  streak: number;
}

export interface StreakInfo {
  active: StreakHolder | null;
  record: StreakHolder | null;
}

export interface UpsetParticipant {
  playerId: string;
  name: string;
}

export interface BiggestUpset {
  matchId: string;
  date: string;
  winners: UpsetParticipant[];
  losers: UpsetParticipant[];
  winnerAvgElo: number;
  loserAvgElo: number;
  eloGap: number;
}

export interface Rivalry {
  playerAId: string;
  playerAName: string;
  playerBId: string;
  playerBName: string;
  matchesPlayed: number;
  winsA: number;
  winsB: number;
}

export interface ContextStats {
  topScorers: TopScorer[];
  streaks: StreakInfo;
  biggestUpset: BiggestUpset | null;
  topRivalries: Rivalry[];
  totalMatches: number;
}

const DEFAULT_TOP_SCORERS = 5;
const DEFAULT_TOP_RIVALRIES = 3;
const MIN_RIVALRY_MATCHES = 2;
const FALLBACK_ELO = 1000;

function buildNameMap(players: ContextPlayer[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const p of players) map[p.id] = p.name;
  return map;
}

function nameOf(playerId: string, nameMap: Record<string, string>): string {
  return nameMap[playerId] ?? `Joueur ${playerId.slice(0, 8)}`;
}

function sortMatchesAsc<T extends { date: string }>(matches: T[]): T[] {
  return [...matches].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
}

function teamOf(playerId: string, match: ContextMatch): "A" | "B" | null {
  if (match.teamA.includes(playerId)) return "A";
  if (match.teamB.includes(playerId)) return "B";
  return null;
}

function didWin(playerId: string, match: ContextMatch): boolean | null {
  const team = teamOf(playerId, match);
  if (team === null) return null;
  if (match.scoreA === match.scoreB) return null;
  const winner = match.scoreA > match.scoreB ? "A" : "B";
  return team === winner;
}

export function computeTopScorers(
  matches: ContextMatch[],
  players: ContextPlayer[],
  limit: number = DEFAULT_TOP_SCORERS,
): TopScorer[] {
  const nameMap = buildNameMap(players);
  const counts = new Map<string, { wins: number; losses: number }>();
  for (const p of players) counts.set(p.id, { wins: 0, losses: 0 });

  for (const match of matches) {
    if (match.scoreA === match.scoreB) continue;
    const winnerTeam = match.scoreA > match.scoreB ? match.teamA : match.teamB;
    const loserTeam = match.scoreA > match.scoreB ? match.teamB : match.teamA;
    for (const pid of winnerTeam) {
      const entry = counts.get(pid) ?? { wins: 0, losses: 0 };
      entry.wins += 1;
      counts.set(pid, entry);
    }
    for (const pid of loserTeam) {
      const entry = counts.get(pid) ?? { wins: 0, losses: 0 };
      entry.losses += 1;
      counts.set(pid, entry);
    }
  }

  const scorers: TopScorer[] = [];
  for (const [playerId, { wins, losses }] of counts) {
    const total = wins + losses;
    if (total === 0) continue;
    scorers.push({
      playerId,
      name: nameOf(playerId, nameMap),
      wins,
      losses,
      matches: total,
      winRate: Math.round((wins / total) * 100),
    });
  }
  scorers.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.winRate !== a.winRate) return b.winRate - a.winRate;
    return a.name.localeCompare(b.name);
  });
  return scorers.slice(0, limit);
}

export function computeStreaks(
  matches: ContextMatch[],
  players: ContextPlayer[],
): StreakInfo {
  const nameMap = buildNameMap(players);
  const matchesAsc = sortMatchesAsc(matches);

  let bestActive: StreakHolder | null = null;
  let bestRecord: StreakHolder | null = null;

  const allPlayerIds = new Set<string>(players.map((p) => p.id));
  for (const m of matchesAsc) {
    for (const pid of [...m.teamA, ...m.teamB]) allPlayerIds.add(pid);
  }

  for (const pid of allPlayerIds) {
    let current = 0;
    let maxPositive = 0;
    let endedOnWin = false;
    for (const match of matchesAsc) {
      const result = didWin(pid, match);
      if (result === null) continue;
      if (result) {
        current = current > 0 ? current + 1 : 1;
        if (current > maxPositive) maxPositive = current;
        endedOnWin = true;
      } else {
        current = current < 0 ? current - 1 : -1;
        endedOnWin = false;
      }
    }
    if (endedOnWin && current > 0) {
      if (bestActive === null || current > bestActive.streak) {
        bestActive = { playerId: pid, name: nameOf(pid, nameMap), streak: current };
      }
    }
    if (maxPositive > 0) {
      if (bestRecord === null || maxPositive > bestRecord.streak) {
        bestRecord = {
          playerId: pid,
          name: nameOf(pid, nameMap),
          streak: maxPositive,
        };
      }
    }
  }

  return { active: bestActive, record: bestRecord };
}

function computePreMatchEloMap(
  matches: ContextMatch[],
  players: ContextPlayer[],
): Map<string, Record<string, number>> {
  const result = new Map<string, Record<string, number>>();
  const matchesAsc = sortMatchesAsc(matches);

  const totalDelta: Record<string, number> = {};
  for (const m of matchesAsc) {
    if (!m.eloChanges) continue;
    for (const [pid, delta] of Object.entries(m.eloChanges)) {
      totalDelta[pid] = (totalDelta[pid] ?? 0) + delta;
    }
  }

  const running: Record<string, number> = {};
  for (const p of players) {
    running[p.id] = p.elo - (totalDelta[p.id] ?? 0);
  }

  for (const m of matchesAsc) {
    const pre: Record<string, number> = {};
    for (const pid of [...m.teamA, ...m.teamB]) {
      pre[pid] = running[pid] ?? FALLBACK_ELO;
    }
    result.set(m.id, pre);
    if (m.eloChanges) {
      for (const [pid, delta] of Object.entries(m.eloChanges)) {
        running[pid] = (running[pid] ?? FALLBACK_ELO) + delta;
      }
    }
  }
  return result;
}

function avg(values: number[]): number {
  if (values.length === 0) return FALLBACK_ELO;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

export function computeBiggestUpset(
  matches: ContextMatch[],
  players: ContextPlayer[],
): BiggestUpset | null {
  if (matches.length === 0) return null;
  const nameMap = buildNameMap(players);
  const preMatchElo = computePreMatchEloMap(matches, players);

  let best: BiggestUpset | null = null;
  for (const match of matches) {
    if (match.scoreA === match.scoreB) continue;
    const winnerTeam = match.scoreA > match.scoreB ? match.teamA : match.teamB;
    const loserTeam = match.scoreA > match.scoreB ? match.teamB : match.teamA;
    const eloByPlayer = preMatchElo.get(match.id) ?? {};
    const winnerAvg = avg(winnerTeam.map((pid) => eloByPlayer[pid] ?? FALLBACK_ELO));
    const loserAvg = avg(loserTeam.map((pid) => eloByPlayer[pid] ?? FALLBACK_ELO));
    const gap = loserAvg - winnerAvg;
    if (gap <= 0) continue;
    if (best === null || gap > best.eloGap) {
      best = {
        matchId: match.id,
        date: match.date,
        winners: winnerTeam.map((pid) => ({
          playerId: pid,
          name: nameOf(pid, nameMap),
        })),
        losers: loserTeam.map((pid) => ({
          playerId: pid,
          name: nameOf(pid, nameMap),
        })),
        winnerAvgElo: Math.round(winnerAvg),
        loserAvgElo: Math.round(loserAvg),
        eloGap: Math.round(gap),
      };
    }
  }
  return best;
}

function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export function computeTopRivalries(
  matches: ContextMatch[],
  players: ContextPlayer[],
  limit: number = DEFAULT_TOP_RIVALRIES,
): Rivalry[] {
  const nameMap = buildNameMap(players);
  const pairs = new Map<
    string,
    {
      playerAId: string;
      playerBId: string;
      matchesPlayed: number;
      winsA: number;
      winsB: number;
    }
  >();

  for (const match of matches) {
    if (match.scoreA === match.scoreB) continue;
    const winnerTeam = match.scoreA > match.scoreB ? "A" : "B";
    for (const aId of match.teamA) {
      for (const bId of match.teamB) {
        const key = pairKey(aId, bId);
        const [first, second] = key.split("|");
        const entry = pairs.get(key) ?? {
          playerAId: first,
          playerBId: second,
          matchesPlayed: 0,
          winsA: 0,
          winsB: 0,
        };
        entry.matchesPlayed += 1;
        const aIsFirst = aId === first;
        const aWon = winnerTeam === "A";
        const firstWon = (aIsFirst && aWon) || (!aIsFirst && !aWon);
        if (firstWon) entry.winsA += 1;
        else entry.winsB += 1;
        pairs.set(key, entry);
      }
    }
  }

  const rivalries: Rivalry[] = [];
  for (const p of pairs.values()) {
    if (p.matchesPlayed < MIN_RIVALRY_MATCHES) continue;
    rivalries.push({
      playerAId: p.playerAId,
      playerAName: nameOf(p.playerAId, nameMap),
      playerBId: p.playerBId,
      playerBName: nameOf(p.playerBId, nameMap),
      matchesPlayed: p.matchesPlayed,
      winsA: p.winsA,
      winsB: p.winsB,
    });
  }
  rivalries.sort((a, b) => {
    if (b.matchesPlayed !== a.matchesPlayed) {
      return b.matchesPlayed - a.matchesPlayed;
    }
    return a.playerAName.localeCompare(b.playerAName);
  });
  return rivalries.slice(0, limit);
}

export function computeContextStats(
  matches: ContextMatch[],
  players: ContextPlayer[],
): ContextStats {
  return {
    topScorers: computeTopScorers(matches, players),
    streaks: computeStreaks(matches, players),
    biggestUpset: computeBiggestUpset(matches, players),
    topRivalries: computeTopRivalries(matches, players),
    totalMatches: matches.length,
  };
}
