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
   */
  async loadLeagues(userId?: string, anonymousUserId?: string): Promise<League[]> {
    if (!this.isSupabaseAvailable()) {
      return this.loadLeaguesFromLocalStorage();
    }

    try {
      // Charger les leagues
      let query = supabase!.from('leagues').select('*');
      
      // Filtrer par créateur si fourni
      if (userId) {
        query = query.eq('creator_user_id', userId);
      } else if (anonymousUserId) {
        query = query.eq('creator_anonymous_user_id', anonymousUserId);
      }

      const { data: leaguesData, error: leaguesError } = await query;

      if (leaguesError) throw leaguesError;
      if (!leaguesData) return [];

      // Pour chaque league, charger les players et matches
      const leagues: League[] = await Promise.all(
        leaguesData.map(async (leagueRow: any) => {
          // Type assertion pour correspondre à la structure DB
          const typedRow: LeagueRow = {
            id: leagueRow.id,
            name: leagueRow.name,
            type: leagueRow.type as 'event' | 'season',
            created_at: leagueRow.created_at || new Date().toISOString(),
            creator_user_id: leagueRow.creator_user_id,
            creator_anonymous_user_id: leagueRow.creator_anonymous_user_id,
          };
          // Charger les players
          const { data: playersData, error: playersError } = await supabase!
            .from('league_players')
            .select('*')
            .eq('league_id', typedRow.id);

          if (playersError) throw playersError;

          const players: Player[] = (playersData || []).map((p: any) => ({
            id: p.id,
            name: p.pseudo_in_league,
            elo: p.elo || 1000,
            wins: p.wins || 0,
            losses: p.losses || 0,
            matchesPlayed: p.matches_played || 0,
            streak: p.streak || 0,
          }));

          // Charger les matches
          const { data: matchesData, error: matchesError } = await supabase!
            .from('matches')
            .select('*')
            .eq('league_id', typedRow.id)
            .order('created_at', { ascending: false });

          if (matchesError) throw matchesError;

          const matches: Match[] = (matchesData || []).map((m: any) => ({
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
          }));

          // Charger les tournaments associés
          const { data: tournamentsData, error: tournamentsError } = await supabase!
            .from('tournaments')
            .select('id')
            .eq('league_id', typedRow.id);

          if (tournamentsError) throw tournamentsError;

          const tournaments = (tournamentsData || []).map((t: { id: string }) => t.id);

          return {
            id: typedRow.id,
            name: typedRow.name,
            type: typedRow.type,
            createdAt: typedRow.created_at,
            players,
            matches,
            tournaments,
            creator_user_id: leagueRow.creator_user_id,
            creator_anonymous_user_id: leagueRow.creator_anonymous_user_id,
            anti_cheat_enabled: leagueRow.anti_cheat_enabled || false,
          };
        })
      );

      return leagues;
    } catch (error) {
      console.error('Error loading leagues from Supabase:', error);
      return this.loadLeaguesFromLocalStorage();
    }
  }

  /**
   * Charge toutes les tournaments depuis Supabase
   */
  async loadTournaments(userId?: string, anonymousUserId?: string): Promise<Tournament[]> {
    if (!this.isSupabaseAvailable()) {
      return this.loadTournamentsFromLocalStorage();
    }

    try {
      // Charger les tournaments
      let query = supabase!.from('tournaments').select('*');
      
      // Filtrer par créateur si fourni
      if (userId) {
        query = query.eq('creator_user_id', userId);
      } else if (anonymousUserId) {
        query = query.eq('creator_anonymous_user_id', anonymousUserId);
      }

      const { data: tournamentsData, error: tournamentsError } = await query;

      if (tournamentsError) throw tournamentsError;
      if (!tournamentsData) return [];

      // Pour chaque tournament, charger les matches
      const tournaments: Tournament[] = await Promise.all(
        tournamentsData.map(async (tournamentRow: any) => {
          const typedRow: TournamentRow = {
            id: tournamentRow.id,
            name: tournamentRow.name,
            date: tournamentRow.date,
            league_id: tournamentRow.league_id,
            is_finished: tournamentRow.is_finished || false,
            created_at: tournamentRow.created_at || new Date().toISOString(),
            creator_user_id: tournamentRow.creator_user_id,
            creator_anonymous_user_id: tournamentRow.creator_anonymous_user_id,
          };
          // Charger les player IDs
          const { data: playersData, error: playersError } = await supabase!
            .from('tournament_players')
            .select('id, user_id, anonymous_user_id')
            .eq('tournament_id', typedRow.id);

          if (playersError) throw playersError;

          // Pour les tournaments, on utilise les IDs des league_players ou tournament_players
          // On récupère les IDs depuis tournament_players
          const playerIds: string[] = (playersData || []).map((p: any) => p.id);

          // Charger les matches
          const { data: matchesData, error: matchesError } = await supabase!
            .from('matches')
            .select('*')
            .eq('tournament_id', typedRow.id)
            .order('created_at', { ascending: false });

          if (matchesError) throw matchesError;

          const matches: Match[] = (matchesData || []).map((m: any) => ({
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
          }));

          return {
            id: typedRow.id,
            name: typedRow.name,
            date: typedRow.date,
            format: tournamentRow.format || '2v2',
            location: tournamentRow.location,
            leagueId: typedRow.league_id,
            createdAt: typedRow.created_at,
            playerIds,
            matches,
            isFinished: typedRow.is_finished,
            creator_user_id: typedRow.creator_user_id,
            creator_anonymous_user_id: typedRow.creator_anonymous_user_id,
            anti_cheat_enabled: tournamentRow.anti_cheat_enabled || false,
          };
        })
      );

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
    antiCheatEnabled?: boolean
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
        this.saveTournamentToLocalStorage(tournament);
      }
      return;
    }

    try {
      const updates: any = { name, date };
      if (antiCheatEnabled !== undefined) {
        updates.anti_cheat_enabled = antiCheatEnabled;
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
   * Charge les participants d'un tournament depuis tournament_players
   */
  async loadTournamentParticipants(tournamentId: string): Promise<{
    id: string;
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
            .select('elo, matches_played, wins, losses')
            .eq('league_id', tournamentData.league_id);

          if (tp.user_id) {
            statsQuery = statsQuery.eq('user_id', tp.user_id);
          } else if (tp.anonymous_user_id) {
            statsQuery = statsQuery.eq('anonymous_user_id', tp.anonymous_user_id);
          }

          const { data: statsData } = await statsQuery.maybeSingle();

          // Type guard to ensure statsData is valid
          const stats = (statsData && typeof statsData === 'object' && 'elo' in statsData) 
            ? statsData as { elo: number; matches_played: number; wins: number; losses: number }
            : null;

          return {
            id: tp.id,
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
      const { error: insertError } = await supabase!
        .from('tournament_players')
        .insert({
          id: playerId,
          tournament_id: tournamentId,
          anonymous_user_id: anonymousUserId,
          pseudo_in_tournament: playerName,
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
    anonymousUserId?: string | null
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
      if (tournamentData.league_id) {
        for (const [playerId, change] of Object.entries(eloChanges)) {
          const { data: playerData } = await supabase!
            .from('league_players')
            .select('wins, losses, matches_played, streak')
            .eq('id', playerId)
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
              .eq('id', playerId)
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
}

export const databaseService = new DatabaseService();

