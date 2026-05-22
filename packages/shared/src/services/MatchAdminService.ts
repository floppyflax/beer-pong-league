/**
 * MatchAdminService — admin edit/delete of recorded matches via the
 * `admin_update_match` / `admin_delete_match` RPCs (mig 021, realigned to the
 * events schema in mig 033 — they now return `event_id` + `league_id`).
 *
 * Match edits and deletes are followed by a mandatory ELO rebuild so stats
 * stay coherent. Since mig 023 events carry their OWN persistent ELO
 * (`event_memberships.elo`), so the caller must rebuild BOTH contexts when
 * applicable: `recalculateEventElo(eventId)` for the event bubble AND
 * `recalculateLeagueElo(leagueId)` for the league bubble (mig 032 added the
 * per-context recalc RPCs).
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
  /**
   * Same boundary translation as `MatchesRepository.resolveToPlayerIds`: the
   * call sites pass membership ids (event_memberships.id / league_memberships.id)
   * sourced from the React state, but `matches.team_*_player_ids` is
   * canonically players.id (see mig 022, mig 025). Translate before handing
   * off to the RPC so admin edits actually rewire ELO to the right players.
   */
  private async resolveToPlayerIds(
    matchId: string,
    membershipIds: string[],
  ): Promise<string[]> {
    const supabase = getSupabase();
    if (!supabase || membershipIds.length === 0) return membershipIds;
    type AnyClient = {
      from: (table: string) => {
        select: (cols: string) => {
          eq: (col: string, val: string) => unknown;
        };
      };
    };
    const q = supabase as unknown as AnyClient;
    const matchQuery = q.from('matches').select('event_id, league_id').eq('id', matchId) as {
      maybeSingle: () => Promise<{
        data: { event_id: string | null; league_id: string | null } | null;
      }>;
    };
    const { data: m } = await matchQuery.maybeSingle();
    if (!m) return membershipIds;
    const table = m.event_id ? 'event_memberships' : 'league_memberships';
    const ctxCol = m.event_id ? 'event_id' : 'league_id';
    const ctxVal = m.event_id ?? m.league_id;
    if (!ctxVal) return membershipIds;
    const membersQuery = q.from(table).select('id, player_id').eq(ctxCol, ctxVal) as {
      in: (
        col: string,
        vals: string[],
      ) => Promise<{ data: Array<{ id: string; player_id: string }> | null }>;
    };
    const { data: rows } = await membersQuery.in('id', membershipIds);
    if (!rows) return membershipIds;
    const map = new Map(rows.map((r) => [r.id, r.player_id] as const));
    return membershipIds.map((id) => map.get(id) ?? id);
  }

  async updateMatch(
    matchId: string,
    teamAPlayerIds: string[],
    teamBPlayerIds: string[],
    scoreA: number,
    scoreB: number,
    /** Resolved caller identity id — must match the event/league creator (mig 036). */
    callerUserId: string | null,
  ): Promise<{
    success: boolean;
    error?: string;
    leagueId?: string | null;
    eventId?: string | null;
  }> {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    try {
      const [resolvedA, resolvedB] = await Promise.all([
        this.resolveToPlayerIds(matchId, teamAPlayerIds),
        this.resolveToPlayerIds(matchId, teamBPlayerIds),
      ]);
      const rpc = supabase.rpc.bind(supabase) as unknown as Rpc;
      const { data, error } = await rpc('admin_update_match', {
        p_match_id: matchId,
        p_team_a_player_ids: resolvedA,
        p_team_b_player_ids: resolvedB,
        p_score_a: scoreA,
        p_score_b: scoreB,
        p_caller_user_id: callerUserId,
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
    /** Resolved caller identity id — must match the event/league creator (mig 036). */
    callerUserId: string | null,
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
        p_caller_user_id: callerUserId,
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
