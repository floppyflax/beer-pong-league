/**
 * Service for merging anonymous user identity to authenticated user
 * Handles the migration of all data from anonymous_user_id to user_id
 */

import { supabase } from '../lib/supabase';
// import type { LocalUser } from './LocalUserService'; // Unused
import { authService } from './AuthService';

class IdentityMergeService {
  /**
   * Merge anonymous user identity to authenticated user
   * This is called when a user claims their account
   * 
   * Uses atomic PostgreSQL function to ensure transactional integrity
   */
  async mergeAnonymousToUser(
    anonymousUserId: string,
    userId: string,
    pseudo: string
  ): Promise<{ success: boolean; error?: string; stats?: { leagues: number; tournaments: number; matches: number } }> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }
    
    try {
      // 1. Create user profile if doesn't exist
      const profile = await authService.getUserProfile(userId);
      if (!profile) {
        const created = await authService.createUserProfile(userId, pseudo);
        if (!created) {
          return { success: false, error: 'Failed to create user profile' };
        }
      }

      // 2. Call atomic merge function (all-or-nothing transaction)
      const { data, error: rpcError } = await supabase.rpc('merge_anonymous_identity', {
        p_anonymous_user_id: anonymousUserId,
        p_user_id: userId,
      });

      if (rpcError) {
        console.error('Error merging identity:', rpcError);
        return { success: false, error: rpcError.message };
      }

      // 3. Return success with stats
      return {
        success: true,
        stats: {
          leagues: data.leagues_migrated || 0,
          tournaments: data.tournaments_migrated || 0,
          matches: data.matches_migrated || 0,
        },
      };
    } catch (error) {
      console.error('Error merging identity:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async migrateLeaguePlayers(
    anonymousUserId: string,
    userId: string
  ): Promise<void> {
    if (!supabase) return;
    // Find all league_players with anonymous_user_id
    const { data: leaguePlayers } = await supabase
      .from('league_players')
      .select('*')
      .eq('anonymous_user_id', anonymousUserId);

    if (!leaguePlayers || leaguePlayers.length === 0) return;

    // Update each to use user_id instead
    for (const lp of leaguePlayers) {
      // Check if user already exists in this league
      const { data: existing } = await supabase
        .from('league_players')
        .select('id')
        .eq('league_id', lp.league_id)
        .eq('user_id', userId)
        .single();

      if (existing) {
        // User already in league, delete the anonymous entry
        await supabase
          .from('league_players')
          .delete()
          .eq('id', lp.id);
      } else {
        // Migrate to user_id
        await supabase
          .from('league_players')
          .update({
            user_id: userId,
            anonymous_user_id: null,
          })
          .eq('id', lp.id);
      }
    }
  }

  private async migrateTournamentPlayers(
    anonymousUserId: string,
    userId: string
  ): Promise<void> {
    if (!supabase) return;
    const { data: tournamentPlayers } = await supabase
      .from('tournament_players')
      .select('*')
      .eq('anonymous_user_id', anonymousUserId);

    if (!tournamentPlayers || tournamentPlayers.length === 0) return;

    for (const tp of tournamentPlayers) {
      const { data: existing } = await supabase
        .from('tournament_players')
        .select('id')
        .eq('tournament_id', tp.tournament_id)
        .eq('user_id', userId)
        .single();

      if (existing) {
        await supabase
          .from('tournament_players')
          .delete()
          .eq('id', tp.id);
      } else {
        await supabase
          .from('tournament_players')
          .update({
            user_id: userId,
            anonymous_user_id: null,
          })
          .eq('id', tp.id);
      }
    }
  }

  private async migrateMatches(
    anonymousUserId: string,
    userId: string
  ): Promise<void> {
    if (!supabase) return;
    // Get all matches and filter in memory (PostgreSQL array contains)
    const { data: allMatches } = await supabase
      .from('matches')
      .select('*');

    if (!allMatches || allMatches.length === 0) return;

    // Filter matches where anonymous_user_id appears in team arrays
    const matchesToUpdate = allMatches.filter(
      (match) =>
        match.team_a_player_ids.includes(anonymousUserId) ||
        match.team_b_player_ids.includes(anonymousUserId)
    );

    for (const match of matchesToUpdate) {
      const updatedTeamA = match.team_a_player_ids.map((id: string) =>
        id === anonymousUserId ? userId : id
      );
      const updatedTeamB = match.team_b_player_ids.map((id: string) =>
        id === anonymousUserId ? userId : id
      );

      await supabase
        .from('matches')
        .update({
          team_a_player_ids: updatedTeamA,
          team_b_player_ids: updatedTeamB,
        })
        .eq('id', match.id);
    }
  }

  private async migrateEloHistory(
    anonymousUserId: string,
    userId: string
  ): Promise<void> {
    if (!supabase) return;
    await supabase
      .from('elo_history')
      .update({
        user_id: userId,
        anonymous_user_id: null,
      })
      .eq('anonymous_user_id', anonymousUserId);
  }

  private async migrateCreators(
    anonymousUserId: string,
    userId: string
  ): Promise<void> {
    if (!supabase) return;
    // Migrate league creators
    await supabase
      .from('leagues')
      .update({
        creator_user_id: userId,
        creator_anonymous_user_id: null,
      })
      .eq('creator_anonymous_user_id', anonymousUserId);

    // Migrate tournament creators
    await supabase
      .from('tournaments')
      .update({
        creator_user_id: userId,
        creator_anonymous_user_id: null,
      })
      .eq('creator_anonymous_user_id', anonymousUserId);

    // Migrate match creators
    await supabase
      .from('matches')
      .update({
        created_by_user_id: userId,
        created_by_anonymous_user_id: null,
      })
      .eq('created_by_anonymous_user_id', anonymousUserId);
  }
}

export const identityMergeService = new IdentityMergeService();

