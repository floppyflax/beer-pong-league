/**
 * League lifecycle — derived state from `leagues` columns (mig 028).
 *
 * Schema:
 *   - paused_at  TIMESTAMPTZ NULL  (admin "Mettre en pause")
 *   - ended_at   TIMESTAMPTZ NULL  (admin "Clôturer la league")
 *
 * Rules:
 *   finished → ended_at
 *   paused   → !ended_at && paused_at
 *   active   → otherwise
 *
 * Une league n'a pas de date de début planifiée — elle est active dès sa
 * création. Pas d'état `not_started` (≠ event).
 *
 * Match logging is only allowed in `active`.
 */

import type { League } from '@/types';

export type LeagueLifecycle = 'active' | 'paused' | 'finished';

export type LeagueLifecycleInput = Pick<League, 'pausedAt' | 'endedAt'>;

export function getLeagueLifecycle(league: LeagueLifecycleInput): LeagueLifecycle {
  if (league.endedAt) return 'finished';
  if (league.pausedAt) return 'paused';
  return 'active';
}

export const canRecordLeagueMatch = (league: LeagueLifecycleInput): boolean =>
  getLeagueLifecycle(league) === 'active';

export const LEAGUE_LIFECYCLE_LABEL_FR: Record<LeagueLifecycle, string> = {
  active: 'Active',
  paused: 'En pause',
  finished: 'Terminée',
};
