import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePremiumLimits } from '../../../src/hooks/usePremiumLimits';
import * as AuthContext from '../../../src/context/AuthContext';
import * as LeagueContext from '../../../src/context/LeagueContext';

// Mock contexts
vi.mock('../../../src/context/AuthContext');
vi.mock('../../../src/context/LeagueContext');

describe('usePremiumLimits', () => {
  const mockUseAuthContext = vi.spyOn(AuthContext, 'useAuthContext');
  const mockUseLeague = vi.spyOn(LeagueContext, 'useLeague');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Free User Limits', () => {
    beforeEach(() => {
      mockUseAuthContext.mockReturnValue({
        user: { user_metadata: { isPremium: false } },
        isAuthenticated: true,
        signIn: vi.fn(),
        signOut: vi.fn(),
      } as any);
    });

    it('should return false for isPremium when user is not premium', () => {
      mockUseLeague.mockReturnValue({
        tournaments: [],
        leagues: [],
      } as any);

      const { result } = renderHook(() => usePremiumLimits());
      
      expect(result.current.isPremium).toBe(false);
    });

    it('should allow creating tournaments when under limit (0/2)', () => {
      mockUseLeague.mockReturnValue({
        tournaments: [],
        leagues: [],
      } as any);

      const { result } = renderHook(() => usePremiumLimits());
      
      expect(result.current.canCreateTournament).toBe(true);
      expect(result.current.isAtTournamentLimit).toBe(false);
      expect(result.current.tournamentCount).toBe(0);
      expect(result.current.limits.tournaments).toBe(2);
    });

    it('should allow creating tournaments when at 1/2 limit', () => {
      mockUseLeague.mockReturnValue({
        tournaments: [{ id: '1', isFinished: false }],
        leagues: [],
      } as any);

      const { result } = renderHook(() => usePremiumLimits());
      
      expect(result.current.canCreateTournament).toBe(true);
      expect(result.current.isAtTournamentLimit).toBe(false);
      expect(result.current.tournamentCount).toBe(1);
    });

    it('should prevent creating tournaments when at limit (2/2)', () => {
      mockUseLeague.mockReturnValue({
        tournaments: [
          { id: '1', isFinished: false },
          { id: '2', isFinished: false },
        ],
        leagues: [],
      } as any);

      const { result } = renderHook(() => usePremiumLimits());
      
      expect(result.current.canCreateTournament).toBe(false);
      expect(result.current.isAtTournamentLimit).toBe(true);
      expect(result.current.tournamentCount).toBe(2);
    });

    it('should not count finished tournaments against limit', () => {
      mockUseLeague.mockReturnValue({
        tournaments: [
          { id: '1', isFinished: false },
          { id: '2', isFinished: true },
          { id: '3', isFinished: true },
        ],
        leagues: [],
      } as any);

      const { result } = renderHook(() => usePremiumLimits());
      
      expect(result.current.canCreateTournament).toBe(true);
      expect(result.current.tournamentCount).toBe(1);
    });

    it('should allow creating leagues when under limit (0/1)', () => {
      mockUseLeague.mockReturnValue({
        tournaments: [],
        leagues: [],
      } as any);

      const { result } = renderHook(() => usePremiumLimits());
      
      expect(result.current.canCreateLeague).toBe(true);
      expect(result.current.isAtLeagueLimit).toBe(false);
      expect(result.current.leagueCount).toBe(0);
      expect(result.current.limits.leagues).toBe(1);
    });

    it('should prevent creating leagues when at limit (1/1)', () => {
      mockUseLeague.mockReturnValue({
        tournaments: [],
        leagues: [{ id: '1', status: 'active' }],
      } as any);

      const { result } = renderHook(() => usePremiumLimits());
      
      expect(result.current.canCreateLeague).toBe(false);
      expect(result.current.isAtLeagueLimit).toBe(true);
      expect(result.current.leagueCount).toBe(1);
    });

    it('should not count inactive leagues against limit', () => {
      mockUseLeague.mockReturnValue({
        tournaments: [],
        leagues: [
          { id: '1', status: 'active' },
          { id: '2', status: 'archived' },
        ],
      } as any);

      const { result } = renderHook(() => usePremiumLimits());
      
      expect(result.current.canCreateLeague).toBe(false);
      expect(result.current.leagueCount).toBe(1);
    });
  });

  describe('Premium User Limits', () => {
    beforeEach(() => {
      mockUseAuthContext.mockReturnValue({
        user: { user_metadata: { isPremium: true } },
        isAuthenticated: true,
        signIn: vi.fn(),
        signOut: vi.fn(),
      } as any);
    });

    it('should return true for isPremium when user is premium', () => {
      mockUseLeague.mockReturnValue({
        tournaments: [],
        leagues: [],
      } as any);

      const { result } = renderHook(() => usePremiumLimits());
      
      expect(result.current.isPremium).toBe(true);
    });

    it('should allow unlimited tournaments for premium users', () => {
      mockUseLeague.mockReturnValue({
        tournaments: [
          { id: '1', isFinished: false },
          { id: '2', isFinished: false },
          { id: '3', isFinished: false },
        ],
        leagues: [],
      } as any);

      const { result } = renderHook(() => usePremiumLimits());
      
      expect(result.current.canCreateTournament).toBe(true);
      expect(result.current.isAtTournamentLimit).toBe(false);
      expect(result.current.limits.tournaments).toBe(Infinity);
    });

    it('should allow unlimited leagues for premium users', () => {
      mockUseLeague.mockReturnValue({
        tournaments: [],
        leagues: [
          { id: '1', status: 'active' },
          { id: '2', status: 'active' },
        ],
      } as any);

      const { result } = renderHook(() => usePremiumLimits());
      
      expect(result.current.canCreateLeague).toBe(true);
      expect(result.current.isAtLeagueLimit).toBe(false);
      expect(result.current.limits.leagues).toBe(Infinity);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing user gracefully', () => {
      mockUseAuthContext.mockReturnValue({
        user: null,
        isAuthenticated: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
      } as any);
      
      mockUseLeague.mockReturnValue({
        tournaments: [],
        leagues: [],
      } as any);

      const { result } = renderHook(() => usePremiumLimits());
      
      expect(result.current.isPremium).toBe(false);
      expect(result.current.limits.tournaments).toBe(2);
      expect(result.current.limits.leagues).toBe(1);
    });

    it('should handle missing tournaments array', () => {
      mockUseAuthContext.mockReturnValue({
        user: { user_metadata: { isPremium: false } },
        isAuthenticated: true,
        signIn: vi.fn(),
        signOut: vi.fn(),
      } as any);
      
      mockUseLeague.mockReturnValue({
        leagues: [],
      } as any);

      const { result } = renderHook(() => usePremiumLimits());
      
      expect(result.current.tournamentCount).toBe(0);
      expect(result.current.canCreateTournament).toBe(true);
    });

    it('should handle missing leagues array', () => {
      mockUseAuthContext.mockReturnValue({
        user: { user_metadata: { isPremium: false } },
        isAuthenticated: true,
        signIn: vi.fn(),
        signOut: vi.fn(),
      } as any);
      
      mockUseLeague.mockReturnValue({
        tournaments: [],
      } as any);

      const { result } = renderHook(() => usePremiumLimits());
      
      expect(result.current.leagueCount).toBe(0);
      expect(result.current.canCreateLeague).toBe(true);
    });
  });
});
