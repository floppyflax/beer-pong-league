/**
 * Event lifecycle — derived state from `events` columns.
 *
 * Schema (mig 027):
 *   - is_finished BOOLEAN
 *   - started_at  TIMESTAMPTZ NULL  (admin "Démarrer" or implicit on resume)
 *   - paused_at   TIMESTAMPTZ NULL  (admin "Mettre en pause")
 *
 * Rules:
 *   finished     → is_finished
 *   paused       → !is_finished && paused_at
 *   in_progress  → !is_finished && !paused_at && (started_at || date <= today)
 *   not_started  → otherwise
 *
 * Match logging is only allowed in `in_progress`.
 */

import type { Event } from '@/types';

export type EventLifecycle = 'not_started' | 'in_progress' | 'paused' | 'finished';

export type LifecycleInput = Pick<
  Event,
  'isFinished' | 'date' | 'startedAt' | 'pausedAt'
>;

const todayIso = (): string => new Date().toISOString().slice(0, 10);

export function getEventLifecycle(event: LifecycleInput): EventLifecycle {
  if (event.isFinished) return 'finished';
  if (event.pausedAt) return 'paused';
  const dateIso = event.date ? event.date.slice(0, 10) : '';
  if (event.startedAt || (dateIso && dateIso <= todayIso())) return 'in_progress';
  return 'not_started';
}

export const canLogMatch = (event: LifecycleInput): boolean =>
  getEventLifecycle(event) === 'in_progress';

export const LIFECYCLE_LABEL_FR: Record<EventLifecycle, string> = {
  not_started: 'Non démarré',
  in_progress: 'En cours',
  paused: 'En pause',
  finished: 'Terminé',
};
