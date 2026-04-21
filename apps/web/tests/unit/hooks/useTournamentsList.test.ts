import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTournamentsList } from '../../../src/hooks/useTournamentsList';
import * as LeagueContext from '../../../src/context/LeagueContext';
import * as IdentityHook from '../../../src/hooks/useIdentity';
import type { Tournament } from '../../../src/types';

// Mock dependencies
vi.mock('../../../src/context/LeagueContext');
vi.mock('../../../src/hooks/useIdentity');

describe('useTournamentsList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty array when no identity', () => {
    vi.spyOn(IdentityHook, 'useIdentity').mockReturnValue({
      identity: null,
      isLoading: false,
      error: null,
      refreshIdentity: vi.fn(),
    });

    vi.spyOn(LeagueContext, 'useLeague').mockReturnValue({
      tournaments: [],
      isLoadingInitialData: false,
    } as any);

    const { result } = renderHook(() => useTournamentsList());

    expect(result.current.tournaments).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('should return sorted tournaments (active first, then finished)', () => {
    const mockTournaments: Tournament[] = [
      {
        id: '1',
        name: 'Finished Tournament',
        date: '2024-01-01',
        format: '1v1',
        leagueId: null,
        createdAt: '2024-01-01T10:00:00Z',
        playerIds: ['p1', 'p2'],
        matches: [],
        isFinished: true,
      },
      {
        id: '2',
        name: 'Active Tournament 1',
        date: '2024-01-15',
        format: '2v2',
        leagueId: null,
        createdAt: '2024-01-10T10:00:00Z',
        playerIds: ['p1', 'p2', 'p3'],
        matches: [],
        isFinished: false,
      },
      {
        id: '3',
        name: 'Active Tournament 2',
        date: '2024-01-20',
        format: '1v1',
        leagueId: null,
        createdAt: '2024-01-15T10:00:00Z',
        playerIds: ['p1', 'p2'],
        matches: [],
        isFinished: false,
      },
    ];

    vi.spyOn(IdentityHook, 'useIdentity').mockReturnValue({
      identity: { type: 'authenticated', userId: 'user1' } as any,
      isLoading: false,
      error: null,
      refreshIdentity: vi.fn(),
    });

    vi.spyOn(LeagueContext, 'useLeague').mockReturnValue({
      tournaments: mockTournaments,
      isLoadingInitialData: false,
    } as any);

    const { result } = renderHook(() => useTournamentsList());

    // Active tournaments should come first, sorted by createdAt desc
    expect(result.current.tournaments).toHaveLength(3);
    expect(result.current.tournaments[0].id).toBe('3'); // Most recent active
    expect(result.current.tournaments[1].id).toBe('2'); // Older active
    expect(result.current.tournaments[2].id).toBe('1'); // Finished
    expect(result.current.isLoading).toBe(false);
  });

  it('should show loading state when data is loading', () => {
    vi.spyOn(IdentityHook, 'useIdentity').mockReturnValue({
      identity: { type: 'authenticated', userId: 'user1' } as any,
      isLoading: false,
      error: null,
      refreshIdentity: vi.fn(),
    });

    vi.spyOn(LeagueContext, 'useLeague').mockReturnValue({
      tournaments: [],
      isLoadingInitialData: true,
    } as any);

    const { result } = renderHook(() => useTournamentsList());

    expect(result.current.isLoading).toBe(true);
  });

  it('should handle empty tournaments array', () => {
    vi.spyOn(IdentityHook, 'useIdentity').mockReturnValue({
      identity: { type: 'authenticated', userId: 'user1' } as any,
      isLoading: false,
      error: null,
      refreshIdentity: vi.fn(),
    });

    vi.spyOn(LeagueContext, 'useLeague').mockReturnValue({
      tournaments: [],
      isLoadingInitialData: false,
    } as any);

    const { result } = renderHook(() => useTournamentsList());

    expect(result.current.tournaments).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle null tournaments', () => {
    vi.spyOn(IdentityHook, 'useIdentity').mockReturnValue({
      identity: { type: 'authenticated', userId: 'user1' } as any,
      isLoading: false,
      error: null,
      refreshIdentity: vi.fn(),
    });

    vi.spyOn(LeagueContext, 'useLeague').mockReturnValue({
      tournaments: null,
      isLoadingInitialData: false,
    } as any);

    const { result } = renderHook(() => useTournamentsList());

    expect(result.current.tournaments).toEqual([]);
  });
});
