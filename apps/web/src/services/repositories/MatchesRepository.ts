/**
 * MatchesRepository — enregistre les matches.
 *
 * Depuis mig 022 : `matches.team_a/b_player_ids` référencent `players.id`
 * directement.
 *
 * Depuis mig 025 : l'ELO est calculé serveur via la fonction `apply_match_elo`
 * (SECURITY DEFINER). Le repo n'écrit plus elo_history ni *_memberships
 * stats — il insère le match puis appelle la RPC. Les `eloChanges` reçus
 * du caller sont uniquement utilisés pour la preview UI immédiate
 * (EloChangeDisplay) ; la source de vérité reste le calcul serveur.
 *
 * Si la migration 025 n'est pas appliquée, le match sera bien créé mais
 * l'ELO ne sera pas calculé — un warning console est émis dans ce cas.
 */

import type { Match } from '../../types';
import { BaseRepository, sb } from './_base';
import { leaguesRepository } from './LeaguesRepository';
import { eventsRepository } from './EventsRepository';

class MatchesRepository extends BaseRepository {
  /**
   * Calls the SECURITY DEFINER `apply_match_elo` RPC — this is the only
   * legitimate write path for elo_history / *_memberships stats since
   * mig 025.
   */
  private async applyMatchElo(matchId: string): Promise<void> {
    if (!sb) return;
    const { error } = await sb.rpc('apply_match_elo', { p_match_id: matchId });
    if (error) {
      // Log but don't throw: the match row is already saved, the local
      // React state is up-to-date with the client-side preview, and a
      // later admin recalculate_league_elo can rebuild from authoritative
      // server logic. Throwing here would surface a user-facing error
      // for what is effectively an eventually-consistent gap.
      console.error('apply_match_elo failed:', error);
    }
  }

  async recordMatch(
    leagueId: string,
    match: Match,
    /** @deprecated since mig 025 — kept for API compat; eloChanges are recomputed server-side. */
    _eloChanges: Record<string, { before: number; after: number; change: number }>,
    userId?: string | null,
    anonymousUserId?: string | null,
  ): Promise<void> {
    void _eloChanges;
    if (!this.isSupabaseAvailable()) {
      const leagues = leaguesRepository.loadLeaguesFromLocalStorage();
      const league = leagues.find((l) => l.id === leagueId);
      if (league) {
        league.matches.push(match);
        leaguesRepository.saveLeagueToLocalStorage(league);
      }
      return;
    }

    try {
      const format =
        match.teamA.length === 1 && match.teamB.length === 1
          ? '1v1'
          : match.teamA.length === 2 && match.teamB.length === 2
            ? '2v2'
            : '3v3';

      const callerUserId = userId || anonymousUserId || null;

      const { error: matchError } = await sb!.from('matches').insert({
        id: match.id,
        league_id: leagueId,
        event_id: null,
        format,
        team_a_player_ids: match.teamA,
        team_b_player_ids: match.teamB,
        score_a: match.scoreA,
        score_b: match.scoreB,
        created_at: match.date,
        created_by_user_id: callerUserId,
        cups_remaining: match.cups_remaining ?? null,
        photo_url: match.photo_url ?? null,
      });
      if (matchError) throw matchError;

      // Server-side ELO calculation (mig 025) — single source of truth
      // for elo_history rows + league_memberships stats.
      await this.applyMatchElo(match.id);

      // localStorage cache
      const leagues = leaguesRepository.loadLeaguesFromLocalStorage();
      const league = leagues.find((l) => l.id === leagueId);
      if (league) {
        league.matches.push(match);
        leaguesRepository.saveLeagueToLocalStorage(league);
      }
    } catch (error) {
      console.error('Error recording match in Supabase:', error);
      const leagues = leaguesRepository.loadLeaguesFromLocalStorage();
      const league = leagues.find((l) => l.id === leagueId);
      if (league) {
        league.matches.push(match);
        leaguesRepository.saveLeagueToLocalStorage(league);
      }
    }
  }

  /**
   * Event match. Inserts a single match row that may also link to a league
   * (when the event is league-linked and propagates_to_league_elo is true).
   * The server-side `apply_match_elo` walks both contexts independently —
   * one set of elo_history rows for the event context, one for the league
   * context, with separate baselines.
   */
  async recordEventMatch(
    eventId: string,
    match: Match,
    /** @deprecated since mig 025 — eloChanges are recomputed server-side. */
    _eventEloChanges: Record<string, { before: number; after: number; change: number }>,
    userId?: string | null,
    anonymousUserId?: string | null,
    /** @deprecated since mig 025. */
    _leagueEloChanges?: Record<string, { before: number; after: number; change: number }>,
    /** @deprecated since mig 022. */
    _legacyMapping?: Record<string, string>,
  ): Promise<void> {
    void _eventEloChanges;
    void _leagueEloChanges;
    void _legacyMapping;
    if (!this.isSupabaseAvailable()) {
      const events = eventsRepository.loadEventsFromLocalStorage();
      const event = events.find((t) => t.id === eventId);
      if (event) {
        event.matches.push(match);
        eventsRepository.saveEventToLocalStorage(event);
      }
      return;
    }

    try {
      const { data: tData } = await sb!
        .from('events')
        .select('league_id')
        .eq('id', eventId)
        .single();
      if (!tData) throw new Error('Event not found');
      const leagueId = (tData as { league_id: string | null }).league_id;

      const format =
        match.teamA.length === 1 && match.teamB.length === 1
          ? '1v1'
          : match.teamA.length === 2 && match.teamB.length === 2
            ? '2v2'
            : '3v3';

      const callerUserId = userId || anonymousUserId || null;

      const { error: matchError } = await sb!.from('matches').insert({
        id: match.id,
        league_id: leagueId,
        event_id: eventId,
        format,
        team_a_player_ids: match.teamA,
        team_b_player_ids: match.teamB,
        score_a: match.scoreA,
        score_b: match.scoreB,
        created_at: match.date,
        created_by_user_id: callerUserId,
        cups_remaining: match.cups_remaining ?? null,
        photo_url: match.photo_url ?? null,
      });
      if (matchError) throw matchError;

      // Server-side ELO calculation handles both contexts (event +
      // optional league propagation) in one call — no need to differentiate
      // here. Propagation honours events.propagates_to_league_elo.
      await this.applyMatchElo(match.id);

      const events = eventsRepository.loadEventsFromLocalStorage();
      const event = events.find((t) => t.id === eventId);
      if (event) {
        event.matches.push(match);
        eventsRepository.saveEventToLocalStorage(event);
      }
    } catch (error) {
      console.error('Error recording event match in Supabase:', error);
      const events = eventsRepository.loadEventsFromLocalStorage();
      const event = events.find((t) => t.id === eventId);
      if (event) {
        event.matches.push(match);
        eventsRepository.saveEventToLocalStorage(event);
      }
    }
  }
}

export const matchesRepository = new MatchesRepository();
