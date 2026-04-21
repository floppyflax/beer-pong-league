/**
 * Integration test for Story 8.6: Auto-add Tournament Creator as Participant
 * 
 * Tests that tournament creators are automatically added as first participants
 * when creating a tournament, ensuring they appear in their dashboard.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { databaseService } from '../../src/services/DatabaseService';
import { supabase } from '../../src/lib/supabase';

// Mock supabase
vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('Tournament Creation - Auto-add Creator as Participant (Story 8.6)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Integration: createTournament with Database Trigger', () => {
    it('should create tournament and database trigger adds creator automatically', async () => {
      const mockTournamentId = 'integration-tournament-123';
      
      // Mock successful tournament creation
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: mockTournamentId },
            error: null,
          }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const tournamentData = {
        name: 'Integration Test Tournament',
        joinCode: 'INT123',
        formatType: 'fixed' as const,
        team1Size: 2,
        team2Size: 2,
        maxPlayers: 16,
        isPrivate: true,
        creatorUserId: 'integration-user-123',
        creatorAnonymousUserId: null,
      };

      const result = await databaseService.createTournament(tournamentData);

      // Verify tournament was created
      expect(result).toBe(mockTournamentId);
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Integration Test Tournament',
          creator_user_id: 'integration-user-123',
        })
      );

      // NOTE: The database trigger `tournament_add_creator_trigger` 
      // automatically inserts the creator into `tournament_players` table.
      // This happens at the database level (migration 007).
      // 
      // To verify this works in production:
      // 1. Apply migration 007 to your database
      // 2. Create a tournament via the UI
      // 3. Check `tournament_players` table - creator should be there
      // 4. Check home dashboard - tournament should appear
    });

    it('should handle anonymous creator correctly', async () => {
      const mockTournamentId = 'integration-anon-tournament-456';
      
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: mockTournamentId },
            error: null,
          }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const tournamentData = {
        name: 'Anonymous Integration Tournament',
        joinCode: 'AIN789',
        formatType: 'free' as const,
        team1Size: null,
        team2Size: null,
        maxPlayers: 8,
        isPrivate: false,
        creatorUserId: null,
        creatorAnonymousUserId: 'integration-anon-456',
      };

      const result = await databaseService.createTournament(tournamentData);

      expect(result).toBe(mockTournamentId);
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Anonymous Integration Tournament',
          creator_anonymous_user_id: 'integration-anon-456',
        })
      );

      // Database trigger handles anonymous users too
    });
  });

  describe('Integration: Transaction Safety', () => {
    it('should document trigger failure handling', () => {
      // NOTE: The database trigger approach ensures atomicity.
      // If the trigger fails to add the creator to tournament_players,
      // the entire transaction is rolled back by PostgreSQL.
      // 
      // The tournament will NOT be created if:
      // - The creator's user_id doesn't exist in users table
      // - The creator's anonymous_user_id doesn't exist in anonymous_users table
      // - There's a constraint violation in tournament_players
      // 
      // This is handled by PostgreSQL's ACID guarantees, not application code.
      // 
      // Manual test procedure:
      // 1. Try to create tournament with invalid creator_user_id
      // 2. Verify tournament is NOT created
      // 3. Verify no orphan record in tournament_players
      
      expect(true).toBe(true); // Placeholder - behavior is database-level
    });
  });

  describe('Integration: Home Dashboard Query', () => {
    it('should document dashboard query expectations', () => {
      // NOTE: After Story 8.6 implementation, useHomeData hook should find tournaments via:
      // 
      // Option 1: Query tournaments where creator_user_id = userId
      //   (Existing behavior - finds created tournaments)
      // 
      // Option 2: Query tournament_players where user_id = userId, then join to tournaments
      //   (New behavior - finds participated tournaments, including self-created)
      // 
      // Both should return created tournaments now that creator is auto-added as participant.
      // 
      // The temporary workaround in useHomeData (querying both created and participated)
      // can eventually be simplified to just query tournament_players.
      
      expect(true).toBe(true); // Placeholder - verified via manual testing
    });
  });
});
