import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDetailPagePermissions } from '../../../src/hooks/useDetailPagePermissions';

// Mock dependencies
vi.mock('../../../src/context/AuthContext', () => ({
  useAuthContext: vi.fn(),
}));

vi.mock('../../../src/hooks/useIdentity', () => ({
  useIdentity: vi.fn(),
}));

vi.mock('../../../src/context/LeagueContext', () => ({
  useLeague: vi.fn(),
}));

import { useAuthContext } from '../../../src/context/AuthContext';
import { useIdentity } from '../../../src/hooks/useIdentity';
import { useLeague } from '../../../src/context/LeagueContext';

describe('useDetailPagePermissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Tournament Permissions', () => {
    it('should return isAdmin true when authenticated user is creator', () => {
      vi.mocked(useAuthContext).mockReturnValue({
        user: { id: 'user-123' },
        isAuthenticated: true,
      } as any);

      vi.mocked(useIdentity).mockReturnValue({
        localUser: null,
      } as any);

      vi.mocked(useLeague).mockReturnValue({
        tournaments: [
          {
            id: 'tournament-1',
            creator_user_id: 'user-123',
            creator_anonymous_user_id: null,
            allowPlayersToInvite: false,
          },
        ],
        leagues: [],
      } as any);

      const { result } = renderHook(() =>
        useDetailPagePermissions('tournament-1', 'tournament')
      );

      expect(result.current.isAdmin).toBe(true);
      expect(result.current.canInvite).toBe(false);
    });

    it('should return isAdmin true when anonymous user is creator', () => {
      vi.mocked(useAuthContext).mockReturnValue({
        user: null,
        isAuthenticated: false,
      } as any);

      vi.mocked(useIdentity).mockReturnValue({
        localUser: { anonymousUserId: 'anon-123' },
      } as any);

      vi.mocked(useLeague).mockReturnValue({
        tournaments: [
          {
            id: 'tournament-1',
            creator_user_id: null,
            creator_anonymous_user_id: 'anon-123',
            allowPlayersToInvite: false,
          },
        ],
        leagues: [],
      } as any);

      const { result } = renderHook(() =>
        useDetailPagePermissions('tournament-1', 'tournament')
      );

      expect(result.current.isAdmin).toBe(true);
      expect(result.current.canInvite).toBe(false);
    });

    it('should return isAdmin false when user is not creator', () => {
      vi.mocked(useAuthContext).mockReturnValue({
        user: { id: 'user-456' },
        isAuthenticated: true,
      } as any);

      vi.mocked(useIdentity).mockReturnValue({
        localUser: null,
      } as any);

      vi.mocked(useLeague).mockReturnValue({
        tournaments: [
          {
            id: 'tournament-1',
            creator_user_id: 'user-123',
            creator_anonymous_user_id: null,
            allowPlayersToInvite: false,
          },
        ],
        leagues: [],
      } as any);

      const { result } = renderHook(() =>
        useDetailPagePermissions('tournament-1', 'tournament')
      );

      expect(result.current.isAdmin).toBe(false);
      expect(result.current.canInvite).toBe(false);
    });

    it('should return canInvite true when allowPlayersToInvite is true', () => {
      vi.mocked(useAuthContext).mockReturnValue({
        user: { id: 'user-456' },
        isAuthenticated: true,
      } as any);

      vi.mocked(useIdentity).mockReturnValue({
        localUser: null,
      } as any);

      vi.mocked(useLeague).mockReturnValue({
        tournaments: [
          {
            id: 'tournament-1',
            creator_user_id: 'user-123',
            creator_anonymous_user_id: null,
            allowPlayersToInvite: true,
          },
        ],
        leagues: [],
      } as any);

      const { result } = renderHook(() =>
        useDetailPagePermissions('tournament-1', 'tournament')
      );

      expect(result.current.isAdmin).toBe(false);
      expect(result.current.canInvite).toBe(true);
    });

    it('should handle missing tournament', () => {
      vi.mocked(useAuthContext).mockReturnValue({
        user: { id: 'user-123' },
        isAuthenticated: true,
      } as any);

      vi.mocked(useIdentity).mockReturnValue({
        localUser: null,
      } as any);

      vi.mocked(useLeague).mockReturnValue({
        tournaments: [],
        leagues: [],
      } as any);

      const { result } = renderHook(() =>
        useDetailPagePermissions('tournament-999', 'tournament')
      );

      expect(result.current.isAdmin).toBe(false);
      expect(result.current.canInvite).toBe(false);
    });
  });

  describe('League Permissions', () => {
    it('should return isAdmin true when authenticated user is creator of league', () => {
      vi.mocked(useAuthContext).mockReturnValue({
        user: { id: 'user-123' },
        isAuthenticated: true,
      } as any);

      vi.mocked(useIdentity).mockReturnValue({
        localUser: null,
      } as any);

      vi.mocked(useLeague).mockReturnValue({
        tournaments: [],
        leagues: [
          {
            id: 'league-1',
            creator_user_id: 'user-123',
            creator_anonymous_user_id: null,
            allowPlayersToInvite: false,
          },
        ],
      } as any);

      const { result } = renderHook(() =>
        useDetailPagePermissions('league-1', 'league')
      );

      expect(result.current.isAdmin).toBe(true);
      expect(result.current.canInvite).toBe(false);
    });

    it('should return isAdmin true when anonymous user is creator of league', () => {
      vi.mocked(useAuthContext).mockReturnValue({
        user: null,
        isAuthenticated: false,
      } as any);

      vi.mocked(useIdentity).mockReturnValue({
        localUser: { anonymousUserId: 'anon-123' },
      } as any);

      vi.mocked(useLeague).mockReturnValue({
        tournaments: [],
        leagues: [
          {
            id: 'league-1',
            creator_user_id: null,
            creator_anonymous_user_id: 'anon-123',
            allowPlayersToInvite: false,
          },
        ],
      } as any);

      const { result } = renderHook(() =>
        useDetailPagePermissions('league-1', 'league')
      );

      expect(result.current.isAdmin).toBe(true);
      expect(result.current.canInvite).toBe(false);
    });

    it('should return canInvite true when allowPlayersToInvite is true for league', () => {
      vi.mocked(useAuthContext).mockReturnValue({
        user: { id: 'user-456' },
        isAuthenticated: true,
      } as any);

      vi.mocked(useIdentity).mockReturnValue({
        localUser: null,
      } as any);

      vi.mocked(useLeague).mockReturnValue({
        tournaments: [],
        leagues: [
          {
            id: 'league-1',
            creator_user_id: 'user-123',
            creator_anonymous_user_id: null,
            allowPlayersToInvite: true,
          },
        ],
      } as any);

      const { result } = renderHook(() =>
        useDetailPagePermissions('league-1', 'league')
      );

      expect(result.current.isAdmin).toBe(false);
      expect(result.current.canInvite).toBe(true);
    });

    it('should handle missing league', () => {
      vi.mocked(useAuthContext).mockReturnValue({
        user: { id: 'user-123' },
        isAuthenticated: true,
      } as any);

      vi.mocked(useIdentity).mockReturnValue({
        localUser: null,
      } as any);

      vi.mocked(useLeague).mockReturnValue({
        tournaments: [],
        leagues: [],
      } as any);

      const { result } = renderHook(() =>
        useDetailPagePermissions('league-999', 'league')
      );

      expect(result.current.isAdmin).toBe(false);
      expect(result.current.canInvite).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle no user and no local user', () => {
      vi.mocked(useAuthContext).mockReturnValue({
        user: null,
        isAuthenticated: false,
      } as any);

      vi.mocked(useIdentity).mockReturnValue({
        localUser: null,
      } as any);

      vi.mocked(useLeague).mockReturnValue({
        tournaments: [
          {
            id: 'tournament-1',
            creator_user_id: 'user-123',
            creator_anonymous_user_id: null,
            allowPlayersToInvite: false,
          },
        ],
        leagues: [],
      } as any);

      const { result } = renderHook(() =>
        useDetailPagePermissions('tournament-1', 'tournament')
      );

      expect(result.current.isAdmin).toBe(false);
      expect(result.current.canInvite).toBe(false);
    });

    it('should default canInvite to false when field is missing', () => {
      vi.mocked(useAuthContext).mockReturnValue({
        user: { id: 'user-123' },
        isAuthenticated: true,
      } as any);

      vi.mocked(useIdentity).mockReturnValue({
        localUser: null,
      } as any);

      vi.mocked(useLeague).mockReturnValue({
        tournaments: [
          {
            id: 'tournament-1',
            creator_user_id: 'user-123',
            creator_anonymous_user_id: null,
            // allowPlayersToInvite field missing
          } as any,
        ],
        leagues: [],
      } as any);

      const { result } = renderHook(() =>
        useDetailPagePermissions('tournament-1', 'tournament')
      );

      expect(result.current.isAdmin).toBe(true);
      expect(result.current.canInvite).toBe(false);
    });
  });
});
