import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useEventsList } from '../../../src/hooks/useEventsList';
import * as LeagueContext from '../../../src/context/LeagueContext';
import * as IdentityHook from '../../../src/hooks/useIdentity';
import type { Event } from '../../../src/types';

// Mock dependencies
vi.mock('../../../src/context/LeagueContext');
vi.mock('../../../src/hooks/useIdentity');

describe('useEventsList', () => {
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
      events: [],
      isLoadingInitialData: false,
    } as any);

    const { result } = renderHook(() => useEventsList());

    expect(result.current.events).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('should return sorted events (active first, then finished)', () => {
    const mockEvents: Event[] = [
      {
        id: '1',
        name: 'Finished Event',
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
        name: 'Active Event 1',
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
        name: 'Active Event 2',
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
      events: mockEvents,
      isLoadingInitialData: false,
    } as any);

    const { result } = renderHook(() => useEventsList());

    // Active events should come first, sorted by createdAt desc
    expect(result.current.events).toHaveLength(3);
    expect(result.current.events[0].id).toBe('3'); // Most recent active
    expect(result.current.events[1].id).toBe('2'); // Older active
    expect(result.current.events[2].id).toBe('1'); // Finished
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
      events: [],
      isLoadingInitialData: true,
    } as any);

    const { result } = renderHook(() => useEventsList());

    expect(result.current.isLoading).toBe(true);
  });

  it('should handle empty events array', () => {
    vi.spyOn(IdentityHook, 'useIdentity').mockReturnValue({
      identity: { type: 'authenticated', userId: 'user1' } as any,
      isLoading: false,
      error: null,
      refreshIdentity: vi.fn(),
    });

    vi.spyOn(LeagueContext, 'useLeague').mockReturnValue({
      events: [],
      isLoadingInitialData: false,
    } as any);

    const { result } = renderHook(() => useEventsList());

    expect(result.current.events).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle null events', () => {
    vi.spyOn(IdentityHook, 'useIdentity').mockReturnValue({
      identity: { type: 'authenticated', userId: 'user1' } as any,
      isLoading: false,
      error: null,
      refreshIdentity: vi.fn(),
    });

    vi.spyOn(LeagueContext, 'useLeague').mockReturnValue({
      events: null,
      isLoadingInitialData: false,
    } as any);

    const { result } = renderHook(() => useEventsList());

    expect(result.current.events).toEqual([]);
  });
});
