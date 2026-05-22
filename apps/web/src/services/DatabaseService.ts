/**
 * DatabaseService - Façade autour des repositories spécialisés
 *
 * Ce fichier ré-exporte toutes les méthodes des repositories (`./repositories/*`)
 * afin de préserver l'API publique historique de `databaseService`. Aucun import
 * externe ne doit être cassé par ce refactor.
 *
 * La logique métier réelle se trouve dans :
 *   - src/services/repositories/LeaguesRepository.ts
 *   - src/services/repositories/EventsRepository.ts
 *   - src/services/repositories/PlayersRepository.ts
 *   - src/services/repositories/MatchesRepository.ts
 *   - src/services/repositories/_base.ts (helpers partagés)
 */

import type { League, LeagueSeasonArchive, Event, Player, Match } from '../types';
import { leaguesRepository } from './repositories/LeaguesRepository';
import {
  eventsRepository,
  type EventUpdates,
  type EventLeagueAssociationResult,
} from './repositories/EventsRepository';
import { playersRepository } from './repositories/PlayersRepository';
import {
  matchesRepository,
  type RecordMatchResult,
  type ConfirmMatchDecision,
} from './repositories/MatchesRepository';

// Re-export so external callers (LeagueContext, tests) can import the shape
// of the updates object without digging into the repository module.
export type {
  EventUpdates,
  EventLeagueAssociationResult,
  RecordMatchResult,
  ConfirmMatchDecision,
};

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

  // Lifecycle league (mig 028)
  pauseLeague(leagueId: string): Promise<void> {
    return leaguesRepository.pauseLeague(leagueId);
  }
  resumeLeague(leagueId: string): Promise<void> {
    return leaguesRepository.resumeLeague(leagueId);
  }
  finishLeague(leagueId: string): Promise<void> {
    return leaguesRepository.finishLeague(leagueId);
  }
  reopenLeague(leagueId: string): Promise<void> {
    return leaguesRepository.reopenLeague(leagueId);
  }
  finishCurrentLeagueSeason(leagueId: string): Promise<void> {
    return leaguesRepository.finishCurrentSeason(leagueId);
  }
  startNewLeagueSeason(leagueId: string): Promise<number> {
    return leaguesRepository.startNewSeason(leagueId);
  }
  loadLeagueSeasonArchives(leagueId: string): Promise<LeagueSeasonArchive[]> {
    return leaguesRepository.loadSeasonArchives(leagueId);
  }

  // ===== Events =====

  loadEvents(userId?: string, anonymousUserId?: string): Promise<Event[]> {
    return eventsRepository.loadEvents(userId, anonymousUserId);
  }

  loadEventById(eventId: string): Promise<Event | null> {
    return eventsRepository.loadEventById(eventId);
  }

  saveEvent(event: Event): Promise<void> {
    return eventsRepository.saveEvent(event);
  }

  deleteEvent(eventId: string): Promise<void> {
    return eventsRepository.deleteEvent(eventId);
  }

  updateEvent(
    eventId: string,
    updates: EventUpdates
  ): Promise<void> {
    return eventsRepository.updateEvent(eventId, updates);
  }

  toggleEventStatus(eventId: string, isFinished: boolean): Promise<void> {
    return eventsRepository.toggleEventStatus(eventId, isFinished);
  }

  startEvent(eventId: string): Promise<void> {
    return eventsRepository.startEvent(eventId);
  }

  pauseEvent(eventId: string): Promise<void> {
    return eventsRepository.pauseEvent(eventId);
  }

  resumeEvent(eventId: string): Promise<void> {
    return eventsRepository.resumeEvent(eventId);
  }

  associateEventToLeague(
    eventId: string,
    leagueId: string | null,
  ): Promise<EventLeagueAssociationResult> {
    return eventsRepository.associateEventToLeague(eventId, leagueId);
  }

  createEvent(data: {
    name: string;
    /** Human-facing format ('1v1' | '2v2' | '3v3' | 'libre'). Written to the
     *  `format` column so that loadEvents can read it back directly. */
    format?: '1v1' | '2v2' | '3v3' | 'libre';
    joinCode: string;
    formatType: 'fixed' | 'free';
    team1Size: number | null;
    team2Size: number | null;
    maxPlayers: number;
    isPrivate: boolean;
    // Competition mode — defaults to 'elo' server-side (see migration 011).
    // Only passed when caller wants to create a Bracket event; the DB
    // default handles the common ELO case.
    mode?: 'elo' | 'bracket';
    /** ISO date string `YYYY-MM-DD`. Defaults to today if omitted. */
    date?: string;
    creatorUserId: string | null;
    creatorAnonymousUserId: string | null;
  }): Promise<string> {
    return eventsRepository.createEvent(data);
  }

  eventCodeExists(joinCode: string): Promise<boolean> {
    return eventsRepository.eventCodeExists(joinCode);
  }

  leaveEvent(
    eventId: string,
    userId?: string,
    anonymousUserId?: string
  ): Promise<void> {
    return eventsRepository.leaveEvent(eventId, userId, anonymousUserId);
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
    eventId?: string;
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

  loadEventParticipants(eventId: string): Promise<
    {
      id: string;
      /**
       * Mig 022 — `players.id`. Callers matching against
       * `matches.team_*_player_ids` MUST use this field (not `id`, which
       * is the `event_memberships.id`).
       */
      playerId: string;
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
    return playersRepository.loadEventParticipants(eventId);
  }

  addAnonymousPlayerToEvent(
    eventId: string,
    playerName: string,
    anonymousUserId: string
  ): Promise<string> {
    return playersRepository.addAnonymousPlayerToEvent(
      eventId,
      playerName,
      anonymousUserId
    );
  }

  addGuestPlayerToEvent(
    eventId: string,
    playerName: string
  ): Promise<string> {
    return playersRepository.addGuestPlayerToEvent(eventId, playerName);
  }

  addLeaguePlayerToEvent(
    eventId: string,
    leaguePlayerId: string
  ): Promise<string> {
    return playersRepository.addLeaguePlayerToEvent(eventId, leaguePlayerId);
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
  ): Promise<RecordMatchResult> {
    return matchesRepository.recordMatch(leagueId, match, eloChanges, userId, anonymousUserId);
  }

  recordEventMatch(
    eventId: string,
    match: Match,
    eventEloChanges: Record<string, { before: number; after: number; change: number }>,
    userId?: string | null,
    anonymousUserId?: string | null,
    leagueEloChanges?: Record<string, { before: number; after: number; change: number }>,
    /** @deprecated since mig 022. */
    eventPlayerIdToLeaguePlayerId?: Record<string, string>
  ): Promise<RecordMatchResult> {
    return matchesRepository.recordEventMatch(
      eventId,
      match,
      eventEloChanges,
      userId,
      anonymousUserId,
      leagueEloChanges,
      eventPlayerIdToLeaguePlayerId
    );
  }

  /** Mig 030 — confirm or reject a pending anti-cheat match (RPC `confirm_match`). */
  confirmMatch(
    matchId: string,
    decision: ConfirmMatchDecision,
    callerUserId: string,
  ): Promise<void> {
    return matchesRepository.confirmMatch(matchId, decision, callerUserId);
  }
}

export const databaseService = new DatabaseService();
