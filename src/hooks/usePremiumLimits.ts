import { useAuthContext } from '../context/AuthContext';
import { useLeague } from '../context/LeagueContext';

/**
 * Premium Limits Hook
 * 
 * Manages premium feature limits for tournaments and leagues
 * 
 * Free user limits:
 * - Tournaments: 2 active tournaments max
 * - Leagues: 1 active league max
 * 
 * Premium users: Unlimited
 * 
 * @returns Object with limit information and creation flags
 */

export interface PremiumLimitsResult {
  canCreateTournament: boolean;
  canCreateLeague: boolean;
  tournamentCount: number;
  leagueCount: number;
  limits: {
    tournaments: number;
    leagues: number;
  };
  isPremium: boolean;
  isAtTournamentLimit: boolean;
  isAtLeagueLimit: boolean;
}

export const usePremiumLimits = (): PremiumLimitsResult => {
  const { user } = useAuthContext();
  const { tournaments = [], leagues = [] } = useLeague();

  // Check premium status
  const isPremium = user?.user_metadata?.isPremium || false;

  // Count active tournaments and leagues
  const activeTournaments = tournaments.filter(t => !t.isFinished).length;
  const activeLeagues = leagues.filter(l => l.status === 'active').length;

  // Define limits
  const limits = {
    tournaments: isPremium ? Infinity : 2,
    leagues: isPremium ? Infinity : 1,
  };

  // Check if at limit
  const isAtTournamentLimit = activeTournaments >= limits.tournaments;
  const isAtLeagueLimit = activeLeagues >= limits.leagues;

  return {
    canCreateTournament: !isAtTournamentLimit,
    canCreateLeague: !isAtLeagueLimit,
    tournamentCount: activeTournaments,
    leagueCount: activeLeagues,
    limits,
    isPremium,
    isAtTournamentLimit,
    isAtLeagueLimit,
  };
};
