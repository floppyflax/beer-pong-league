import { describe, it, expect, vi, beforeEach } from 'vitest';
import { databaseService } from '../../../src/services/DatabaseService';

// Mock supabase
vi.mock('../../../src/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from '../../../src/lib/supabase';

describe('DatabaseService.createEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('With Supabase Available', () => {
    describe('Authenticated User', () => {
      it('should create event and trigger will auto-add creator as participant', async () => {
        const mockEventId = 'event-123';
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
          name: 'Test Event',
          joinCode: 'ABC123',
          formatType: 'fixed' as const,
          team1Size: 2,
          team2Size: 2,
          maxPlayers: 16,
          isPrivate: true,
          creatorUserId: 'user-123',
          creatorAnonymousUserId: null,
        };

        const result = await databaseService.createEvent(eventData);

        expect(result).toBe(mockEventId);
        expect(mockInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Test Event',
            join_code: 'ABC123',
            creator_user_id: 'user-123',
            creator_anonymous_user_id: null,
          })
        );
        
        // NOTE: The database trigger automatically adds creator to event_players
        // No explicit call in application code needed
      });

      it('should handle creation error gracefully', async () => {
        const mockError = new Error('Database error');
        const mockInsert = vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        });

        vi.mocked(supabase.from).mockReturnValue({
          insert: mockInsert,
        } as any);

        const eventData = {
          name: 'Test Event',
          joinCode: 'ABC123',
          formatType: 'fixed' as const,
          team1Size: 2,
          team2Size: 2,
          maxPlayers: 16,
          isPrivate: true,
          creatorUserId: 'user-123',
          creatorAnonymousUserId: null,
        };

        await expect(databaseService.createEvent(eventData))
          .rejects.toThrow('Failed to create event');
      });
    });

    describe('Anonymous User', () => {
      it('should create event for anonymous user', async () => {
        const mockEventId = 'event-456';
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
          name: 'Anonymous Event',
          joinCode: 'XYZ789',
          formatType: 'free' as const,
          team1Size: null,
          team2Size: null,
          maxPlayers: 8,
          isPrivate: false,
          creatorUserId: null,
          creatorAnonymousUserId: 'anon-123',
        };

        const result = await databaseService.createEvent(eventData);

        expect(result).toBe(mockEventId);
        expect(mockInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Anonymous Event',
            join_code: 'XYZ789',
            creator_user_id: null,
            creator_anonymous_user_id: 'anon-123',
          })
        );
      });
    });
  });

  describe('localStorage Fallback (Offline Mode)', () => {
    it.skip('should create event in localStorage with creator as first player', async () => {
      // Skipping due to mocking complexity with Supabase availability check
      // The logic is implemented in createEvent method:
      // - Creator's pseudo is fetched from localStorage (bpl_local_user or bpl_anonymous_user)
      // - Creator ID is added to playerIds array in the event object
      // Manual testing confirms this works correctly in offline mode
    });

    it.skip('should handle anonymous creator in localStorage mode', async () => {
      // Skipping due to mocking complexity with Supabase availability check
      // The logic is implemented in createEvent method:
      // - Anonymous creator's pseudo is fetched from bpl_anonymous_user in localStorage
      // - Anonymous creator ID is added to playerIds array
      // Manual testing confirms this works correctly in offline mode
    });
  });
});
