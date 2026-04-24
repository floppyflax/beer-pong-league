/**
 * PlayersRepository - Gère les joueurs (league_players, tournament_players)
 * et utilise leaguesRepository / tournamentsRepository pour le fallback localStorage.
 */

import type { Player } from '../../types';
import { BaseRepository, supabase } from './_base';
import { leaguesRepository } from './LeaguesRepository';
import { tournamentsRepository } from './TournamentsRepository';

/**
 * Shape attendue d'une ligne `tournament_players` avec relations
 * (retournée par Supabase lors d'un select imbriqué).
 */
interface TournamentPlayerWithRelations {
  id: string;
  tournament_id: string;
  user_id?: string | null;
  anonymous_user_id?: string | null;
  pseudo_in_tournament?: string | null;
  joined_at?: string;
  user?: { id?: string; pseudo?: string } | null;
  anonymous_user?: { id?: string; pseudo?: string } | null;
}

class PlayersRepository extends BaseRepository {
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
      const leagues = leaguesRepository.loadLeaguesFromLocalStorage();
      const league = leagues.find((l) => l.id === leagueId);
      if (league) {
        league.players.push(player);
        leaguesRepository.saveLeagueToLocalStorage(league);
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
      const leagues = leaguesRepository.loadLeaguesFromLocalStorage();
      const league = leagues.find((l) => l.id === leagueId);
      if (league && !league.players.find((p) => p.id === player.id)) {
        league.players.push(player);
        leaguesRepository.saveLeagueToLocalStorage(league);
      }
    } catch (error) {
      console.error('Error adding player to league in Supabase:', error);
      // Fallback vers localStorage
      const leagues = leaguesRepository.loadLeaguesFromLocalStorage();
      const league = leagues.find((l) => l.id === leagueId);
      if (league && !league.players.find((p) => p.id === player.id)) {
        league.players.push(player);
        leaguesRepository.saveLeagueToLocalStorage(league);
      }
    }
  }

  /**
   * Charge un joueur par ID (league_players ou tournament_players).
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
        const lp = lpData as unknown as {
          id: string;
          league_id: string;
          pseudo_in_league: string;
          elo?: number;
          wins?: number;
          losses?: number;
          matches_played?: number;
        };
        const league = await leaguesRepository.getLeagueById(lp.league_id);
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
        .select(
          `
          id,
          pseudo_in_tournament,
          tournament_id,
          user_id,
          anonymous_user_id,
          user:users ( pseudo ),
          anonymous_user:anonymous_users ( pseudo )
        `
        )
        .eq('id', playerId)
        .maybeSingle();

      if (tpData) {
        const tp = tpData as unknown as TournamentPlayerWithRelations;
        const name =
          tp.pseudo_in_tournament ||
          tp.user?.pseudo ||
          tp.anonymous_user?.pseudo ||
          'Joueur';

        // Essayer de récupérer les stats league si le tournoi a une league
        const { data: tData } = await supabase!
          .from('tournaments')
          .select('league_id')
          .eq('id', tp.tournament_id)
          .single();

        let elo = 1500;
        let wins = 0;
        let losses = 0;
        let matchesPlayed = 0;

        const tournamentInfo = tData as { league_id: string | null } | null;

        if (tournamentInfo?.league_id) {
          let lpResult: {
            data: {
              elo: number;
              wins: number;
              losses: number;
              matches_played: number;
            } | null;
          } = { data: null };
          if (tp.user_id) {
            const res = await supabase!
              .from('league_players')
              .select('elo, wins, losses, matches_played')
              .eq('league_id', tournamentInfo.league_id)
              .eq('user_id', tp.user_id)
              .maybeSingle();
            lpResult = { data: res.data as typeof lpResult.data };
          } else if (tp.anonymous_user_id) {
            const res = await supabase!
              .from('league_players')
              .select('elo, wins, losses, matches_played')
              .eq('league_id', tournamentInfo.league_id)
              .eq('anonymous_user_id', tp.anonymous_user_id)
              .maybeSingle();
            lpResult = { data: res.data as typeof lpResult.data };
          }

          if (lpResult?.data) {
            elo = lpResult.data.elo || 1500;
            wins = lpResult.data.wins || 0;
            losses = lpResult.data.losses || 0;
            matchesPlayed = lpResult.data.matches_played || 0;
          }
        }

        const leagueId = tournamentInfo?.league_id ?? undefined;
        const league = leagueId ? await leaguesRepository.getLeagueById(leagueId) : null;
        return {
          player: {
            id: tp.id,
            name,
            elo,
            wins,
            losses,
            matchesPlayed,
            streak: 0,
          },
          leagueId,
          leagueName: league?.name,
          tournamentId: tp.tournament_id,
        };
      }

      return null;
    } catch (error) {
      console.error('Error loading player by ID:', error);
      return null;
    }
  }

  /**
   * Charge les participants d'un tournament depuis tournament_players
   */
  async loadTournamentParticipants(tournamentId: string): Promise<
    {
      id: string;
      leaguePlayerId?: string;
      name: string;
      elo: number;
      matchesPlayed: number;
      wins: number;
      losses: number;
      joinedAt: string;
    }[]
  > {
    if (!this.isSupabaseAvailable()) {
      // Fallback to localStorage - get tournament and league data
      const tournaments = tournamentsRepository.loadTournamentsFromLocalStorage();
      const tournament = tournaments.find((t) => t.id === tournamentId);
      if (!tournament || !tournament.leagueId) return [];

      const leagues = leaguesRepository.loadLeaguesFromLocalStorage();
      const league = leagues.find((l) => l.id === tournament.leagueId);
      if (!league) return [];

      return league.players
        .filter((p) => tournament.playerIds.includes(p.id))
        .map((p) => ({
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
        .select(
          `
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
        `
        )
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

      const tournamentInfo = tournamentData as { league_id: string | null } | null;

      const typedData = data as unknown as TournamentPlayerWithRelations[];

      if (!tournamentInfo || !tournamentInfo.league_id) {
        // Autonomous tournament - return basic participant info without stats
        return typedData.map((tp) => ({
          id: tp.id,
          name:
            tp.pseudo_in_tournament ||
            tp.user?.pseudo ||
            tp.anonymous_user?.pseudo ||
            'Anonymous',
          elo: 1500, // Default ELO for autonomous tournaments
          matchesPlayed: 0,
          wins: 0,
          losses: 0,
          joinedAt: tp.joined_at || new Date().toISOString(),
        }));
      }

      // Load league_player stats for each participant
      const participantsWithStats = await Promise.all(
        typedData.map(async (tp) => {
          // Try to find corresponding league_player
          if (!tournamentInfo.league_id) {
            return {
              id: tp.id,
              name:
                tp.pseudo_in_tournament ||
                tp.user?.pseudo ||
                tp.anonymous_user?.pseudo ||
                'Anonymous',
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
            .eq('league_id', tournamentInfo.league_id);

          if (tp.user_id) {
            statsQuery = statsQuery.eq('user_id', tp.user_id);
          } else if (tp.anonymous_user_id) {
            statsQuery = statsQuery.eq('anonymous_user_id', tp.anonymous_user_id);
          }

          const { data: statsData } = await statsQuery.maybeSingle();

          // Type guard to ensure statsData is valid
          const stats =
            statsData && typeof statsData === 'object' && 'elo' in statsData
              ? (statsData as {
                  id: string;
                  elo: number;
                  matches_played: number;
                  wins: number;
                  losses: number;
                })
              : null;

          return {
            id: tp.id,
            leaguePlayerId: stats?.id,
            name:
              tp.pseudo_in_tournament ||
              tp.user?.pseudo ||
              tp.anonymous_user?.pseudo ||
              'Anonymous',
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
      const tournaments = tournamentsRepository.loadTournamentsFromLocalStorage();
      const tournament = tournaments.find((t) => t.id === tournamentId);
      if (tournament) {
        const newPlayerId = crypto.randomUUID();
        tournament.playerIds.push(newPlayerId);
        tournamentsRepository.saveTournamentToLocalStorage(tournament);
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
      const tournaments = tournamentsRepository.loadTournamentsFromLocalStorage();
      const tournament = tournaments.find((t) => t.id === tournamentId);
      if (tournament && !tournament.playerIds.includes(playerId)) {
        tournament.playerIds.push(playerId);
        tournamentsRepository.saveTournamentToLocalStorage(tournament);
      }

      return playerId;
    } catch (error) {
      console.error('Error adding anonymous player to tournament:', error);
      throw error;
    }
  }

  /**
   * Ajoute un "guest" (joueur fantôme sans compte propre) à un tournoi standalone.
   *
   * Crée systématiquement un nouvel `anonymous_users` avec un UUID frais, puis
   * une entrée `tournament_players` qui le référence. Contrairement à
   * `addAnonymousPlayerToTournament`, on ne réutilise jamais l'identité d'un
   * utilisateur existant — chaque appel produit un nouveau guest distinct, ce
   * qui évite la collision sur la contrainte
   * `UNIQUE(tournament_id, anonymous_user_id)`.
   *
   * Usage : ajout manuel par l'admin depuis TournamentDashboard / RecordMatch
   * pour des invités physiques qui n'utilisent pas l'app.
   */
  async addGuestPlayerToTournament(
    tournamentId: string,
    playerName: string
  ): Promise<string> {
    if (!this.isSupabaseAvailable()) {
      const tournaments = tournamentsRepository.loadTournamentsFromLocalStorage();
      const tournament = tournaments.find((t) => t.id === tournamentId);
      if (tournament) {
        const newPlayerId = crypto.randomUUID();
        tournament.playerIds.push(newPlayerId);
        tournamentsRepository.saveTournamentToLocalStorage(tournament);
        return newPlayerId;
      }
      throw new Error('Tournament not found');
    }

    try {
      // 1. Crée un anonymous_user dédié à ce guest (UUID frais à chaque appel).
      const guestAnonymousId = crypto.randomUUID();
      const { error: createError } = await supabase!
        .from('anonymous_users')
        .insert({
          id: guestAnonymousId,
          pseudo: playerName,
        });

      if (createError) throw createError;

      // 2. Crée l'entrée tournament_players liée à ce nouvel anonymous_user.
      const playerId = crypto.randomUUID();
      const joinedAt = new Date().toISOString();
      const { error: insertError } = await supabase!
        .from('tournament_players')
        .insert({
          id: playerId,
          tournament_id: tournamentId,
          anonymous_user_id: guestAnonymousId,
          pseudo_in_tournament: playerName,
          joined_at: joinedAt,
        });

      if (insertError) throw insertError;

      // 3. Synchronise le cache localStorage.
      const tournaments = tournamentsRepository.loadTournamentsFromLocalStorage();
      const tournament = tournaments.find((t) => t.id === tournamentId);
      if (tournament && !tournament.playerIds.includes(playerId)) {
        tournament.playerIds.push(playerId);
        tournamentsRepository.saveTournamentToLocalStorage(tournament);
      }

      return playerId;
    } catch (error) {
      console.error('Error adding guest player to tournament:', error);
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
      const tournaments = tournamentsRepository.loadTournamentsFromLocalStorage();
      const tournament = tournaments.find((t) => t.id === tournamentId);
      if (tournament) {
        tournament.playerIds.push(leaguePlayerId);
        tournamentsRepository.saveTournamentToLocalStorage(tournament);
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

    const lp = leaguePlayer as {
      user_id: string | null;
      anonymous_user_id: string | null;
      pseudo_in_league: string;
    };

    let existingQuery = supabase!
      .from('tournament_players')
      .select('id')
      .eq('tournament_id', tournamentId);
    if (lp.user_id) {
      existingQuery = existingQuery.eq('user_id', lp.user_id);
    } else if (lp.anonymous_user_id) {
      existingQuery = existingQuery.eq('anonymous_user_id', lp.anonymous_user_id);
    } else {
      throw new Error('League player has no user identity');
    }
    const { data: existing } = await existingQuery.maybeSingle();

    if (existing) return (existing as { id: string }).id;

    const newId = crypto.randomUUID();
    const { error: insertError } = await supabase!
      .from('tournament_players')
      .insert({
        id: newId,
        tournament_id: tournamentId,
        user_id: lp.user_id || null,
        anonymous_user_id: lp.anonymous_user_id || null,
        pseudo_in_tournament: lp.pseudo_in_league,
      });

    if (insertError) throw insertError;

    const tournaments = tournamentsRepository.loadTournamentsFromLocalStorage();
    const tournament = tournaments.find((t) => t.id === tournamentId);
    if (tournament && !tournament.playerIds.includes(newId)) {
      tournament.playerIds.push(newId);
      tournamentsRepository.saveTournamentToLocalStorage(tournament);
    }

    return newId;
  }

  /**
   * Met à jour un joueur dans une league
   */
  async updatePlayer(
    leagueId: string,
    playerId: string,
    updates: Partial<Player>
  ): Promise<void> {
    if (!this.isSupabaseAvailable()) {
      const leagues = leaguesRepository.loadLeaguesFromLocalStorage();
      const league = leagues.find((l) => l.id === leagueId);
      if (league) {
        const player = league.players.find((p) => p.id === playerId);
        if (player) {
          Object.assign(player, updates);
          leaguesRepository.saveLeagueToLocalStorage(league);
        }
      }
      return;
    }

    try {
      const updateData: {
        pseudo_in_league?: string;
        elo?: number;
        wins?: number;
        losses?: number;
        matches_played?: number;
        streak?: number;
      } = {};
      if (updates.name !== undefined) updateData.pseudo_in_league = updates.name;
      if (updates.elo !== undefined) updateData.elo = updates.elo;
      if (updates.wins !== undefined) updateData.wins = updates.wins;
      if (updates.losses !== undefined) updateData.losses = updates.losses;
      if (updates.matchesPlayed !== undefined)
        updateData.matches_played = updates.matchesPlayed;
      if (updates.streak !== undefined) updateData.streak = updates.streak;

      const { error } = await supabase!
        .from('league_players')
        .update(updateData)
        .eq('id', playerId)
        .eq('league_id', leagueId);

      if (error) throw error;

      // Update localStorage cache
      const leagues = leaguesRepository.loadLeaguesFromLocalStorage();
      const league = leagues.find((l) => l.id === leagueId);
      if (league) {
        const player = league.players.find((p) => p.id === playerId);
        if (player) {
          Object.assign(player, updates);
          leaguesRepository.saveLeagueToLocalStorage(league);
        }
      }
    } catch (error) {
      console.error('Error updating player in Supabase:', error);
      // Fallback vers localStorage
      const leagues = leaguesRepository.loadLeaguesFromLocalStorage();
      const league = leagues.find((l) => l.id === leagueId);
      if (league) {
        const player = league.players.find((p) => p.id === playerId);
        if (player) {
          Object.assign(player, updates);
          leaguesRepository.saveLeagueToLocalStorage(league);
        }
      }
    }
  }

  /**
   * Supprime un joueur d'une league
   */
  async deletePlayer(leagueId: string, playerId: string): Promise<void> {
    if (!this.isSupabaseAvailable()) {
      const leagues = leaguesRepository.loadLeaguesFromLocalStorage();
      const league = leagues.find((l) => l.id === leagueId);
      if (league) {
        league.players = league.players.filter((p) => p.id !== playerId);
        league.matches = league.matches.filter(
          (m) => !m.teamA.includes(playerId) && !m.teamB.includes(playerId)
        );
        leaguesRepository.saveLeagueToLocalStorage(league);
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
        const typedMatches = matches as {
          id: string;
          team_a_player_ids: string[] | null;
          team_b_player_ids: string[] | null;
        }[];
        const matchesToDelete = typedMatches.filter(
          (m) =>
            (m.team_a_player_ids || []).includes(playerId) ||
            (m.team_b_player_ids || []).includes(playerId)
        );

        for (const match of matchesToDelete) {
          await supabase!.from('matches').delete().eq('id', match.id);
        }
      }

      // Update localStorage cache
      const leagues = leaguesRepository.loadLeaguesFromLocalStorage();
      const league = leagues.find((l) => l.id === leagueId);
      if (league) {
        league.players = league.players.filter((p) => p.id !== playerId);
        league.matches = league.matches.filter(
          (m) => !m.teamA.includes(playerId) && !m.teamB.includes(playerId)
        );
        leaguesRepository.saveLeagueToLocalStorage(league);
      }
    } catch (error) {
      console.error('Error deleting player from Supabase:', error);
      // Fallback vers localStorage
      const leagues = leaguesRepository.loadLeaguesFromLocalStorage();
      const league = leagues.find((l) => l.id === leagueId);
      if (league) {
        league.players = league.players.filter((p) => p.id !== playerId);
        league.matches = league.matches.filter(
          (m) => !m.teamA.includes(playerId) && !m.teamB.includes(playerId)
        );
        leaguesRepository.saveLeagueToLocalStorage(league);
      }
    }
  }
  /**
   * Enrichissement d'un joueur : avatar_url, joined_at, user_id.
   * Cherche d'abord dans league_players, puis tournament_players.
   * Retourne null si Supabase n'est pas disponible.
   */
  async loadPlayerEnrichment(playerId: string): Promise<{
    avatarUrl: string | null;
    joinedAt: string | null;
    userId: string | null;
  } | null> {
    if (!this.isSupabaseAvailable()) return null;

    try {
      // 1. league_players
      const { data: lp } = await supabase!
        .from('league_players')
        .select('user_id, joined_at, user:users(avatar_url)')
        .eq('id', playerId)
        .maybeSingle();

      if (lp) {
        const row = lp as unknown as {
          user_id: string | null;
          joined_at: string | null;
          user: { avatar_url: string | null } | null;
        };
        return {
          userId: row.user_id ?? null,
          joinedAt: row.joined_at ?? null,
          avatarUrl: row.user?.avatar_url ?? null,
        };
      }

      // 2. tournament_players
      const { data: tp } = await supabase!
        .from('tournament_players')
        .select('user_id, joined_at, user:users(avatar_url)')
        .eq('id', playerId)
        .maybeSingle();

      if (tp) {
        const row = tp as unknown as {
          user_id: string | null;
          joined_at: string | null;
          user: { avatar_url: string | null } | null;
        };
        return {
          userId: row.user_id ?? null,
          joinedAt: row.joined_at ?? null,
          avatarUrl: row.user?.avatar_url ?? null,
        };
      }

      return null;
    } catch (error) {
      console.error('Error loading player enrichment:', error);
      return null;
    }
  }
}

export const playersRepository = new PlayersRepository();
