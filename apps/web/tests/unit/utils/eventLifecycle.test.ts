/**
 * eventLifecycle — derived state truth table.
 *
 * Rules:
 *   finished     → is_finished
 *   paused       → !is_finished && paused_at
 *   in_progress  → !is_finished && !paused_at && (started_at || date <= today)
 *   not_started  → otherwise
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  canLogMatch,
  getEventLifecycle,
  type LifecycleInput,
} from '@/utils/eventLifecycle';

const FROZEN_TODAY = '2026-05-20T12:00:00.000Z';

const YESTERDAY = '2026-05-19';
const TODAY = '2026-05-20';
const TOMORROW = '2026-05-21';

const make = (overrides: Partial<LifecycleInput>): LifecycleInput => ({
  isFinished: false,
  date: TOMORROW,
  startedAt: null,
  pausedAt: null,
  ...overrides,
});

describe('eventLifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(FROZEN_TODAY));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getEventLifecycle', () => {
    it('finished wins over any other field', () => {
      expect(
        getEventLifecycle(
          make({
            isFinished: true,
            pausedAt: '2026-05-20T10:00:00.000Z',
            startedAt: '2026-05-20T09:00:00.000Z',
            date: YESTERDAY,
          }),
        ),
      ).toBe('finished');
    });

    it('paused when not finished and paused_at is set', () => {
      expect(
        getEventLifecycle(
          make({ pausedAt: '2026-05-20T10:00:00.000Z', startedAt: '2026-05-20T09:00:00.000Z' }),
        ),
      ).toBe('paused');
    });

    it('in_progress when admin started explicitly (date still in future)', () => {
      expect(
        getEventLifecycle(
          make({ startedAt: '2026-05-20T09:00:00.000Z', date: TOMORROW }),
        ),
      ).toBe('in_progress');
    });

    it('in_progress when date is today, even without started_at', () => {
      expect(getEventLifecycle(make({ date: TODAY }))).toBe('in_progress');
    });

    it('in_progress when date is past, even without started_at (legacy / backfilled)', () => {
      expect(getEventLifecycle(make({ date: YESTERDAY }))).toBe('in_progress');
    });

    it('not_started when date is future and admin has not started', () => {
      expect(getEventLifecycle(make({ date: TOMORROW }))).toBe('not_started');
    });

    it('not_started when date is missing', () => {
      expect(getEventLifecycle(make({ date: '' }))).toBe('not_started');
    });

    it('handles ISO datetime as date prefix (slices to YYYY-MM-DD)', () => {
      expect(
        getEventLifecycle(make({ date: `${TODAY}T20:00:00.000Z` })),
      ).toBe('in_progress');
      expect(
        getEventLifecycle(make({ date: `${TOMORROW}T20:00:00.000Z` })),
      ).toBe('not_started');
    });
  });

  describe('canLogMatch', () => {
    it('allows only in_progress events', () => {
      expect(canLogMatch(make({ date: TODAY }))).toBe(true);
      expect(canLogMatch(make({ date: TOMORROW }))).toBe(false);
      expect(
        canLogMatch(make({ date: TODAY, pausedAt: FROZEN_TODAY })),
      ).toBe(false);
      expect(canLogMatch(make({ isFinished: true }))).toBe(false);
    });
  });
});
