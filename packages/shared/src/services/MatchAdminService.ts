/**
 * MatchAdminService — admin edit/delete of recorded matches via mig 021 RPCs.
 *
 * Match edits and deletes are followed by a mandatory ELO rebuild
 * (`EloRecalcService.recalculateLeagueElo`) so league_players stats
 * stay coherent. Events without an associated league have no
 * persistent ELO, so the recalc is a no-op there.
 */

import { getSupabase } from '../lib/supabase';

interface RpcResult<T> {
  data: T | null;
  error: { message: string } | null;
}

type Rpc = (
  fn: string,
  params: Record<string, unknown>,
) => Promise<RpcResult<unknown>>;

class MatchAdminService {
  async updateMatch(
    matchId: string,
    teamAPlayerIds: string[],
    teamBPlayerIds: string[],
    scoreA: number,
    scoreB: number,
  ): Promise<{
    success: boolean;
    error?: string;
    leagueId?: string | null;
    eventId?: string | null;
  }> {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    try {
      const rpc = supabase.rpc.bind(supabase) as unknown as Rpc;
      const { data, error } = await rpc('admin_update_match', {
        p_match_id: matchId,
        p_team_a_player_ids: teamAPlayerIds,
        p_team_b_player_ids: teamBPlayerIds,
        p_score_a: scoreA,
        p_score_b: scoreB,
      });
      if (error) return { success: false, error: error.message };
      const result = data as { league_id?: string | null; event_id?: string | null } | null;
      return {
        success: true,
        leagueId: result?.league_id ?? null,
        eventId: result?.event_id ?? null,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }

  async deleteMatch(
    matchId: string,
  ): Promise<{
    success: boolean;
    error?: string;
    leagueId?: string | null;
    eventId?: string | null;
  }> {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    try {
      const rpc = supabase.rpc.bind(supabase) as unknown as Rpc;
      const { data, error } = await rpc('admin_delete_match', {
        p_match_id: matchId,
      });
      if (error) return { success: false, error: error.message };
      const result = data as { league_id?: string | null; event_id?: string | null } | null;
      return {
        success: true,
        leagueId: result?.league_id ?? null,
        eventId: result?.event_id ?? null,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }
}

export const matchAdminService = new MatchAdminService();
