/**
 * ELO calculation — pure logic, no platform dependencies.
 *
 * Server-side recomputation lives elsewhere (cf. supabase RPCs
 * `apply_match_elo` + `elo_k_factor`); this module is the canonical
 * client-side implementation used for previews and offline mode.
 *
 * K-factor is CONTEXT-DEPENDENT (decision 2026-05-22):
 *   - `event`  → 64 flat. Events are short (~10-15 matches/player), so the
 *     20-match tier never bites; a high flat K gives a wide, lively ranking
 *     on the night. (The K only scales the spread — it does not change the
 *     order or create upsets.)
 *   - `league` → 32 for the first 20 matches, 16 afterwards. A durable,
 *     stable ranking of true level over a season.
 * Keep in sync with `public.elo_k_factor(matches_played, context)` in
 * supabase/migrations/033_elo_context_k_factor.sql.
 *
 * Team rating = arithmetic mean. Each player's delta is computed against the
 * opposing team's average, then scaled by THAT player's own K-factor — so two
 * teammates in different league tiers can get different deltas for one match.
 */

import type { Player } from './validation';

/** Selects the K-factor regime. `event` = flat 64, `league` = 32/16 tiered. */
export type EloContext = 'event' | 'league';

/** Minimal shape required by `calculateEloChange`. Accepts the full
 * `Player` zod-inferred type or any structural superset. */
export interface EloPlayer {
  id: string;
  elo: number;
  matchesPlayed: number;
}

const getKFactor = (player: EloPlayer, context: EloContext): number => {
  if (context === 'event') return 64;
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
 * @param context 'event' (flat K=64) or 'league' (tiered 32/16). Required so
 *   each call site declares which ELO bubble it computes — the client preview
 *   must match the server's per-context K (cf. `apply_match_elo`).
 * @returns Map of player id → new ELO.
 */
export const calculateEloChange = (
  teamA: EloPlayer[],
  teamB: EloPlayer[],
  winner: 'A' | 'B',
  context: EloContext,
): Record<string, number> => {
  const avgEloA = teamA.reduce((sum, p) => sum + p.elo, 0) / teamA.length;
  const avgEloB = teamB.reduce((sum, p) => sum + p.elo, 0) / teamB.length;

  const expectedA = getExpectedScore(avgEloA, avgEloB);
  const expectedB = getExpectedScore(avgEloB, avgEloA);

  const actualA = winner === 'A' ? 1 : 0;
  const actualB = winner === 'B' ? 1 : 0;

  const newRatings: Record<string, number> = {};

  teamA.forEach((player) => {
    const k = getKFactor(player, context);
    const change = Math.round(k * (actualA - expectedA));
    newRatings[player.id] = player.elo + change;
  });

  teamB.forEach((player) => {
    const k = getKFactor(player, context);
    const change = Math.round(k * (actualB - expectedB));
    newRatings[player.id] = player.elo + change;
  });

  return newRatings;
};

// Re-export for callers that want the strict zod-inferred Player.
export type { Player };
