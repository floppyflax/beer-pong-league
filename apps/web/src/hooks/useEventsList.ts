import { useMemo } from "react";
import { useLeague } from "../context/LeagueContext";

/**
 * Hook to get events list for current user
 *
 * Fetches all events the user has joined (as creator or participant).
 * Sorts by: Active first (by updated_at desc), then Finished (by end date desc)
 *
 * @returns Object with events data and loading state
 */
export const useEventsList = () => {
  const { events, isLoadingInitialData, loadError } = useLeague();

  // Filter and sort events for current user
  // Note: LeagueContext already filters events by user (creator or participant)
  const userEvents = useMemo(() => {
    if (!events || events.length === 0) {
      return [];
    }

    // Story 10.2 AC2: Sort by Active first (by last activity = updatedAt desc), then Finished (by updatedAt desc)
    return [...events].sort((a, b) => {
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
  }, [events]);

  return {
    events: userEvents,
    isLoading: isLoadingInitialData,
    loadError: loadError ?? null,
  };
};
