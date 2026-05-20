/**
 * useLeagues — facade hook over useLeague() that exposes ONLY the
 * league-related concerns. Step 1 of the LeagueContext split (audit
 * plan §2.2): consumers can already migrate off the mega-`useLeague`
 * onto a focused hook; once enough call sites have migrated, the
 * underlying provider can be split into a dedicated LeaguesProvider
 * with its own state.
 *
 * Use this when a component cares about leagues only — creating,
 * updating, deleting, selecting, ranking. Don't reach for `useLeague`
 * for new code.
 */

import { useMemo } from 'react';
import { useLeague } from '../context/LeagueContext';

export const useLeagues = () => {
  const ctx = useLeague();
  return useMemo(
    () => ({
      leagues: ctx.leagues,
      currentLeague: ctx.currentLeague,
      isLoadingInitialData: ctx.isLoadingInitialData,
      loadError: ctx.loadError,
      createLeague: ctx.createLeague,
      updateLeague: ctx.updateLeague,
      deleteLeague: ctx.deleteLeague,
      selectLeague: ctx.selectLeague,
      getLeagueGlobalRanking: ctx.getLeagueGlobalRanking,
      // Lifecycle league (mig 028)
      pauseLeague: ctx.pauseLeague,
      resumeLeague: ctx.resumeLeague,
      finishLeague: ctx.finishLeague,
      reopenLeague: ctx.reopenLeague,
      startNewLeagueSeason: ctx.startNewLeagueSeason,
    }),
    [
      ctx.leagues,
      ctx.currentLeague,
      ctx.isLoadingInitialData,
      ctx.loadError,
      ctx.createLeague,
      ctx.updateLeague,
      ctx.deleteLeague,
      ctx.selectLeague,
      ctx.getLeagueGlobalRanking,
      ctx.pauseLeague,
      ctx.resumeLeague,
      ctx.finishLeague,
      ctx.reopenLeague,
      ctx.startNewLeagueSeason,
    ],
  );
};
