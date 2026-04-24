/**
 * MatchesRepository - Enregistre les matches (league + tournament) avec mise à jour
 * des stats ELO dans league_players et insertion dans elo_history.
 */

import type { Match } from '../../types';
import { BaseRepository, supabase } from './_base';
import { leaguesRepository } from './LeaguesRepository';
import { tournamentsRepository } from './TournamentsRepository';

interface LeaguePlayerStats {
  wins: number | null;
  losses: number | null;
  matches_played: number | null;
  streak: number | null;
}

class MatchesRepository extends BaseRepository {
  /**
   * Enregistre un match de league avec calcul ELO et historique
   */
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
      // Determine match format based on team sizes
      const format =
        match.teamA.length === 1 && match.teamB.length === 1
          ? '1v1'
          : match.teamA.length === 2 && match.teamB.length === 2
            ? '2v2'
            : '3v3';

      // Insert match
      const { error: matchError } = await supabase!
        .from('matches')
        .insert({
          id: match.id,
          league_id: leagueId,
          tournament_id: null,
          format,
          team_a_player_ids: match.teamA,
          team_b_player_ids: match.teamB,
          score_a: match.scoreA,
          score_b: match.scoreB,
          created_at: match.date,
          created_by_user_id: userId || match.created_by_user_id || null,
          created_by_anonymous_user_id:
            anonymousUserId || match.created_by_anonymous_user_id || null,
          cups_remaining: match.cups_remaining ?? null,
          photo_url: match.photo_url ?? null,
        });

      if (matchError) throw matchError;

      // Insert ELO history for each player
      const eloHistoryEntries = Object.entries(eloChanges).map(([_playerId, change]) => ({
        match_id: match.id,
        league_id: leagueId,
        tournament_id: null,
        // FUTURE WORK: Map player identity for ELO history tracking
        user_id: null,
        anonymous_user_id: null,
        elo_before: change.before,
        elo_after: change.after,
        elo_change: change.change,
      }));

      if (eloHistoryEntries.length > 0) {
        const { error: eloError } = await supabase!
          .from('elo_history')
          .insert(eloHistoryEntries);

        if (eloError) throw eloError;
      }

      // Update player stats in league_players
      for (const [playerId, change] of Object.entries(eloChanges)) {
        // Get current player stats
        const { data: playerData } = await supabase!
          .from('league_players')
          .select('wins, losses, matches_played, streak')
          .eq('id', playerId)
          .eq('league_id', leagueId)
          .single();

        if (playerData && !('code' in playerData)) {
          const player = playerData as unknown as LeaguePlayerStats;
          const isWinner = change.change > 0;
          const newWins = isWinner ? (player.wins || 0) + 1 : player.wins || 0;
          const newLosses = !isWinner ? (player.losses || 0) + 1 : player.losses || 0;
          const newStreak = isWinner
            ? (player.streak || 0) > 0
              ? (player.streak || 0) + 1
              : 1
            : (player.streak || 0) < 0
              ? (player.streak || 0) - 1
              : -1;

          await supabase!
            .from('league_players')
            .update({
              elo: change.after,
              wins: newWins,
              losses: newLosses,
              matches_played: (player.matches_played || 0) + 1,
              streak: newStreak,
            } as any)
            .eq('id', playerId)
            .eq('league_id', leagueId);
        }
      }

      // Update localStorage cache
      const leagues = leaguesRepository.loadLeaguesFromLocalStorage();
      const league = leagues.find((l) => l.id === leagueId);
      if (league) {
        league.matches.push(match);
        leaguesRepository.saveLeagueToLocalStorage(league);
      }
    } catch (error) {
      console.error('Error recording match in Supabase:', error);
      // Fallback vers localStorage
      const leagues = leaguesRepository.loadLeaguesFromLocalStorage();
      const league = leagues.find((l) => l.id === leagueId);
      if (league) {
        league.matches.push(match);
        leaguesRepository.saveLeagueToLocalStorage(league);
      }
    }
  }

  /**
   * Enregistre un match de tournament avec calcul ELO et historique
   */
  async recordTournamentMatch(
    tournamentId: string,
    match: Match,
    eloChanges: Record<string, { before: number; after: number; change: number }>,
    userId?: string | null,
    anonymousUserId?: string | null,
    tournamentPlayerIdToLeaguePlayerId?: Record<string, string>
  ): Promise<void> {
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
      // Get tournament to find league_id
      const { data: tournamentData } = await supabase!
        .from('tournaments')
        .select('league_id')
        .eq('id', tournamentId)
        .single();

      if (!tournamentData) throw new Error('Tournament not found');
      const tournamentInfo = tournamentData as { league_id: string | null };

      // Determine match format
      const format =
        match.teamA.length === 1 && match.teamB.length === 1
          ? '1v1'
          : match.teamA.length === 2 && match.teamB.length === 2
            ? '2v2'
            : '3v3';

      // Insert match
      const { error: matchError } = await supabase!
        .from('matches')
        .insert({
          id: match.id,
          league_id: tournamentInfo.league_id,
          tournament_id: tournamentId,
          format,
          team_a_player_ids: match.teamA,
          team_b_player_ids: match.teamB,
          score_a: match.scoreA,
          score_b: match.scoreB,
          created_at: match.date,
          created_by_user_id: userId || match.created_by_user_id || null,
          created_by_anonymous_user_id:
            anonymousUserId || match.created_by_anonymous_user_id || null,
          cups_remaining: match.cups_remaining ?? null,
          photo_url: match.photo_url ?? null,
        });

      if (matchError) throw matchError;

      // Insert ELO history
      const eloHistoryEntries = Object.entries(eloChanges).map(([_playerId, change]) => ({
        match_id: match.id,
        league_id: tournamentInfo.league_id,
        tournament_id: tournamentId,
        // FUTURE WORK: Map player identity for ELO history tracking in tournaments
        user_id: null,
        anonymous_user_id: null,
        elo_before: change.before,
        elo_after: change.after,
        elo_change: change.change,
      }));

      if (eloHistoryEntries.length > 0) {
        const { error: eloError } = await supabase!
          .from('elo_history')
          .insert(eloHistoryEntries);

        if (eloError) throw eloError;
      }

      // Update player stats in league_players (if tournament is linked to a league)
      if (tournamentInfo.league_id) {
        for (const [playerId, change] of Object.entries(eloChanges)) {
          const leaguePlayerId = tournamentPlayerIdToLeaguePlayerId?.[playerId] ?? playerId;
          const { data: playerData } = await supabase!
            .from('league_players')
            .select('wins, losses, matches_played, streak')
            .eq('id', leaguePlayerId)
            .eq('league_id', tournamentInfo.league_id)
            .single();

          if (playerData && !('code' in playerData)) {
            const player = playerData as unknown as LeaguePlayerStats;
            const isWinner = change.change > 0;
            const newWins = isWinner ? (player.wins || 0) + 1 : player.wins || 0;
            const newLosses = !isWinner ? (player.losses || 0) + 1 : player.losses || 0;
            const newStreak = isWinner
              ? (player.streak || 0) > 0
                ? (player.streak || 0) + 1
                : 1
              : (player.streak || 0) < 0
                ? (player.streak || 0) - 1
                : -1;

            await supabase!
              .from('league_players')
              .update({
                elo: change.after,
                wins: newWins,
                losses: newLosses,
                matches_played: (player.matches_played || 0) + 1,
                streak: newStreak,
              } as any)
              .eq('id', leaguePlayerId)
              .eq('league_id', tournamentInfo.league_id);
          }
        }
      }

      // Update localStorage cache
      const tournaments = tournamentsRepository.loadTournamentsFromLocalStorage();
      const tournament = tournaments.find((t) => t.id === tournamentId);
      if (tournament) {
        tournament.matches.push(match);
        tournamentsRepository.saveTournamentToLocalStorage(tournament);
      }
    } catch (error) {
      console.error('Error recording tournament match in Supabase:', error);
      // Fallback vers localStorage
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
