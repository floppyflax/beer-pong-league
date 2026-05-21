/**
 * League lifecycle — derived state from `leagues` columns (mig 028 + 029).
 *
 * Schema:
 *   - paused_at               TIMESTAMPTZ NULL  (mig 028 — admin "Mettre en pause")
 *   - ended_at                TIMESTAMPTZ NULL  (mig 028 — admin "Clôturer la league")
 *   - current_season_ended_at TIMESTAMPTZ NULL  (mig 029 — saison N close, en attente de N+1)
 *
 * Rules (précédence du plus terminal au plus actif) :
 *   finished        → endedAt
 *   paused          → !endedAt && pausedAt
 *   between_seasons → !endedAt && !pausedAt && currentSeasonEndedAt
 *   active          → otherwise
 *
 * Une league n'a pas de date de début planifiée — elle est active dès sa
 * création. Pas d'état `not_started` (≠ event).
 *
 * Match logging is only allowed in `active` (between_seasons bloque aussi).
 */

import type { League } from '@/types';

export type LeagueLifecycle =
  | 'active'
  | 'paused'
  | 'between_seasons'
  | 'finished';

export type LeagueLifecycleInput = Pick<
  League,
  'pausedAt' | 'endedAt' | 'currentSeasonEndedAt'
>;

export function getLeagueLifecycle(league: LeagueLifecycleInput): LeagueLifecycle {
  if (league.endedAt) return 'finished';
  if (league.pausedAt) return 'paused';
  if (league.currentSeasonEndedAt) return 'between_seasons';
  return 'active';
}

export const canRecordLeagueMatch = (league: LeagueLifecycleInput): boolean =>
  getLeagueLifecycle(league) === 'active';

export const LEAGUE_LIFECYCLE_LABEL_FR: Record<LeagueLifecycle, string> = {
  active: 'Active',
  paused: 'En pause',
  between_seasons: 'Inter-saison',
  finished: 'Terminée',
};
