/**
 * ELO calculation — pure logic, no platform dependencies.
 *
 * Server-side recomputation lives elsewhere (cf. supabase RPC
 * `apply_match_elo`); this module is the canonical client-side
 * implementation used for previews and offline mode.
 *
 * Spec: K-factor 32 for the first 20 matches, 16 afterwards. Team
 * rating = arithmetic mean. Each player's delta is computed against
 * the opposing team's average.
 */

import type { Player } from './validation';

/** Minimal shape required by `calculateEloChange`. Accepts the full
 * `Player` zod-inferred type or any structural superset. */
export interface EloPlayer {
  id: string;
  elo: number;
  matchesPlayed: number;
}

const getKFactor = (player: EloPlayer): number => {
  return player.matchesPlayed < 20 ? 32 : 16;
};

const getExpectedScore = (Ra: number, Rb: number): number => {
  return 1 / (1 + Math.pow(10, (Rb - Ra) / 400));
};

/**
 * Calculate the new ELO ratings for two teams after a match.
 *
 * @param teamA Players on team A.
 * @param teamB Players on team B.
 * @param winner 'A' or 'B'.
 * @returns Map of player id → new ELO.
 */
export const calculateEloChange = (
  teamA: EloPlayer[],
  teamB: EloPlayer[],
  winner: 'A' | 'B',
): Record<string, number> => {
  const avgEloA = teamA.reduce((sum, p) => sum + p.elo, 0) / teamA.length;
  const avgEloB = teamB.reduce((sum, p) => sum + p.elo, 0) / teamB.length;

  const expectedA = getExpectedScore(avgEloA, avgEloB);
  const expectedB = getExpectedScore(avgEloB, avgEloA);

  const actualA = winner === 'A' ? 1 : 0;
  const actualB = winner === 'B' ? 1 : 0;

  const newRatings: Record<string, number> = {};

  teamA.forEach((player) => {
    const k = getKFactor(player);
    const change = Math.round(k * (actualA - expectedA));
    newRatings[player.id] = player.elo + change;
  });

  teamB.forEach((player) => {
    const k = getKFactor(player);
    const change = Math.round(k * (actualB - expectedB));
    newRatings[player.id] = player.elo + change;
  });

  return newRatings;
};

// Re-export for callers that want the strict zod-inferred Player.
export type { Player };
