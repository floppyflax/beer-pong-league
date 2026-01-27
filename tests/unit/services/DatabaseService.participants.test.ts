import { describe, it, expect, beforeEach, vi } from 'vitest';
import { databaseService } from '../../../src/services/DatabaseService';

// Mock Supabase client
vi.mock('../../../src/lib/supabase', () => ({
  supabase: null,
}));

describe('DatabaseService - Tournament Participants (Story 3.3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('loadTournamentParticipants', () => {
    it('should load participants from localStorage when Supabase unavailable', async () => {
      // Setup localStorage data
      const mockLeague = {
        id: 'league-1',
        name: 'Test League',
        type: 'event',
        players: [
          { id: 'player-1', name: 'Alice', elo: 1200, wins: 5, losses: 3, matchesPlayed: 8, streak: 2 },
          { id: 'player-2', name: 'Bob', elo: 1150, wins: 4, losses: 4, matchesPlayed: 8, streak: -1 },
        ],
        matches: [],
        createdAt: new Date().toISOString(),
      };

      const mockTournament = {
        id: 'tournament-1',
        name: 'Summer Tournament',
        date: new Date().toISOString(),
        format: '2v2',
        leagueId: 'league-1',
        playerIds: ['player-1', 'player-2'],
        matches: [],
        isFinished: false,
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem('bpl_leagues', JSON.stringify([mockLeague]));
      localStorage.setItem('bpl_tournaments', JSON.stringify([mockTournament]));

      // Load participants
      const participants = await databaseService.loadTournamentParticipants('tournament-1');

      // AC: List of participants is displayed
      expect(participants).toHaveLength(2);
      
      // AC: Each participant shows name and basic stats
      expect(participants[0]).toEqual(expect.objectContaining({
        id: 'player-1',
        name: 'Alice',
        elo: 1200,
        matchesPlayed: 8,
        wins: 5,
        losses: 3,
      }));
    });

    it('should return empty array when tournament not found', async () => {
      const participants = await databaseService.loadTournamentParticipants('non-existent');
      
      expect(participants).toEqual([]);
    });

    it('should handle tournament with no league', async () => {
      const mockTournament = {
        id: 'tournament-1',
        name: 'Autonomous Tournament',
        date: new Date().toISOString(),
        format: '2v2',
        leagueId: null,
        playerIds: [],
        matches: [],
        isFinished: false,
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem('bpl_tournaments', JSON.stringify([mockTournament]));

      const participants = await databaseService.loadTournamentParticipants('tournament-1');
      
      // AC: Handle autonomous tournaments
      expect(participants).toEqual([]);
    });
  });

  describe('Participant Display Requirements', () => {
    it('should include all required participant data fields', async () => {
      const mockLeague = {
        id: 'league-1',
        name: 'Test League',
        type: 'event',
        players: [
          { id: 'player-1', name: 'Alice', elo: 1200, wins: 5, losses: 3, matchesPlayed: 8, streak: 2 },
        ],
        matches: [],
        createdAt: new Date().toISOString(),
      };

      const mockTournament = {
        id: 'tournament-1',
        name: 'Summer Tournament',
        date: new Date().toISOString(),
        format: '2v2',
        leagueId: 'league-1',
        playerIds: ['player-1'],
        matches: [],
        isFinished: false,
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem('bpl_leagues', JSON.stringify([mockLeague]));
      localStorage.setItem('bpl_tournaments', JSON.stringify([mockTournament]));

      const participants = await databaseService.loadTournamentParticipants('tournament-1');

      // AC: Shows name and basic stats (ELO, matches played)
      expect(participants[0]).toHaveProperty('name');
      expect(participants[0]).toHaveProperty('elo');
      expect(participants[0]).toHaveProperty('matchesPlayed');
      expect(participants[0]).toHaveProperty('wins');
      expect(participants[0]).toHaveProperty('losses');
      expect(participants[0]).toHaveProperty('joinedAt');
    });
  });
});
