import { useMemo } from 'react';
import { useLeague } from '../context/LeagueContext';
import { useIdentity } from './useIdentity';
import type { Tournament } from '../types';

/**
 * Hook to get tournaments list for current user
 * 
 * Fetches all tournaments the user has joined (as creator or participant).
 * Sorts by: Active first (by updated_at desc), then Finished (by end date desc)
 * 
 * @returns Object with tournaments data and loading state
 */
export const useTournamentsList = () => {
  const { tournaments, isLoadingInitialData } = useLeague();

  // Filter and sort tournaments for current user
  // Note: LeagueContext already filters tournaments by user (creator or participant)
  const userTournaments = useMemo(() => {
    if (!tournaments || tournaments.length === 0) {
      return [];
    }

    // Story 10.2 AC2: Sort by Active first (by last activity = updatedAt desc), then Finished (by updatedAt desc)
    return [...tournaments].sort((a, b) => {
      // First, separate by isFinished status
      if (a.isFinished !== b.isFinished) {
        return a.isFinished ? 1 : -1; // Active (false) comes before Finished (true)
      }

      // Within same status, sort by updatedAt descending (most recent activity first)
      // Fallback to createdAt if updatedAt is not available
      const dateA = new Date(a.updatedAt || a.createdAt).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt).getTime();
      return dateB - dateA;
    });
  }, [tournaments]);

  return {
    tournaments: userTournaments,
    isLoading: isLoadingInitialData,
  };
};
