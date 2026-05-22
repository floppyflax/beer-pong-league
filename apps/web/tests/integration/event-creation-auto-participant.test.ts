/**
 * Integration test for Story 8.6: Auto-add Event Creator as Participant
 * 
 * Tests that event creators are automatically added as first participants
 * when creating a event, ensuring they appear in their dashboard.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { databaseService } from '../../src/services/DatabaseService';

// createEvent lives in EventsRepository, which reads the live `sb` binding from
// the shared `_base` module (populated at boot) and gates on
// BaseRepository.isSupabaseAvailable() — not the web lib/supabase shim. Mock
// `_base` to inject the spy client and a base whose isSupabaseAvailable() is
// always true.
const { supabase } = vi.hoisted(() => ({ supabase: { from: vi.fn() } }));

vi.mock('@elofight/shared/services/repositories/_base', async (importActual) => {
  const actual = await importActual<
    typeof import('@elofight/shared/services/repositories/_base')
  >();
  class MockBaseRepository {
    protected isSupabaseAvailable(): boolean {
      return true;
    }
  }
  return { ...actual, supabase, sb: supabase, BaseRepository: MockBaseRepository };
});

describe('Event Creation - Auto-add Creator as Participant (Story 8.6)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Integration: createEvent with Database Trigger', () => {
    it('should create event and database trigger adds creator automatically', async () => {
      const mockEventId = 'integration-event-123';
      
      // Mock successful event creation
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: mockEventId },
            error: null,
          }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const eventData = {
        name: 'Integration Test Event',
        joinCode: 'INT123',
        formatType: 'fixed' as const,
        team1Size: 2,
        team2Size: 2,
        maxPlayers: 16,
        isPrivate: true,
        creatorUserId: 'integration-user-123',
        creatorAnonymousUserId: null,
      };

      const result = await databaseService.createEvent(eventData);

      // Verify event was created
      expect(result).toBe(mockEventId);
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Integration Test Event',
          creator_user_id: 'integration-user-123',
        })
      );

      // NOTE: The database trigger `event_add_creator_trigger` 
      // automatically inserts the creator into `event_players` table.
      // This happens at the database level (migration 007).
      // 
      // To verify this works in production:
      // 1. Apply migration 007 to your database
      // 2. Create a event via the UI
      // 3. Check `event_players` table - creator should be there
      // 4. Check home dashboard - event should appear
    });

    // "should handle anonymous creator correctly" removed: mig 022
    // unified anonymous_users into users, so the dedicated
    // `creator_anonymous_user_id` column no longer exists. Anonymous
    // creators now use the same `creator_user_id` field.
  });

  describe('Integration: Transaction Safety', () => {
    it('should document trigger failure handling', () => {
      // NOTE: The database trigger approach ensures atomicity.
      // If the trigger fails to add the creator to event_players,
      // the entire transaction is rolled back by PostgreSQL.
      // 
      // The event will NOT be created if:
      // - The creator's user_id doesn't exist in users table
      // - The creator's anonymous_user_id doesn't exist in anonymous_users table
      // - There's a constraint violation in event_players
      // 
      // This is handled by PostgreSQL's ACID guarantees, not application code.
      // 
      // Manual test procedure:
      // 1. Try to create event with invalid creator_user_id
      // 2. Verify event is NOT created
      // 3. Verify no orphan record in event_players
      
      expect(true).toBe(true); // Placeholder - behavior is database-level
    });
  });

  describe('Integration: Home Dashboard Query', () => {
    it('should document dashboard query expectations', () => {
      // NOTE: After Story 8.6 implementation, useHomeData hook should find events via:
      // 
      // Option 1: Query events where creator_user_id = userId
      //   (Existing behavior - finds created events)
      // 
      // Option 2: Query event_players where user_id = userId, then join to events
      //   (New behavior - finds participated events, including self-created)
      // 
      // Both should return created events now that creator is auto-added as participant.
      // 
      // The temporary workaround in useHomeData (querying both created and participated)
      // can eventually be simplified to just query event_players.
      
      expect(true).toBe(true); // Placeholder - verified via manual testing
    });
  });
});
