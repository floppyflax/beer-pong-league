/**
 * TournamentsRepository - Gère le CRUD des tournaments (Supabase + fallback localStorage)
 */

import type { Tournament, Match } from '../../types';
import { safeValidateTournament } from '../../utils/validation';
import {
  BaseRepository,
  supabase,
  type TournamentRow,
  type TournamentPlayerRow,
  type MatchRow,
} from './_base';

/**
 * Set of tournament fields that callers are allowed to update in-place.
 * Using an object (rather than positional args) lets us extend the API
 * without breaking existing call sites every time a new field shows up.
 *
 * `name` / `date` are optional here even though they're required at
 * creation time — update is a partial mutation.
 */
export interface TournamentUpdates {
  name?: string;
  date?: string;
  antiCheatEnabled?: boolean;
  format?: '1v1' | '2v2' | '3v3' | 'libre';
  maxPlayers?: number;
  isPrivate?: boolean;
}

class TournamentsRepository extends BaseRepository {
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
      const creatorIds = (creatorTournaments || []).map((t) => t.id);
      const participantIds = (participantTournaments || []).map((t) => t.tournament_id);
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
      ((allPlayersData || []) as TournamentPlayerRow[]).forEach((p) => {
        if (!playersByTournament.has(p.tournament_id)) {
          playersByTournament.set(p.tournament_id, []);
        }
        playersByTournament.get(p.tournament_id)!.push(p.id);
      });

      // Group matches
      ((allMatchesData || []) as MatchRow[]).forEach((m) => {
        if (!m.tournament_id) return;
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
          status: (m.status as Match['status']) || 'confirmed',
          confirmed_by_user_id: m.confirmed_by_user_id,
          confirmed_by_anonymous_user_id: m.confirmed_by_anonymous_user_id,
          confirmed_at: m.confirmed_at,
          cups_remaining: m.cups_remaining ?? undefined,
          photo_url: m.photo_url ?? undefined,
        });
      });

      // Step 6: Build tournaments with grouped data
      const tournaments: Tournament[] = (tournamentsData as TournamentRow[]).map(
        (tournamentRow) => {
          const playerIds = playersByTournament.get(tournamentRow.id) || [];
          const matches = matchesByTournament.get(tournamentRow.id) || [];

          return {
            id: tournamentRow.id,
            name: tournamentRow.name,
            date: tournamentRow.date,
            format: (tournamentRow.format as Tournament['format']) || '2v2',
            location: tournamentRow.location ?? undefined,
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
            // Phase A.5 — competition mode (migration 011). Default 'elo' if DB
            // hasn't received the migration yet (local/staging sync lag).
            mode: tournamentRow.mode ?? 'elo',
          };
        }
      );

      console.log(`⚡ Loaded ${tournaments.length} tournaments with optimized batch queries`);

      return tournaments;
    } catch (error) {
      console.error('Error loading tournaments from Supabase:', error);
      return this.loadTournamentsFromLocalStorage();
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
      throw new Error(
        `Invalid tournament data: ${validationResult.error.issues.map((i) => i.message).join(', ')}`
      );
    }

    if (!this.isSupabaseAvailable()) {
      this.saveTournamentToLocalStorage(tournament);
      return;
    }

    try {
      // Sauvegarder le tournament
      const { error: tournamentError } = await supabase!
        .from('tournaments')
        .upsert(
          {
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
          },
          {
            onConflict: 'id',
          }
        );

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
            onConflict: 'id',
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
   * Met à jour un tournament dans Supabase
   */
  async updateTournament(
    tournamentId: string,
    updates: TournamentUpdates
  ): Promise<void> {
    // Apply the same set of field updates to a Tournament instance held in
    // localStorage. Keeps the cache coherent with whatever gets sent to
    // Supabase.
    const applyToLocal = (tournament: Tournament) => {
      if (updates.name !== undefined) tournament.name = updates.name;
      if (updates.date !== undefined) tournament.date = updates.date;
      if (updates.antiCheatEnabled !== undefined)
        tournament.anti_cheat_enabled = updates.antiCheatEnabled;
      if (updates.format !== undefined) tournament.format = updates.format;
      if (updates.maxPlayers !== undefined)
        tournament.maxPlayers = updates.maxPlayers;
      if (updates.isPrivate !== undefined)
        tournament.isPrivate = updates.isPrivate;
    };

    if (!this.isSupabaseAvailable()) {
      const tournaments = this.loadTournamentsFromLocalStorage();
      const tournament = tournaments.find((t) => t.id === tournamentId);
      if (tournament) {
        applyToLocal(tournament);
        this.saveTournamentToLocalStorage(tournament);
      }
      return;
    }

    try {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.date !== undefined) dbUpdates.date = updates.date;
      if (updates.antiCheatEnabled !== undefined)
        dbUpdates.anti_cheat_enabled = updates.antiCheatEnabled;
      if (updates.format !== undefined) dbUpdates.format = updates.format;
      if (updates.maxPlayers !== undefined)
        dbUpdates.max_players = updates.maxPlayers;
      if (updates.isPrivate !== undefined)
        dbUpdates.is_private = updates.isPrivate;

      // Nothing to update (e.g. caller passed an empty object) — bail out
      // rather than issue a no-op round-trip.
      if (Object.keys(dbUpdates).length === 0) return;

      const { error } = await supabase!
        .from('tournaments')
        .update(dbUpdates)
        .eq('id', tournamentId);

      if (error) throw error;

      // Update localStorage cache
      const tournaments = this.loadTournamentsFromLocalStorage();
      const tournament = tournaments.find((t) => t.id === tournamentId);
      if (tournament) {
        applyToLocal(tournament);
        this.saveTournamentToLocalStorage(tournament);
      }
    } catch (error) {
      console.error('Error updating tournament in Supabase:', error);
      // Fallback vers localStorage
      const tournaments = this.loadTournamentsFromLocalStorage();
      const tournament = tournaments.find((t) => t.id === tournamentId);
      if (tournament) {
        applyToLocal(tournament);
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
    // Competition mode. Omit to fall back on DB default 'elo' (migration 011).
    mode?: 'elo' | 'bracket';
    creatorUserId: string | null;
    creatorAnonymousUserId: string | null;
  }): Promise<string> {
    if (!this.isSupabaseAvailable()) {
      // Fallback to localStorage
      const tournamentId = crypto.randomUUID();

      // Get creator's pseudo for localStorage mode (kept for parity; value unused beyond structure)
      if (data.creatorUserId) {
        const localUser = localStorage.getItem('bpl_local_user');
        if (localUser) {
          JSON.parse(localUser);
        }
      } else if (data.creatorAnonymousUserId) {
        const anonUser = localStorage.getItem('bpl_anonymous_user');
        if (anonUser) {
          JSON.parse(anonUser);
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
      // Only send `mode` when the caller explicitly opted into Bracket.
      // Otherwise the DB default 'elo' kicks in (migration 011) and we avoid
      // a redundant field on every insert.
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
          ...(data.mode !== undefined ? { mode: data.mode } : {}),
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error creating tournament:', error);
        throw new Error(`Failed to create tournament: ${error.message}`);
      }

      return (tournament as { id: string }).id;
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

      const t = tournament as {
        creator_user_id: string | null;
        creator_anonymous_user_id: string | null;
      };

      // Verify user is not the creator
      if (
        (userId && t.creator_user_id === userId) ||
        (anonymousUserId && t.creator_anonymous_user_id === anonymousUserId)
      ) {
        throw new Error("Le créateur de l'événement ne peut pas quitter");
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

  // ===== localStorage fallback =====

  loadTournamentsFromLocalStorage(): Tournament[] {
    const saved = localStorage.getItem('bpl_tournaments');
    return saved ? JSON.parse(saved) : [];
  }

  saveTournamentToLocalStorage(tournament: Tournament): void {
    const tournaments = this.loadTournamentsFromLocalStorage();
    const index = tournaments.findIndex((t) => t.id === tournament.id);
    if (index >= 0) {
      tournaments[index] = tournament;
    } else {
      tournaments.push(tournament);
    }
    localStorage.setItem('bpl_tournaments', JSON.stringify(tournaments));
  }

  private deleteTournamentFromLocalStorage(tournamentId: string): void {
    const tournaments = this.loadTournamentsFromLocalStorage();
    const filtered = tournaments.filter((t) => t.id !== tournamentId);
    localStorage.setItem('bpl_tournaments', JSON.stringify(filtered));
  }
}

export const tournamentsRepository = new TournamentsRepository();
