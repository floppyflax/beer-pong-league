/**
 * League lifecycle — derived state from `leagues` columns (mig 028 + 029 + 030).
 *
 * Schema:
 *   - paused_at               TIMESTAMPTZ NULL  (mig 028 — admin "Mettre en pause")
 *   - ended_at                TIMESTAMPTZ NULL  (mig 028 — admin "Clôturer la league")
 *   - planned_start_at        TIMESTAMPTZ NULL  (mig 029 — gate not_started si futur)
 *   - current_season_ended_at TIMESTAMPTZ NULL  (mig 030 — saison N close, en attente de N+1)
 *
 * Rules (précédence du plus terminal au plus actif) :
 *   finished        → endedAt
 *   paused          → !endedAt && pausedAt
 *   between_seasons → !endedAt && !pausedAt && currentSeasonEndedAt
 *   not_started     → !endedAt && !pausedAt && !currentSeasonEndedAt && plannedStartAt > today
 *   active          → otherwise
 *
 * Match logging is only allowed in `active`.
 *
 * Plus, des rappels informationnels (`getLeagueReminders`) qui n'affectent pas
 * le gating mais peuvent déclencher des strips UX (mig 029) :
 *   - seasonOverdue : currentSeasonStartedAt + seasonDurationDays < now
 *   - leagueOverdue : plannedEndAt < now (et league non encore clôturée)
 */

import type { League } from '@/types';

export type LeagueLifecycle =
  | 'not_started'
  | 'active'
  | 'paused'
  | 'between_seasons'
  | 'finished';

export type LeagueLifecycleInput = Pick<
  League,
  'pausedAt' | 'endedAt' | 'plannedStartAt' | 'currentSeasonEndedAt'
>;

const todayIso = (): string => new Date().toISOString().slice(0, 10);

export function getLeagueLifecycle(league: LeagueLifecycleInput): LeagueLifecycle {
  if (league.endedAt) return 'finished';
  if (league.pausedAt) return 'paused';
  if (league.currentSeasonEndedAt) return 'between_seasons';
  const startsAt = league.plannedStartAt?.slice(0, 10);
  if (startsAt && startsAt > todayIso()) return 'not_started';
  return 'active';
}

export const canRecordLeagueMatch = (league: LeagueLifecycleInput): boolean =>
  getLeagueLifecycle(league) === 'active';

export const LEAGUE_LIFECYCLE_LABEL_FR: Record<LeagueLifecycle, string> = {
  not_started: 'Non démarrée',
  active: 'Active',
  paused: 'En pause',
  between_seasons: 'Inter-saison',
  finished: 'Terminée',
};

// ── Rappels informationnels (mig 029) ──────────────────────────────────────

export interface LeagueReminders {
  /** Saison courante échue : currentSeasonStartedAt + seasonDurationDays < now. */
  seasonOverdue: boolean;
  /** Date prévue de fin de la league dépassée. */
  leagueOverdue: boolean;
}

export type LeagueRemindersInput = Pick<
  League,
  'currentSeasonStartedAt' | 'seasonDurationDays' | 'plannedEndAt' | 'endedAt' | 'pausedAt'
>;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function getLeagueReminders(league: LeagueRemindersInput): LeagueReminders {
  // Si la league est clôturée, plus de rappels.
  if (league.endedAt) return { seasonOverdue: false, leagueOverdue: false };

  const now = Date.now();

  // seasonOverdue : pertinent uniquement si on a duration + started_at, et que
  // l'admin n'a pas encore cliqué "nouvelle saison" depuis l'échéance.
  // La pause ne supprime pas le rappel (la saison reste échue), mais on peut
  // choisir de le masquer en pause pour ne pas surcharger l'admin.
  let seasonOverdue = false;
  if (
    !league.pausedAt &&
    league.seasonDurationDays &&
    league.currentSeasonStartedAt
  ) {
    const startedAtMs = new Date(league.currentSeasonStartedAt).getTime();
    if (!Number.isNaN(startedAtMs)) {
      const expectedEndMs = startedAtMs + league.seasonDurationDays * MS_PER_DAY;
      seasonOverdue = expectedEndMs < now;
    }
  }

  // leagueOverdue : pertinent dès que plannedEndAt est passé.
  let leagueOverdue = false;
  if (league.plannedEndAt) {
    const endMs = new Date(league.plannedEndAt).getTime();
    if (!Number.isNaN(endMs)) leagueOverdue = endMs < now;
  }

  return { seasonOverdue, leagueOverdue };
}
