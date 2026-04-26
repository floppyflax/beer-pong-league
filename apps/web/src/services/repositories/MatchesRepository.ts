/**
 * MatchesRepository — enregistre les matches (mig 022).
 *
 * Depuis mig 022 : `matches.team_a/b_player_ids` référencent `players.id`
 * directement (plus de mapping tournament/league_player). Les stats vivent
 * dans `league_memberships` (pas de membership = pas de stats).
 *
 * Les eloChanges passés ici sont indexés par players.id.
 */

import type { Match } from '../../types';
import { BaseRepository, sb } from './_base';
import { leaguesRepository } from './LeaguesRepository';
import { tournamentsRepository } from './TournamentsRepository';

interface LeagueMembershipStats {
  wins: number | null;
  losses: number | null;
  matches_played: number | null;
  streak: number | null;
}

class MatchesRepository extends BaseRepository {
  async recordMatch(
    leagueId: string,
    match: Match,
    eloChanges: Record<string, { before: number; after: number; change: number }>,
    userId?: string | null,
    anonymousUserId?: string | null
  ): Promise<void> {
    if (!this.isSupabaseAvailable()) {
      const leagues = leaguesRepository.loadLeaguesFromLocalStorage();
      const league = leagues.find((l) => l.id === leagueId);
      if (league) {
        league.matches.push(match);
        leaguesRepository.saveLeagueToLocalStorage(league);
      }
      return;
    }

    try {
      const format =
        match.teamA.length === 1 && match.teamB.length === 1 ? '1v1'
        : match.teamA.length === 2 && match.teamB.length === 2 ? '2v2'
        : '3v3';

      const callerUserId = userId || anonymousUserId || null;

      const { error: matchError } = await sb!.from('matches').insert({
        id: match.id,
        league_id: leagueId,
        tournament_id: null,
        format,
        team_a_player_ids: match.teamA,
        team_b_player_ids: match.teamB,
        score_a: match.scoreA,
        score_b: match.scoreB,
        created_at: match.date,
        created_by_user_id: callerUserId,
        cups_remaining: match.cups_remaining ?? null,
        photo_url: match.photo_url ?? null,
      });
      if (matchError) throw matchError;

      // ELO history — match player_id directly.
      const eloHistoryEntries = Object.entries(eloChanges).map(([playerId, change]) => ({
        match_id: match.id,
        league_id: leagueId,
        tournament_id: null,
        player_id: playerId,
        elo_before: change.before,
        elo_after: change.after,
        elo_change: change.change,
      }));
      if (eloHistoryEntries.length > 0) {
        const { error: eloError } = await sb!.from('elo_history').insert(eloHistoryEntries);
        if (eloError) throw eloError;
      }

      // Update league_memberships stats keyed by player_id
      for (const [playerId, change] of Object.entries(eloChanges)) {
        const { data: lmRow } = await sb!
          .from('league_memberships')
          .select('wins, losses, matches_played, streak')
          .eq('league_id', leagueId)
          .eq('player_id', playerId)
          .maybeSingle();
        if (!lmRow) continue;
        const stats = lmRow as unknown as LeagueMembershipStats;
        const isWinner = change.change > 0;
        const newWins = isWinner ? (stats.wins || 0) + 1 : stats.wins || 0;
        const newLosses = !isWinner ? (stats.losses || 0) + 1 : stats.losses || 0;
        const newStreak = isWinner
          ? (stats.streak || 0) > 0 ? (stats.streak || 0) + 1 : 1
          : (stats.streak || 0) < 0 ? (stats.streak || 0) - 1 : -1;

        await sb!
          .from('league_memberships')
          .update({
            elo: change.after,
            wins: newWins,
            losses: newLosses,
            matches_played: (stats.matches_played || 0) + 1,
            streak: newStreak,
          } as never)
          .eq('league_id', leagueId)
          .eq('player_id', playerId);
      }

      // localStorage cache
      const leagues = leaguesRepository.loadLeaguesFromLocalStorage();
      const league = leagues.find((l) => l.id === leagueId);
      if (league) {
        league.matches.push(match);
        leaguesRepository.saveLeagueToLocalStorage(league);
      }
    } catch (error) {
      console.error('Error recording match in Supabase:', error);
      const leagues = leaguesRepository.loadLeaguesFromLocalStorage();
      const league = leagues.find((l) => l.id === leagueId);
      if (league) {
        league.matches.push(match);
        leaguesRepository.saveLeagueToLocalStorage(league);
      }
    }
  }

  /**
   * Tournament match. Records the match + per-context ELO history + per-context
   * stats updates. Mig 023.
   *
   * Two ELO contexts are tracked independently:
   *   - **Event ELO** (always) — `tournament_memberships.elo` updated from
   *     `eventEloChanges`. Written as `elo_history` rows with `tournament_id`
   *     set, `league_id` NULL.
   *   - **League ELO** (optional) — `league_memberships.elo` updated from
   *     `leagueEloChanges` when provided. Written as `elo_history` rows with
   *     `league_id` set, `tournament_id` NULL. The caller decides whether to
   *     propagate based on `tournaments.propagates_to_league_elo`.
   *
   * One match row is inserted (with both `tournament_id` and `league_id` so
   * it shows up in both contexts' match feeds), but the ELO history is
   * cleanly split per context — querying `elo_history` by either
   * `tournament_id` or `league_id` returns a single delta per player.
   */
  async recordTournamentMatch(
    tournamentId: string,
    match: Match,
    eventEloChanges: Record<string, { before: number; after: number; change: number }>,
    userId?: string | null,
    anonymousUserId?: string | null,
    leagueEloChanges?: Record<string, { before: number; after: number; change: number }>,
    /** @deprecated since mig 022. Ignored — match.teamA/teamB are already players.id. */
    _legacyMapping?: Record<string, string>
  ): Promise<void> {
    void _legacyMapping;
    if (!this.isSupabaseAvailable()) {
      const tournaments = tournamentsRepository.loadTournamentsFromLocalStorage();
      const tournament = tournaments.find((t) => t.id === tournamentId);
      if (tournament) {
        tournament.matches.push(match);
        tournamentsRepository.saveTournamentToLocalStorage(tournament);
      }
      return;
    }

    try {
      const { data: tData } = await sb!
        .from('tournaments')
        .select('league_id')
        .eq('id', tournamentId)
        .single();
      if (!tData) throw new Error('Tournament not found');
      const leagueId = (tData as { league_id: string | null }).league_id;

      const format =
        match.teamA.length === 1 && match.teamB.length === 1 ? '1v1'
        : match.teamA.length === 2 && match.teamB.length === 2 ? '2v2'
        : '3v3';

      const callerUserId = userId || anonymousUserId || null;

      // ── 1. Match row (one row, both context ids) ─────────────────────
      const { error: matchError } = await sb!.from('matches').insert({
        id: match.id,
        league_id: leagueId,
        tournament_id: tournamentId,
        format,
        team_a_player_ids: match.teamA,
        team_b_player_ids: match.teamB,
        score_a: match.scoreA,
        score_b: match.scoreB,
        created_at: match.date,
        created_by_user_id: callerUserId,
        cups_remaining: match.cups_remaining ?? null,
        photo_url: match.photo_url ?? null,
      });
      if (matchError) throw matchError;

      // ── 2. Event-context elo_history (tournament_id only) ────────────
      const eventHistoryRows = Object.entries(eventEloChanges).map(([playerId, change]) => ({
        match_id: match.id,
        league_id: null,
        tournament_id: tournamentId,
        player_id: playerId,
        elo_before: change.before,
        elo_after: change.after,
        elo_change: change.change,
      }));
      if (eventHistoryRows.length > 0) {
        const { error: ehErr } = await sb!.from('elo_history').insert(eventHistoryRows);
        if (ehErr) throw ehErr;
      }

      // ── 3. tournament_memberships ELO + stats update ─────────────────
      for (const [playerId, change] of Object.entries(eventEloChanges)) {
        const { data: tmRow } = await sb!
          .from('tournament_memberships')
          .select('wins, losses, matches_played, streak')
          .eq('tournament_id', tournamentId)
          .eq('player_id', playerId)
          .maybeSingle();
        if (!tmRow) continue;
        const stats = tmRow as unknown as LeagueMembershipStats;
        const isWinner = change.change > 0;
        const newWins = isWinner ? (stats.wins || 0) + 1 : stats.wins || 0;
        const newLosses = !isWinner ? (stats.losses || 0) + 1 : stats.losses || 0;
        const newStreak = isWinner
          ? (stats.streak || 0) > 0 ? (stats.streak || 0) + 1 : 1
          : (stats.streak || 0) < 0 ? (stats.streak || 0) - 1 : -1;

        await sb!
          .from('tournament_memberships')
          .update({
            elo: change.after,
            wins: newWins,
            losses: newLosses,
            matches_played: (stats.matches_played || 0) + 1,
            streak: newStreak,
          } as never)
          .eq('tournament_id', tournamentId)
          .eq('player_id', playerId);
      }

      // ── 4. League-context propagation (when caller provided deltas) ──
      if (leagueId && leagueEloChanges && Object.keys(leagueEloChanges).length > 0) {
        const leagueHistoryRows = Object.entries(leagueEloChanges).map(([playerId, change]) => ({
          match_id: match.id,
          league_id: leagueId,
          tournament_id: null,
          player_id: playerId,
          elo_before: change.before,
          elo_after: change.after,
          elo_change: change.change,
        }));
        const { error: lhErr } = await sb!.from('elo_history').insert(leagueHistoryRows);
        if (lhErr) throw lhErr;

        for (const [playerId, change] of Object.entries(leagueEloChanges)) {
          const { data: lmRow } = await sb!
            .from('league_memberships')
            .select('wins, losses, matches_played, streak')
            .eq('league_id', leagueId)
            .eq('player_id', playerId)
            .maybeSingle();
          if (!lmRow) continue;
          const stats = lmRow as unknown as LeagueMembershipStats;
          const isWinner = change.change > 0;
          const newWins = isWinner ? (stats.wins || 0) + 1 : stats.wins || 0;
          const newLosses = !isWinner ? (stats.losses || 0) + 1 : stats.losses || 0;
          const newStreak = isWinner
            ? (stats.streak || 0) > 0 ? (stats.streak || 0) + 1 : 1
            : (stats.streak || 0) < 0 ? (stats.streak || 0) - 1 : -1;

          await sb!
            .from('league_memberships')
            .update({
              elo: change.after,
              wins: newWins,
              losses: newLosses,
              matches_played: (stats.matches_played || 0) + 1,
              streak: newStreak,
            } as never)
            .eq('league_id', leagueId)
            .eq('player_id', playerId);
        }
      }

      const tournaments = tournamentsRepository.loadTournamentsFromLocalStorage();
      const tournament = tournaments.find((t) => t.id === tournamentId);
      if (tournament) {
        tournament.matches.push(match);
        tournamentsRepository.saveTournamentToLocalStorage(tournament);
      }
    } catch (error) {
      console.error('Error recording tournament match in Supabase:', error);
      const tournaments = tournamentsRepository.loadTournamentsFromLocalStorage();
      const tournament = tournaments.find((t) => t.id === tournamentId);
      if (tournament) {
        tournament.matches.push(match);
        tournamentsRepository.saveTournamentToLocalStorage(tournament);
      }
    }
  }
}

export const matchesRepository = new MatchesRepository();
