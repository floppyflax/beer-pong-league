import { z } from 'zod';

/**
 * Zod validation schemas for Beer Pong League data types.
 * These schemas provide runtime validation and type safety.
 * 
 * Architecture patterns:
 * - App uses camelCase (TypeScript)
 * - Schemas validate camelCase data (not DB snake_case)
 * - Transformation between formats handled in services layer
 */

// ============================================================================
// PLAYER SCHEMA
// ============================================================================

export const playerSchema = z.object({
  id: z.string().uuid('Player ID must be a valid UUID'),
  name: z.string().min(1, 'Player name is required').max(100, 'Player name must be 100 characters or less'),
  elo: z.number().int('ELO must be an integer').min(0, 'ELO cannot be negative').max(3000, 'ELO cannot exceed 3000').default(1500),
  wins: z.number().int('Wins must be an integer').min(0, 'Wins cannot be negative').default(0),
  losses: z.number().int('Losses must be an integer').min(0, 'Losses cannot be negative').default(0),
  matchesPlayed: z.number().int('Matches played must be an integer').min(0, 'Matches played cannot be negative').default(0),
  streak: z.number().int('Streak must be an integer').default(0), // Positive for win streak, negative for loss streak
});

export type Player = z.infer<typeof playerSchema>;

// ============================================================================
// TEAM SCHEMA
// ============================================================================

export const teamSchema = z.object({
  players: z.array(playerSchema).min(1, 'Team must have at least one player'),
});

export type Team = z.infer<typeof teamSchema>;

// ============================================================================
// MATCH SCHEMA
// ============================================================================

export const matchSchema = z.object({
  id: z.string().uuid('Match ID must be a valid UUID'),
  date: z.string().datetime('Date must be a valid ISO 8601 datetime'),
  teamA: z.array(z.string().uuid('Player ID must be a valid UUID')).min(1, 'Team A must have at least one player'),
  teamB: z.array(z.string().uuid('Player ID must be a valid UUID')).min(1, 'Team B must have at least one player'),
  scoreA: z.number().int('Score A must be an integer').min(0, 'Score A cannot be negative').max(10, 'Score A cannot exceed 10'),
  scoreB: z.number().int('Score B must be an integer').min(0, 'Score B cannot be negative').max(10, 'Score B cannot exceed 10'),
  eloChanges: z.record(z.string(), z.number()).optional(),
  created_by_user_id: z.string().uuid('User ID must be a valid UUID').nullable().optional(),
  created_by_anonymous_user_id: z.string().uuid('Anonymous user ID must be a valid UUID').nullable().optional(),
  status: z.enum(['pending', 'confirmed', 'rejected']).default('confirmed'),
  confirmed_by_user_id: z.string().uuid('User ID must be a valid UUID').nullable().optional(),
  confirmed_by_anonymous_user_id: z.string().uuid('Anonymous user ID must be a valid UUID').nullable().optional(),
  confirmed_at: z.string().datetime('Confirmed at must be a valid ISO 8601 datetime').nullable().optional(),
});

export type Match = z.infer<typeof matchSchema>;

// ============================================================================
// LEAGUE SCHEMA
// ============================================================================

export const leagueSchema = z.object({
  id: z.string().uuid('League ID must be a valid UUID'),
  name: z.string().min(1, 'League name is required').max(200, 'League name must be 200 characters or less'),
  type: z.enum(['event', 'season'], { message: 'Type must be either "event" or "season"' }),
  createdAt: z.string().datetime('Created at must be a valid ISO 8601 datetime'),
  players: z.array(playerSchema).default([]),
  matches: z.array(matchSchema).default([]),
  tournaments: z.array(z.string().uuid('Tournament ID must be a valid UUID')).optional(),
  creator_user_id: z.string().uuid('User ID must be a valid UUID').nullable().optional(),
  creator_anonymous_user_id: z.string().uuid('Anonymous user ID must be a valid UUID').nullable().optional(),
  anti_cheat_enabled: z.boolean().default(false),
});

export type League = z.infer<typeof leagueSchema>;

// ============================================================================
// TOURNAMENT SCHEMA
// ============================================================================

export const tournamentSchema = z.object({
  id: z.string().uuid('Tournament ID must be a valid UUID'),
  name: z.string().min(1, 'Tournament name is required').max(200, 'Tournament name must be 200 characters or less'),
  // Accept both date (YYYY-MM-DD) and datetime formats, convert to datetime
  date: z.string().refine((val) => {
    // Accept ISO date (YYYY-MM-DD) or ISO datetime
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const datetimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    return dateRegex.test(val) || datetimeRegex.test(val);
  }, 'Date must be a valid ISO 8601 date or datetime')
    .transform((val) => {
      // If it's just a date, convert to datetime
      if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
        return new Date(val + 'T00:00:00.000Z').toISOString();
      }
      // If it's already a datetime, ensure it's ISO format
      return new Date(val).toISOString();
    }),
  format: z.enum(['1v1', '2v2', '3v3'], { message: 'Format must be either "1v1", "2v2", or "3v3"' }).default('2v2'),
  location: z.string().max(200, 'Location must be 200 characters or less').optional(),
  leagueId: z.string().uuid('League ID must be a valid UUID').nullable(),
  // Accept both date and datetime formats for createdAt
  createdAt: z.string().refine((val) => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const datetimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    return dateRegex.test(val) || datetimeRegex.test(val);
  }, 'Created at must be a valid ISO 8601 date or datetime')
    .transform((val) => {
      if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
        return new Date(val + 'T00:00:00.000Z').toISOString();
      }
      return new Date(val).toISOString();
    }),
  playerIds: z.array(z.string().uuid('Player ID must be a valid UUID')).default([]),
  matches: z.array(matchSchema).default([]),
  isFinished: z.boolean().default(false),
  creator_user_id: z.string().uuid('User ID must be a valid UUID').nullable().optional(),
  creator_anonymous_user_id: z.string().uuid('Anonymous user ID must be a valid UUID').nullable().optional(),
  anti_cheat_enabled: z.boolean().default(false),
});

export type Tournament = z.infer<typeof tournamentSchema>;

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate player data and throw error if invalid
 * @throws {z.ZodError} if validation fails
 */
export function validatePlayer(data: unknown): Player {
  return playerSchema.parse(data);
}

/**
 * Validate team data and throw error if invalid
 * @throws {z.ZodError} if validation fails
 */
export function validateTeam(data: unknown): Team {
  return teamSchema.parse(data);
}

/**
 * Validate match data and throw error if invalid
 * @throws {z.ZodError} if validation fails
 */
export function validateMatch(data: unknown): Match {
  return matchSchema.parse(data);
}

/**
 * Validate league data and throw error if invalid
 * @throws {z.ZodError} if validation fails
 */
export function validateLeague(data: unknown): League {
  return leagueSchema.parse(data);
}

/**
 * Validate tournament data and throw error if invalid
 * @throws {z.ZodError} if validation fails
 */
export function validateTournament(data: unknown): Tournament {
  return tournamentSchema.parse(data);
}

// ============================================================================
// SAFE VALIDATION FUNCTIONS (don't throw, return result)
// ============================================================================

/**
 * Safely validate player data without throwing
 * @returns {success: true, data: Player} | {success: false, error: ZodError}
 */
export function safeValidatePlayer(data: unknown) {
  return playerSchema.safeParse(data);
}

/**
 * Safely validate team data without throwing
 * @returns {success: true, data: Team} | {success: false, error: ZodError}
 */
export function safeValidateTeam(data: unknown) {
  return teamSchema.safeParse(data);
}

/**
 * Safely validate match data without throwing
 * @returns {success: true, data: Match} | {success: false, error: ZodError}
 */
export function safeValidateMatch(data: unknown) {
  return matchSchema.safeParse(data);
}

/**
 * Safely validate league data without throwing
 * @returns {success: true, data: League} | {success: false, error: ZodError}
 */
export function safeValidateLeague(data: unknown) {
  return leagueSchema.safeParse(data);
}

/**
 * Safely validate tournament data without throwing
 * @returns {success: true, data: Tournament} | {success: false, error: ZodError}
 */
export function safeValidateTournament(data: unknown) {
  return tournamentSchema.safeParse(data);
}

// ============================================================================
// PARTIAL VALIDATION SCHEMAS (for updates)
// ============================================================================

export const partialPlayerSchema = playerSchema.partial();
export const partialMatchSchema = matchSchema.partial();
export const partialLeagueSchema = leagueSchema.partial();
export const partialTournamentSchema = tournamentSchema.partial();

// ============================================================================
// INPUT VALIDATION SCHEMAS (for forms)
// ============================================================================

/**
 * Schema for creating a new player (no ID required)
 */
export const createPlayerInputSchema = playerSchema.omit({ id: true });

/**
 * Schema for creating a new league (no ID, timestamps, or nested data)
 */
export const createLeagueInputSchema = leagueSchema.omit({
  id: true,
  createdAt: true,
  players: true,
  matches: true,
  tournaments: true,
});

/**
 * Schema for creating a new tournament (no ID, timestamp, or matches)
 */
export const createTournamentInputSchema = tournamentSchema.omit({
  id: true,
  createdAt: true,
  matches: true,
});

/**
 * Schema for creating a new match (no ID)
 */
export const createMatchInputSchema = matchSchema.omit({ id: true });
