/**
 * DatabaseService - Service de synchronisation avec Supabase
 * 
 * Gère la transformation entre le format app (imbriqué) et le format DB (normalisé)
 * et la synchronisation avec Supabase avec fallback localStorage
 */

import { supabase } from '../lib/supabase';
import type { League, Tournament, Player, Match } from '../types';
import { safeValidateLeague, safeValidateTournament } from '../utils/validation';

interface LeagueRow {
  id: string;
  name: string;
  type: 'event' | 'season';
  created_at: string;
  creator_user_id: string | null;
  creator_anonymous_user_id: string | null;
}

// Types removed - using 'any' with type assertions instead

interface TournamentRow {
  id: string;
  name: string;
  date: string;
  league_id: string | null;
  is_finished: boolean;
  created_at: string;
  creator_user_id: string | null;
  creator_anonymous_user_id: string | null;
  // Story 8.2 fields
  join_code?: string;
  format_type?: 'fixed' | 'free';
  team1_size?: number | null;
  team2_size?: number | null;
  max_players?: number;
  is_private?: boolean;
  status?: string;
  anti_cheat_enabled?: boolean;
  format?: string;
}

class DatabaseService {
  /**
   * Vérifie si Supabase est disponible
   */
  private isSupabaseAvailable(): boolean {
    return supabase !== null;
  }

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
      
      (creatorLeagues || []).forEach((l: any) => leagueIds.add(l.id));

      // Get leagues where user is a member
      let memberQuery = supabase!.from('league_players').select('league_id');
      if (userId) {
        memberQuery = memberQuery.eq('user_id', userId);
      } else if (anonymousUserId) {
        memberQuery = memberQuery.eq('anonymous_user_id', anonymousUserId);
      }

      const { data: memberLeagues, error: memberError } = await memberQuery;
      if (memberError) throw memberError;
      
      (memberLeagues || []).forEach((l: any) => leagueIds.add(l.league_id));

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
      const batchLeagueIds = leaguesData.map((l: any) => l.id);

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
      const { data: allTournamentsData, error: tournamentsError} = await supabase!
        .from('tournaments')
        .select('id, league_id')
        .in('league_id', batchLeagueIds);

      if (tournamentsError) throw tournamentsError;

      // Step 6: Group data by league_id
      const playersByLeague = new Map<string, Player[]>();
      const matchesByLeague = new Map<string, Match[]>();
      const tournamentsByLeague = new Map<string, string[]>();

      // Group players
      (allPlayersData || []).forEach((p: any) => {
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
      (allMatchesData || []).forEach((m: any) => {
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
          status: m.status || 'confirmed',
          confirmed_by_user_id: m.confirmed_by_user_id,
          confirmed_by_anonymous_user_id: m.confirmed_by_anonymous_user_id,
          confirmed_at: m.confirmed_at,
          cups_remaining: m.cups_remaining ?? undefined,
          photo_url: m.photo_url ?? undefined,
        });
      });

      // Group tournaments
      (allTournamentsData || []).forEach((t: any) => {
        if (!tournamentsByLeague.has(t.league_id)) {
          tournamentsByLeague.set(t.league_id, []);
        }
        tournamentsByLeague.get(t.league_id)!.push(t.id);
      });

      // Step 7: Build leagues with grouped data
      const leagues: League[] = leaguesData.map((leagueRow: any) => {
        return {
          id: leagueRow.id,
          name: leagueRow.name,
          type: leagueRow.type as 'event' | 'season',
          createdAt: leagueRow.created_at || new Date().toISOString(),
          players: playersByLeague.get(leagueRow.id) || [],
          matches: matchesByLeague.get(leagueRow.id) || [],
          tournaments: tournamentsByLeague.get(leagueRow.id) || [],
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
   * Charge toutes les tournaments depuis Supabase
   * OPTIMIZED: Uses batch queries instead of N+1 pattern
   * 
   * Loads tournaments where the user is EITHER:
   * 1. The creator (creator_user_id or creator_anonymous_user_id)
   * 2. A participant (via tournament_players table)
   */
  async loadTournaments(userId?: string, anonymousUserId?: string): Promise<Tournament[]> {
    if (!this.isSupabaseAvailable()) {
      return this.loadTournamentsFromLocalStorage();
    }

    // SECURITY: If no user identity, return empty array (RLS will block anyway)
    if (!userId && !anonymousUserId) {
      console.log('🔒 No user identity - returning empty tournaments list');
      return [];
    }

    try {
      // Step 1: Get tournament IDs where user is creator OR participant
      let tournamentIds: string[] = [];

      // Get tournaments where user is creator
      let creatorQuery = supabase!.from('tournaments').select('id');
      if (userId) {
        creatorQuery = creatorQuery.eq('creator_user_id', userId);
      } else if (anonymousUserId) {
        creatorQuery = creatorQuery.eq('creator_anonymous_user_id', anonymousUserId);
      }
      const { data: creatorTournaments, error: creatorError } = await creatorQuery;
      if (creatorError) throw creatorError;

      // Get tournaments where user is participant
      let participantQuery = supabase!.from('tournament_players').select('tournament_id');
      if (userId) {
        participantQuery = participantQuery.eq('user_id', userId);
      } else if (anonymousUserId) {
        participantQuery = participantQuery.eq('anonymous_user_id', anonymousUserId);
      }
      const { data: participantTournaments, error: participantError } = await participantQuery;
      if (participantError) throw participantError;

      // Combine and deduplicate tournament IDs
      const creatorIds = (creatorTournaments || []).map(t => t.id);
      const participantIds = (participantTournaments || []).map(t => t.tournament_id);
      tournamentIds = [...new Set([...creatorIds, ...participantIds])];

      if (tournamentIds.length === 0) {
        console.log('🏆 No tournaments found for user (neither creator nor participant)');
        return [];
      }

      // Step 2: Load full tournament data for all relevant tournaments
      const { data: tournamentsData, error: tournamentsError } = await supabase!
        .from('tournaments')
        .select('*')
        .in('id', tournamentIds);

      if (tournamentsError) throw tournamentsError;
      if (!tournamentsData || tournamentsData.length === 0) return [];

      // Step 3: Batch load ALL tournament players in one query
      const { data: allPlayersData, error: playersError } = await supabase!
        .from('tournament_players')
        .select('id, user_id, anonymous_user_id, tournament_id')
        .in('tournament_id', tournamentIds);

      if (playersError) throw playersError;

      // Step 4: Batch load ALL matches in one query
      const { data: allMatchesData, error: matchesError } = await supabase!
        .from('matches')
        .select('*')
        .in('tournament_id', tournamentIds)
        .order('created_at', { ascending: false });

      if (matchesError) throw matchesError;

      // Step 5: Group data by tournament_id
      const playersByTournament = new Map<string, string[]>();
      const matchesByTournament = new Map<string, Match[]>();

      // Group players
      (allPlayersData || []).forEach((p: any) => {
        if (!playersByTournament.has(p.tournament_id)) {
          playersByTournament.set(p.tournament_id, []);
        }
        playersByTournament.get(p.tournament_id)!.push(p.id);
      });

      // Group matches
      (allMatchesData || []).forEach((m: any) => {
        if (!matchesByTournament.has(m.tournament_id)) {
          matchesByTournament.set(m.tournament_id, []);
        }
        matchesByTournament.get(m.tournament_id)!.push({
          id: m.id,
          date: m.created_at || new Date().toISOString(),
          teamA: m.team_a_player_ids || [],
          teamB: m.team_b_player_ids || [],
          scoreA: m.score_a || 0,
          scoreB: m.score_b || 0,
          created_by_user_id: m.created_by_user_id,
          created_by_anonymous_user_id: m.created_by_anonymous_user_id,
          status: m.status || 'confirmed',
          confirmed_by_user_id: m.confirmed_by_user_id,
          confirmed_by_anonymous_user_id: m.confirmed_by_anonymous_user_id,
          confirmed_at: m.confirmed_at,
          cups_remaining: m.cups_remaining ?? undefined,
          photo_url: m.photo_url ?? undefined,
        });
      });

      // Step 6: Build tournaments with grouped data
      const tournaments: Tournament[] = tournamentsData.map((tournamentRow: any) => {
        const playerIds = playersByTournament.get(tournamentRow.id) || [];
        const matches = matchesByTournament.get(tournamentRow.id) || [];

        return {
          id: tournamentRow.id,
          name: tournamentRow.name,
          date: tournamentRow.date,
          format: tournamentRow.format || '2v2',
          location: tournamentRow.location,
          leagueId: tournamentRow.league_id,
          createdAt: tournamentRow.created_at || new Date().toISOString(),
          updatedAt: tournamentRow.updated_at || tournamentRow.created_at, // Story 10.2: Last activity time
          playerIds,
          matches,
          isFinished: tournamentRow.is_finished || false,
          creator_user_id: tournamentRow.creator_user_id,
          creator_anonymous_user_id: tournamentRow.creator_anonymous_user_id,
          anti_cheat_enabled: tournamentRow.anti_cheat_enabled || false,
          // Story 8.2 fields
          joinCode: tournamentRow.join_code,
          formatType: tournamentRow.format_type,
          team1Size: tournamentRow.team1_size,
          team2Size: tournamentRow.team2_size,
          maxPlayers: tournamentRow.max_players,
          isPrivate: tournamentRow.is_private,
          status: tournamentRow.status as 'active' | 'finished' | 'cancelled' | undefined,
        };
      });

      console.log(`⚡ Loaded ${tournaments.length} tournaments with optimized batch queries`);
      
      return tournaments;
    } catch (error) {
      console.error('Error loading tournaments from Supabase:', error);
      return this.loadTournamentsFromLocalStorage();
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
      throw new Error(`Invalid league data: ${validationResult.error.issues.map(i => i.message).join(', ')}`);
    }

    if (!this.isSupabaseAvailable()) {
      this.saveLeagueToLocalStorage(league);
      return;
    }

    try {
      // Sauvegarder la league
      const { error: leagueError } = await supabase!
        .from('leagues')
        .upsert({
          id: league.id,
          name: league.name,
          type: league.type,
          created_at: league.createdAt,
          creator_user_id: league.creator_user_id,
          creator_anonymous_user_id: league.creator_anonymous_user_id,
          anti_cheat_enabled: league.anti_cheat_enabled || false,
        }, {
          onConflict: 'id'
        });

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
            onConflict: 'id'
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
            onConflict: 'id'
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
   * Sauvegarde un tournament dans Supabase
   */
  async saveTournament(tournament: Tournament): Promise<void> {
    // Validate tournament data before saving
    const validationResult = safeValidateTournament(tournament);
    if (!validationResult.success) {
      console.error('Tournament validation failed:', validationResult.error.issues);
      throw new Error(`Invalid tournament data: ${validationResult.error.issues.map(i => i.message).join(', ')}`);
    }

    if (!this.isSupabaseAvailable()) {
      this.saveTournamentToLocalStorage(tournament);
      return;
    }

    try {
      // Sauvegarder le tournament
      const { error: tournamentError } = await supabase!
        .from('tournaments')
        .upsert({
          id: tournament.id,
          name: tournament.name,
          date: tournament.date,
          format: tournament.format,
          location: tournament.location || null,
          league_id: tournament.leagueId,
          is_finished: tournament.isFinished,
          created_at: tournament.createdAt,
          creator_user_id: tournament.creator_user_id,
          creator_anonymous_user_id: tournament.creator_anonymous_user_id,
          anti_cheat_enabled: tournament.anti_cheat_enabled || false,
        }, {
          onConflict: 'id'
        });

      if (tournamentError) throw tournamentError;

      // Sauvegarder les matches
      if (tournament.matches.length > 0) {
        const matchesToInsert = tournament.matches.map((match) => ({
          id: match.id,
          league_id: tournament.leagueId,
          tournament_id: tournament.id,
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
            onConflict: 'id'
          });

        if (matchesError) throw matchesError;
      }

      // Sauvegarder aussi dans localStorage comme cache
      this.saveTournamentToLocalStorage(tournament);
    } catch (error) {
      console.error('Error saving tournament to Supabase:', error);
      // Fallback vers localStorage
      this.saveTournamentToLocalStorage(tournament);
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
   * Supprime un tournament de Supabase
   */
  async deleteTournament(tournamentId: string): Promise<void> {
    if (!this.isSupabaseAvailable()) {
      this.deleteTournamentFromLocalStorage(tournamentId);
      return;
    }

    try {
      // Supprimer les matches
      await supabase!.from('matches').delete().eq('tournament_id', tournamentId);
      
      // Supprimer les players
      await supabase!.from('tournament_players').delete().eq('tournament_id', tournamentId);
      
      // Supprimer le tournament
      const { error } = await supabase!.from('tournaments').delete().eq('id', tournamentId);
      
      if (error) throw error;

      // Supprimer aussi de localStorage
      this.deleteTournamentFromLocalStorage(tournamentId);
    } catch (error) {
      console.error('Error deleting tournament from Supabase:', error);
      // Fallback vers localStorage
      this.deleteTournamentFromLocalStorage(tournamentId);
    }
  }

  /**
   * Met à jour une league dans Supabase
   */
  async updateLeague(leagueId: string, name: string, type: 'event' | 'season'): Promise<void> {
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
   * Met à jour un tournament dans Supabase
   */
  async updateTournament(
    tournamentId: string,
    name: string,
    date: string,
    antiCheatEnabled?: boolean,
    format?: '1v1' | '2v2' | '3v3' | 'libre'
  ): Promise<void> {
    if (!this.isSupabaseAvailable()) {
      const tournaments = this.loadTournamentsFromLocalStorage();
      const tournament = tournaments.find((t) => t.id === tournamentId);
      if (tournament) {
        tournament.name = name;
        tournament.date = date;
        if (antiCheatEnabled !== undefined) {
          tournament.anti_cheat_enabled = antiCheatEnabled;
        }
        if (format !== undefined) {
          tournament.format = format;
        }
        this.saveTournamentToLocalStorage(tournament);
      }
      return;
    }

    try {
      const updates: any = { name, date };
      if (antiCheatEnabled !== undefined) {
        updates.anti_cheat_enabled = antiCheatEnabled;
      }
      if (format !== undefined) {
        updates.format = format;
      }
      
      const { error } = await supabase!
        .from('tournaments')
        .update(updates)
        .eq('id', tournamentId);

      if (error) throw error;

      // Update localStorage cache
      const tournaments = this.loadTournamentsFromLocalStorage();
      const tournament = tournaments.find((t) => t.id === tournamentId);
      if (tournament) {
        tournament.name = name;
        tournament.date = date;
        if (antiCheatEnabled !== undefined) {
          tournament.anti_cheat_enabled = antiCheatEnabled;
        }
        if (format !== undefined) {
          tournament.format = format;
        }
        this.saveTournamentToLocalStorage(tournament);
      }
    } catch (error) {
      console.error('Error updating tournament in Supabase:', error);
      // Fallback vers localStorage
      const tournaments = this.loadTournamentsFromLocalStorage();
      const tournament = tournaments.find((t) => t.id === tournamentId);
      if (tournament) {
        tournament.name = name;
        tournament.date = date;
        if (antiCheatEnabled !== undefined) {
          tournament.anti_cheat_enabled = antiCheatEnabled;
        }
        if (format !== undefined) {
          tournament.format = format;
        }
        this.saveTournamentToLocalStorage(tournament);
      }
    }
  }

  /**
   * Change le statut is_finished d'un tournament
   */
  async toggleTournamentStatus(tournamentId: string, isFinished: boolean): Promise<void> {
    if (!this.isSupabaseAvailable()) {
      const tournaments = this.loadTournamentsFromLocalStorage();
      const tournament = tournaments.find((t) => t.id === tournamentId);
      if (tournament) {
        tournament.isFinished = isFinished;
        this.saveTournamentToLocalStorage(tournament);
      }
      return;
    }

    try {
      const { error } = await supabase!
        .from('tournaments')
        .update({ is_finished: isFinished })
        .eq('id', tournamentId);

      if (error) throw error;

      // Update localStorage cache
      const tournaments = this.loadTournamentsFromLocalStorage();
      const tournament = tournaments.find((t) => t.id === tournamentId);
      if (tournament) {
        tournament.isFinished = isFinished;
        this.saveTournamentToLocalStorage(tournament);
      }
    } catch (error) {
      console.error('Error toggling tournament status in Supabase:', error);
      // Fallback vers localStorage
      const tournaments = this.loadTournamentsFromLocalStorage();
      const tournament = tournaments.find((t) => t.id === tournamentId);
      if (tournament) {
        tournament.isFinished = isFinished;
        this.saveTournamentToLocalStorage(tournament);
      }
    }
  }

  /**
   * Ajoute un joueur à une league
   */
  async addPlayerToLeague(
    leagueId: string,
    player: Player,
    userId?: string | null,
    anonymousUserId?: string | null
  ): Promise<void> {
    if (!this.isSupabaseAvailable()) {
      const leagues = this.loadLeaguesFromLocalStorage();
      const league = leagues.find((l) => l.id === leagueId);
      if (league) {
        league.players.push(player);
        this.saveLeagueToLocalStorage(league);
      }
      return;
    }

    try {
      const { error } = await supabase!
        .from('league_players')
        .insert({
          id: player.id,
          league_id: leagueId,
          user_id: userId || null,
          anonymous_user_id: anonymousUserId || null,
          pseudo_in_league: player.name,
          elo: player.elo,
          wins: player.wins,
          losses: player.losses,
          matches_played: player.matchesPlayed,
          streak: player.streak,
        });

      if (error) throw error;

      // Update localStorage cache
      const leagues = this.loadLeaguesFromLocalStorage();
      const league = leagues.find((l) => l.id === leagueId);
      if (league && !league.players.find((p) => p.id === player.id)) {
        league.players.push(player);
        this.saveLeagueToLocalStorage(league);
      }
    } catch (error) {
      console.error('Error adding player to league in Supabase:', error);
      // Fallback vers localStorage
      const leagues = this.loadLeaguesFromLocalStorage();
      const league = leagues.find((l) => l.id === leagueId);
      if (league && !league.players.find((p) => p.id === player.id)) {
        league.players.push(player);
        this.saveLeagueToLocalStorage(league);
      }
    }
  }

  /**
   * Charge un joueur par ID (league_players ou tournament_players).
   * Utilisé par PlayerProfile quand le joueur n'est pas dans le contexte (ex: autre joueur d'un tournoi).
   */
  async loadPlayerById(playerId: string): Promise<{
    player: Player;
    leagueId?: string;
    leagueName?: string;
    tournamentId?: string;
  } | null> {
    if (!this.isSupabaseAvailable()) return null;

    try {
      // 1. Essayer league_players
      const { data: lpData } = await supabase!
        .from('league_players')
        .select('id, league_id, pseudo_in_league, elo, wins, losses, matches_played')
        .eq('id', playerId)
        .maybeSingle();

      if (lpData) {
        const lp = lpData as { id: string; league_id: string; pseudo_in_league: string; elo?: number; wins?: number; losses?: number; matches_played?: number };
        const league = await this.getLeagueById(lp.league_id);
        return {
          player: {
            id: lp.id,
            name: lp.pseudo_in_league || 'Joueur',
            elo: lp.elo || 1000,
            wins: lp.wins || 0,
            losses: lp.losses || 0,
            matchesPlayed: lp.matches_played || 0,
            streak: 0,
          },
          leagueId: lp.league_id,
          leagueName: league?.name,
        };
      }

      // 2. Essayer tournament_players
      const { data: tpData } = await supabase!
        .from('tournament_players')
        .select(`
          id,
          pseudo_in_tournament,
          tournament_id,
          user_id,
          anonymous_user_id,
          user:users ( pseudo ),
          anonymous_user:anonymous_users ( pseudo )
        `)
        .eq('id', playerId)
        .maybeSingle();

      if (tpData) {
        const name = (tpData as any).pseudo_in_tournament
          || (tpData as any).user?.pseudo
          || (tpData as any).anonymous_user?.pseudo
          || 'Joueur';

        // Essayer de récupérer les stats league si le tournoi a une league
        const { data: tData } = await supabase!
          .from('tournaments')
          .select('league_id')
          .eq('id', (tpData as any).tournament_id)
          .single();

        let elo = 1500;
        let wins = 0;
        let losses = 0;
        let matchesPlayed = 0;

        if (tData?.league_id) {
          let lpResult: { data: { elo: number; wins: number; losses: number; matches_played: number } | null } = { data: null };
          if ((tpData as any).user_id) {
            lpResult = await supabase!
              .from('league_players')
              .select('elo, wins, losses, matches_played')
              .eq('league_id', tData.league_id)
              .eq('user_id', (tpData as any).user_id)
              .maybeSingle();
          } else if ((tpData as any).anonymous_user_id) {
            lpResult = await supabase!
              .from('league_players')
              .select('elo, wins, losses, matches_played')
              .eq('league_id', tData.league_id)
              .eq('anonymous_user_id', (tpData as any).anonymous_user_id)
              .maybeSingle();
          }

          if (lpResult?.data) {
            elo = lpResult.data.elo || 1500;
            wins = lpResult.data.wins || 0;
            losses = lpResult.data.losses || 0;
            matchesPlayed = lpResult.data.matches_played || 0;
          }
        }

        const leagueId = tData?.league_id ?? undefined;
        const league = leagueId ? await this.getLeagueById(leagueId) : null;
        return {
          player: {
            id: (tpData as any).id,
            name,
            elo,
            wins,
            losses,
            matchesPlayed,
            streak: 0,
          },
          leagueId,
          leagueName: league?.name,
          tournamentId: (tpData as any).tournament_id,
        };
      }

      return null;
    } catch (error) {
      console.error('Error loading player by ID:', error);
      return null;
    }
  }

  private async getLeagueById(leagueId: string): Promise<{ name: string } | null> {
    if (!this.isSupabaseAvailable()) return null;
    const { data } = await supabase!
      .from('leagues')
      .select('name')
      .eq('id', leagueId)
      .maybeSingle();
    return data as { name: string } | null;
  }

  /**
   * Charge les participants d'un tournament depuis tournament_players
   */
  async loadTournamentParticipants(tournamentId: string): Promise<{
    id: string;
    leaguePlayerId?: string;
    name: string;
    elo: number;
    matchesPlayed: number;
    wins: number;
    losses: number;
    joinedAt: string;
  }[]> {
    if (!this.isSupabaseAvailable()) {
      // Fallback to localStorage - get tournament and league data
      const tournaments = this.loadTournamentsFromLocalStorage();
      const tournament = tournaments.find(t => t.id === tournamentId);
      if (!tournament || !tournament.leagueId) return [];

      const leagues = this.loadLeaguesFromLocalStorage();
      const league = leagues.find(l => l.id === tournament.leagueId);
      if (!league) return [];

      return league.players
        .filter(p => tournament.playerIds.includes(p.id))
        .map(p => ({
          id: p.id,
          name: p.name,
          elo: p.elo,
          matchesPlayed: p.matchesPlayed,
          wins: p.wins,
          losses: p.losses,
          joinedAt: new Date().toISOString(),
        }));
    }

    try {
      const { data, error } = await supabase!
        .from('tournament_players')
        .select(`
          id,
          user_id,
          anonymous_user_id,
          joined_at,
          pseudo_in_tournament,
          user:users (
            id,
            pseudo
          ),
          anonymous_user:anonymous_users (
            id,
            pseudo
          )
        `)
        .eq('tournament_id', tournamentId)
        .order('joined_at', { ascending: true });

      if (error) throw error;
      if (!data) return [];

      // Get tournament to find league_id
      const { data: tournamentData } = await supabase!
        .from('tournaments')
        .select('league_id')
        .eq('id', tournamentId)
        .single();

      if (!tournamentData || !tournamentData.league_id) {
        // Autonomous tournament - return basic participant info without stats
        return data.map((tp: any) => ({
          id: tp.id,
          name: tp.pseudo_in_tournament || tp.user?.pseudo || tp.anonymous_user?.pseudo || 'Anonymous',
          elo: 1500, // Default ELO for autonomous tournaments
          matchesPlayed: 0,
          wins: 0,
          losses: 0,
          joinedAt: tp.joined_at || new Date().toISOString(),
        }));
      }

      // Load league_player stats for each participant
      const participantsWithStats = await Promise.all(
        data.map(async (tp: any) => {
          // Try to find corresponding league_player
          if (!tournamentData.league_id) {
            return {
              id: tp.id,
              name: tp.pseudo_in_tournament || tp.user?.pseudo || tp.anonymous_user?.pseudo || 'Anonymous',
              elo: 1500,
              matchesPlayed: 0,
              wins: 0,
              losses: 0,
              joinedAt: tp.joined_at || new Date().toISOString(),
            };
          }

          let statsQuery = supabase!
            .from('league_players')
            .select('id, elo, matches_played, wins, losses')
            .eq('league_id', tournamentData.league_id);

          if (tp.user_id) {
            statsQuery = statsQuery.eq('user_id', tp.user_id);
          } else if (tp.anonymous_user_id) {
            statsQuery = statsQuery.eq('anonymous_user_id', tp.anonymous_user_id);
          }

          const { data: statsData } = await statsQuery.maybeSingle();

          // Type guard to ensure statsData is valid
          const stats = (statsData && typeof statsData === 'object' && 'elo' in statsData) 
            ? statsData as { id: string; elo: number; matches_played: number; wins: number; losses: number }
            : null;

          return {
            id: tp.id,
            leaguePlayerId: stats?.id,
            name: tp.pseudo_in_tournament || tp.user?.pseudo || tp.anonymous_user?.pseudo || 'Anonymous',
            elo: stats?.elo || 1500,
            matchesPlayed: stats?.matches_played || 0,
            wins: stats?.wins || 0,
            losses: stats?.losses || 0,
            joinedAt: tp.joined_at || new Date().toISOString(),
          };
        })
      );

      return participantsWithStats;
    } catch (error) {
      console.error('Error loading tournament participants:', error);
      return [];
    }
  }

  /**
   * Ajoute un joueur anonyme directement à un tournoi
   */
  async addAnonymousPlayerToTournament(
    tournamentId: string,
    playerName: string,
    anonymousUserId: string
  ): Promise<string> {
    if (!this.isSupabaseAvailable()) {
      // For localStorage, generate an ID and add to tournament
      const tournaments = this.loadTournamentsFromLocalStorage();
      const tournament = tournaments.find((t) => t.id === tournamentId);
      if (tournament) {
        const newPlayerId = crypto.randomUUID();
        tournament.playerIds.push(newPlayerId);
        this.saveTournamentToLocalStorage(tournament);
        return newPlayerId;
      }
      throw new Error('Tournament not found');
    }

    try {
      // First, ensure anonymous_user exists
      const { data: existingAnonymousUser } = await supabase!
        .from('anonymous_users')
        .select('id')
        .eq('id', anonymousUserId)
        .single();

      if (!existingAnonymousUser) {
        // Create anonymous user
        const { error: createError } = await supabase!
          .from('anonymous_users')
          .insert({
            id: anonymousUserId,
            pseudo: playerName,
          });

        if (createError) throw createError;
      }

      // Create tournament_player entry
      const playerId = crypto.randomUUID();
      const joinedAt = new Date().toISOString();
      const { error: insertError } = await supabase!
        .from('tournament_players')
        .insert({
          id: playerId,
          tournament_id: tournamentId,
          anonymous_user_id: anonymousUserId,
          pseudo_in_tournament: playerName,
          joined_at: joinedAt,
        });

      if (insertError) throw insertError;

      // Update localStorage cache
      const tournaments = this.loadTournamentsFromLocalStorage();
      const tournament = tournaments.find((t) => t.id === tournamentId);
      if (tournament && !tournament.playerIds.includes(playerId)) {
        tournament.playerIds.push(playerId);
        this.saveTournamentToLocalStorage(tournament);
      }

      return playerId;
    } catch (error) {
      console.error('Error adding anonymous player to tournament:', error);
      throw error;
    }
  }

  /**
   * Ajoute un joueur de la league au tournoi (crée une entrée tournament_players)
   */
  async addLeaguePlayerToTournament(
    tournamentId: string,
    leaguePlayerId: string
  ): Promise<string> {
    if (!this.isSupabaseAvailable()) {
      const tournaments = this.loadTournamentsFromLocalStorage();
      const tournament = tournaments.find((t) => t.id === tournamentId);
      if (tournament) {
        tournament.playerIds.push(leaguePlayerId);
        this.saveTournamentToLocalStorage(tournament);
        return leaguePlayerId;
      }
      throw new Error('Tournament not found');
    }

    const { data: leaguePlayer, error: lpError } = await supabase!
      .from('league_players')
      .select('user_id, anonymous_user_id, pseudo_in_league')
      .eq('id', leaguePlayerId)
      .single();

    if (lpError || !leaguePlayer) throw new Error('League player not found');

    let existingQuery = supabase!
      .from('tournament_players')
      .select('id')
      .eq('tournament_id', tournamentId);
    if (leaguePlayer.user_id) {
      existingQuery = existingQuery.eq('user_id', leaguePlayer.user_id);
    } else if (leaguePlayer.anonymous_user_id) {
      existingQuery = existingQuery.eq('anonymous_user_id', leaguePlayer.anonymous_user_id);
    } else {
      throw new Error('League player has no user identity');
    }
    const { data: existing } = await existingQuery.maybeSingle();

    if (existing) return existing.id;

    const newId = crypto.randomUUID();
    const { error: insertError } = await supabase!
      .from('tournament_players')
      .insert({
        id: newId,
        tournament_id: tournamentId,
        user_id: leaguePlayer.user_id || null,
        anonymous_user_id: leaguePlayer.anonymous_user_id || null,
        pseudo_in_tournament: leaguePlayer.pseudo_in_league,
      });

    if (insertError) throw insertError;

    const tournaments = this.loadTournamentsFromLocalStorage();
    const tournament = tournaments.find((t) => t.id === tournamentId);
    if (tournament && !tournament.playerIds.includes(newId)) {
      tournament.playerIds.push(newId);
      this.saveTournamentToLocalStorage(tournament);
    }

    return newId;
  }

  /**
   * Met à jour un joueur dans une league
   */
  async updatePlayer(leagueId: string, playerId: string, updates: Partial<Player>): Promise<void> {
    if (!this.isSupabaseAvailable()) {
      const leagues = this.loadLeaguesFromLocalStorage();
      const league = leagues.find((l) => l.id === leagueId);
      if (league) {
        const player = league.players.find((p) => p.id === playerId);
        if (player) {
          Object.assign(player, updates);
          this.saveLeagueToLocalStorage(league);
        }
      }
      return;
    }

    try {
      const updateData: any = {};
      if (updates.name !== undefined) updateData.pseudo_in_league = updates.name;
      if (updates.elo !== undefined) updateData.elo = updates.elo;
      if (updates.wins !== undefined) updateData.wins = updates.wins;
      if (updates.losses !== undefined) updateData.losses = updates.losses;
      if (updates.matchesPlayed !== undefined) updateData.matches_played = updates.matchesPlayed;
      if (updates.streak !== undefined) updateData.streak = updates.streak;

      const { error } = await supabase!
        .from('league_players')
        .update(updateData)
        .eq('id', playerId)
        .eq('league_id', leagueId);

      if (error) throw error;

      // Update localStorage cache
      const leagues = this.loadLeaguesFromLocalStorage();
      const league = leagues.find((l) => l.id === leagueId);
      if (league) {
        const player = league.players.find((p) => p.id === playerId);
        if (player) {
          Object.assign(player, updates);
          this.saveLeagueToLocalStorage(league);
        }
      }
    } catch (error) {
      console.error('Error updating player in Supabase:', error);
      // Fallback vers localStorage
      const leagues = this.loadLeaguesFromLocalStorage();
      const league = leagues.find((l) => l.id === leagueId);
      if (league) {
        const player = league.players.find((p) => p.id === playerId);
        if (player) {
          Object.assign(player, updates);
          this.saveLeagueToLocalStorage(league);
        }
      }
    }
  }

  /**
   * Supprime un joueur d'une league
   */
  async deletePlayer(leagueId: string, playerId: string): Promise<void> {
    if (!this.isSupabaseAvailable()) {
      const leagues = this.loadLeaguesFromLocalStorage();
      const league = leagues.find((l) => l.id === leagueId);
      if (league) {
        league.players = league.players.filter((p) => p.id !== playerId);
        league.matches = league.matches.filter(
          (m) => !m.teamA.includes(playerId) && !m.teamB.includes(playerId)
        );
        this.saveLeagueToLocalStorage(league);
      }
      return;
    }

    try {
      // Delete player from league_players
      const { error } = await supabase!
        .from('league_players')
        .delete()
        .eq('id', playerId)
        .eq('league_id', leagueId);

      if (error) throw error;

      // Delete matches that include this player
      // First, get all matches for this league
      const { data: matches } = await supabase!
        .from('matches')
        .select('id, team_a_player_ids, team_b_player_ids')
        .eq('league_id', leagueId);

      if (matches) {
        const matchesToDelete = matches.filter(
          (m) => 
            (m.team_a_player_ids || []).includes(playerId) || 
            (m.team_b_player_ids || []).includes(playerId)
        );

        for (const match of matchesToDelete) {
          await supabase!.from('matches').delete().eq('id', match.id);
        }
      }

      // Update localStorage cache
      const leagues = this.loadLeaguesFromLocalStorage();
      const league = leagues.find((l) => l.id === leagueId);
      if (league) {
        league.players = league.players.filter((p) => p.id !== playerId);
        league.matches = league.matches.filter(
          (m) => !m.teamA.includes(playerId) && !m.teamB.includes(playerId)
        );
        this.saveLeagueToLocalStorage(league);
      }
    } catch (error) {
      console.error('Error deleting player from Supabase:', error);
      // Fallback vers localStorage
      const leagues = this.loadLeaguesFromLocalStorage();
      const league = leagues.find((l) => l.id === leagueId);
      if (league) {
        league.players = league.players.filter((p) => p.id !== playerId);
        league.matches = league.matches.filter(
          (m) => !m.teamA.includes(playerId) && !m.teamB.includes(playerId)
        );
        this.saveLeagueToLocalStorage(league);
      }
    }
  }

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
      const leagues = this.loadLeaguesFromLocalStorage();
      const league = leagues.find((l) => l.id === leagueId);
      if (league) {
        league.matches.push(match);
        this.saveLeagueToLocalStorage(league);
      }
      return;
    }

    try {
      // Determine match format based on team sizes
      const format = match.teamA.length === 1 && match.teamB.length === 1 
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
          created_by_anonymous_user_id: anonymousUserId || match.created_by_anonymous_user_id || null,
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
        // This would allow filtering ELO history by user or anonymous user
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
          const player = playerData as any;
          const isWinner = change.change > 0;
          const newWins = isWinner ? (player.wins || 0) + 1 : (player.wins || 0);
          const newLosses = !isWinner ? (player.losses || 0) + 1 : (player.losses || 0);
          const newStreak = isWinner
            ? (player.streak || 0) > 0 ? (player.streak || 0) + 1 : 1
            : (player.streak || 0) < 0 ? (player.streak || 0) - 1 : -1;

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
      const leagues = this.loadLeaguesFromLocalStorage();
      const league = leagues.find((l) => l.id === leagueId);
      if (league) {
        league.matches.push(match);
        this.saveLeagueToLocalStorage(league);
      }
    } catch (error) {
      console.error('Error recording match in Supabase:', error);
      // Fallback vers localStorage
      const leagues = this.loadLeaguesFromLocalStorage();
      const league = leagues.find((l) => l.id === leagueId);
      if (league) {
        league.matches.push(match);
        this.saveLeagueToLocalStorage(league);
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
      const tournaments = this.loadTournamentsFromLocalStorage();
      const tournament = tournaments.find((t) => t.id === tournamentId);
      if (tournament) {
        tournament.matches.push(match);
        this.saveTournamentToLocalStorage(tournament);
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

      // Determine match format
      const format = match.teamA.length === 1 && match.teamB.length === 1 
        ? '1v1' 
        : match.teamA.length === 2 && match.teamB.length === 2
        ? '2v2'
        : '3v3';

      // Insert match
      const { error: matchError } = await supabase!
        .from('matches')
        .insert({
          id: match.id,
          league_id: tournamentData.league_id,
          tournament_id: tournamentId,
          format,
          team_a_player_ids: match.teamA,
          team_b_player_ids: match.teamB,
          score_a: match.scoreA,
          score_b: match.scoreB,
          created_at: match.date,
          created_by_user_id: userId || match.created_by_user_id || null,
          created_by_anonymous_user_id: anonymousUserId || match.created_by_anonymous_user_id || null,
          cups_remaining: match.cups_remaining ?? null,
          photo_url: match.photo_url ?? null,
        });

      if (matchError) throw matchError;

      // Insert ELO history
      const eloHistoryEntries = Object.entries(eloChanges).map(([_playerId, change]) => ({
        match_id: match.id,
        league_id: tournamentData.league_id,
        tournament_id: tournamentId,
        // FUTURE WORK: Map player identity for ELO history tracking in tournaments
        // This would allow filtering ELO history by user or anonymous user
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
      // When tournamentPlayerIdToLeaguePlayerId is provided, playerId in eloChanges is tournament_players.id - resolve to league_players.id
      if (tournamentData.league_id) {
        for (const [playerId, change] of Object.entries(eloChanges)) {
          const leaguePlayerId = tournamentPlayerIdToLeaguePlayerId?.[playerId] ?? playerId;
          const { data: playerData } = await supabase!
            .from('league_players')
            .select('wins, losses, matches_played, streak')
            .eq('id', leaguePlayerId)
            .eq('league_id', tournamentData.league_id)
            .single();

          if (playerData && !('code' in playerData)) {
            const player = playerData as any;
            const isWinner = change.change > 0;
            const newWins = isWinner ? (player.wins || 0) + 1 : (player.wins || 0);
            const newLosses = !isWinner ? (player.losses || 0) + 1 : (player.losses || 0);
            const newStreak = isWinner
              ? (player.streak || 0) > 0 ? (player.streak || 0) + 1 : 1
              : (player.streak || 0) < 0 ? (player.streak || 0) - 1 : -1;

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
              .eq('league_id', tournamentData.league_id);
          }
        }
      }

      // Update localStorage cache
      const tournaments = this.loadTournamentsFromLocalStorage();
      const tournament = tournaments.find((t) => t.id === tournamentId);
      if (tournament) {
        tournament.matches.push(match);
        this.saveTournamentToLocalStorage(tournament);
      }
    } catch (error) {
      console.error('Error recording tournament match in Supabase:', error);
      // Fallback vers localStorage
      const tournaments = this.loadTournamentsFromLocalStorage();
      const tournament = tournaments.find((t) => t.id === tournamentId);
      if (tournament) {
        tournament.matches.push(match);
        this.saveTournamentToLocalStorage(tournament);
      }
    }
  }

  // ===== Méthodes localStorage (fallback) =====

  private loadLeaguesFromLocalStorage(): League[] {
    const saved = localStorage.getItem('bpl_leagues');
    return saved ? JSON.parse(saved) : [];
  }

  private loadTournamentsFromLocalStorage(): Tournament[] {
    const saved = localStorage.getItem('bpl_tournaments');
    return saved ? JSON.parse(saved) : [];
  }

  private saveLeagueToLocalStorage(league: League): void {
    const leagues = this.loadLeaguesFromLocalStorage();
    const index = leagues.findIndex((l) => l.id === league.id);
    if (index >= 0) {
      leagues[index] = league;
    } else {
      leagues.push(league);
    }
    localStorage.setItem('bpl_leagues', JSON.stringify(leagues));
  }

  private saveTournamentToLocalStorage(tournament: Tournament): void {
    const tournaments = this.loadTournamentsFromLocalStorage();
    const index = tournaments.findIndex((t) => t.id === tournament.id);
    if (index >= 0) {
      tournaments[index] = tournament;
    } else {
      tournaments.push(tournament);
    }
    localStorage.setItem('bpl_tournaments', JSON.stringify(tournaments));
  }

  private deleteLeagueFromLocalStorage(leagueId: string): void {
    const leagues = this.loadLeaguesFromLocalStorage();
    const filtered = leagues.filter((l) => l.id !== leagueId);
    localStorage.setItem('bpl_leagues', JSON.stringify(filtered));
  }

  private deleteTournamentFromLocalStorage(tournamentId: string): void {
    const tournaments = this.loadTournamentsFromLocalStorage();
    const filtered = tournaments.filter((t) => t.id !== tournamentId);
    localStorage.setItem('bpl_tournaments', JSON.stringify(filtered));
  }

  /**
   * Create a new tournament (Story 8.2)
   * 
   * @param data - Tournament creation data
   * @returns Tournament ID
   */
  async createTournament(data: {
    name: string;
    joinCode: string;
    formatType: 'fixed' | 'free';
    team1Size: number | null;
    team2Size: number | null;
    maxPlayers: number;
    isPrivate: boolean;
    creatorUserId: string | null;
    creatorAnonymousUserId: string | null;
  }): Promise<string> {
    if (!this.isSupabaseAvailable()) {
      // Fallback to localStorage
      const tournamentId = crypto.randomUUID();
      
      // Get creator's pseudo for localStorage mode
      let creatorPseudo = 'Créateur';
      if (data.creatorUserId) {
        const localUser = localStorage.getItem('bpl_local_user');
        if (localUser) {
          const userData = JSON.parse(localUser);
          creatorPseudo = userData.pseudo || 'Créateur';
        }
      } else if (data.creatorAnonymousUserId) {
        const anonUser = localStorage.getItem('bpl_anonymous_user');
        if (anonUser) {
          const anonData = JSON.parse(anonUser);
          creatorPseudo = anonData.pseudo || 'Créateur';
        }
      }
      
      const tournament: Tournament = {
        id: tournamentId,
        name: data.name,
        date: new Date().toISOString(),
        format: data.formatType === 'fixed' ? '2v2' : 'libre',
        leagueId: null,
        playerIds: [data.creatorUserId || data.creatorAnonymousUserId || ''], // Add creator as first player
        matches: [],
        isFinished: false,
        createdAt: new Date().toISOString(),
      };
      this.saveTournamentToLocalStorage(tournament);
      return tournamentId;
    }

    try {
      const { data: tournament, error } = await supabase!
        .from('tournaments')
        .insert({
          name: data.name,
          date: new Date().toISOString().split('T')[0], // Date only
          join_code: data.joinCode,
          format_type: data.formatType,
          team1_size: data.team1Size,
          team2_size: data.team2Size,
          max_players: data.maxPlayers,
          is_private: data.isPrivate,
          status: 'active',
          creator_user_id: data.creatorUserId,
          creator_anonymous_user_id: data.creatorAnonymousUserId,
          is_finished: false,
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error creating tournament:', error);
        throw new Error(`Failed to create tournament: ${error.message}`);
      }

      return tournament.id;
    } catch (error) {
      console.error('Error in createTournament:', error);
      throw error;
    }
  }

  /**
   * Check if a tournament join code already exists (Story 8.2)
   * 
   * @param joinCode - Code to check
   * @returns true if code exists, false otherwise
   */
  async tournamentCodeExists(joinCode: string): Promise<boolean> {
    if (!this.isSupabaseAvailable()) {
      return false; // Optimistic: assume code is unique if offline
    }

    try {
      const { data, error } = await supabase!
        .from('tournaments')
        .select('id')
        .eq('join_code', joinCode)
        .maybeSingle();

      if (error) {
        console.error('Error checking tournament code:', error);
        return false;
      }

      return data !== null;
    } catch (error) {
      console.error('Error in tournamentCodeExists:', error);
      return false;
    }
  }

  /**
   * Remove a user from a tournament (Story 8.3 - Task 7, 8)
   * 
   * @param tournamentId - Tournament ID to leave
   * @param userId - User ID (authenticated user)
   * @param anonymousUserId - Anonymous user ID (if not authenticated)
   * @throws Error if user is the tournament creator (not allowed to leave)
   */
  async leaveTournament(
    tournamentId: string,
    userId?: string,
    anonymousUserId?: string
  ): Promise<void> {
    // Check user identity first
    if (!userId && !anonymousUserId) {
      throw new Error('User ID or Anonymous User ID required');
    }

    if (!this.isSupabaseAvailable()) {
      // For offline mode, tournaments are managed via context/localStorage
      // This operation requires online access to modify tournament_players
      throw new Error('Cannot leave tournament in offline mode');
    }

    try {
      // Check if user is the tournament creator (creators cannot leave)
      const { data: tournament, error: tournamentError } = await supabase!
        .from('tournaments')
        .select('creator_user_id, creator_anonymous_user_id')
        .eq('id', tournamentId)
        .single();

      if (tournamentError) {
        console.error('Error fetching tournament:', tournamentError);
        throw new Error('Failed to fetch tournament information');
      }

      // Verify user is not the creator
      if (
        (userId && tournament.creator_user_id === userId) ||
        (anonymousUserId && tournament.creator_anonymous_user_id === anonymousUserId)
      ) {
        throw new Error('Le créateur du tournoi ne peut pas quitter');
      }

      // Remove user from tournament_players
      let query = supabase!
        .from('tournament_players')
        .delete()
        .eq('tournament_id', tournamentId);

      if (userId) {
        query = query.eq('user_id', userId);
      } else if (anonymousUserId) {
        query = query.eq('anonymous_user_id', anonymousUserId);
      }

      const { error: deleteError } = await query;

      if (deleteError) {
        console.error('Error leaving tournament:', deleteError);
        throw new Error(`Failed to leave tournament: ${deleteError.message}`);
      }

      console.log('✅ Successfully left tournament:', tournamentId);
    } catch (error) {
      console.error('Error in leaveTournament:', error);
      throw error;
    }
  }
}

export const databaseService = new DatabaseService();

