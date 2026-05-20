/**
 * leagueLifecycle — derived state truth table.
 *
 * Rules:
 *   finished → ended_at
 *   paused   → !ended_at && paused_at
 *   active   → otherwise
 */

import { describe, it, expect } from 'vitest';
import {
  canRecordLeagueMatch,
  getLeagueLifecycle,
  type LeagueLifecycleInput,
} from '@/utils/leagueLifecycle';

const make = (overrides: Partial<LeagueLifecycleInput>): LeagueLifecycleInput => ({
  pausedAt: null,
  endedAt: null,
  ...overrides,
});

describe('leagueLifecycle', () => {
  describe('getLeagueLifecycle', () => {
    it('finished wins when ended_at is set', () => {
      expect(
        getLeagueLifecycle(
          make({ endedAt: '2026-05-20T10:00:00.000Z', pausedAt: '2026-05-19T09:00:00.000Z' }),
        ),
      ).toBe('finished');
    });

    it('paused when not finished and paused_at is set', () => {
      expect(
        getLeagueLifecycle(make({ pausedAt: '2026-05-20T10:00:00.000Z' })),
      ).toBe('paused');
    });

    it('active when no lifecycle timestamp is set', () => {
      expect(getLeagueLifecycle(make({}))).toBe('active');
    });

    it('active when paused_at is undefined (legacy row)', () => {
      expect(getLeagueLifecycle({} as LeagueLifecycleInput)).toBe('active');
    });
  });

  describe('canRecordLeagueMatch', () => {
    it('allows only active leagues', () => {
      expect(canRecordLeagueMatch(make({}))).toBe(true);
      expect(canRecordLeagueMatch(make({ pausedAt: '2026-05-20T10:00:00.000Z' }))).toBe(false);
      expect(canRecordLeagueMatch(make({ endedAt: '2026-05-20T10:00:00.000Z' }))).toBe(false);
    });
  });
});
