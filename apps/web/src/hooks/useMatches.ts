/**
 * useMatches — facade hook over useLeague() that exposes ONLY the
 * match-recording ops. Step 1 of the LeagueContext split (audit plan
 * §2.2).
 *
 * Use this from RecordMatch and any component that needs to log a
 * match. Note that since mig 025 (audit wave 2.1) the actual ELO
 * calculation runs server-side via the apply_match_elo RPC — this
 * hook still receives client-side eloChanges for the optimistic
 * preview update only.
 */

import { useMemo } from 'react';
import { useLeague } from '../context/LeagueContext';

export const useMatches = () => {
  const ctx = useLeague();
  return useMemo(
    () => ({
      recordMatch: ctx.recordMatch,
      recordEventMatch: ctx.recordEventMatch,
    }),
    [ctx.recordMatch, ctx.recordEventMatch],
  );
};
