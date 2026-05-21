/**
 * leagueLifecycle — derived state truth table (mig 028 + 029).
 *
 * Rules (du plus terminal au plus actif) :
 *   finished        → endedAt
 *   paused          → !endedAt && pausedAt
 *   between_seasons → !endedAt && !pausedAt && currentSeasonEndedAt
 *   active          → otherwise
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
  currentSeasonEndedAt: null,
  ...overrides,
});

const ISO = '2026-05-20T10:00:00.000Z';

describe('leagueLifecycle', () => {
  describe('getLeagueLifecycle', () => {
    it('finished wins when ended_at is set', () => {
      expect(
        getLeagueLifecycle(
          make({
            endedAt: ISO,
            pausedAt: '2026-05-19T09:00:00.000Z',
            currentSeasonEndedAt: '2026-05-18T08:00:00.000Z',
          }),
        ),
      ).toBe('finished');
    });

    it('paused when not finished and paused_at is set (overrides between_seasons)', () => {
      expect(
        getLeagueLifecycle(
          make({ pausedAt: ISO, currentSeasonEndedAt: '2026-05-18T08:00:00.000Z' }),
        ),
      ).toBe('paused');
    });

    it('between_seasons when only currentSeasonEndedAt is set', () => {
      expect(
        getLeagueLifecycle(make({ currentSeasonEndedAt: ISO })),
      ).toBe('between_seasons');
    });

    it('active when no lifecycle timestamp is set', () => {
      expect(getLeagueLifecycle(make({}))).toBe('active');
    });

    it('active when fields are undefined (legacy row)', () => {
      expect(getLeagueLifecycle({} as LeagueLifecycleInput)).toBe('active');
    });
  });

  describe('canRecordLeagueMatch', () => {
    it('allows only active leagues', () => {
      expect(canRecordLeagueMatch(make({}))).toBe(true);
      expect(canRecordLeagueMatch(make({ pausedAt: ISO }))).toBe(false);
      expect(canRecordLeagueMatch(make({ endedAt: ISO }))).toBe(false);
      expect(canRecordLeagueMatch(make({ currentSeasonEndedAt: ISO }))).toBe(false);
    });
  });
});
