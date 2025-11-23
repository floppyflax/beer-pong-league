/**
 * DatabaseService - Service de synchronisation avec Supabase
 * 
 * Gère la transformation entre le format app (imbriqué) et le format DB (normalisé)
 * et la synchronisation avec Supabase avec fallback localStorage
 */

import { supabase } from '../lib/supabase';
import type { League, Tournament, Player, Match } from '../types';

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
          }));

          return {
            id: typedRow.id,
            name: typedRow.name,
            date: typedRow.date,
            leagueId: typedRow.league_id,
            createdAt: typedRow.created_at,
            playerIds,
            matches,
            isFinished: typedRow.is_finished,
            creator_user_id: typedRow.creator_user_id,
            creator_anonymous_user_id: typedRow.creator_anonymous_user_id,
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
        }, {
          onConflict: 'id'
        });

      if (leagueError) throw leagueError;

      // Sauvegarder les players
      if (league.players.length > 0) {
        const playersToInsert = league.players.map((player) => ({
          id: player.id,
          league_id: league.id,
          user_id: null, // TODO: mapper depuis player si nécessaire
          anonymous_user_id: null, // TODO: mapper depuis player si nécessaire
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
          league_id: tournament.leagueId,
          is_finished: tournament.isFinished,
          created_at: tournament.createdAt,
          creator_user_id: tournament.creator_user_id,
          creator_anonymous_user_id: tournament.creator_anonymous_user_id,
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

