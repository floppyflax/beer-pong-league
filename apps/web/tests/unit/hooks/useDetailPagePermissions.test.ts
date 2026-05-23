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

  describe('Event Permissions', () => {
    it('should return isAdmin true when authenticated user is creator', () => {
      vi.mocked(useAuthContext).mockReturnValue({
        user: { id: 'user-123' },
        isAuthenticated: true,
      } as any);

      vi.mocked(useIdentity).mockReturnValue({
        localUser: null,
      } as any);

      vi.mocked(useLeague).mockReturnValue({
        events: [
          {
            id: 'event-1',
            creator_user_id: 'user-123',
            creator_anonymous_user_id: null,
            allowPlayersToInvite: false,
          },
        ],
        leagues: [],
      } as any);

      const { result } = renderHook(() =>
        useDetailPagePermissions('event-1', 'event')
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
        events: [
          {
            id: 'event-1',
            creator_user_id: null,
            creator_anonymous_user_id: 'anon-123',
            allowPlayersToInvite: false,
          },
        ],
        leagues: [],
      } as any);

      const { result } = renderHook(() =>
        useDetailPagePermissions('event-1', 'event')
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
        events: [
          {
            id: 'event-1',
            creator_user_id: 'user-123',
            creator_anonymous_user_id: null,
            allowPlayersToInvite: false,
          },
        ],
        leagues: [],
      } as any);

      const { result } = renderHook(() =>
        useDetailPagePermissions('event-1', 'event')
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
        events: [
          {
            id: 'event-1',
            creator_user_id: 'user-123',
            creator_anonymous_user_id: null,
            allowPlayersToInvite: true,
          },
        ],
        leagues: [],
      } as any);

      const { result } = renderHook(() =>
        useDetailPagePermissions('event-1', 'event')
      );

      expect(result.current.isAdmin).toBe(false);
      expect(result.current.canInvite).toBe(true);
    });

    it('should handle missing event', () => {
      vi.mocked(useAuthContext).mockReturnValue({
        user: { id: 'user-123' },
        isAuthenticated: true,
      } as any);

      vi.mocked(useIdentity).mockReturnValue({
        localUser: null,
      } as any);

      vi.mocked(useLeague).mockReturnValue({
        events: [],
        leagues: [],
      } as any);

      const { result } = renderHook(() =>
        useDetailPagePermissions('event-999', 'event')
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
        events: [],
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
        events: [],
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
        events: [],
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
        events: [],
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
        events: [
          {
            id: 'event-1',
            creator_user_id: 'user-123',
            creator_anonymous_user_id: null,
            allowPlayersToInvite: false,
          },
        ],
        leagues: [],
      } as any);

      const { result } = renderHook(() =>
        useDetailPagePermissions('event-1', 'event')
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
        events: [
          {
            id: 'event-1',
            creator_user_id: 'user-123',
            creator_anonymous_user_id: null,
            // allowPlayersToInvite field missing
          } as any,
        ],
        leagues: [],
      } as any);

      const { result } = renderHook(() =>
        useDetailPagePermissions('event-1', 'event')
      );

      expect(result.current.isAdmin).toBe(true);
      expect(result.current.canInvite).toBe(false);
    });
  });

  // Mig 037 — co-admins
  describe('Co-admin (mig 037)', () => {
    it('grants isAdmin to an authenticated co-admin on an event', () => {
      vi.mocked(useAuthContext).mockReturnValue({
        user: { id: 'user-co' },
        isAuthenticated: true,
      } as any);
      vi.mocked(useIdentity).mockReturnValue({ localUser: null } as any);
      vi.mocked(useLeague).mockReturnValue({
        events: [
          {
            id: 'event-1',
            creator_user_id: 'user-owner',
            creator_anonymous_user_id: null,
            coAdminUserIds: ['user-co', 'user-other'],
          },
        ],
        leagues: [],
      } as any);

      const { result } = renderHook(() =>
        useDetailPagePermissions('event-1', 'event'),
      );
      expect(result.current.isAdmin).toBe(true);
      expect(result.current.isOwner).toBe(false);
    });

    it('grants isAdmin to an authenticated co-admin on a league', () => {
      vi.mocked(useAuthContext).mockReturnValue({
        user: { id: 'user-co' },
        isAuthenticated: true,
      } as any);
      vi.mocked(useIdentity).mockReturnValue({ localUser: null } as any);
      vi.mocked(useLeague).mockReturnValue({
        events: [],
        leagues: [
          {
            id: 'league-1',
            creator_user_id: 'user-owner',
            creator_anonymous_user_id: null,
            coAdminUserIds: ['user-co'],
          },
        ],
      } as any);

      const { result } = renderHook(() =>
        useDetailPagePermissions('league-1', 'league'),
      );
      expect(result.current.isAdmin).toBe(true);
      expect(result.current.isOwner).toBe(false);
    });

    it('isOwner is true and isAdmin is true when caller is the creator', () => {
      vi.mocked(useAuthContext).mockReturnValue({
        user: { id: 'user-owner' },
        isAuthenticated: true,
      } as any);
      vi.mocked(useIdentity).mockReturnValue({ localUser: null } as any);
      vi.mocked(useLeague).mockReturnValue({
        events: [
          {
            id: 'event-1',
            creator_user_id: 'user-owner',
            creator_anonymous_user_id: null,
            coAdminUserIds: ['user-co'],
          },
        ],
        leagues: [],
      } as any);

      const { result } = renderHook(() =>
        useDetailPagePermissions('event-1', 'event'),
      );
      expect(result.current.isOwner).toBe(true);
      expect(result.current.isAdmin).toBe(true);
    });

    it('does NOT grant co-admin status to anonymous (non-authenticated) users', () => {
      // A co-admin must be authenticated. Even if their anon id happens to
      // appear in coAdminUserIds (it shouldn't, server-side rejects it),
      // the client refuses to promote them via the anon path.
      vi.mocked(useAuthContext).mockReturnValue({
        user: null,
        isAuthenticated: false,
      } as any);
      vi.mocked(useIdentity).mockReturnValue({
        localUser: { anonymousUserId: 'anon-co' },
      } as any);
      vi.mocked(useLeague).mockReturnValue({
        events: [
          {
            id: 'event-1',
            creator_user_id: 'user-owner',
            creator_anonymous_user_id: null,
            coAdminUserIds: ['anon-co'],
          },
        ],
        leagues: [],
      } as any);

      const { result } = renderHook(() =>
        useDetailPagePermissions('event-1', 'event'),
      );
      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isOwner).toBe(false);
    });

    it('isAdmin is false when authenticated user is neither creator nor in coAdminUserIds', () => {
      vi.mocked(useAuthContext).mockReturnValue({
        user: { id: 'user-stranger' },
        isAuthenticated: true,
      } as any);
      vi.mocked(useIdentity).mockReturnValue({ localUser: null } as any);
      vi.mocked(useLeague).mockReturnValue({
        events: [
          {
            id: 'event-1',
            creator_user_id: 'user-owner',
            creator_anonymous_user_id: null,
            coAdminUserIds: ['user-co'],
          },
        ],
        leagues: [],
      } as any);

      const { result } = renderHook(() =>
        useDetailPagePermissions('event-1', 'event'),
      );
      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isOwner).toBe(false);
    });

    it('handles missing coAdminUserIds array (legacy events) gracefully', () => {
      vi.mocked(useAuthContext).mockReturnValue({
        user: { id: 'user-stranger' },
        isAuthenticated: true,
      } as any);
      vi.mocked(useIdentity).mockReturnValue({ localUser: null } as any);
      vi.mocked(useLeague).mockReturnValue({
        events: [
          {
            id: 'event-1',
            creator_user_id: 'user-owner',
            creator_anonymous_user_id: null,
            // coAdminUserIds missing — legacy data path
          },
        ],
        leagues: [],
      } as any);

      const { result } = renderHook(() =>
        useDetailPagePermissions('event-1', 'event'),
      );
      expect(result.current.isAdmin).toBe(false);
    });
  });
});
