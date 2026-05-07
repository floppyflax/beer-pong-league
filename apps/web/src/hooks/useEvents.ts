/**
 * useEvents — facade hook over useLeague() that exposes ONLY the
 * event-related concerns. Step 1 of the LeagueContext split (audit
 * plan §2.2).
 *
 * Use this when a component cares about events only — creating, updating,
 * deleting, selecting, finishing, ranking, attaching to a league.
 *
 * Note: a `useEventsList()` hook already exists for the list/filter
 * concerns specifically (load + filter + premium gating). This hook
 * complements it by exposing the CRUD + selection ops.
 */

import { useMemo } from 'react';
import { useLeague } from '../context/LeagueContext';

export const useEvents = () => {
  const ctx = useLeague();
  return useMemo(
    () => ({
      events: ctx.events,
      currentEvent: ctx.currentEvent,
      isLoadingInitialData: ctx.isLoadingInitialData,
      loadError: ctx.loadError,
      createEvent: ctx.createEvent,
      updateEvent: ctx.updateEvent,
      deleteEvent: ctx.deleteEvent,
      selectEvent: ctx.selectEvent,
      toggleEventStatus: ctx.toggleEventStatus,
      associateEventToLeague: ctx.associateEventToLeague,
      getEventLocalRanking: ctx.getEventLocalRanking,
    }),
    [
      ctx.events,
      ctx.currentEvent,
      ctx.isLoadingInitialData,
      ctx.loadError,
      ctx.createEvent,
      ctx.updateEvent,
      ctx.deleteEvent,
      ctx.selectEvent,
      ctx.toggleEventStatus,
      ctx.associateEventToLeague,
      ctx.getEventLocalRanking,
    ],
  );
};
