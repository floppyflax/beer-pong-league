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
 * Depuis mig 030 : si le parent (event OU league) a `anti_cheat_enabled`,
 * le match est inséré en `status: 'pending'` et `apply_match_elo` n'est
 * **pas** appelé (il refuserait avec `check_violation` de toute façon).
 * Le caller reçoit `{ status: 'pending' }` pour ajuster son toast / UI.
 * La confirmation passe ensuite par `confirmMatch()` → RPC `confirm_match`.
 *
 * Si la migration 025 n'est pas appliquée, le match sera bien créé mais
 * l'ELO ne sera pas calculé — un warning console est émis dans ce cas.
 */

import type { Match } from '../../types';
import { BaseRepository, sb } from './_base';
import { leaguesRepository } from './LeaguesRepository';
import { eventsRepository } from './EventsRepository';

export type RecordMatchResult = { status: 'confirmed' | 'pending' };
export type ConfirmMatchDecision = 'confirmed' | 'rejected';

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

  /**
   * Inspect parent contexts to decide if the new match should land in
   * `pending` (anti-cheat ON anywhere up the chain) or proceed straight
   * to `confirmed`. Returns the league_id of an event-linked match too
   * — recordEventMatch needs it for the INSERT.
   */
  private async resolveParentAntiCheat(args: {
    eventId?: string | null;
    leagueId?: string | null;
  }): Promise<{ antiCheatOn: boolean; eventLeagueId: string | null }> {
    if (!sb) return { antiCheatOn: false, eventLeagueId: null };

    let antiCheatOn = false;
    let eventLeagueId: string | null = null;

    if (args.eventId) {
      const { data: tRow } = await sb
        .from('events')
        .select('league_id, anti_cheat_enabled')
        .eq('id', args.eventId)
        .single();
      if (tRow) {
        const row = tRow as { league_id: string | null; anti_cheat_enabled: boolean | null };
        eventLeagueId = row.league_id;
        if (row.anti_cheat_enabled) antiCheatOn = true;
      }
    }

    const effectiveLeagueId = args.leagueId ?? eventLeagueId;
    if (effectiveLeagueId) {
      const { data: lRow } = await sb
        .from('leagues')
        .select('anti_cheat_enabled')
        .eq('id', effectiveLeagueId)
        .single();
      if (lRow) {
        const row = lRow as { anti_cheat_enabled: boolean | null };
        if (row.anti_cheat_enabled) antiCheatOn = true;
      }
    }

    return { antiCheatOn, eventLeagueId };
  }

  /**
   * Translate membership IDs (event_memberships.id or league_memberships.id)
   * into the canonical players.id values that `matches.team_*_player_ids` is
   * supposed to store per schema. React state historically keys players by
   * membership ID (for per-context ELO/stats lookup) and the call sites pass
   * those membership IDs through verbatim, so the DB row used to end up with
   * the wrong namespace — silently breaking `apply_match_elo` (mig 025) which
   * looks the IDs up in `*_memberships.player_id`. We fix that at the write
   * boundary here.
   *
   * Falls back to the original ID for any unmapped value, so callers passing
   * a real `players.id` (post-refactor) or an orphan membership ID stay
   * intact rather than nullified.
   */
  private async resolveToPlayerIds(
    ids: string[],
    ctx: { eventId?: string | null; leagueId?: string | null },
  ): Promise<string[]> {
    if (!sb || ids.length === 0) return ids;
    const table = ctx.eventId ? 'event_memberships' : 'league_memberships';
    const ctxColumn = ctx.eventId ? 'event_id' : 'league_id';
    const ctxValue = ctx.eventId ?? ctx.leagueId;
    if (!ctxValue) return ids;
    const { data, error } = await sb
      .from(table)
      .select('id, player_id')
      .eq(ctxColumn, ctxValue)
      .in('id', ids);
    if (error || !data) return ids;
    const map = new Map(
      (data as Array<{ id: string; player_id: string }>).map((r) => [r.id, r.player_id]),
    );
    return ids.map((id) => map.get(id) ?? id);
  }

  async recordMatch(
    leagueId: string,
    match: Match,
    /** @deprecated since mig 025 — kept for API compat; eloChanges are recomputed server-side. */
    _eloChanges: Record<string, { before: number; after: number; change: number }>,
    userId?: string | null,
    anonymousUserId?: string | null,
  ): Promise<RecordMatchResult> {
    void _eloChanges;
    if (!this.isSupabaseAvailable()) {
      const leagues = leaguesRepository.loadLeaguesFromLocalStorage();
      const league = leagues.find((l) => l.id === leagueId);
      if (league) {
        league.matches.push(match);
        leaguesRepository.saveLeagueToLocalStorage(league);
      }
      return { status: 'confirmed' };
    }

    try {
      const format =
        match.teamA.length === 1 && match.teamB.length === 1
          ? '1v1'
          : match.teamA.length === 2 && match.teamB.length === 2
            ? '2v2'
            : '3v3';

      const callerUserId = userId || anonymousUserId || null;

      const [teamAPlayerIds, teamBPlayerIds] = await Promise.all([
        this.resolveToPlayerIds(match.teamA, { leagueId }),
        this.resolveToPlayerIds(match.teamB, { leagueId }),
      ]);

      // Mig 030 — anti-cheat awareness on INSERT
      const { antiCheatOn } = await this.resolveParentAntiCheat({ leagueId });
      const status: 'pending' | 'confirmed' = antiCheatOn ? 'pending' : 'confirmed';

      const { error: matchError } = await sb!.from('matches').insert({
        id: match.id,
        league_id: leagueId,
        event_id: null,
        format,
        team_a_player_ids: teamAPlayerIds,
        team_b_player_ids: teamBPlayerIds,
        score_a: match.scoreA,
        score_b: match.scoreB,
        created_at: match.date,
        created_by_user_id: callerUserId,
        status,
        cups_remaining: match.cups_remaining ?? null,
        photo_url: match.photo_url ?? null,
      });
      if (matchError) throw matchError;

      // Server-side ELO calculation (mig 025) — single source of truth
      // for elo_history rows + league_memberships stats. Skip when pending;
      // confirm_match will trigger it on confirmation.
      if (status === 'confirmed') {
        await this.applyMatchElo(match.id);
      }

      // localStorage cache — mirror the DB status so the UI doesn't show
      // an immediate ELO delta for a pending match.
      const leagues = leaguesRepository.loadLeaguesFromLocalStorage();
      const league = leagues.find((l) => l.id === leagueId);
      if (league) {
        league.matches.push({ ...match, status });
        leaguesRepository.saveLeagueToLocalStorage(league);
      }

      return { status };
    } catch (error) {
      console.error('Error recording match in Supabase:', error);
      const leagues = leaguesRepository.loadLeaguesFromLocalStorage();
      const league = leagues.find((l) => l.id === leagueId);
      if (league) {
        league.matches.push(match);
        leaguesRepository.saveLeagueToLocalStorage(league);
      }
      return { status: 'confirmed' };
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
  ): Promise<RecordMatchResult> {
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
      return { status: 'confirmed' };
    }

    try {
      // Mig 030 — single SELECT pulls league_id + anti-cheat state.
      const { antiCheatOn, eventLeagueId } = await this.resolveParentAntiCheat({ eventId });
      const leagueId = eventLeagueId;
      const status: 'pending' | 'confirmed' = antiCheatOn ? 'pending' : 'confirmed';

      const format =
        match.teamA.length === 1 && match.teamB.length === 1
          ? '1v1'
          : match.teamA.length === 2 && match.teamB.length === 2
            ? '2v2'
            : '3v3';

      const callerUserId = userId || anonymousUserId || null;

      const [teamAPlayerIds, teamBPlayerIds] = await Promise.all([
        this.resolveToPlayerIds(match.teamA, { eventId }),
        this.resolveToPlayerIds(match.teamB, { eventId }),
      ]);

      const { error: matchError } = await sb!.from('matches').insert({
        id: match.id,
        league_id: leagueId,
        event_id: eventId,
        format,
        team_a_player_ids: teamAPlayerIds,
        team_b_player_ids: teamBPlayerIds,
        score_a: match.scoreA,
        score_b: match.scoreB,
        created_at: match.date,
        created_by_user_id: callerUserId,
        status,
        cups_remaining: match.cups_remaining ?? null,
        photo_url: match.photo_url ?? null,
      });
      if (matchError) throw matchError;

      // Server-side ELO calculation handles both contexts (event +
      // optional league propagation) in one call — no need to differentiate
      // here. Propagation honours events.propagates_to_league_elo. Skip on
      // pending; confirm_match will dispatch it.
      if (status === 'confirmed') {
        await this.applyMatchElo(match.id);
      }

      const events = eventsRepository.loadEventsFromLocalStorage();
      const event = events.find((t) => t.id === eventId);
      if (event) {
        event.matches.push({ ...match, status });
        eventsRepository.saveEventToLocalStorage(event);
      }

      return { status };
    } catch (error) {
      console.error('Error recording event match in Supabase:', error);
      const events = eventsRepository.loadEventsFromLocalStorage();
      const event = events.find((t) => t.id === eventId);
      if (event) {
        event.matches.push(match);
        eventsRepository.saveEventToLocalStorage(event);
      }
      return { status: 'confirmed' };
    }
  }

  /**
   * Mig 030 — confirm or reject a pending anti-cheat match.
   *
   * Wraps the `confirm_match` SECURITY DEFINER RPC. The server validates
   * authorization (opponent vs admin mode) and applies ELO on confirm.
   * Surfaces server errors as a thrown Error with a user-friendly message.
   */
  async confirmMatch(
    matchId: string,
    decision: ConfirmMatchDecision,
    callerUserId: string,
  ): Promise<void> {
    if (!sb) {
      throw new Error('La validation des scores nécessite une connexion réseau.');
    }
    const { error } = await sb.rpc('confirm_match', {
      p_match_id: matchId,
      p_decision: decision,
      p_caller_user_id: callerUserId,
    });
    if (error) {
      // Map known ERRCODEs to human messages. The RPC error object exposes
      // a `code` field on PostgrestError at runtime, but the generated
      // typings for our (unspecified) RPC return shape only declare
      // `message`, so we narrow defensively.
      const errCode = (error as { code?: string }).code;
      if (errCode === 'insufficient_privilege') {
        throw new Error("Tu n'as pas les droits pour valider ce match.");
      }
      if (errCode === 'check_violation') {
        throw new Error('Ce match ne peut plus être validé (déjà confirmé ou rejeté).');
      }
      if (errCode === 'no_data_found') {
        throw new Error('Match introuvable.');
      }
      console.error('confirm_match failed:', error);
      throw new Error('La validation a échoué. Réessaie dans un instant.');
    }
  }
}

export const matchesRepository = new MatchesRepository();
