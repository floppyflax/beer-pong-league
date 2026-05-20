import { useMemo } from 'react';
import { useLeague } from '../context/LeagueContext';
import { getLeagueLifecycle, type LeagueLifecycle } from '@/utils/leagueLifecycle';

export interface LeagueListItem {
  id: string;
  name: string;
  /** @deprecated Mig 028 — préfère `lifecycle`. Conservé pour compat (toujours `'active'`). */
  status: 'active' | 'finished';
  lifecycle: LeagueLifecycle;
  currentSeasonNumber: number;
  creator_user_id: string | null;
  creator_anonymous_user_id: string | null;
  createdAt: string;
  updatedAt: string;
  member_count: number;
  event_count: number;
}

/**
 * Hook to transform leagues data into list view format
 * 
 * Note: This hook does NOT fetch data - it transforms existing leagues from LeagueContext.
 * LeagueContext handles the actual data fetching from Supabase on app initialization.
 * 
 * Transforms leagues to list items with computed counts and applies sorting:
 * - Sorts by: Active first (by creation date desc), then Finished (by creation date desc)
 * 
 * KNOWN LIMITATIONS (requires database migrations):
 * - All leagues hardcoded as 'active' (leagues table has no status column)
 * - Sorts by createdAt instead of updatedAt (leagues table has no updated_at column)
 * - Last activity time shows creation date, not actual last activity
 * 
 * @returns Object with transformed leagues data and loading state
 */
export const useLeaguesList = () => {
  const { leagues, isLoadingInitialData } = useLeague();

  // Transform leagues to list items with counts
  // Note: LeagueContext already filters leagues by user (creator or member via league_players)
  const userLeagues = useMemo(() => {
    if (!leagues || leagues.length === 0) {
      return [];
    }

    // Transform to list items with computed fields
    const leagueItems: LeagueListItem[] = leagues.map(league => {
      const lifecycle = getLeagueLifecycle(league);
      return {
        id: league.id,
        name: league.name,
        // Legacy status field: 'finished' uniquement quand lifecycle === 'finished'.
        status: lifecycle === 'finished' ? 'finished' : 'active',
        lifecycle,
        currentSeasonNumber: league.currentSeasonNumber ?? 1,
        creator_user_id: league.creator_user_id || null,
        creator_anonymous_user_id: league.creator_anonymous_user_id || null,
        createdAt: league.createdAt,
        // LIMITATION: Using createdAt as updatedAt - leagues table needs updated_at column
        updatedAt: league.createdAt,
        // Count members: length of players array (Player[] objects)
        member_count: league.players?.length || 0,
        // Count events: length of events array (string[] of event IDs)
        event_count: league.events?.length || 0,
      };
    });

    // Story 10.3 AC2 (PARTIAL): Sort by status, then by date
    // NOTE: Currently sorts by createdAt (not updatedAt) because leagues.updated_at doesn't exist
    // This means "last activity" is actually "creation date" until database migration is done
    return [...leagueItems].sort((a, b) => {
      // First, separate by status (finished goes last)
      if (a.status !== b.status) {
        return a.status === 'finished' ? 1 : -1;
      }

      // Within same status, sort by date descending (most recent first)
      // LIMITATION: Using createdAt as proxy for "last activity" until updated_at column exists
      const dateA = new Date(a.updatedAt).getTime();
      const dateB = new Date(b.updatedAt).getTime();
      return dateB - dateA;
    });
  }, [leagues]);

  return {
    leagues: userLeagues,
    isLoading: isLoadingInitialData,
  };
};
