/**
 * EloRecalcService — replays every ranked match of a context to rebuild
 * its memberships ELO + elo_history.
 *
 * Triggered after admin edit/delete of a match (mig 021/033) and after
 * (de)associating an event to a league (mig 034).
 *
 * Since mig 025/032, the replay logic lives server-side in the SECURITY
 * DEFINER functions `recalculate_league_elo(p_league_id)` (league context)
 * and `recalculate_event_elo(p_event_id)` (event context, mig 032). This
 * service is a thin RPC wrapper around each.
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

  /**
   * Mirror of recalculateLeagueElo for the event context (mig 032). Wipes
   * event_memberships stats + event-context elo_history, then replays every
   * ranked match of the event in chrono order. Use after editing/deleting a
   * match recorded in an event so the event ELO bubble stays coherent —
   * independently of any league propagation.
   */
  async recalculateEventElo(
    eventId: string,
  ): Promise<{ success: boolean; error?: string; matchesReplayed?: number }> {
    if (!sb) return { success: false, error: 'Supabase not configured' };

    try {
      const { data, error } = await sb.rpc('recalculate_event_elo', {
        p_event_id: eventId,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      const replayed = typeof data === 'number' ? data : 0;
      return { success: true, matchesReplayed: replayed };
    } catch (err) {
      console.error('Error recalculating event ELO:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }
}

export const eloRecalcService = new EloRecalcService();
