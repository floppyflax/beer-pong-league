/**
 * PlayersRepository — gère les `players` + `league_memberships` + `event_memberships`
 * (mig 022 — modèle unifié).
 *
 * Concepts :
 *   - `players` : entité de jeu, avec un `pseudo` et optionnellement un `user_id`.
 *   - `league_memberships` : appartenance d'un player à une league + ses stats ELO.
 *   - `event_memberships` : appartenance à un tournoi (pas de stats — l'ELO
 *     vit au niveau league).
 *   - Pseudo affiché : `membership.pseudo_override` si non-NULL, sinon `players.pseudo`.
 */

import { getSupabase } from '@elofight/shared';
import type { Player } from '../../types';
import { BaseRepository, sb } from './_base';
import { leaguesRepository } from './LeaguesRepository';
import { eventsRepository } from './EventsRepository';

interface PlayerWithMembership {
  id: string;             // membership row id (legacy callers expect a stable id per context)
  playerId: string;       // players.id
  leaguePlayerId?: string; // alias kept for event participants who also have a league membership
  name: string;
  elo: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  joinedAt: string;
  avatarUrl?: string | null;
  isArchived?: boolean;
}

class PlayersRepository extends BaseRepository {
  // ───────────────────────────────────────────────────────────────────────
  // CREATE — players + memberships
  // ───────────────────────────────────────────────────────────────────────

  /**
   * Ajoute un joueur (auth ou anon) à une league. Crée le `players` row si
   * besoin, puis le `league_memberships`.
   */
  async addPlayerToLeague(
    leagueId: string,
    player: Player,
    userId?: string | null
  ): Promise<void> {
    if (!this.isSupabaseAvailable()) {
      const leagues = leaguesRepository.loadLeaguesFromLocalStorage();
      const league = leagues.find((l) => l.id === leagueId);
      if (league) {
        // Mig 029 — garde max_players côté localStorage fallback.
        if (
          league.maxPlayers != null &&
          league.players.length >= league.maxPlayers
        ) {
          throw new Error(
            `Cette league a atteint sa limite de ${league.maxPlayers} joueurs.`,
          );
        }
        league.players.push(player);
        leaguesRepository.saveLeagueToLocalStorage(league);
      }
      return;
    }

    try {
      // Mig 029 — garde max_players côté Supabase : on lit la limite + le
      // nombre de memberships actifs avant l'insert.
      const { data: leagueRow } = await sb!
        .from('leagues')
        .select('max_players')
        .eq('id', leagueId)
        .maybeSingle();
      const maxPlayers = (leagueRow as { max_players: number | null } | null)
        ?.max_players;
      if (maxPlayers != null) {
        const { data: members } = await sb!
          .from('league_memberships')
          .select('id')
          .eq('league_id', leagueId)
          .is('archived_at', null);
        const memberCount = members?.length ?? 0;
        if (memberCount >= maxPlayers) {
          throw new Error(
            `Cette league a atteint sa limite de ${maxPlayers} joueurs.`,
          );
        }
      }

      // 1. Resolve or create the players row
      let playerId = player.id;
      if (userId) {
        const { data: existing } = await sb!
          .from('players')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();
        if (existing) {
          playerId = (existing as { id: string }).id;
        } else {
          const { data: created, error: createErr } = await sb!
            .from('players')
            .insert({ id: player.id, pseudo: player.name, user_id: userId })
            .select('id')
            .single();
          if (createErr) throw createErr;
          playerId = (created as { id: string }).id;
        }
      } else {
        const { error: createErr } = await sb!
          .from('players')
          .insert({ id: player.id, pseudo: player.name, user_id: null });
        if (createErr) throw createErr;
        playerId = player.id;
      }

      // 2. Membership — idempotent: the player may already be a member (e.g.
      // after claim_player transferred an anonymous player to the auth account).
      // Skip the INSERT silently in that case rather than throwing a UNIQUE error.
      const { data: existingMem } = await sb!
        .from('league_memberships')
        .select('id')
        .eq('league_id', leagueId)
        .eq('player_id', playerId)
        .maybeSingle();
      if (!existingMem) {
        const { error: memErr } = await sb!
          .from('league_memberships')
          .insert({
            league_id: leagueId,
            player_id: playerId,
            elo: player.elo,
            wins: player.wins,
            losses: player.losses,
            matches_played: player.matchesPlayed,
            streak: player.streak,
          });
        if (memErr) throw memErr;
      }

      // localStorage cache
      const leagues = leaguesRepository.loadLeaguesFromLocalStorage();
      const league = leagues.find((l) => l.id === leagueId);
      if (league && !league.players.find((p) => p.id === playerId)) {
        league.players.push({ ...player, id: playerId });
        leaguesRepository.saveLeagueToLocalStorage(league);
      }
    } catch (error) {
      console.error('Error adding player to league:', error);
      const leagues = leaguesRepository.loadLeaguesFromLocalStorage();
      const league = leagues.find((l) => l.id === leagueId);
      if (league && !league.players.find((p) => p.id === player.id)) {
        league.players.push(player);
        leaguesRepository.saveLeagueToLocalStorage(league);
      }
    }
  }

  /**
   * Ajoute un guest (ghost player) directement à un tournoi standalone.
   * Crée un nouveau `players` non-claimé puis le `event_memberships`.
   */
  async addGuestPlayerToEvent(eventId: string, playerName: string): Promise<string> {
    if (!this.isSupabaseAvailable()) {
      const events = eventsRepository.loadEventsFromLocalStorage();
      const event = events.find((t) => t.id === eventId);
      if (event) {
        const newId = crypto.randomUUID();
        event.playerIds.push(newId);
        eventsRepository.saveEventToLocalStorage(event);
        return newId;
      }
      throw new Error('Event not found');
    }

    const { data: created, error: createErr } = await sb!
      .from('players')
      .insert({ pseudo: playerName, user_id: null })
      .select('id')
      .single();
    if (createErr) throw createErr;
    const playerId = (created as { id: string }).id;

    const { data: mem, error: memErr } = await sb!
      .from('event_memberships')
      .insert({ event_id: eventId, player_id: playerId })
      .select('id')
      .single();
    if (memErr) throw memErr;

    // If the event is league-linked, also create a league_membership
    // so the ghost gets ELO tracking.
    const { data: tData } = await sb!
      .from('events')
      .select('league_id')
      .eq('id', eventId)
      .single();
    const t = tData as { league_id: string | null } | null;
    if (t?.league_id) {
      await sb!
        .from('league_memberships')
        .insert({ league_id: t.league_id, player_id: playerId })
        .select()
        .maybeSingle();
    }

    return (mem as { id: string }).id;
  }

  /**
   * Ajoute un player anonyme (déjà existant via son user_id anon) à un tournoi.
   * Réutilise le `players` lié à cet anonymous user_id, sinon en crée un.
   */
  async addAnonymousPlayerToEvent(
    eventId: string,
    playerName: string,
    anonymousUserId: string
  ): Promise<string> {
    if (!this.isSupabaseAvailable()) {
      const events = eventsRepository.loadEventsFromLocalStorage();
      const event = events.find((t) => t.id === eventId);
      if (event) {
        const newId = crypto.randomUUID();
        event.playerIds.push(newId);
        eventsRepository.saveEventToLocalStorage(event);
        return newId;
      }
      throw new Error('Event not found');
    }

    // Resolve or create the players row owned by this anonymous user
    let playerId: string;
    const { data: existingPlayer } = await sb!
      .from('players')
      .select('id')
      .eq('user_id', anonymousUserId)
      .maybeSingle();
    if (existingPlayer) {
      playerId = (existingPlayer as { id: string }).id;
    } else {
      const { data: created, error: createErr } = await sb!
        .from('players')
        .insert({ pseudo: playerName, user_id: anonymousUserId })
        .select('id')
        .single();
      if (createErr) throw createErr;
      playerId = (created as { id: string }).id;
    }

    // Resolve event's league context — drives both auto-add to league
    // and ELO inheritance.
    const { data: tData } = await sb!
      .from('events')
      .select('league_id')
      .eq('id', eventId)
      .single();
    const t = tData as { league_id: string | null } | null;

    // If event is league-linked, ensure a league_membership exists for this
    // player (auto-add) and inherit its ELO as the event_membership
    // baseline. Otherwise, the event_membership starts at default 1000.
    let inheritedElo: number | null = null;
    if (t?.league_id) {
      const { data: existingLm } = await sb!
        .from('league_memberships')
        .select('id, elo')
        .eq('league_id', t.league_id)
        .eq('player_id', playerId)
        .maybeSingle();
      if (existingLm) {
        inheritedElo = (existingLm as { id: string; elo: number }).elo;
      } else {
        await sb!
          .from('league_memberships')
          .insert({ league_id: t.league_id, player_id: playerId });
      }
    }

    const insertPayload: { event_id: string; player_id: string; elo?: number } = {
      event_id: eventId,
      player_id: playerId,
    };
    if (inheritedElo !== null) insertPayload.elo = inheritedElo;

    // Idempotent: the player may already have an event_membership (e.g. after
    // claim_player transferred their anonymous player to the auth account).
    const { data: existingEventMem } = await sb!
      .from('event_memberships')
      .select('id')
      .eq('event_id', eventId)
      .eq('player_id', playerId)
      .maybeSingle();
    if (existingEventMem) return (existingEventMem as { id: string }).id;

    const { data: mem, error: memErr } = await sb!
      .from('event_memberships')
      .insert(insertPayload)
      .select('id')
      .single();
    if (memErr) throw memErr;

    return (mem as { id: string }).id;
  }

  /**
   * Ajoute un league_membership existant à un tournoi (= "ajouter depuis la ligue").
   * Crée un event_memberships pointant vers le même player_id.
   * Hérite de l'ELO de la ligue (mig 023 — chaque event a son propre ELO,
   * mais on démarre depuis le ELO ligue pour une transition naturelle).
   */
  async addLeaguePlayerToEvent(
    eventId: string,
    leaguePlayerId: string
  ): Promise<string> {
    if (!this.isSupabaseAvailable()) {
      throw new Error('Supabase required');
    }

    // leaguePlayerId is a league_memberships.id — resolve player_id + elo
    const { data: lm, error: lmErr } = await sb!
      .from('league_memberships')
      .select('player_id, elo')
      .eq('id', leaguePlayerId)
      .single();
    if (lmErr || !lm) throw new Error('League membership not found');
    const lmRow = lm as { player_id: string; elo: number };

    // Reuse existing event_memberships if present
    const { data: existing } = await sb!
      .from('event_memberships')
      .select('id')
      .eq('event_id', eventId)
      .eq('player_id', lmRow.player_id)
      .maybeSingle();
    if (existing) return (existing as { id: string }).id;

    const { data: mem, error: memErr } = await sb!
      .from('event_memberships')
      .insert({
        event_id: eventId,
        player_id: lmRow.player_id,
        elo: lmRow.elo,                 // inherit league ELO baseline
      })
      .select('id')
      .single();
    if (memErr) throw memErr;
    return (mem as { id: string }).id;
  }

  // ───────────────────────────────────────────────────────────────────────
  // READ — load players for display
  // ───────────────────────────────────────────────────────────────────────

  /**
   * Charge un player par membership_id (league_memberships.id ou event_memberships.id)
   * — le caller donne l'id de la row de membership (legacy comportement).
   */
  async loadPlayerById(playerId: string): Promise<{
    player: Player;
    leagueId?: string;
    leagueName?: string;
    eventId?: string;
    /** Global players.id (membership id ≠ players.id). */
    globalPlayerId?: string;
    /** Owning user; null = ghost (admin-created, unclaimed). */
    userId?: string | null;
  } | null> {
    if (!this.isSupabaseAvailable()) return null;
    try {
      // 1. Try league_memberships
      const { data: lm } = await sb!
        .from('league_memberships')
        .select('id, league_id, player_id, pseudo_override, elo, wins, losses, matches_played, streak, player:players(pseudo, user_id)')
        .eq('id', playerId)
        .maybeSingle();
      if (lm) {
        const row = lm as unknown as {
          id: string;
          league_id: string;
          player_id: string;
          pseudo_override: string | null;
          elo: number;
          wins: number;
          losses: number;
          matches_played: number;
          streak: number;
          player: { pseudo: string; user_id: string | null } | null;
        };
        const league = await leaguesRepository.getLeagueById(row.league_id);
        return {
          player: {
            id: row.id,
            name: row.pseudo_override || row.player?.pseudo || 'Joueur',
            elo: row.elo,
            wins: row.wins,
            losses: row.losses,
            matchesPlayed: row.matches_played,
            streak: row.streak,
          },
          leagueId: row.league_id,
          leagueName: league?.name,
          globalPlayerId: row.player_id,
          userId: row.player?.user_id ?? null,
        };
      }

      // 2. Try event_memberships — read its OWN ELO/W/L/streak (mig 023),
      //    NOT the league baseline. Standalone events have no league row, so
      //    falling back to league_memberships would freeze ELO at the default.
      const { data: tm } = await sb!
        .from('event_memberships')
        .select('id, event_id, player_id, pseudo_override, elo, wins, losses, matches_played, streak, player:players(pseudo, user_id)')
        .eq('id', playerId)
        .maybeSingle();
      if (tm) {
        const row = tm as unknown as {
          id: string;
          event_id: string;
          player_id: string;
          pseudo_override: string | null;
          elo: number;
          wins: number;
          losses: number;
          matches_played: number;
          streak: number;
          player: { pseudo: string; user_id: string | null } | null;
        };
        const { data: tData } = await sb!
          .from('events')
          .select('league_id')
          .eq('id', row.event_id)
          .single();
        const tInfo = tData as { league_id: string | null } | null;
        const league = tInfo?.league_id ? await leaguesRepository.getLeagueById(tInfo.league_id) : null;
        return {
          player: {
            id: row.id,
            name: row.pseudo_override || row.player?.pseudo || 'Joueur',
            elo: row.elo,
            wins: row.wins,
            losses: row.losses,
            matchesPlayed: row.matches_played,
            streak: row.streak,
          },
          leagueId: tInfo?.league_id ?? undefined,
          leagueName: league?.name,
          eventId: row.event_id,
          globalPlayerId: row.player_id,
          userId: row.player?.user_id ?? null,
        };
      }
      return null;
    } catch (error) {
      console.error('Error loading player by id:', error);
      return null;
    }
  }

  /**
   * Charge les participants d'un tournoi (event_memberships joined avec
   * players + éventuellement league_memberships pour les stats).
   */
  async loadEventParticipants(eventId: string): Promise<PlayerWithMembership[]> {
    if (!this.isSupabaseAvailable()) {
      const events = eventsRepository.loadEventsFromLocalStorage();
      const event = events.find((t) => t.id === eventId);
      if (!event || !event.leagueId) return [];
      const leagues = leaguesRepository.loadLeaguesFromLocalStorage();
      const league = leagues.find((l) => l.id === event.leagueId);
      if (!league) return [];
      return league.players
        .filter((p) => event.playerIds.includes(p.id))
        .map((p) => ({
          id: p.id,
          playerId: p.id,
          name: p.name,
          elo: p.elo,
          matchesPlayed: p.matchesPlayed,
          wins: p.wins,
          losses: p.losses,
          joinedAt: new Date().toISOString(),
        }));
    }

    try {
      // Since mig 023, event_memberships has its own ELO/W/L/streak
      // columns (per-event ELO bubble, optionally propagating to league).
      const { data, error } = await sb!
        .from('event_memberships')
        .select(`
          id,
          player_id,
          joined_at,
          archived_at,
          pseudo_override,
          elo,
          wins,
          losses,
          matches_played,
          streak,
          player:players ( id, pseudo, avatar_url, user_id )
        `)
        .eq('event_id', eventId)
        .order('joined_at', { ascending: true });
      if (error) throw error;

      const rows = (data ?? []) as unknown as Array<{
        id: string;
        player_id: string;
        joined_at: string;
        archived_at: string | null;
        pseudo_override: string | null;
        elo: number;
        wins: number;
        losses: number;
        matches_played: number;
        streak: number;
        player: { id: string; pseudo: string; avatar_url: string | null; user_id: string | null } | null;
      }>;

      // Optional: still resolve league_memberships.id for the few consumers
      // (e.g. PlayerProfile cross-context navigation) that need it.
      const { data: tData } = await sb!
        .from('events')
        .select('league_id')
        .eq('id', eventId)
        .single();
      const tInfo = tData as { league_id: string | null } | null;

      let lmIdByPlayer = new Map<string, string>();
      if (tInfo?.league_id && rows.length > 0) {
        const playerIds = rows.map((r) => r.player_id);
        const { data: lmData } = await sb!
          .from('league_memberships')
          .select('id, player_id')
          .eq('league_id', tInfo.league_id)
          .in('player_id', playerIds);
        lmIdByPlayer = new Map(
          ((lmData ?? []) as Array<{ id: string; player_id: string }>).map(
            (lm) => [lm.player_id, lm.id]
          )
        );
      }

      return rows.map((r) => ({
        id: r.id,                          // membership id (matches.team_a/b_player_ids ARE NOT this — see note below)
        playerId: r.player_id,
        leaguePlayerId: lmIdByPlayer.get(r.player_id),
        name: r.pseudo_override || r.player?.pseudo || 'Joueur',
        elo: r.elo,
        matchesPlayed: r.matches_played,
        wins: r.wins,
        losses: r.losses,
        joinedAt: r.joined_at,
        avatarUrl: r.player?.avatar_url ?? null,
        isArchived: r.archived_at != null,
      }));
    } catch (error) {
      const detail = error instanceof Error ? error.message : JSON.stringify(error);
      console.error('Error loading event participants:', detail);
      return [];
    }
  }

  /**
   * Note importante : depuis la mig 022, `matches.team_a/b_player_ids`
   * référencent `players.id` directement (plus de membership id). Les
   * consumers qui matchent `match.teamA` avec un participant doivent comparer
   * avec `participant.playerId`, pas `participant.id`.
   *
   * Ce mapping retourne, pour un tournoi donné, la map playerId → display name
   * pour rendre les matches sans avoir besoin de la liste complète.
   */
  async loadMatchPlayerNames(eventId: string): Promise<Map<string, string>> {
    if (!this.isSupabaseAvailable()) return new Map();
    const { data } = await sb!
      .from('event_memberships')
      .select('player_id, pseudo_override, player:players(pseudo)')
      .eq('event_id', eventId);
    const rows = (data ?? []) as unknown as Array<{
      player_id: string;
      pseudo_override: string | null;
      player: { pseudo: string } | null;
    }>;
    const m = new Map<string, string>();
    for (const r of rows) m.set(r.player_id, r.pseudo_override || r.player?.pseudo || 'Joueur');
    return m;
  }

  /**
   * Mig 032 — Mirror de `loadMatchPlayerNames` pour les ligues. Retourne
   * la map players.id → display name à partir de `league_memberships`.
   * Utilisé par PendingMatches en contexte ligue.
   */
  async loadLeagueMatchPlayerNames(leagueId: string): Promise<Map<string, string>> {
    if (!this.isSupabaseAvailable()) return new Map();
    const { data } = await sb!
      .from('league_memberships')
      .select('player_id, pseudo_override, player:players(pseudo)')
      .eq('league_id', leagueId);
    const rows = (data ?? []) as unknown as Array<{
      player_id: string;
      pseudo_override: string | null;
      player: { pseudo: string } | null;
    }>;
    const m = new Map<string, string>();
    for (const r of rows) m.set(r.player_id, r.pseudo_override || r.player?.pseudo || 'Joueur');
    return m;
  }

  // ───────────────────────────────────────────────────────────────────────
  // UPDATE
  // ───────────────────────────────────────────────────────────────────────

  /**
   * Met à jour un league_membership (legacy: Partial<Player>). Le `name`
   * écrit dans `pseudo_override` (override par-league).
   */
  async updatePlayer(
    leagueId: string,
    membershipId: string,
    updates: Partial<Player>
  ): Promise<void> {
    if (!this.isSupabaseAvailable()) {
      const leagues = leaguesRepository.loadLeaguesFromLocalStorage();
      const league = leagues.find((l) => l.id === leagueId);
      if (league) {
        const player = league.players.find((p) => p.id === membershipId);
        if (player) {
          Object.assign(player, updates);
          leaguesRepository.saveLeagueToLocalStorage(league);
        }
      }
      return;
    }

    const updateData: Record<string, unknown> = {};
    if (updates.name !== undefined) updateData.pseudo_override = updates.name;
    if (updates.elo !== undefined) updateData.elo = updates.elo;
    if (updates.wins !== undefined) updateData.wins = updates.wins;
    if (updates.losses !== undefined) updateData.losses = updates.losses;
    if (updates.matchesPlayed !== undefined) updateData.matches_played = updates.matchesPlayed;
    if (updates.streak !== undefined) updateData.streak = updates.streak;

    const { error } = await sb!
      .from('league_memberships')
      .update(updateData)
      .eq('id', membershipId)
      .eq('league_id', leagueId);
    if (error) throw error;
  }

  /**
   * Admin edit of a GHOST player's global identity (players.pseudo /
   * avatar_url). Ghost = players.user_id IS NULL. The caller (PlayerProfile)
   * gates on admin + ghost before invoking. RLS on `players` is permissive.
   * Updating players.pseudo propagates to every context (no per-league
   * override is set for manually-added ghosts).
   */
  async updateGhostPlayerIdentity(
    globalPlayerId: string,
    updates: { pseudo?: string; avatarUrl?: string },
  ): Promise<void> {
    if (!this.isSupabaseAvailable()) return;
    const payload: Record<string, unknown> = {};
    if (updates.pseudo !== undefined) payload.pseudo = updates.pseudo;
    if (updates.avatarUrl !== undefined) payload.avatar_url = updates.avatarUrl;
    if (Object.keys(payload).length === 0) return;
    const { error } = await sb!
      .from('players')
      .update(payload)
      .eq('id', globalPlayerId);
    if (error) throw error;
  }

  /**
   * Upload a ghost player's photo to the `avatars` bucket. The bucket's INSERT
   * policy requires the first path segment to equal auth.uid() (mig 017), so
   * the ghost photo is nested under the admin's own folder.
   */
  async uploadGhostAvatar(
    adminAuthUserId: string,
    globalPlayerId: string,
    file: File,
  ): Promise<string | null> {
    const supabase = getSupabase();
    if (!supabase) return null;
    try {
      const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
      const path = `${adminAuthUserId}/ghost-${globalPlayerId}.${ext}`;
      const { error } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      return `${data.publicUrl}?t=${Date.now()}`;
    } catch (error) {
      console.error('Error uploading ghost avatar:', error);
      return null;
    }
  }

  // ───────────────────────────────────────────────────────────────────────
  // DELETE
  // ───────────────────────────────────────────────────────────────────────

  /**
   * Supprime un league_membership et les matches qui référencent son player_id.
   */
  async deletePlayer(leagueId: string, membershipId: string): Promise<void> {
    if (!this.isSupabaseAvailable()) return;
    const { data: lm } = await sb!
      .from('league_memberships')
      .select('player_id')
      .eq('id', membershipId)
      .single();
    if (!lm) return;
    const playerId = (lm as { player_id: string }).player_id;

    // Delete matches that reference this player in this league
    const { data: matches } = await sb!
      .from('matches')
      .select('id, team_a_player_ids, team_b_player_ids')
      .eq('league_id', leagueId);
    const ms = (matches ?? []) as Array<{ id: string; team_a_player_ids: string[]; team_b_player_ids: string[] }>;
    for (const m of ms) {
      if (m.team_a_player_ids.includes(playerId) || m.team_b_player_ids.includes(playerId)) {
        await sb!.from('matches').delete().eq('id', m.id);
      }
    }

    await sb!
      .from('league_memberships')
      .delete()
      .eq('id', membershipId)
      .eq('league_id', leagueId);
  }

  // ───────────────────────────────────────────────────────────────────────
  // ENRICHMENT (avatar, joined, owning user) — used by player profile page
  // ───────────────────────────────────────────────────────────────────────

  async loadPlayerEnrichment(membershipId: string): Promise<{
    avatarUrl: string | null;
    joinedAt: string | null;
    userId: string | null;
    /** Global players.id — needed for admin edits of ghost players. */
    globalPlayerId: string | null;
  } | null> {
    if (!this.isSupabaseAvailable()) return null;
    try {
      const { data: lm } = await sb!
        .from('league_memberships')
        .select('joined_at, player_id, player:players(user_id, avatar_url)')
        .eq('id', membershipId)
        .maybeSingle();
      if (lm) {
        const row = lm as unknown as {
          joined_at: string | null;
          player_id: string;
          player: { user_id: string | null; avatar_url: string | null } | null;
        };
        return {
          joinedAt: row.joined_at,
          userId: row.player?.user_id ?? null,
          avatarUrl: row.player?.avatar_url ?? null,
          globalPlayerId: row.player_id,
        };
      }
      const { data: tm } = await sb!
        .from('event_memberships')
        .select('joined_at, player_id, player:players(user_id, avatar_url)')
        .eq('id', membershipId)
        .maybeSingle();
      if (tm) {
        const row = tm as unknown as {
          joined_at: string | null;
          player_id: string;
          player: { user_id: string | null; avatar_url: string | null } | null;
        };
        return {
          joinedAt: row.joined_at,
          userId: row.player?.user_id ?? null,
          avatarUrl: row.player?.avatar_url ?? null,
          globalPlayerId: row.player_id,
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
