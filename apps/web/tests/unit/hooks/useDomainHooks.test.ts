/**
 * Smoke tests for the domain facade hooks introduced as step 1 of the
 * LeagueContext split (audit plan §2.2). Each hook is a thin slice over
 * useLeague() — these tests pin down the API surface so we don't
 * accidentally drop a re-export when the underlying context evolves.
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

const ctxValue = {
  // state
  leagues: [],
  events: [],
  currentLeague: null,
  currentEvent: null,
  isLoadingInitialData: false,
  loadError: null,
  // sync
  reloadData: vi.fn(),
  // league
  createLeague: vi.fn(),
  updateLeague: vi.fn(),
  deleteLeague: vi.fn(),
  selectLeague: vi.fn(),
  getLeagueGlobalRanking: vi.fn(),
  // event
  createEvent: vi.fn(),
  updateEvent: vi.fn(),
  deleteEvent: vi.fn(),
  selectEvent: vi.fn(),
  toggleEventStatus: vi.fn(),
  startEvent: vi.fn(),
  pauseEvent: vi.fn(),
  resumeEvent: vi.fn(),
  associateEventToLeague: vi.fn(),
  getEventLocalRanking: vi.fn(),
  // player
  addPlayer: vi.fn(),
  addPlayerToEvent: vi.fn(),
  addAnonymousPlayerToEvent: vi.fn(),
  addGuestPlayerToEvent: vi.fn(),
  updatePlayer: vi.fn(),
  deletePlayer: vi.fn(),
  // match
  recordMatch: vi.fn(),
  recordEventMatch: vi.fn(),
};

vi.mock('../../../src/context/LeagueContext', () => ({
  useLeague: () => ctxValue,
  LeagueContext: {},
}));

describe('useLeagues — league facade', () => {
  it('exposes leagues, currentLeague, CRUD ops and ranking', async () => {
    const { useLeagues } = await import('../../../src/hooks/useLeagues');
    const { result } = renderHook(() => useLeagues());

    expect(Object.keys(result.current).sort()).toEqual(
      [
        'createLeague',
        'currentLeague',
        'deleteLeague',
        'getLeagueGlobalRanking',
        'isLoadingInitialData',
        'leagues',
        'loadError',
        'selectLeague',
        'updateLeague',
      ].sort(),
    );
  });

  it('returns the same identity across renders when ctx values are stable', async () => {
    const { useLeagues } = await import('../../../src/hooks/useLeagues');
    const { result, rerender } = renderHook(() => useLeagues());
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});

describe('useEvents — event facade', () => {
  it('exposes events, currentEvent, CRUD + propagation + ranking', async () => {
    const { useEvents } = await import('../../../src/hooks/useEvents');
    const { result } = renderHook(() => useEvents());

    expect(Object.keys(result.current).sort()).toEqual(
      [
        'associateEventToLeague',
        'createEvent',
        'currentEvent',
        'deleteEvent',
        'events',
        'getEventLocalRanking',
        'isLoadingInitialData',
        'loadError',
        'pauseEvent',
        'resumeEvent',
        'selectEvent',
        'startEvent',
        'toggleEventStatus',
        'updateEvent',
      ].sort(),
    );
  });
});

describe('usePlayers — player facade', () => {
  it('exposes the six player ops only', async () => {
    const { usePlayers } = await import('../../../src/hooks/usePlayers');
    const { result } = renderHook(() => usePlayers());

    expect(Object.keys(result.current).sort()).toEqual(
      [
        'addAnonymousPlayerToEvent',
        'addGuestPlayerToEvent',
        'addPlayer',
        'addPlayerToEvent',
        'deletePlayer',
        'updatePlayer',
      ].sort(),
    );
  });
});

describe('useMatches — match recording facade', () => {
  it('exposes recordMatch and recordEventMatch only', async () => {
    const { useMatches } = await import('../../../src/hooks/useMatches');
    const { result } = renderHook(() => useMatches());

    expect(Object.keys(result.current).sort()).toEqual(
      ['recordEventMatch', 'recordMatch'].sort(),
    );
  });
});
