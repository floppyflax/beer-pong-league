/**
 * leagueLifecycle — derived state truth table.
 *
 * Rules:
 *   finished → ended_at
 *   paused   → !ended_at && paused_at
 *   active   → otherwise
 */

import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import {
  canRecordLeagueMatch,
  getLeagueLifecycle,
  getLeagueReminders,
  type LeagueLifecycleInput,
  type LeagueRemindersInput,
} from '@/utils/leagueLifecycle';

const FROZEN_TODAY = '2026-05-20T12:00:00.000Z';

const YESTERDAY_DAY = '2026-05-19';
const TOMORROW_DAY = '2026-05-21';

const make = (overrides: Partial<LeagueLifecycleInput>): LeagueLifecycleInput => ({
  pausedAt: null,
  endedAt: null,
  plannedStartAt: null,
  ...overrides,
});

describe('leagueLifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(FROZEN_TODAY));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getLeagueLifecycle', () => {
    it('finished wins over any other field', () => {
      expect(
        getLeagueLifecycle(
          make({
            endedAt: '2026-05-20T10:00:00.000Z',
            pausedAt: '2026-05-19T09:00:00.000Z',
            plannedStartAt: `${TOMORROW_DAY}T08:00:00.000Z`,
          }),
        ),
      ).toBe('finished');
    });

    it('paused wins over not_started', () => {
      expect(
        getLeagueLifecycle(
          make({
            pausedAt: '2026-05-20T10:00:00.000Z',
            plannedStartAt: `${TOMORROW_DAY}T08:00:00.000Z`,
          }),
        ),
      ).toBe('paused');
    });

    it('not_started when planned_start_at is in the future', () => {
      expect(
        getLeagueLifecycle(
          make({ plannedStartAt: `${TOMORROW_DAY}T08:00:00.000Z` }),
        ),
      ).toBe('not_started');
    });

    it('active when planned_start_at is in the past', () => {
      expect(
        getLeagueLifecycle(
          make({ plannedStartAt: `${YESTERDAY_DAY}T08:00:00.000Z` }),
        ),
      ).toBe('active');
    });

    it('active when no lifecycle timestamp is set (legacy row)', () => {
      expect(getLeagueLifecycle(make({}))).toBe('active');
    });
  });

  describe('canRecordLeagueMatch', () => {
    it('allows only active leagues', () => {
      expect(canRecordLeagueMatch(make({}))).toBe(true);
      expect(
        canRecordLeagueMatch(make({ pausedAt: '2026-05-20T10:00:00.000Z' })),
      ).toBe(false);
      expect(
        canRecordLeagueMatch(make({ endedAt: '2026-05-20T10:00:00.000Z' })),
      ).toBe(false);
      expect(
        canRecordLeagueMatch(
          make({ plannedStartAt: `${TOMORROW_DAY}T08:00:00.000Z` }),
        ),
      ).toBe(false);
    });
  });

  describe('getLeagueReminders', () => {
    const makeR = (
      overrides: Partial<LeagueRemindersInput>,
    ): LeagueRemindersInput => ({
      currentSeasonStartedAt: undefined,
      seasonDurationDays: null,
      plannedEndAt: null,
      endedAt: null,
      pausedAt: null,
      ...overrides,
    });

    it('no flags when nothing is configured', () => {
      expect(getLeagueReminders(makeR({}))).toEqual({
        seasonOverdue: false,
        leagueOverdue: false,
      });
    });

    it('seasonOverdue when current season has exceeded its duration', () => {
      expect(
        getLeagueReminders(
          makeR({
            currentSeasonStartedAt: '2026-01-01T00:00:00.000Z',
            seasonDurationDays: 30, // expired since Feb
          }),
        ).seasonOverdue,
      ).toBe(true);
    });

    it('no seasonOverdue when within duration window', () => {
      expect(
        getLeagueReminders(
          makeR({
            currentSeasonStartedAt: '2026-05-15T00:00:00.000Z',
            seasonDurationDays: 30,
          }),
        ).seasonOverdue,
      ).toBe(false);
    });

    it('no seasonOverdue when paused', () => {
      expect(
        getLeagueReminders(
          makeR({
            currentSeasonStartedAt: '2026-01-01T00:00:00.000Z',
            seasonDurationDays: 30,
            pausedAt: '2026-04-01T00:00:00.000Z',
          }),
        ).seasonOverdue,
      ).toBe(false);
    });

    it('leagueOverdue when planned_end_at is in the past', () => {
      expect(
        getLeagueReminders(
          makeR({ plannedEndAt: '2026-01-01T00:00:00.000Z' }),
        ).leagueOverdue,
      ).toBe(true);
    });

    it('no flags when the league is already finished', () => {
      expect(
        getLeagueReminders(
          makeR({
            currentSeasonStartedAt: '2026-01-01T00:00:00.000Z',
            seasonDurationDays: 30,
            plannedEndAt: '2026-01-01T00:00:00.000Z',
            endedAt: '2026-05-01T00:00:00.000Z',
          }),
        ),
      ).toEqual({ seasonOverdue: false, leagueOverdue: false });
    });
  });
});
