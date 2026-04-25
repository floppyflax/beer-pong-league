/**
 * LeaguesRepository - Gère le CRUD des leagues (Supabase + fallback localStorage)
 */

import type { League, Player, Match } from '../../types';
import { safeValidateLeague } from '../../utils/validation';
import {
  BaseRepository,
  supabase,
  type LeagueRow,
  type LeaguePlayerRow,
  type MatchRow,
} from './_base';

class LeaguesRepository extends BaseRepository {
  /**
   * Charge toutes les leagues depuis Supabase
   * OPTIMIZED: Uses batch queries instead of N+1 pattern
   *
   * Loads leagues where the user is EITHER:
   * 1. The creator (creator_user_id or creator_anonymous_user_id)
   * 2. A member (via league_players table)
   */
  async loadLeagues(userId?: string, anonymousUserId?: string): Promise<League[]> {
    if (!this.isSupabaseAvailable()) {
      return this.loadLeaguesFromLocalStorage();
    }

    // SECURITY: If no user identity, return empty array (RLS will block anyway)
    if (!userId && !anonymousUserId) {
      console.log('🔒 No user identity - returning empty leagues list');
      return [];
    }

    try {
      // Step 1: Get all league IDs where user is creator OR member
      const leagueIds = new Set<string>();

      // Get leagues where user is creator
      let creatorQuery = supabase!.from('leagues').select('id');
      if (userId) {
        creatorQuery = creatorQuery.eq('creator_user_id', userId);
      } else if (anonymousUserId) {
        creatorQuery = creatorQuery.eq('creator_anonymous_user_id', anonymousUserId);
      }

      const { data: creatorLeagues, error: creatorError } = await creatorQuery;
      if (creatorError) throw creatorError;

      (creatorLeagues || []).forEach((l: { id: string }) => leagueIds.add(l.id));

      // Get leagues where user is a member
      let memberQuery = supabase!.from('league_players').select('league_id');
      if (userId) {
        memberQuery = memberQuery.eq('user_id', userId);
      } else if (anonymousUserId) {
        memberQuery = memberQuery.eq('anonymous_user_id', anonymousUserId);
      }

      const { data: memberLeagues, error: memberError } = await memberQuery;
      if (memberError) throw memberError;

      (memberLeagues || []).forEach((l: { league_id: string }) => leagueIds.add(l.league_id));

      // If no leagues found, return empty array
      if (leagueIds.size === 0) return [];

      // Step 2: Load full league data for all league IDs
      const { data: leaguesData, error: leaguesError } = await supabase!
        .from('leagues')
        .select('*')
        .in('id', Array.from(leagueIds));

      if (leaguesError) throw leaguesError;
      if (!leaguesData || leaguesData.length === 0) return [];

      // Convert Set to Array for batch queries
      const batchLeagueIds = (leaguesData as LeagueRow[]).map((l) => l.id);

      // Step 3: Batch load ALL players in one query
      const { data: allPlayersData, error: playersError } = await supabase!
        .from('league_players')
        .select('*')
        .in('league_id', batchLeagueIds);

      if (playersError) throw playersError;

      // Step 4: Batch load ALL matches in one query
      const { data: allMatchesData, error: matchesError } = await supabase!
        .from('matches')
        .select('*')
        .in('league_id', batchLeagueIds)
        .order('created_at', { ascending: false });

      if (matchesError) throw matchesError;

      // Step 5: Batch load ALL tournaments in one query
      const { data: allTournamentsData, error: tournamentsError } = await supabase!
        .from('tournaments')
        .select('id, league_id')
        .in('league_id', batchLeagueIds);

      if (tournamentsError) throw tournamentsError;

      // Step 6: Group data by league_id
      const playersByLeague = new Map<string, Player[]>();
      const matchesByLeague = new Map<string, Match[]>();
      const tournamentsByLeague = new Map<string, string[]>();

      // Group players
      ((allPlayersData || []) as LeaguePlayerRow[]).forEach((p) => {
        if (!playersByLeague.has(p.league_id)) {
          playersByLeague.set(p.league_id, []);
        }
        playersByLeague.get(p.league_id)!.push({
          id: p.id,
          name: p.pseudo_in_league,
          elo: p.elo || 1000,
          wins: p.wins || 0,
          losses: p.losses || 0,
          matchesPlayed: p.matches_played || 0,
          streak: p.streak || 0,
        });
      });

      // Group matches
      ((allMatchesData || []) as MatchRow[]).forEach((m) => {
        if (!m.league_id) return;
        if (!matchesByLeague.has(m.league_id)) {
          matchesByLeague.set(m.league_id, []);
        }
        matchesByLeague.get(m.league_id)!.push({
          id: m.id,
          date: m.created_at || new Date().toISOString(),
          teamA: m.team_a_player_ids || [],
          teamB: m.team_b_player_ids || [],
          scoreA: m.score_a || 0,
          scoreB: m.score_b || 0,
          created_by_user_id: m.created_by_user_id,
          created_by_anonymous_user_id: m.created_by_anonymous_user_id,
          status: (m.status as Match['status']) || 'confirmed',
          confirmed_by_user_id: m.confirmed_by_user_id,
          confirmed_by_anonymous_user_id: m.confirmed_by_anonymous_user_id,
          confirmed_at: m.confirmed_at,
          cups_remaining: m.cups_remaining ?? undefined,
          photo_url: m.photo_url ?? undefined,
        });
      });

      // Group tournaments
      ((allTournamentsData || []) as { id: string; league_id: string | null }[]).forEach((t) => {
        if (!t.league_id) return;
        if (!tournamentsByLeague.has(t.league_id)) {
          tournamentsByLeague.set(t.league_id, []);
        }
        tournamentsByLeague.get(t.league_id)!.push(t.id);
      });

      // Step 7: Build leagues with grouped data
      const leagues: League[] = (leaguesData as LeagueRow[]).map((leagueRow) => {
        return {
          id: leagueRow.id,
          name: leagueRow.name,
          type: leagueRow.type,
          createdAt: leagueRow.created_at || new Date().toISOString(),
          players: playersByLeague.get(leagueRow.id) || [],
          matches: matchesByLeague.get(leagueRow.id) || [],
          tournaments: tournamentsByLeague.get(leagueRow.id) || [],
          joinCode: leagueRow.join_code ?? undefined,
          creator_user_id: leagueRow.creator_user_id,
          creator_anonymous_user_id: leagueRow.creator_anonymous_user_id,
          anti_cheat_enabled: leagueRow.anti_cheat_enabled || false,
        };
      });

      console.log(`⚡ Loaded ${leagues.length} leagues with optimized batch queries`);
      return leagues;
    } catch (error) {
      console.error('Error loading leagues from Supabase:', error);
      return this.loadLeaguesFromLocalStorage();
    }
  }

  /**
   * Sauvegarde une league dans Supabase
   */
  async saveLeague(league: League): Promise<void> {
    // Validate league data before saving
    const validationResult = safeValidateLeague(league);
    if (!validationResult.success) {
      console.error('League validation failed:', validationResult.error.issues);
      throw new Error(
        `Invalid league data: ${validationResult.error.issues.map((i) => i.message).join(', ')}`
      );
    }

    if (!this.isSupabaseAvailable()) {
      this.saveLeagueToLocalStorage(league);
      return;
    }

    try {
      // Sauvegarder la league
      const { error: leagueError } = await supabase!
        .from('leagues')
        .upsert(
          {
            id: league.id,
            name: league.name,
            type: league.type,
            created_at: league.createdAt,
            join_code: league.joinCode ?? null,
            creator_user_id: league.creator_user_id,
            creator_anonymous_user_id: league.creator_anonymous_user_id,
            anti_cheat_enabled: league.anti_cheat_enabled || false,
          },
          {
            onConflict: 'id',
          }
        );

      if (leagueError) throw leagueError;

      // Sauvegarder les players
      if (league.players.length > 0) {
        const playersToInsert = league.players.map((player) => ({
          id: player.id,
          league_id: league.id,
          // FUTURE WORK: Map player identity (user_id or anonymous_user_id) from Player object
          // Currently, the Player type doesn't contain identity fields. This requires:
          // 1. Extending the Player interface to include identity information
          // 2. Or maintaining a separate identity mapping service
          user_id: null,
          anonymous_user_id: null,
          pseudo_in_league: player.name,
          elo: player.elo,
          wins: player.wins,
          losses: player.losses,
          matches_played: player.matchesPlayed,
          streak: player.streak,
        }));

        const { error: playersError } = await supabase!
          .from('league_players')
          .upsert(playersToInsert, {
            onConflict: 'id',
          });

        if (playersError) throw playersError;
      }

      // Sauvegarder les matches
      if (league.matches.length > 0) {
        const matchesToInsert = league.matches.map((match) => ({
          id: match.id,
          league_id: league.id,
          tournament_id: null,
          format: '2v2', // Default format
          team_a_player_ids: match.teamA,
          team_b_player_ids: match.teamB,
          score_a: match.scoreA,
          score_b: match.scoreB,
          created_at: match.date,
          created_by_user_id: match.created_by_user_id,
          created_by_anonymous_user_id: match.created_by_anonymous_user_id,
          status: match.status || 'confirmed',
          confirmed_by_user_id: match.confirmed_by_user_id || null,
          confirmed_by_anonymous_user_id: match.confirmed_by_anonymous_user_id || null,
          confirmed_at: match.confirmed_at || null,
          cups_remaining: match.cups_remaining ?? null,
          photo_url: match.photo_url ?? null,
        }));

        const { error: matchesError } = await supabase!
          .from('matches')
          .upsert(matchesToInsert, {
            onConflict: 'id',
          });

        if (matchesError) throw matchesError;
      }

      // Sauvegarder aussi dans localStorage comme cache
      this.saveLeagueToLocalStorage(league);
    } catch (error) {
      console.error('Error saving league to Supabase:', error);
      // Fallback vers localStorage
      this.saveLeagueToLocalStorage(league);
    }
  }

  /**
   * Supprime une league de Supabase
   */
  async deleteLeague(leagueId: string): Promise<void> {
    if (!this.isSupabaseAvailable()) {
      this.deleteLeagueFromLocalStorage(leagueId);
      return;
    }

    try {
      // Supprimer les matches
      await supabase!.from('matches').delete().eq('league_id', leagueId);

      // Supprimer les players
      await supabase!.from('league_players').delete().eq('league_id', leagueId);

      // Supprimer la league
      const { error } = await supabase!.from('leagues').delete().eq('id', leagueId);

      if (error) throw error;

      // Supprimer aussi de localStorage
      this.deleteLeagueFromLocalStorage(leagueId);
    } catch (error) {
      console.error('Error deleting league from Supabase:', error);
      // Fallback vers localStorage
      this.deleteLeagueFromLocalStorage(leagueId);
    }
  }

  /**
   * Met à jour une league dans Supabase
   */
  async updateLeague(leagueId: string, name: string, type: 'one-shot' | 'season'): Promise<void> {
    if (!this.isSupabaseAvailable()) {
      // Load from localStorage, update, save back
      const leagues = this.loadLeaguesFromLocalStorage();
      const league = leagues.find((l) => l.id === leagueId);
      if (league) {
        league.name = name;
        league.type = type;
        this.saveLeagueToLocalStorage(league);
      }
      return;
    }

    try {
      const { error } = await supabase!
        .from('leagues')
        .update({ name, type })
        .eq('id', leagueId);

      if (error) throw error;

      // Update localStorage cache
      const leagues = this.loadLeaguesFromLocalStorage();
      const league = leagues.find((l) => l.id === leagueId);
      if (league) {
        league.name = name;
        league.type = type;
        this.saveLeagueToLocalStorage(league);
      }
    } catch (error) {
      console.error('Error updating league in Supabase:', error);
      // Fallback vers localStorage
      const leagues = this.loadLeaguesFromLocalStorage();
      const league = leagues.find((l) => l.id === leagueId);
      if (league) {
        league.name = name;
        league.type = type;
        this.saveLeagueToLocalStorage(league);
      }
    }
  }

  /**
   * Retourne les infos basiques d'une league par ID (name).
   */
  async getLeagueById(leagueId: string): Promise<{ name: string } | null> {
    if (!this.isSupabaseAvailable()) return null;
    const { data } = await supabase!
      .from('leagues')
      .select('name')
      .eq('id', leagueId)
      .maybeSingle();
    return data as { name: string } | null;
  }

  /**
   * Migration 016 — check if a league join_code already exists.
   * Mirrors `tournamentCodeExists` so league code generation can collision-test.
   */
  async leagueCodeExists(joinCode: string): Promise<boolean> {
    if (!this.isSupabaseAvailable()) {
      return false; // Optimistic: assume code is unique if offline
    }

    try {
      const { data, error } = await supabase!
        .from('leagues')
        .select('id')
        .eq('join_code', joinCode)
        .maybeSingle();

      if (error) {
        console.error('Error checking league code:', error);
        return false;
      }

      return data !== null;
    } catch (error) {
      console.error('Error in leagueCodeExists:', error);
      return false;
    }
  }

  // ===== localStorage fallback =====

  loadLeaguesFromLocalStorage(): League[] {
    const saved = localStorage.getItem('bpl_leagues');
    return saved ? JSON.parse(saved) : [];
  }

  saveLeagueToLocalStorage(league: League): void {
    const leagues = this.loadLeaguesFromLocalStorage();
    const index = leagues.findIndex((l) => l.id === league.id);
    if (index >= 0) {
      leagues[index] = league;
    } else {
      leagues.push(league);
    }
    localStorage.setItem('bpl_leagues', JSON.stringify(leagues));
  }

  private deleteLeagueFromLocalStorage(leagueId: string): void {
    const leagues = this.loadLeaguesFromLocalStorage();
    const filtered = leagues.filter((l) => l.id !== leagueId);
    localStorage.setItem('bpl_leagues', JSON.stringify(filtered));
  }
}

export const leaguesRepository = new LeaguesRepository();
