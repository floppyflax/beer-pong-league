/**
 * DatabaseService - Façade autour des repositories spécialisés
 *
 * Ce fichier ré-exporte toutes les méthodes des repositories (`./repositories/*`)
 * afin de préserver l'API publique historique de `databaseService`. Aucun import
 * externe ne doit être cassé par ce refactor.
 *
 * La logique métier réelle se trouve dans :
 *   - src/services/repositories/LeaguesRepository.ts
 *   - src/services/repositories/TournamentsRepository.ts
 *   - src/services/repositories/PlayersRepository.ts
 *   - src/services/repositories/MatchesRepository.ts
 *   - src/services/repositories/_base.ts (helpers partagés)
 */

import type { League, Tournament, Player, Match } from '../types';
import { leaguesRepository } from './repositories/LeaguesRepository';
import {
  tournamentsRepository,
  type TournamentUpdates,
} from './repositories/TournamentsRepository';
import { playersRepository } from './repositories/PlayersRepository';
import { matchesRepository } from './repositories/MatchesRepository';

// Re-export so external callers (LeagueContext, tests) can import the shape
// of the updates object without digging into the repository module.
export type { TournamentUpdates };

class DatabaseService {
  // ===== Leagues =====

  loadLeagues(userId?: string, anonymousUserId?: string): Promise<League[]> {
    return leaguesRepository.loadLeagues(userId, anonymousUserId);
  }

  saveLeague(league: League): Promise<void> {
    return leaguesRepository.saveLeague(league);
  }

  deleteLeague(leagueId: string): Promise<void> {
    return leaguesRepository.deleteLeague(leagueId);
  }

  updateLeague(leagueId: string, name: string, type: 'one-shot' | 'season'): Promise<void> {
    return leaguesRepository.updateLeague(leagueId, name, type);
  }

  getLeagueById(leagueId: string): Promise<{ name: string } | null> {
    return leaguesRepository.getLeagueById(leagueId);
  }

  leagueCodeExists(joinCode: string): Promise<boolean> {
    return leaguesRepository.leagueCodeExists(joinCode);
  }

  // ===== Tournaments =====

  loadTournaments(userId?: string, anonymousUserId?: string): Promise<Tournament[]> {
    return tournamentsRepository.loadTournaments(userId, anonymousUserId);
  }

  loadTournamentById(tournamentId: string): Promise<Tournament | null> {
    return tournamentsRepository.loadTournamentById(tournamentId);
  }

  saveTournament(tournament: Tournament): Promise<void> {
    return tournamentsRepository.saveTournament(tournament);
  }

  deleteTournament(tournamentId: string): Promise<void> {
    return tournamentsRepository.deleteTournament(tournamentId);
  }

  updateTournament(
    tournamentId: string,
    updates: TournamentUpdates
  ): Promise<void> {
    return tournamentsRepository.updateTournament(tournamentId, updates);
  }

  toggleTournamentStatus(tournamentId: string, isFinished: boolean): Promise<void> {
    return tournamentsRepository.toggleTournamentStatus(tournamentId, isFinished);
  }

  associateTournamentToLeague(
    tournamentId: string,
    leagueId: string | null,
  ): Promise<void> {
    return tournamentsRepository.associateTournamentToLeague(tournamentId, leagueId);
  }

  createTournament(data: {
    name: string;
    /** Human-facing format ('1v1' | '2v2' | '3v3' | 'libre'). Written to the
     *  `format` column so that loadTournaments can read it back directly. */
    format?: '1v1' | '2v2' | '3v3' | 'libre';
    joinCode: string;
    formatType: 'fixed' | 'free';
    team1Size: number | null;
    team2Size: number | null;
    maxPlayers: number;
    isPrivate: boolean;
    // Competition mode — defaults to 'elo' server-side (see migration 011).
    // Only passed when caller wants to create a Bracket tournament; the DB
    // default handles the common ELO case.
    mode?: 'elo' | 'bracket';
    creatorUserId: string | null;
    creatorAnonymousUserId: string | null;
  }): Promise<string> {
    return tournamentsRepository.createTournament(data);
  }

  tournamentCodeExists(joinCode: string): Promise<boolean> {
    return tournamentsRepository.tournamentCodeExists(joinCode);
  }

  leaveTournament(
    tournamentId: string,
    userId?: string,
    anonymousUserId?: string
  ): Promise<void> {
    return tournamentsRepository.leaveTournament(tournamentId, userId, anonymousUserId);
  }

  // ===== Players =====

  addPlayerToLeague(
    leagueId: string,
    player: Player,
    userId?: string | null,
    anonymousUserId?: string | null
  ): Promise<void> {
    // mig 022: anonymousUserId merged into userId namespace (single users table)
    return playersRepository.addPlayerToLeague(leagueId, player, userId || anonymousUserId);
  }

  loadPlayerById(playerId: string): Promise<{
    player: Player;
    leagueId?: string;
    leagueName?: string;
    tournamentId?: string;
  } | null> {
    return playersRepository.loadPlayerById(playerId);
  }

  loadPlayerEnrichment(playerId: string): Promise<{
    avatarUrl: string | null;
    joinedAt: string | null;
    userId: string | null;
  } | null> {
    return playersRepository.loadPlayerEnrichment(playerId);
  }

  loadTournamentParticipants(tournamentId: string): Promise<
    {
      id: string;
      leaguePlayerId?: string;
      name: string;
      elo: number;
      matchesPlayed: number;
      wins: number;
      losses: number;
      joinedAt: string;
      avatarUrl?: string | null;
      isArchived?: boolean;
    }[]
  > {
    return playersRepository.loadTournamentParticipants(tournamentId);
  }

  addAnonymousPlayerToTournament(
    tournamentId: string,
    playerName: string,
    anonymousUserId: string
  ): Promise<string> {
    return playersRepository.addAnonymousPlayerToTournament(
      tournamentId,
      playerName,
      anonymousUserId
    );
  }

  addGuestPlayerToTournament(
    tournamentId: string,
    playerName: string
  ): Promise<string> {
    return playersRepository.addGuestPlayerToTournament(tournamentId, playerName);
  }

  addLeaguePlayerToTournament(
    tournamentId: string,
    leaguePlayerId: string
  ): Promise<string> {
    return playersRepository.addLeaguePlayerToTournament(tournamentId, leaguePlayerId);
  }

  updatePlayer(
    leagueId: string,
    playerId: string,
    updates: Partial<Player>
  ): Promise<void> {
    return playersRepository.updatePlayer(leagueId, playerId, updates);
  }

  deletePlayer(leagueId: string, playerId: string): Promise<void> {
    return playersRepository.deletePlayer(leagueId, playerId);
  }

  // ===== Matches =====

  recordMatch(
    leagueId: string,
    match: Match,
    eloChanges: Record<string, { before: number; after: number; change: number }>,
    userId?: string | null,
    anonymousUserId?: string | null
  ): Promise<void> {
    return matchesRepository.recordMatch(leagueId, match, eloChanges, userId, anonymousUserId);
  }

  recordTournamentMatch(
    tournamentId: string,
    match: Match,
    eventEloChanges: Record<string, { before: number; after: number; change: number }>,
    userId?: string | null,
    anonymousUserId?: string | null,
    leagueEloChanges?: Record<string, { before: number; after: number; change: number }>,
    /** @deprecated since mig 022. */
    tournamentPlayerIdToLeaguePlayerId?: Record<string, string>
  ): Promise<void> {
    return matchesRepository.recordTournamentMatch(
      tournamentId,
      match,
      eventEloChanges,
      userId,
      anonymousUserId,
      leagueEloChanges,
      tournamentPlayerIdToLeaguePlayerId
    );
  }
}

export const databaseService = new DatabaseService();
