/**
 * TournamentsRepository — gère les tournaments + leurs membres
 * (`tournament_memberships`) + matches (mig 022).
 */

import type { Tournament, Match } from '../../types';
import { safeValidateTournament } from '../../utils/validation';
import {
  BaseRepository,
  sb,
  type TournamentRow,
  type TournamentMembershipRow,
  type MatchRow,
} from './_base';

export interface TournamentUpdates {
  name?: string;
  date?: string;
  antiCheatEnabled?: boolean;
  format?: '1v1' | '2v2' | '3v3' | 'libre';
  maxPlayers?: number;
  isPrivate?: boolean;
  /**
   * Mig 023 — When TRUE (default) and the event is linked to a league, matches
   * recorded in this event also update the league's ELO. Toggle off to keep
   * the event's ELO bubble isolated from the league.
   */
  propagatesToLeagueElo?: boolean;
}

class TournamentsRepository extends BaseRepository {
  /**
   * Charge les tournaments où l'user est creator OU member (via player owned).
   */
  async loadTournaments(userId?: string, anonymousUserId?: string): Promise<Tournament[]> {
    if (!this.isSupabaseAvailable()) {
      return this.loadTournamentsFromLocalStorage();
    }
    const myUserId = userId || anonymousUserId;
    if (!myUserId) {
      console.log('🔒 No user identity - returning empty tournaments list');
      return [];
    }

    try {
      const tournamentIds = new Set<string>();

      const { data: created, error: createdErr } = await sb!
        .from('tournaments')
        .select('id')
        .eq('creator_user_id', myUserId);
      if (createdErr) throw createdErr;
      (created || []).forEach((t: { id: string }) => tournamentIds.add(t.id));

      // Member-of via my player
      const { data: myPlayer } = await sb!
        .from('players')
        .select('id')
        .eq('user_id', myUserId)
        .maybeSingle();
      if (myPlayer) {
        const playerId = (myPlayer as { id: string }).id;
        const { data: memberships } = await sb!
          .from('tournament_memberships')
          .select('tournament_id')
          .eq('player_id', playerId);
        (memberships || []).forEach((m: { tournament_id: string }) => tournamentIds.add(m.tournament_id));
      }

      if (tournamentIds.size === 0) return [];
      const ids = Array.from(tournamentIds);

      const [{ data: tournamentsData }, { data: allMembers }, { data: allMatches }] = await Promise.all([
        sb!.from('tournaments').select('*').in('id', ids),
        sb!
          .from('tournament_memberships')
          .select('id, tournament_id, player_id, archived_at')
          .in('tournament_id', ids),
        sb!.from('matches').select('*').in('tournament_id', ids).order('created_at', { ascending: false }),
      ]);

      const tournRows = (tournamentsData ?? []) as TournamentRow[];

      const playerIdsByTournament = new Map<string, string[]>();
      ((allMembers ?? []) as TournamentMembershipRow[]).forEach((m) => {
        const list = playerIdsByTournament.get(m.tournament_id) ?? [];
        list.push(m.id); // legacy: playerIds carries membership id
        playerIdsByTournament.set(m.tournament_id, list);
      });

      const matchesByTournament = new Map<string, Match[]>();
      ((allMatches ?? []) as MatchRow[]).forEach((m) => {
        if (!m.tournament_id) return;
        const list = matchesByTournament.get(m.tournament_id) ?? [];
        list.push({
          id: m.id,
          date: m.created_at || new Date().toISOString(),
          teamA: m.team_a_player_ids || [],
          teamB: m.team_b_player_ids || [],
          scoreA: m.score_a || 0,
          scoreB: m.score_b || 0,
          created_by_user_id: m.created_by_user_id,
          created_by_anonymous_user_id: null,
          status: (m.status as Match['status']) || 'confirmed',
          confirmed_by_user_id: m.confirmed_by_user_id,
          confirmed_by_anonymous_user_id: null,
          confirmed_at: m.confirmed_at,
          cups_remaining: m.cups_remaining ?? undefined,
          photo_url: m.photo_url ?? undefined,
        });
        matchesByTournament.set(m.tournament_id, list);
      });

      return tournRows.map((row) => ({
        id: row.id,
        name: row.name,
        date: row.date,
        format: (row.format as Tournament['format']) || '2v2',
        location: row.location ?? undefined,
        leagueId: row.league_id,
        createdAt: row.created_at || new Date().toISOString(),
        updatedAt: row.updated_at || row.created_at,
        playerIds: playerIdsByTournament.get(row.id) || [],
        matches: matchesByTournament.get(row.id) || [],
        isFinished: row.is_finished || false,
        creator_user_id: row.creator_user_id,
        creator_anonymous_user_id: null,
        anti_cheat_enabled: row.anti_cheat_enabled || false,
        joinCode: row.join_code,
        formatType: row.format_type,
        team1Size: row.team1_size,
        team2Size: row.team2_size,
        maxPlayers: row.max_players,
        isPrivate: row.is_private,
        status: row.status as 'active' | 'finished' | 'cancelled' | undefined,
        mode: row.mode ?? 'elo',
        propagatesToLeagueElo:
          (row as TournamentRow & { propagates_to_league_elo?: boolean }).propagates_to_league_elo ?? true,
      }));
    } catch (error) {
      console.error('Error loading tournaments from Supabase:', error);
      return this.loadTournamentsFromLocalStorage();
    }
  }

  async loadTournamentById(tournamentId: string): Promise<Tournament | null> {
    if (!this.isSupabaseAvailable()) {
      const local = this.loadTournamentsFromLocalStorage();
      return local.find((t) => t.id === tournamentId) ?? null;
    }
    try {
      const { data: tRow, error } = await sb!
        .from('tournaments')
        .select('*')
        .eq('id', tournamentId)
        .maybeSingle();
      if (error) throw error;
      if (!tRow) return null;

      const { data: members } = await sb!
        .from('tournament_memberships')
        .select('id')
        .eq('tournament_id', tournamentId);

      const row = tRow as TournamentRow;
      return {
        id: row.id,
        name: row.name,
        date: row.date,
        format: (row.format as Tournament['format']) || '2v2',
        location: row.location ?? undefined,
        leagueId: row.league_id,
        createdAt: row.created_at || new Date().toISOString(),
        updatedAt: row.updated_at || row.created_at,
        playerIds: ((members || []) as { id: string }[]).map((p) => p.id),
        matches: [],
        isFinished: row.is_finished || false,
        creator_user_id: row.creator_user_id,
        creator_anonymous_user_id: null,
        anti_cheat_enabled: row.anti_cheat_enabled || false,
        joinCode: row.join_code,
        formatType: row.format_type,
        team1Size: row.team1_size,
        team2Size: row.team2_size,
        maxPlayers: row.max_players,
        isPrivate: row.is_private,
        status: row.status as 'active' | 'finished' | 'cancelled' | undefined,
        mode: row.mode ?? 'elo',
        propagatesToLeagueElo:
          (row as TournamentRow & { propagates_to_league_elo?: boolean }).propagates_to_league_elo ?? true,
      };
    } catch (error) {
      console.error('Error loading tournament by id:', error);
      return null;
    }
  }

  async saveTournament(tournament: Tournament): Promise<void> {
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
      const { error } = await sb!.from('tournaments').upsert(
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
          anti_cheat_enabled: tournament.anti_cheat_enabled || false,
        },
        { onConflict: 'id' }
      );
      if (error) throw error;
      this.saveTournamentToLocalStorage(tournament);
    } catch (error) {
      console.error('Error saving tournament:', error);
      this.saveTournamentToLocalStorage(tournament);
    }
  }

  async deleteTournament(tournamentId: string): Promise<void> {
    if (!this.isSupabaseAvailable()) {
      this.deleteTournamentFromLocalStorage(tournamentId);
      return;
    }
    try {
      // memberships + matches cascade via FK ON DELETE CASCADE
      const { error } = await sb!.from('tournaments').delete().eq('id', tournamentId);
      if (error) throw error;
      this.deleteTournamentFromLocalStorage(tournamentId);
    } catch (error) {
      console.error('Error deleting tournament:', error);
      this.deleteTournamentFromLocalStorage(tournamentId);
    }
  }

  async updateTournament(tournamentId: string, updates: TournamentUpdates): Promise<void> {
    const applyToLocal = (tournament: Tournament) => {
      if (updates.name !== undefined) tournament.name = updates.name;
      if (updates.date !== undefined) tournament.date = updates.date;
      if (updates.antiCheatEnabled !== undefined) tournament.anti_cheat_enabled = updates.antiCheatEnabled;
      if (updates.format !== undefined) tournament.format = updates.format;
      if (updates.maxPlayers !== undefined) tournament.maxPlayers = updates.maxPlayers;
      if (updates.isPrivate !== undefined) tournament.isPrivate = updates.isPrivate;
      if (updates.propagatesToLeagueElo !== undefined) tournament.propagatesToLeagueElo = updates.propagatesToLeagueElo;
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
      if (updates.antiCheatEnabled !== undefined) dbUpdates.anti_cheat_enabled = updates.antiCheatEnabled;
      if (updates.format !== undefined) dbUpdates.format = updates.format;
      if (updates.maxPlayers !== undefined) dbUpdates.max_players = updates.maxPlayers;
      if (updates.isPrivate !== undefined) dbUpdates.is_private = updates.isPrivate;
      if (updates.propagatesToLeagueElo !== undefined) dbUpdates.propagates_to_league_elo = updates.propagatesToLeagueElo;
      if (Object.keys(dbUpdates).length === 0) return;
      const { error } = await sb!.from('tournaments').update(dbUpdates).eq('id', tournamentId);
      if (error) throw error;
      const tournaments = this.loadTournamentsFromLocalStorage();
      const tournament = tournaments.find((t) => t.id === tournamentId);
      if (tournament) {
        applyToLocal(tournament);
        this.saveTournamentToLocalStorage(tournament);
      }
    } catch (error) {
      console.error('Error updating tournament:', error);
    }
  }

  /**
   * Associe / dissocie un event à une ligue (DB + cache local).
   *
   * Effets de bord (mig 023) :
   *   - Quand on rattache à une ligue (`leagueId !== null`), TOUS les
   *     `tournament_memberships` de l'event sont synchronisés vers
   *     `league_memberships` de la ligue cible : les players manquants y
   *     sont ajoutés (avec ELO par défaut 1000), les présents sont laissés
   *     intacts. Côté event, les `tournament_memberships.elo` des players
   *     qui avaient déjà un `league_memberships.elo` sont alignés sur ce
   *     dernier (héritage) — sinon laissés à leur valeur courante.
   *   - Quand on dissocie (`leagueId === null`), aucune row n'est supprimée
   *     côté ligue (les players y restent — c'est leur historique). Seul le
   *     lien `tournaments.league_id` est nullifié.
   */
  async associateTournamentToLeague(
    tournamentId: string,
    leagueId: string | null,
  ): Promise<void> {
    if (!this.isSupabaseAvailable()) {
      const tournaments = this.loadTournamentsFromLocalStorage();
      const tournament = tournaments.find((t) => t.id === tournamentId);
      if (tournament) {
        tournament.leagueId = leagueId;
        this.saveTournamentToLocalStorage(tournament);
      }
      return;
    }

    try {
      // Persist the link first.
      const { error: linkErr } = await sb!
        .from('tournaments')
        .update({ league_id: leagueId })
        .eq('id', tournamentId);
      if (linkErr) throw linkErr;

      // Sync players when rattaching to a league.
      if (leagueId) {
        const { data: memberships } = await sb!
          .from('tournament_memberships')
          .select('player_id, elo')
          .eq('tournament_id', tournamentId);

        const tmRows = (memberships ?? []) as Array<{ player_id: string; elo: number }>;
        if (tmRows.length > 0) {
          const playerIds = tmRows.map((m) => m.player_id);

          // Find which league memberships already exist.
          const { data: existingLm } = await sb!
            .from('league_memberships')
            .select('player_id, elo')
            .eq('league_id', leagueId)
            .in('player_id', playerIds);
          const existingMap = new Map(
            ((existingLm ?? []) as Array<{ player_id: string; elo: number }>).map(
              (lm) => [lm.player_id, lm.elo],
            ),
          );

          // Insert missing league_memberships in bulk.
          const toInsert = playerIds
            .filter((pid) => !existingMap.has(pid))
            .map((pid) => ({ league_id: leagueId, player_id: pid }));
          if (toInsert.length > 0) {
            const { error: insErr } = await sb!
              .from('league_memberships')
              .insert(toInsert);
            if (insErr) {
              console.error('associateTournamentToLeague — insert lm failed', insErr);
            }
          }

          // Inheritance pass: align tournament_memberships.elo with the league
          // ELO when the player already had one (preserves their league
          // baseline). Players newly added to the league inherit the event's
          // current ELO (no realignment needed — both sides at default).
          for (const tm of tmRows) {
            const leagueElo = existingMap.get(tm.player_id);
            if (leagueElo !== undefined && leagueElo !== tm.elo) {
              await sb!
                .from('tournament_memberships')
                .update({ elo: leagueElo })
                .eq('tournament_id', tournamentId)
                .eq('player_id', tm.player_id);
            }
          }
        }
      }

      // Cache local update.
      const tournaments = this.loadTournamentsFromLocalStorage();
      const tournament = tournaments.find((t) => t.id === tournamentId);
      if (tournament) {
        tournament.leagueId = leagueId;
        this.saveTournamentToLocalStorage(tournament);
      }
    } catch (error) {
      console.error('Error associating tournament to league:', error);
      throw error;
    }
  }

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
      const { error } = await sb!.from('tournaments').update({ is_finished: isFinished }).eq('id', tournamentId);
      if (error) throw error;
      const tournaments = this.loadTournamentsFromLocalStorage();
      const tournament = tournaments.find((t) => t.id === tournamentId);
      if (tournament) {
        tournament.isFinished = isFinished;
        this.saveTournamentToLocalStorage(tournament);
      }
    } catch (error) {
      console.error('Error toggling tournament status:', error);
    }
  }

  async createTournament(data: {
    name: string;
    joinCode: string;
    formatType: 'fixed' | 'free';
    team1Size: number | null;
    team2Size: number | null;
    maxPlayers: number;
    isPrivate: boolean;
    mode?: 'elo' | 'bracket';
    creatorUserId: string | null;
    creatorAnonymousUserId: string | null;
  }): Promise<string> {
    if (!this.isSupabaseAvailable()) {
      const tournamentId = crypto.randomUUID();
      const tournament: Tournament = {
        id: tournamentId,
        name: data.name,
        date: new Date().toISOString(),
        format: data.formatType === 'fixed' ? '2v2' : 'libre',
        leagueId: null,
        playerIds: [data.creatorUserId || data.creatorAnonymousUserId || ''],
        matches: [],
        isFinished: false,
        createdAt: new Date().toISOString(),
      };
      this.saveTournamentToLocalStorage(tournament);
      return tournamentId;
    }
    try {
      const { data: tournament, error } = await sb!
        .from('tournaments')
        .insert({
          name: data.name,
          date: new Date().toISOString().split('T')[0],
          join_code: data.joinCode,
          format_type: data.formatType,
          team1_size: data.team1Size,
          team2_size: data.team2Size,
          max_players: data.maxPlayers,
          is_private: data.isPrivate,
          status: 'active',
          // mig 022: single creator_user_id (anon or auth, both live in users)
          creator_user_id: data.creatorUserId || data.creatorAnonymousUserId,
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

  async tournamentCodeExists(joinCode: string): Promise<boolean> {
    if (!this.isSupabaseAvailable()) return false;
    try {
      const { data } = await sb!
        .from('tournaments')
        .select('id')
        .eq('join_code', joinCode)
        .maybeSingle();
      return data !== null;
    } catch (error) {
      console.error('Error in tournamentCodeExists:', error);
      return false;
    }
  }

  /**
   * Quitte un tournoi : supprime le tournament_memberships du caller.
   * Le creator ne peut pas quitter.
   */
  async leaveTournament(
    tournamentId: string,
    userId?: string,
    anonymousUserId?: string
  ): Promise<void> {
    const myUserId = userId || anonymousUserId;
    if (!myUserId) throw new Error('User identity required');
    if (!this.isSupabaseAvailable()) throw new Error('Cannot leave tournament in offline mode');

    try {
      const { data: tRow } = await sb!
        .from('tournaments')
        .select('creator_user_id')
        .eq('id', tournamentId)
        .single();
      const t = tRow as { creator_user_id: string | null } | null;
      if (t && t.creator_user_id === myUserId) {
        throw new Error("Le créateur de l'événement ne peut pas quitter");
      }

      // Find my player, then delete the membership
      const { data: myPlayer } = await sb!
        .from('players')
        .select('id')
        .eq('user_id', myUserId)
        .maybeSingle();
      if (!myPlayer) return;
      const playerId = (myPlayer as { id: string }).id;

      const { error } = await sb!
        .from('tournament_memberships')
        .delete()
        .eq('tournament_id', tournamentId)
        .eq('player_id', playerId);
      if (error) throw error;
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
    if (index >= 0) tournaments[index] = tournament;
    else tournaments.push(tournament);
    localStorage.setItem('bpl_tournaments', JSON.stringify(tournaments));
  }

  private deleteTournamentFromLocalStorage(tournamentId: string): void {
    const tournaments = this.loadTournamentsFromLocalStorage();
    const filtered = tournaments.filter((t) => t.id !== tournamentId);
    localStorage.setItem('bpl_tournaments', JSON.stringify(filtered));
  }
}

export const tournamentsRepository = new TournamentsRepository();
