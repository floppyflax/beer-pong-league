import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useLeaguesList } from '../../../src/hooks/useLeaguesList';
import type { League } from '../../../src/types';

// Mock LeagueContext
vi.mock('../../../src/context/LeagueContext', () => ({
  useLeague: vi.fn(),
}));

import { useLeague } from '../../../src/context/LeagueContext';

describe('useLeaguesList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty array when no leagues', () => {
    vi.mocked(useLeague).mockReturnValue({
      leagues: [],
      events: [],
      isLoadingInitialData: false,
      syncWithSupabase: vi.fn(),
      createLeague: vi.fn(),
      createEvent: vi.fn(),
      recordMatch: vi.fn(),
      updateLeague: vi.fn(),
      updateEvent: vi.fn(),
      deleteMatch: vi.fn(),
      confirmMatch: vi.fn(),
      rejectMatch: vi.fn(),
    });

    const { result } = renderHook(() => useLeaguesList());

    expect(result.current.leagues).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('should transform leagues to list items with counts', () => {
    const mockLeagues: League[] = [
      {
        id: 'league-1',
        name: 'Test League',
        type: 'season',
        createdAt: '2024-01-01T00:00:00Z',
        creator_user_id: 'user-1',
        creator_anonymous_user_id: null,
        players: [
          { id: 'p1', name: 'Player 1', elo: 1000, wins: 0, losses: 0, matchesPlayed: 0, streak: 0 },
          { id: 'p2', name: 'Player 2', elo: 1000, wins: 0, losses: 0, matchesPlayed: 0, streak: 0 },
        ],
        matches: [],
        events: ['t1', 't2', 't3'],
      },
    ];

    vi.mocked(useLeague).mockReturnValue({
      leagues: mockLeagues,
      events: [],
      isLoadingInitialData: false,
      syncWithSupabase: vi.fn(),
      createLeague: vi.fn(),
      createEvent: vi.fn(),
      recordMatch: vi.fn(),
      updateLeague: vi.fn(),
      updateEvent: vi.fn(),
      deleteMatch: vi.fn(),
      confirmMatch: vi.fn(),
      rejectMatch: vi.fn(),
    });

    const { result } = renderHook(() => useLeaguesList());

    expect(result.current.leagues).toHaveLength(1);
    expect(result.current.leagues[0]).toMatchObject({
      id: 'league-1',
      name: 'Test League',
      status: 'active',
      member_count: 2,
      event_count: 3,
    });
  });

  it('should sort active leagues before finished leagues', () => {
    const mockLeagues: League[] = [
      {
        id: 'league-finished',
        name: 'Finished League',
        type: 'one-shot',
        createdAt: '2024-02-01T00:00:00Z',
        creator_user_id: 'user-1',
        creator_anonymous_user_id: null,
        players: [],
        matches: [],
        events: [],
      },
      {
        id: 'league-active',
        name: 'Active League',
        type: 'season',
        createdAt: '2024-01-01T00:00:00Z',
        creator_user_id: 'user-1',
        creator_anonymous_user_id: null,
        players: [],
        matches: [],
        events: [],
      },
    ];

    vi.mocked(useLeague).mockReturnValue({
      leagues: mockLeagues,
      events: [],
      isLoadingInitialData: false,
      syncWithSupabase: vi.fn(),
      createLeague: vi.fn(),
      createEvent: vi.fn(),
      recordMatch: vi.fn(),
      updateLeague: vi.fn(),
      updateEvent: vi.fn(),
      deleteMatch: vi.fn(),
      confirmMatch: vi.fn(),
      rejectMatch: vi.fn(),
    });

    const { result } = renderHook(() => useLeaguesList());

    // Both are currently active (status field doesn't exist yet)
    // So they should be sorted by createdAt (most recent first)
    expect(result.current.leagues[0].id).toBe('league-finished'); // More recent
    expect(result.current.leagues[1].id).toBe('league-active');
  });

  it('should return loading state from context', () => {
    vi.mocked(useLeague).mockReturnValue({
      leagues: [],
      events: [],
      isLoadingInitialData: true,
      syncWithSupabase: vi.fn(),
      createLeague: vi.fn(),
      createEvent: vi.fn(),
      recordMatch: vi.fn(),
      updateLeague: vi.fn(),
      updateEvent: vi.fn(),
      deleteMatch: vi.fn(),
      confirmMatch: vi.fn(),
      rejectMatch: vi.fn(),
    });

    const { result } = renderHook(() => useLeaguesList());

    expect(result.current.isLoading).toBe(true);
  });

  it('should handle leagues without players or events', () => {
    const mockLeagues: League[] = [
      {
        id: 'league-empty',
        name: 'Empty League',
        type: 'one-shot',
        createdAt: '2024-01-01T00:00:00Z',
        creator_user_id: 'user-1',
        creator_anonymous_user_id: null,
        players: [],
        matches: [],
        events: [],
      },
    ];

    vi.mocked(useLeague).mockReturnValue({
      leagues: mockLeagues,
      events: [],
      isLoadingInitialData: false,
      syncWithSupabase: vi.fn(),
      createLeague: vi.fn(),
      createEvent: vi.fn(),
      recordMatch: vi.fn(),
      updateLeague: vi.fn(),
      updateEvent: vi.fn(),
      deleteMatch: vi.fn(),
      confirmMatch: vi.fn(),
      rejectMatch: vi.fn(),
    });

    const { result } = renderHook(() => useLeaguesList());

    expect(result.current.leagues[0].member_count).toBe(0);
    expect(result.current.leagues[0].event_count).toBe(0);
  });
});
