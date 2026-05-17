/**
 * Stats avancées au niveau d'un joueur, dérivées de l'agrégat de ses matchs
 * (potentiellement cross-context : league + event).
 *
 * Conforme invariant #8 (`CLAUDE.md`) : aucune fonction ne renvoie d'ELO
 * agrégé. Seuls les compteurs W/L sont utilisés pour les agrégats
 * cross-league (cohérent avec `PersonalStatsSummary`).
 */

export type PlayerStatsMatch = {
  id: string;
  date: string;
  teamA: string[];
  teamB: string[];
  scoreA: number;
  scoreB: number;
};

export type MatchFormat = "1v1" | "2v2" | "3v3" | "autre";

export interface FormatWinRate {
  format: MatchFormat;
  matches: number;
  wins: number;
  winRate: number;
}

export interface AllyOrEnemy {
  playerId: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
}

export interface FormTrend {
  recentWinRate: number;
  lifetimeWinRate: number;
  delta: number;
  recentMatches: number;
  lifetimeMatches: number;
}

const DEFAULT_MIN_TOGETHER = 3;
const DEFAULT_RECENT_WINDOW = 10;
const ALL_FORMATS: MatchFormat[] = ["1v1", "2v2", "3v3"];

function teamOf(playerId: string, match: PlayerStatsMatch): "A" | "B" | null {
  if (match.teamA.includes(playerId)) return "A";
  if (match.teamB.includes(playerId)) return "B";
  return null;
}

function didWin(playerId: string, match: PlayerStatsMatch): boolean | null {
  const team = teamOf(playerId, match);
  if (team === null) return null;
  if (match.scoreA === match.scoreB) return null;
  const winner = match.scoreA > match.scoreB ? "A" : "B";
  return team === winner;
}

function formatOf(match: PlayerStatsMatch): MatchFormat {
  const sizeA = match.teamA.length;
  const sizeB = match.teamB.length;
  if (sizeA !== sizeB) return "autre";
  if (sizeA === 1) return "1v1";
  if (sizeA === 2) return "2v2";
  if (sizeA === 3) return "3v3";
  return "autre";
}

export function computeWinRateByFormat(
  playerId: string,
  matches: PlayerStatsMatch[],
): FormatWinRate[] {
  const counts: Record<MatchFormat, { matches: number; wins: number }> = {
    "1v1": { matches: 0, wins: 0 },
    "2v2": { matches: 0, wins: 0 },
    "3v3": { matches: 0, wins: 0 },
    autre: { matches: 0, wins: 0 },
  };
  for (const match of matches) {
    const result = didWin(playerId, match);
    if (result === null) continue;
    const fmt = formatOf(match);
    counts[fmt].matches += 1;
    if (result) counts[fmt].wins += 1;
  }
  return ALL_FORMATS.map((format) => {
    const { matches: m, wins } = counts[format];
    return {
      format,
      matches: m,
      wins,
      winRate: m > 0 ? Math.round((wins / m) * 100) : 0,
    };
  });
}

function aggregatePartners(
  playerId: string,
  matches: PlayerStatsMatch[],
  pick: "ally" | "enemy",
): Map<string, { matchesPlayed: number; wins: number; losses: number }> {
  const stats = new Map<
    string,
    { matchesPlayed: number; wins: number; losses: number }
  >();
  for (const match of matches) {
    const team = teamOf(playerId, match);
    if (team === null) continue;
    if (match.scoreA === match.scoreB) continue;
    const playerWon = didWin(playerId, match);
    if (playerWon === null) continue;
    const targets =
      pick === "ally"
        ? team === "A"
          ? match.teamA.filter((id) => id !== playerId)
          : match.teamB.filter((id) => id !== playerId)
        : team === "A"
          ? match.teamB
          : match.teamA;
    for (const pid of targets) {
      const entry = stats.get(pid) ?? { matchesPlayed: 0, wins: 0, losses: 0 };
      entry.matchesPlayed += 1;
      if (playerWon) entry.wins += 1;
      else entry.losses += 1;
      stats.set(pid, entry);
    }
  }
  return stats;
}

export function computeBestAlly(
  playerId: string,
  matches: PlayerStatsMatch[],
  minMatchesTogether: number = DEFAULT_MIN_TOGETHER,
): AllyOrEnemy | null {
  const stats = aggregatePartners(playerId, matches, "ally");
  let best: AllyOrEnemy | null = null;
  for (const [pid, s] of stats) {
    if (s.matchesPlayed < minMatchesTogether) continue;
    const winRate = Math.round((s.wins / s.matchesPlayed) * 100);
    const candidate: AllyOrEnemy = {
      playerId: pid,
      matchesPlayed: s.matchesPlayed,
      wins: s.wins,
      losses: s.losses,
      winRate,
    };
    if (
      best === null ||
      candidate.winRate > best.winRate ||
      (candidate.winRate === best.winRate &&
        candidate.matchesPlayed > best.matchesPlayed)
    ) {
      best = candidate;
    }
  }
  return best;
}

export function computeNemesis(
  playerId: string,
  matches: PlayerStatsMatch[],
  minMatchesAgainst: number = DEFAULT_MIN_TOGETHER,
): AllyOrEnemy | null {
  const stats = aggregatePartners(playerId, matches, "enemy");
  let worst: AllyOrEnemy | null = null;
  for (const [pid, s] of stats) {
    if (s.matchesPlayed < minMatchesAgainst) continue;
    const winRate = Math.round((s.wins / s.matchesPlayed) * 100);
    const candidate: AllyOrEnemy = {
      playerId: pid,
      matchesPlayed: s.matchesPlayed,
      wins: s.wins,
      losses: s.losses,
      winRate,
    };
    if (
      worst === null ||
      candidate.winRate < worst.winRate ||
      (candidate.winRate === worst.winRate &&
        candidate.matchesPlayed > worst.matchesPlayed)
    ) {
      worst = candidate;
    }
  }
  return worst;
}

export function computeFormTrend(
  playerId: string,
  matches: PlayerStatsMatch[],
  recentWindow: number = DEFAULT_RECENT_WINDOW,
): FormTrend {
  const playerMatches = matches.filter(
    (m) => teamOf(playerId, m) !== null && m.scoreA !== m.scoreB,
  );
  const sortedDesc = [...playerMatches].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  const recentSlice = sortedDesc.slice(0, recentWindow);
  const recentWins = recentSlice.filter((m) => didWin(playerId, m)).length;
  const lifetimeWins = sortedDesc.filter((m) => didWin(playerId, m)).length;
  const recentWinRate =
    recentSlice.length > 0
      ? Math.round((recentWins / recentSlice.length) * 100)
      : 0;
  const lifetimeWinRate =
    sortedDesc.length > 0
      ? Math.round((lifetimeWins / sortedDesc.length) * 100)
      : 0;
  return {
    recentWinRate,
    lifetimeWinRate,
    delta: recentWinRate - lifetimeWinRate,
    recentMatches: recentSlice.length,
    lifetimeMatches: sortedDesc.length,
  };
}
