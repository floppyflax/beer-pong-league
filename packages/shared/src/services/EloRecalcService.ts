/**
 * EloRecalcService — replays every ranked match attached to a league
 * to rebuild league_memberships ELO + elo_history.
 *
 * Triggered after admin edit/delete of a match (mig 021).
 *
 * Since mig 025, the replay logic lives server-side in the SECURITY
 * DEFINER function `recalculate_league_elo(p_league_id)`. This service
 * is now a thin RPC wrapper.
 */

import { sb } from './repositories/_base';

class EloRecalcService {
  async recalculateLeagueElo(
    leagueId: string,
  ): Promise<{ success: boolean; error?: string; matchesReplayed?: number }> {
    if (!sb) return { success: false, error: 'Supabase not configured' };

    try {
      const { data, error } = await sb.rpc('recalculate_league_elo', {
        p_league_id: leagueId,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      const replayed = typeof data === 'number' ? data : 0;
      return { success: true, matchesReplayed: replayed };
    } catch (err) {
      console.error('Error recalculating league ELO:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }
}

export const eloRecalcService = new EloRecalcService();
