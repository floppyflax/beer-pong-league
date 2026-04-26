/**
 * EloRecalcService — replay all ranked matches of a league chronologically to
 * rebuild league_memberships ELO/wins/losses/streak/matches_played + elo_history.
 *
 * Triggered after admin edit/delete of a match (mig 021/022).
 *
 * Since mig 022, `matches.team_a/b_player_ids` reference `players.id`
 * directly, so the resolver is trivial: just look up the league_membership for
 * (leagueId, playerId).
 */

import { sb } from './repositories/_base';
import { calculateEloChange } from '../utils/elo';
import type { Player } from '../types';

interface MembershipState {
  player_id: string;
  elo: number;
  wins: number;
  losses: number;
  matchesPlayed: number;
  streak: number;
}

interface MatchRow {
  id: string;
  league_id: string | null;
  event_id: string | null;
  team_a_player_ids: string[];
  team_b_player_ids: string[];
  score_a: number;
  score_b: number;
  created_at: string;
}

interface LeagueMembershipRow {
  player_id: string;
}

class EloRecalcService {
  async recalculateLeagueElo(
    leagueId: string,
  ): Promise<{ success: boolean; error?: string; matchesReplayed?: number }> {
    if (!sb) return { success: false, error: 'Supabase not configured' };

    try {
      // 1. Reset all league_memberships in this league
      const { error: resetError } = await sb
        .from('league_memberships')
        .update({ elo: 1000, wins: 0, losses: 0, matches_played: 0, streak: 0 } as never)
        .eq('league_id', leagueId);
      if (resetError) throw resetError;

      // 2. Wipe elo_history for this league
      const { error: histError } = await sb
        .from('elo_history')
        .delete()
        .eq('league_id', leagueId);
      if (histError) throw histError;

      // 3. Load all memberships for this league (in-memory state)
      const { data: lmData, error: lmError } = await sb
        .from('league_memberships')
        .select('player_id')
        .eq('league_id', leagueId);
      if (lmError) throw lmError;

      const stateByPlayer = new Map<string, MembershipState>();
      for (const lm of (lmData ?? []) as LeagueMembershipRow[]) {
        stateByPlayer.set(lm.player_id, {
          player_id: lm.player_id,
          elo: 1000,
          wins: 0,
          losses: 0,
          matchesPlayed: 0,
          streak: 0,
        });
      }

      // 4. Load all matches in chrono order
      const { data: mData, error: mError } = await sb
        .from('matches')
        .select('id, league_id, event_id, team_a_player_ids, team_b_player_ids, score_a, score_b, created_at')
        .eq('league_id', leagueId)
        .order('created_at', { ascending: true });
      if (mError) throw mError;
      const matches = (mData ?? []) as unknown as MatchRow[];

      // 5. Replay
      const eloHistoryRows: Array<{
        match_id: string;
        league_id: string;
        event_id: string | null;
        player_id: string;
        elo_before: number;
        elo_after: number;
        elo_change: number;
      }> = [];

      let replayed = 0;
      for (const m of matches) {
        const teamA = m.team_a_player_ids
          .map((pid) => stateByPlayer.get(pid))
          .filter((s): s is MembershipState => s !== undefined);
        const teamB = m.team_b_player_ids
          .map((pid) => stateByPlayer.get(pid))
          .filter((s): s is MembershipState => s !== undefined);
        if (teamA.length === 0 || teamB.length === 0) continue;

        const toPlayer = (p: MembershipState): Player => ({
          id: p.player_id,
          name: '',
          elo: p.elo,
          wins: p.wins,
          losses: p.losses,
          matchesPlayed: p.matchesPlayed,
          streak: p.streak,
        });
        const winner: 'A' | 'B' = m.score_a > m.score_b ? 'A' : 'B';
        const newRatings = calculateEloChange(teamA.map(toPlayer), teamB.map(toPlayer), winner);

        for (const p of [...teamA, ...teamB]) {
          const before = p.elo;
          const after = newRatings[p.player_id] ?? before;
          const change = after - before;
          const isInTeamA = teamA.includes(p);
          const isWinner = (winner === 'A' && isInTeamA) || (winner === 'B' && !isInTeamA);

          p.elo = after;
          p.matchesPlayed += 1;
          if (isWinner) {
            p.wins += 1;
            p.streak = p.streak > 0 ? p.streak + 1 : 1;
          } else {
            p.losses += 1;
            p.streak = p.streak < 0 ? p.streak - 1 : -1;
          }

          eloHistoryRows.push({
            match_id: m.id,
            league_id: leagueId,
            event_id: m.event_id,
            player_id: p.player_id,
            elo_before: before,
            elo_after: after,
            elo_change: change,
          });
        }
        replayed += 1;
      }

      // 6. Persist final state
      for (const p of stateByPlayer.values()) {
        const { error: upError } = await sb
          .from('league_memberships')
          .update({
            elo: p.elo,
            wins: p.wins,
            losses: p.losses,
            matches_played: p.matchesPlayed,
            streak: p.streak,
          } as never)
          .eq('league_id', leagueId)
          .eq('player_id', p.player_id);
        if (upError) throw upError;
      }

      if (eloHistoryRows.length > 0) {
        const { error: insError } = await sb
          .from('elo_history')
          .insert(eloHistoryRows as never);
        if (insError) throw insError;
      }

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
