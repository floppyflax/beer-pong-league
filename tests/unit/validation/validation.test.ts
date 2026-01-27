import { describe, it, expect } from 'vitest';
import {
  playerSchema,
  teamSchema,
  matchSchema,
  leagueSchema,
  tournamentSchema,
  validatePlayer,
  validateLeague,
  validateTournament,
  validateMatch,
  safeValidatePlayer,
  safeValidateLeague,
  safeValidateTournament,
  safeValidateMatch,
  createPlayerInputSchema,
  createLeagueInputSchema,
  createTournamentInputSchema,
  createMatchInputSchema,
} from '@/utils/validation';

describe('Player Schema Validation', () => {
  it('should validate a valid player', () => {
    const validPlayer = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'John Doe',
      elo: 1500,
      wins: 10,
      losses: 5,
      matchesPlayed: 15,
      streak: 3,
    };

    const result = playerSchema.safeParse(validPlayer);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('John Doe');
      expect(result.data.elo).toBe(1500);
    }
  });

  it('should use default values for optional fields', () => {
    const minimalPlayer = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Jane Doe',
    };

    const result = playerSchema.safeParse(minimalPlayer);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.elo).toBe(1500);
      expect(result.data.wins).toBe(0);
      expect(result.data.losses).toBe(0);
      expect(result.data.matchesPlayed).toBe(0);
      expect(result.data.streak).toBe(0);
    }
  });

  it('should reject invalid player ID', () => {
    const invalidPlayer = {
      id: 'not-a-uuid',
      name: 'Invalid Player',
    };

    const result = playerSchema.safeParse(invalidPlayer);
    expect(result.success).toBe(false);
  });

  it('should reject empty player name', () => {
    const invalidPlayer = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: '',
    };

    const result = playerSchema.safeParse(invalidPlayer);
    expect(result.success).toBe(false);
  });

  it('should reject negative ELO', () => {
    const invalidPlayer = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Player',
      elo: -100,
    };

    const result = playerSchema.safeParse(invalidPlayer);
    expect(result.success).toBe(false);
  });

  it('should reject ELO above 3000', () => {
    const invalidPlayer = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Player',
      elo: 3001,
    };

    const result = playerSchema.safeParse(invalidPlayer);
    expect(result.success).toBe(false);
  });
});

describe('Match Schema Validation', () => {
  it('should validate a valid match', () => {
    const validMatch = {
      id: '123e4567-e89b-12d3-a456-426614174001',
      date: '2026-01-27T10:00:00Z',
      teamA: ['123e4567-e89b-12d3-a456-426614174000'],
      teamB: ['123e4567-e89b-12d3-a456-426614174002'],
      scoreA: 10,
      scoreB: 8,
      status: 'confirmed' as const,
    };

    const result = matchSchema.safeParse(validMatch);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.scoreA).toBe(10);
      expect(result.data.scoreB).toBe(8);
    }
  });

  it('should reject score above 10', () => {
    const invalidMatch = {
      id: '123e4567-e89b-12d3-a456-426614174001',
      date: '2026-01-27T10:00:00Z',
      teamA: ['123e4567-e89b-12d3-a456-426614174000'],
      teamB: ['123e4567-e89b-12d3-a456-426614174002'],
      scoreA: 11,
      scoreB: 8,
    };

    const result = matchSchema.safeParse(invalidMatch);
    expect(result.success).toBe(false);
  });

  it('should reject negative score', () => {
    const invalidMatch = {
      id: '123e4567-e89b-12d3-a456-426614174001',
      date: '2026-01-27T10:00:00Z',
      teamA: ['123e4567-e89b-12d3-a456-426614174000'],
      teamB: ['123e4567-e89b-12d3-a456-426614174002'],
      scoreA: -1,
      scoreB: 8,
    };

    const result = matchSchema.safeParse(invalidMatch);
    expect(result.success).toBe(false);
  });

  it('should reject invalid match status', () => {
    const invalidMatch = {
      id: '123e4567-e89b-12d3-a456-426614174001',
      date: '2026-01-27T10:00:00Z',
      teamA: ['123e4567-e89b-12d3-a456-426614174000'],
      teamB: ['123e4567-e89b-12d3-a456-426614174002'],
      scoreA: 10,
      scoreB: 8,
      status: 'invalid',
    };

    const result = matchSchema.safeParse(invalidMatch);
    expect(result.success).toBe(false);
  });
});

describe('League Schema Validation', () => {
  it('should validate a valid league', () => {
    const validLeague = {
      id: '123e4567-e89b-12d3-a456-426614174003',
      name: 'Summer League 2026',
      type: 'season' as const,
      createdAt: '2026-01-27T10:00:00Z',
      players: [],
      matches: [],
    };

    const result = leagueSchema.safeParse(validLeague);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Summer League 2026');
      expect(result.data.type).toBe('season');
    }
  });

  it('should use default values for optional arrays', () => {
    const minimalLeague = {
      id: '123e4567-e89b-12d3-a456-426614174003',
      name: 'Test League',
      type: 'event' as const,
      createdAt: '2026-01-27T10:00:00Z',
    };

    const result = leagueSchema.safeParse(minimalLeague);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.players).toEqual([]);
      expect(result.data.matches).toEqual([]);
      expect(result.data.anti_cheat_enabled).toBe(false);
    }
  });

  it('should reject invalid league type', () => {
    const invalidLeague = {
      id: '123e4567-e89b-12d3-a456-426614174003',
      name: 'Test League',
      type: 'invalid',
      createdAt: '2026-01-27T10:00:00Z',
    };

    const result = leagueSchema.safeParse(invalidLeague);
    expect(result.success).toBe(false);
  });

  it('should reject empty league name', () => {
    const invalidLeague = {
      id: '123e4567-e89b-12d3-a456-426614174003',
      name: '',
      type: 'season' as const,
      createdAt: '2026-01-27T10:00:00Z',
    };

    const result = leagueSchema.safeParse(invalidLeague);
    expect(result.success).toBe(false);
  });
});

describe('Tournament Schema Validation', () => {
  it('should validate a valid tournament', () => {
    const validTournament = {
      id: '123e4567-e89b-12d3-a456-426614174004',
      name: 'Championship 2026',
      date: '2026-01-27T10:00:00Z',
      leagueId: '123e4567-e89b-12d3-a456-426614174003',
      createdAt: '2026-01-27T10:00:00Z',
      playerIds: [],
      matches: [],
      isFinished: false,
    };

    const result = tournamentSchema.safeParse(validTournament);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Championship 2026');
      expect(result.data.isFinished).toBe(false);
    }
  });

  it('should allow null leagueId for autonomous tournaments', () => {
    const autonomousTournament = {
      id: '123e4567-e89b-12d3-a456-426614174004',
      name: 'Standalone Tournament',
      date: '2026-01-27T10:00:00Z',
      leagueId: null,
      createdAt: '2026-01-27T10:00:00Z',
    };

    const result = tournamentSchema.safeParse(autonomousTournament);
    expect(result.success).toBe(true);
  });
});

describe('Validation Functions', () => {
  it('validatePlayer should throw on invalid data', () => {
    const invalidData = { id: 'invalid', name: '' };
    expect(() => validatePlayer(invalidData)).toThrow();
  });

  it('validatePlayer should return valid data', () => {
    const validData = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test Player',
    };
    const result = validatePlayer(validData);
    expect(result.name).toBe('Test Player');
    expect(result.elo).toBe(1500); // default
  });

  it('safeValidatePlayer should not throw on invalid data', () => {
    const invalidData = { id: 'invalid', name: '' };
    const result = safeValidatePlayer(invalidData);
    expect(result.success).toBe(false);
  });

  it('safeValidatePlayer should return success on valid data', () => {
    const validData = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test Player',
    };
    const result = safeValidatePlayer(validData);
    expect(result.success).toBe(true);
  });
});

describe('Input Schemas (for forms)', () => {
  it('createPlayerInputSchema should not require ID', () => {
    const playerInput = {
      name: 'New Player',
    };

    const result = createPlayerInputSchema.safeParse(playerInput);
    expect(result.success).toBe(true);
  });

  it('createLeagueInputSchema should not require ID or timestamps', () => {
    const leagueInput = {
      name: 'New League',
      type: 'event' as const,
    };

    const result = createLeagueInputSchema.safeParse(leagueInput);
    expect(result.success).toBe(true);
  });

  it('createTournamentInputSchema should not require ID or timestamps', () => {
    const tournamentInput = {
      name: 'New Tournament',
      date: '2026-01-27T10:00:00Z',
      leagueId: '123e4567-e89b-12d3-a456-426614174003',
      playerIds: [],
      isFinished: false,
    };

    const result = createTournamentInputSchema.safeParse(tournamentInput);
    expect(result.success).toBe(true);
  });

  it('createMatchInputSchema should not require ID', () => {
    const matchInput = {
      date: '2026-01-27T10:00:00Z',
      teamA: ['123e4567-e89b-12d3-a456-426614174000'],
      teamB: ['123e4567-e89b-12d3-a456-426614174002'],
      scoreA: 10,
      scoreB: 8,
    };

    const result = createMatchInputSchema.safeParse(matchInput);
    expect(result.success).toBe(true);
  });
});
