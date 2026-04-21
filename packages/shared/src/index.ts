// Config
export { SPORTS, DEFAULT_SPORT_ID } from './config/sports';
export type { SportConfig } from './config/sports';

// Types
export type { Database } from './types/supabase';

// Validation & domain types
export {
  playerSchema,
  matchSchema,
  leagueSchema,
  tournamentSchema,
  createMatchInputSchema,
  createPlayerInputSchema,
  createLeagueInputSchema,
  createTournamentInputSchema,
  validatePlayer,
  validateMatch,
  validateLeague,
  validateTournament,
  safeValidatePlayer,
  safeValidateMatch,
  safeValidateLeague,
  safeValidateTournament,
} from './utils/validation';
export type { Player, Match, League, Tournament } from './utils/validation';

// Utils
export { parseQRData, extractCodeFromQR } from './utils/extractCodeFromQR';
export type { QRParseResult } from './utils/extractCodeFromQR';
export { getInitials } from './utils/string';
