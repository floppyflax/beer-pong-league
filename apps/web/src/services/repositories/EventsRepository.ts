/**
 * EventsRepository — gère les events + leurs membres
 * (`event_memberships`) + matches (mig 022).
 */

import type { Event, Match } from '../../types';
import { safeValidateEvent } from '../../utils/validation';
import {
  BaseRepository,
  sb,
  type EventRow,
  type EventMembershipRow,
  type MatchRow,
} from './_base';

export interface EventUpdates {
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

class EventsRepository extends BaseRepository {
  /**
   * Charge les events où l'user est creator OU member (via player owned).
   */
  async loadEvents(userId?: string, anonymousUserId?: string): Promise<Event[]> {
    if (!this.isSupabaseAvailable()) {
      return this.loadEventsFromLocalStorage();
    }
    const myUserId = userId || anonymousUserId;
    if (!myUserId) {
      console.log('🔒 No user identity - returning empty events list');
      return [];
    }

    try {
      const eventIds = new Set<string>();

      const { data: created, error: createdErr } = await sb!
        .from('events')
        .select('id')
        .eq('creator_user_id', myUserId);
      if (createdErr) throw createdErr;
      (created || []).forEach((t: { id: string }) => eventIds.add(t.id));

      // Member-of via my player
      const { data: myPlayer } = await sb!
        .from('players')
        .select('id')
        .eq('user_id', myUserId)
        .maybeSingle();
      if (myPlayer) {
        const playerId = (myPlayer as { id: string }).id;
        const { data: memberships } = await sb!
          .from('event_memberships')
          .select('event_id')
          .eq('player_id', playerId);
        (memberships || []).forEach((m: { event_id: string }) => eventIds.add(m.event_id));
      }

      if (eventIds.size === 0) return [];
      const ids = Array.from(eventIds);

      const [{ data: eventsData }, { data: allMembers }, { data: allMatches }] = await Promise.all([
        sb!.from('events').select('*').in('id', ids),
        sb!
          .from('event_memberships')
          .select('id, event_id, player_id, archived_at')
          .in('event_id', ids),
        sb!.from('matches').select('*').in('event_id', ids).order('created_at', { ascending: false }),
      ]);

      const tournRows = (eventsData ?? []) as EventRow[];

      const playerIdsByEvent = new Map<string, string[]>();
      ((allMembers ?? []) as EventMembershipRow[]).forEach((m) => {
        const list = playerIdsByEvent.get(m.event_id) ?? [];
        list.push(m.id); // legacy: playerIds carries membership id
        playerIdsByEvent.set(m.event_id, list);
      });

      const matchesByEvent = new Map<string, Match[]>();
      ((allMatches ?? []) as MatchRow[]).forEach((m) => {
        if (!m.event_id) return;
        const list = matchesByEvent.get(m.event_id) ?? [];
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
        matchesByEvent.set(m.event_id, list);
      });

      return tournRows.map((row) => ({
        id: row.id,
        name: row.name,
        date: row.date,
        format: (row.format as Event['format']) || '2v2',
        location: row.location ?? undefined,
        leagueId: row.league_id,
        createdAt: row.created_at || new Date().toISOString(),
        updatedAt: row.updated_at || row.created_at,
        playerIds: playerIdsByEvent.get(row.id) || [],
        matches: matchesByEvent.get(row.id) || [],
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
          (row as EventRow & { propagates_to_league_elo?: boolean }).propagates_to_league_elo ?? true,
      }));
    } catch (error) {
      console.error('Error loading events from Supabase:', error);
      return this.loadEventsFromLocalStorage();
    }
  }

  async loadEventById(eventId: string): Promise<Event | null> {
    if (!this.isSupabaseAvailable()) {
      const local = this.loadEventsFromLocalStorage();
      return local.find((t) => t.id === eventId) ?? null;
    }
    try {
      const { data: tRow, error } = await sb!
        .from('events')
        .select('*')
        .eq('id', eventId)
        .maybeSingle();
      if (error) throw error;
      if (!tRow) return null;

      const { data: members } = await sb!
        .from('event_memberships')
        .select('id')
        .eq('event_id', eventId);

      const row = tRow as EventRow;
      return {
        id: row.id,
        name: row.name,
        date: row.date,
        format: (row.format as Event['format']) || '2v2',
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
          (row as EventRow & { propagates_to_league_elo?: boolean }).propagates_to_league_elo ?? true,
      };
    } catch (error) {
      console.error('Error loading event by id:', error);
      return null;
    }
  }

  async saveEvent(event: Event): Promise<void> {
    const validationResult = safeValidateEvent(event);
    if (!validationResult.success) {
      console.error('Event validation failed:', validationResult.error.issues);
      throw new Error(
        `Invalid event data: ${validationResult.error.issues.map((i) => i.message).join(', ')}`
      );
    }
    if (!this.isSupabaseAvailable()) {
      this.saveEventToLocalStorage(event);
      return;
    }
    try {
      const { error } = await sb!.from('events').upsert(
        {
          id: event.id,
          name: event.name,
          date: event.date,
          format: event.format,
          location: event.location || null,
          league_id: event.leagueId,
          is_finished: event.isFinished,
          created_at: event.createdAt,
          creator_user_id: event.creator_user_id,
          anti_cheat_enabled: event.anti_cheat_enabled || false,
        },
        { onConflict: 'id' }
      );
      if (error) throw error;
      this.saveEventToLocalStorage(event);
    } catch (error) {
      console.error('Error saving event:', error);
      this.saveEventToLocalStorage(event);
    }
  }

  async deleteEvent(eventId: string): Promise<void> {
    if (!this.isSupabaseAvailable()) {
      this.deleteEventFromLocalStorage(eventId);
      return;
    }
    try {
      // memberships + matches cascade via FK ON DELETE CASCADE
      const { error } = await sb!.from('events').delete().eq('id', eventId);
      if (error) throw error;
      this.deleteEventFromLocalStorage(eventId);
    } catch (error) {
      console.error('Error deleting event:', error);
      this.deleteEventFromLocalStorage(eventId);
    }
  }

  async updateEvent(eventId: string, updates: EventUpdates): Promise<void> {
    const applyToLocal = (event: Event) => {
      if (updates.name !== undefined) event.name = updates.name;
      if (updates.date !== undefined) event.date = updates.date;
      if (updates.antiCheatEnabled !== undefined) event.anti_cheat_enabled = updates.antiCheatEnabled;
      if (updates.format !== undefined) event.format = updates.format;
      if (updates.maxPlayers !== undefined) event.maxPlayers = updates.maxPlayers;
      if (updates.isPrivate !== undefined) event.isPrivate = updates.isPrivate;
      if (updates.propagatesToLeagueElo !== undefined) event.propagatesToLeagueElo = updates.propagatesToLeagueElo;
    };
    if (!this.isSupabaseAvailable()) {
      const events = this.loadEventsFromLocalStorage();
      const event = events.find((t) => t.id === eventId);
      if (event) {
        applyToLocal(event);
        this.saveEventToLocalStorage(event);
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
      const { error } = await sb!.from('events').update(dbUpdates).eq('id', eventId);
      if (error) throw error;
      const events = this.loadEventsFromLocalStorage();
      const event = events.find((t) => t.id === eventId);
      if (event) {
        applyToLocal(event);
        this.saveEventToLocalStorage(event);
      }
    } catch (error) {
      console.error('Error updating event:', error);
    }
  }

  /**
   * Associe / dissocie un event à une ligue (DB + cache local).
   *
   * Effets de bord (mig 023) :
   *   - Quand on rattache à une ligue (`leagueId !== null`), TOUS les
   *     `event_memberships` de l'event sont synchronisés vers
   *     `league_memberships` de la ligue cible : les players manquants y
   *     sont ajoutés (avec ELO par défaut 1000), les présents sont laissés
   *     intacts. Côté event, les `event_memberships.elo` des players
   *     qui avaient déjà un `league_memberships.elo` sont alignés sur ce
   *     dernier (héritage) — sinon laissés à leur valeur courante.
   *   - Quand on dissocie (`leagueId === null`), aucune row n'est supprimée
   *     côté ligue (les players y restent — c'est leur historique). Seul le
   *     lien `events.league_id` est nullifié.
   */
  async associateEventToLeague(
    eventId: string,
    leagueId: string | null,
  ): Promise<void> {
    if (!this.isSupabaseAvailable()) {
      const events = this.loadEventsFromLocalStorage();
      const event = events.find((t) => t.id === eventId);
      if (event) {
        event.leagueId = leagueId;
        this.saveEventToLocalStorage(event);
      }
      return;
    }

    try {
      // Persist the link first.
      const { error: linkErr } = await sb!
        .from('events')
        .update({ league_id: leagueId })
        .eq('id', eventId);
      if (linkErr) throw linkErr;

      // Sync players when rattaching to a league.
      if (leagueId) {
        const { data: memberships } = await sb!
          .from('event_memberships')
          .select('player_id, elo')
          .eq('event_id', eventId);

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
              console.error('associateEventToLeague — insert lm failed', insErr);
            }
          }

          // Inheritance pass: align event_memberships.elo with the league
          // ELO when the player already had one (preserves their league
          // baseline). Players newly added to the league inherit the event's
          // current ELO (no realignment needed — both sides at default).
          for (const tm of tmRows) {
            const leagueElo = existingMap.get(tm.player_id);
            if (leagueElo !== undefined && leagueElo !== tm.elo) {
              await sb!
                .from('event_memberships')
                .update({ elo: leagueElo })
                .eq('event_id', eventId)
                .eq('player_id', tm.player_id);
            }
          }
        }
      }

      // Cache local update.
      const events = this.loadEventsFromLocalStorage();
      const event = events.find((t) => t.id === eventId);
      if (event) {
        event.leagueId = leagueId;
        this.saveEventToLocalStorage(event);
      }
    } catch (error) {
      console.error('Error associating event to league:', error);
      throw error;
    }
  }

  async toggleEventStatus(eventId: string, isFinished: boolean): Promise<void> {
    if (!this.isSupabaseAvailable()) {
      const events = this.loadEventsFromLocalStorage();
      const event = events.find((t) => t.id === eventId);
      if (event) {
        event.isFinished = isFinished;
        this.saveEventToLocalStorage(event);
      }
      return;
    }
    try {
      const { error } = await sb!.from('events').update({ is_finished: isFinished }).eq('id', eventId);
      if (error) throw error;
      const events = this.loadEventsFromLocalStorage();
      const event = events.find((t) => t.id === eventId);
      if (event) {
        event.isFinished = isFinished;
        this.saveEventToLocalStorage(event);
      }
    } catch (error) {
      console.error('Error toggling event status:', error);
    }
  }

  async createEvent(data: {
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
      const eventId = crypto.randomUUID();
      const event: Event = {
        id: eventId,
        name: data.name,
        date: new Date().toISOString(),
        format: data.formatType === 'fixed' ? '2v2' : 'libre',
        leagueId: null,
        playerIds: [data.creatorUserId || data.creatorAnonymousUserId || ''],
        matches: [],
        isFinished: false,
        createdAt: new Date().toISOString(),
      };
      this.saveEventToLocalStorage(event);
      return eventId;
    }
    try {
      const { data: event, error } = await sb!
        .from('events')
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
        console.error('Error creating event:', error);
        throw new Error(`Failed to create event: ${error.message}`);
      }
      return (event as { id: string }).id;
    } catch (error) {
      console.error('Error in createEvent:', error);
      throw error;
    }
  }

  async eventCodeExists(joinCode: string): Promise<boolean> {
    if (!this.isSupabaseAvailable()) return false;
    try {
      const { data } = await sb!
        .from('events')
        .select('id')
        .eq('join_code', joinCode)
        .maybeSingle();
      return data !== null;
    } catch (error) {
      console.error('Error in eventCodeExists:', error);
      return false;
    }
  }

  /**
   * Quitte un tournoi : supprime le event_memberships du caller.
   * Le creator ne peut pas quitter.
   */
  async leaveEvent(
    eventId: string,
    userId?: string,
    anonymousUserId?: string
  ): Promise<void> {
    const myUserId = userId || anonymousUserId;
    if (!myUserId) throw new Error('User identity required');
    if (!this.isSupabaseAvailable()) throw new Error('Cannot leave event in offline mode');

    try {
      const { data: tRow } = await sb!
        .from('events')
        .select('creator_user_id')
        .eq('id', eventId)
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
        .from('event_memberships')
        .delete()
        .eq('event_id', eventId)
        .eq('player_id', playerId);
      if (error) throw error;
    } catch (error) {
      console.error('Error in leaveEvent:', error);
      throw error;
    }
  }

  // ===== localStorage fallback =====

  loadEventsFromLocalStorage(): Event[] {
    const saved = localStorage.getItem('bpl_events');
    return saved ? JSON.parse(saved) : [];
  }

  saveEventToLocalStorage(event: Event): void {
    const events = this.loadEventsFromLocalStorage();
    const index = events.findIndex((t) => t.id === event.id);
    if (index >= 0) events[index] = event;
    else events.push(event);
    localStorage.setItem('bpl_events', JSON.stringify(events));
  }

  private deleteEventFromLocalStorage(eventId: string): void {
    const events = this.loadEventsFromLocalStorage();
    const filtered = events.filter((t) => t.id !== eventId);
    localStorage.setItem('bpl_events', JSON.stringify(filtered));
  }
}

export const eventsRepository = new EventsRepository();
