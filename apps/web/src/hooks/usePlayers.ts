/**
 * usePlayers — facade hook over useLeague() that exposes ONLY the
 * player-related ops. Step 1 of the LeagueContext split (audit plan
 * §2.2).
 *
 * Use this when a component manages players (add to a league, add to
 * an event, rename, delete, ghost / claimed flow).
 */

import { useMemo } from 'react';
import { useLeague } from '../context/LeagueContext';

export const usePlayers = () => {
  const ctx = useLeague();
  return useMemo(
    () => ({
      addPlayer: ctx.addPlayer,
      addPlayerToEvent: ctx.addPlayerToEvent,
      addAnonymousPlayerToEvent: ctx.addAnonymousPlayerToEvent,
      addGuestPlayerToEvent: ctx.addGuestPlayerToEvent,
      updatePlayer: ctx.updatePlayer,
      deletePlayer: ctx.deletePlayer,
    }),
    [
      ctx.addPlayer,
      ctx.addPlayerToEvent,
      ctx.addAnonymousPlayerToEvent,
      ctx.addGuestPlayerToEvent,
      ctx.updatePlayer,
      ctx.deletePlayer,
    ],
  );
};
