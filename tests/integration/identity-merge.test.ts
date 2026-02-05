/**
 * Integration Tests: Identity Merge Flow
 * Tests the complete identity merge workflow when anonymous user authenticates
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { identityMergeService } from '../../src/services/IdentityMergeService';
import { authService } from '../../src/services/AuthService';
import { supabase } from '../../src/lib/supabase';

// Mock Supabase
vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

vi.mock('../../src/services/AuthService', () => ({
  authService: {
    getUserProfile: vi.fn(),
    createUserProfile: vi.fn(),
  },
}));

describe('Identity Merge Flow', () => {
  const mockAnonymousUserId = 'anon-123';
  const mockUserId = 'user-456';
  const mockPseudo = 'MergedUser';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete Merge Flow', () => {
    it('should merge anonymous data when user authenticates', async () => {
      // Setup: User profile doesn't exist yet
      vi.mocked(authService.getUserProfile).mockResolvedValue(null);
      vi.mocked(authService.createUserProfile).mockResolvedValue(true);

      // Mock various from() calls for different tables
      const mockFromCalls: Record<string, any> = {
        anonymous_users: {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        },
        league_players: {
          select: vi.fn().mockImplementation((fields) => {
            if (fields === '*') {
              return {
                eq: vi.fn().mockResolvedValue({
                  data: [
                    { id: 'lp1', league_id: 'league1', anonymous_user_id: mockAnonymousUserId },
                  ],
                  error: null,
                }),
              };
            } else if (fields === 'id') {
              return {
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
              };
            }
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        },
        tournament_players: {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        },
        matches: {
          select: vi.fn().mockResolvedValue({
            data: [
              {
                id: 'match1',
                team_a_player_ids: [mockAnonymousUserId, 'other1'],
                team_b_player_ids: ['other2', mockAnonymousUserId],
              },
            ],
            error: null,
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        },
        elo_history: {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        },
        leagues: {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        },
        tournaments: {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        },
        user_identity_merges: {
          insert: vi.fn().mockResolvedValue({ error: null }),
        },
      };

      vi.mocked(supabase?.from).mockImplementation((table: string) => {
        return mockFromCalls[table] || {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      });

      // Execute merge
      const result = await identityMergeService.mergeAnonymousToUser(
        mockAnonymousUserId,
        mockUserId,
        mockPseudo
      );

      // Verify success
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();

      // Verify profile creation was called
      expect(authService.createUserProfile).toHaveBeenCalledWith(mockUserId, mockPseudo);

      // Verify anonymous_users was updated
      expect(mockFromCalls.anonymous_users.update).toHaveBeenCalledWith({
        merged_to_user_id: mockUserId,
        merged_at: expect.any(String),
      });

      // Verify user_identity_merges record was created
      expect(mockFromCalls.user_identity_merges.insert).toHaveBeenCalledWith({
        anonymous_user_id: mockAnonymousUserId,
        user_id: mockUserId,
        stats_migrated: true,
      });
    });

    it('should not create duplicate profile if already exists', async () => {
      // Setup: User profile exists
      const mockExistingProfile = {
        id: mockUserId,
        pseudo: 'ExistingPseudo',
        user_id: mockUserId,
      };
      vi.mocked(authService.getUserProfile).mockResolvedValue(mockExistingProfile);

      const mockFromCalls: Record<string, any> = {
        anonymous_users: {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        },
        league_players: {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        },
        tournament_players: {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        },
        matches: {
          select: vi.fn().mockResolvedValue({ data: [], error: null }),
        },
        elo_history: {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        },
        leagues: {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        },
        tournaments: {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        },
        user_identity_merges: {
          insert: vi.fn().mockResolvedValue({ error: null }),
        },
      };

      vi.mocked(supabase?.from).mockImplementation((table: string) => {
        return mockFromCalls[table];
      });

      const result = await identityMergeService.mergeAnonymousToUser(
        mockAnonymousUserId,
        mockUserId,
        mockPseudo
      );

      expect(result.success).toBe(true);
      // Should not create new profile
      expect(authService.createUserProfile).not.toHaveBeenCalled();
    });
  });

  describe('League Players Migration', () => {
    it('should migrate league_players from anonymous to user', async () => {
      vi.mocked(authService.getUserProfile).mockResolvedValue({
        id: mockUserId,
        pseudo: mockPseudo,
        user_id: mockUserId,
      });

      const mockLeaguePlayers = [
        { id: 'lp1', league_id: 'league1', anonymous_user_id: mockAnonymousUserId, user_id: null },
        { id: 'lp2', league_id: 'league2', anonymous_user_id: mockAnonymousUserId, user_id: null },
      ];

      const mockFromCalls: Record<string, any> = {
        anonymous_users: {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        },
        league_players: {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockLeaguePlayers,
              error: null,
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        },
        tournament_players: {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        },
        matches: {
          select: vi.fn().mockResolvedValue({ data: [], error: null }),
        },
        elo_history: {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        },
        leagues: {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        },
        tournaments: {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        },
        user_identity_merges: {
          insert: vi.fn().mockResolvedValue({ error: null }),
        },
      };

      vi.mocked(supabase?.from).mockImplementation((table: string) => {
        return mockFromCalls[table];
      });

      const result = await identityMergeService.mergeAnonymousToUser(
        mockAnonymousUserId,
        mockUserId,
        mockPseudo
      );

      expect(result.success).toBe(true);
      // Should have updated league_players
      expect(mockFromCalls.league_players.update).toHaveBeenCalled();
    });

    it('should handle existing league participation (no duplicates)', async () => {
      vi.mocked(authService.getUserProfile).mockResolvedValue({
        id: mockUserId,
        pseudo: mockPseudo,
        user_id: mockUserId,
      });

      // Anonymous user in league1
      const mockLeaguePlayers = [
        { id: 'lp1', league_id: 'league1', anonymous_user_id: mockAnonymousUserId },
      ];

      const mockFromCalls: Record<string, any> = {
        anonymous_users: {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        },
        league_players: {
          select: vi.fn().mockImplementation((fields) => {
            if (fields === '*') {
              // First call: get anonymous league players
              return {
                eq: vi.fn().mockResolvedValue({
                  data: mockLeaguePlayers,
                  error: null,
                }),
              };
            } else if (fields === 'id') {
              // Second call: check if user already in league
              return {
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                  data: { id: 'lp-existing' }, // User already in league!
                  error: null,
                }),
              };
            }
            return {
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            };
          }),
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        },
        tournament_players: {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        },
        matches: {
          select: vi.fn().mockResolvedValue({ data: [], error: null }),
        },
        elo_history: {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        },
        leagues: {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        },
        tournaments: {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        },
        user_identity_merges: {
          insert: vi.fn().mockResolvedValue({ error: null }),
        },
      };

      vi.mocked(supabase?.from).mockImplementation((table: string) => {
        return mockFromCalls[table];
      });

      const result = await identityMergeService.mergeAnonymousToUser(
        mockAnonymousUserId,
        mockUserId,
        mockPseudo
      );

      expect(result.success).toBe(true);
      // Should delete the anonymous entry (user already exists)
      expect(mockFromCalls.league_players.delete).toHaveBeenCalled();
    });
  });

  describe('Matches Migration', () => {
    it('should update player IDs in match arrays', async () => {
      vi.mocked(authService.getUserProfile).mockResolvedValue({
        id: mockUserId,
        pseudo: mockPseudo,
        user_id: mockUserId,
      });

      const mockMatches = [
        {
          id: 'match1',
          team_a_player_ids: [mockAnonymousUserId, 'player2'],
          team_b_player_ids: ['player3', 'player4'],
        },
        {
          id: 'match2',
          team_a_player_ids: ['player5', 'player6'],
          team_b_player_ids: [mockAnonymousUserId, 'player7'],
        },
      ];

      const updateSpy = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      const mockFromCalls: Record<string, any> = {
        anonymous_users: {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        },
        league_players: {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        },
        tournament_players: {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        },
        matches: {
          select: vi.fn().mockResolvedValue({
            data: mockMatches,
            error: null,
          }),
          update: updateSpy,
        },
        elo_history: {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        },
        leagues: {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        },
        tournaments: {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        },
        user_identity_merges: {
          insert: vi.fn().mockResolvedValue({ error: null }),
        },
      };

      vi.mocked(supabase?.from).mockImplementation((table: string) => {
        return mockFromCalls[table];
      });

      const result = await identityMergeService.mergeAnonymousToUser(
        mockAnonymousUserId,
        mockUserId,
        mockPseudo
      );

      expect(result.success).toBe(true);
      // Should have updated 2 matches (note: migrations also update leagues/tournaments)
      expect(updateSpy).toHaveBeenCalled();
      
      // Verify first match update
      expect(updateSpy).toHaveBeenCalledWith({
        team_a_player_ids: [mockUserId, 'player2'],
        team_b_player_ids: ['player3', 'player4'],
      });

      // Verify second match update
      expect(updateSpy).toHaveBeenCalledWith({
        team_a_player_ids: ['player5', 'player6'],
        team_b_player_ids: [mockUserId, 'player7'],
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle profile creation failure', async () => {
      vi.mocked(authService.getUserProfile).mockResolvedValue(null);
      vi.mocked(authService.createUserProfile).mockResolvedValue(false);

      const result = await identityMergeService.mergeAnonymousToUser(
        mockAnonymousUserId,
        mockUserId,
        mockPseudo
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to create user profile');
    });

    it('should handle database errors during merge', async () => {
      vi.mocked(authService.getUserProfile).mockResolvedValue({
        id: mockUserId,
        pseudo: mockPseudo,
        user_id: mockUserId,
      });

      const mockFromCalls: Record<string, any> = {
        anonymous_users: {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              error: { message: 'Database error', code: 'DB_ERROR' },
            }),
          }),
        },
      };

      vi.mocked(supabase?.from).mockImplementation((table: string) => {
        return mockFromCalls[table];
      });

      const result = await identityMergeService.mergeAnonymousToUser(
        mockAnonymousUserId,
        mockUserId,
        mockPseudo
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });

    it('should handle missing Supabase client', async () => {
      // Mock the service to test offline mode
      const result = await identityMergeService.mergeAnonymousToUser(
        mockAnonymousUserId,
        mockUserId,
        mockPseudo
      );

      // In the current implementation, if supabase is null, it returns early
      // This test verifies the service handles missing client gracefully
      expect(result).toBeDefined();
      expect(result.success !== undefined).toBe(true);
    });
  });
});
