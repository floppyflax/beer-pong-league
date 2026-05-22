// Runtime — bootstrap API for apps (web / mobile)
export { initShared, onSharedInit } from './runtime/init';
export type { InitSharedOptions } from './runtime/init';
export { getEnv, hasEnv } from './runtime/env';
export type { RuntimeEnv, RuntimeUrls, RuntimeStripeConfig } from './runtime/env';
export { getStorage, hasStorage, storageFromLocalStorage } from './runtime/storage';
export type { KVStorage } from './runtime/storage';

// Supabase client (lazy)
export { getSupabase, isSupabaseAvailable } from './lib/supabase';
export type { AuthStorageAdapter } from './lib/supabase';

// Config
export { SPORTS, DEFAULT_SPORT_ID } from './config/sports';
export type { SportConfig } from './config/sports';

// Types
export type { Database, Json } from './types/supabase';

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

// Services
export { localUserService } from './services/LocalUserService';
export type { LocalUser } from './services/LocalUserService';
export { anonymousUserService } from './services/AnonymousUserService';
export type { AnonymousUserRow } from './services/AnonymousUserService';
export { authService } from './services/AuthService';
export { premiumService } from './services/PremiumService';
export type { CanCreateEventResult } from './services/PremiumService';
export { stripeService, createCheckoutSession, verifyPaymentSession, isStripeConfigured } from './services/StripeService';
export { identityMergeService } from './services/IdentityMergeService';

// Hooks
export { useAuth } from './hooks/useAuth';
export type { AuthState } from './hooks/useAuth';
export { useIdentity } from './hooks/useIdentity';
export type { IdentityState } from './hooks/useIdentity';
export { usePremium } from './hooks/usePremium';
export { useGlobalLeaderboard } from './hooks/useGlobalLeaderboard';
export type { LeaderboardEntry, LeaderboardSort } from './hooks/useGlobalLeaderboard';

// Contexts
export { AuthContext, AuthProvider, useAuthContext } from './contexts/AuthContext';
export type { AuthContextType } from './contexts/AuthContext';
export { IdentityContext, IdentityProvider, useIdentityContext } from './contexts/IdentityContext';
export type { IdentityContextType } from './contexts/IdentityContext';
export { SportContext, SportProvider, useSport } from './contexts/SportContext';
export type { SportContextValue } from './contexts/SportContext';

// Utils
export { parseQRData, extractCodeFromQR } from './utils/extractCodeFromQR';
export type { QRParseResult } from './utils/extractCodeFromQR';
export { getInitials } from './utils/string';
export { calculateEloChange } from './utils/elo';
export type { EloPlayer, EloContext } from './utils/elo';
