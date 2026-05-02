import { useAuthContext } from "../context/AuthContext";
import { useLeague } from "../context/LeagueContext";
import { useIdentity } from "./useIdentity";
import { usePremium } from "./usePremium";

/**
 * Premium Limits Hook
 *
 * Manages premium feature limits for events and leagues
 *
 * Free user limits:
 * - Events: 2 active events max
 * - Leagues: 0 (création réservée Premium)
 *
 * Premium users: Unlimited
 *
 * @returns Object with limit information and creation flags
 */

export interface PremiumLimitsResult {
  canCreateEvent: boolean;
  canCreateLeague: boolean;
  eventCount: number;
  leagueCount: number;
  limits: {
    events: number;
    leagues: number;
  };
  isPremium: boolean;
  isAtEventLimit: boolean;
  isAtLeagueLimit: boolean;
  isPremiumLoading: boolean;
  /** Call after payment success to refresh premium status */
  refetchPremium: () => void;
}

export const usePremiumLimits = (): PremiumLimitsResult => {
  const { user } = useAuthContext();
  const { localUser } = useIdentity();
  const { events = [], leagues = [] } = useLeague();
  const {
    isPremium,
    isLoading: isPremiumLoading,
    refetch: refetchPremium,
  } = usePremium(
    user?.id ?? null,
    localUser?.anonymousUserId ?? null,
  );

  // Count active events and leagues
  const activeEvents = events.filter((t) => !t.isFinished).length;
  const activeLeagues = leagues.filter(
    (l) => !("status" in l) || (l as { status?: string }).status === "active",
  ).length;

  // Define limits — la création de ligue est entièrement réservée aux Premium.
  const limits = {
    events: isPremium ? Infinity : 2,
    leagues: isPremium ? Infinity : 0,
  };

  // Check if at limit
  const isAtEventLimit = activeEvents >= limits.events;
  const isAtLeagueLimit = activeLeagues >= limits.leagues;

  return {
    canCreateEvent: !isAtEventLimit,
    canCreateLeague: !isAtLeagueLimit,
    eventCount: activeEvents,
    leagueCount: activeLeagues,
    limits,
    isPremium,
    isAtEventLimit,
    isAtLeagueLimit,
    isPremiumLoading,
    refetchPremium,
  };
};
