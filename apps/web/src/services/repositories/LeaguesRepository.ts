/**
 * LeaguesRepository — gère les leagues + leurs membres (`league_memberships`)
 * + matches (mig 022).
 */

import type { League, Player, Match } from '../../types';
import { safeValidateLeague } from '../../utils/validation';
import {
  BaseRepository,
  sb,
  type LeagueRow,
  type LeagueMembershipRow,
  type MatchRow,
} from './_base';

class LeaguesRepository extends BaseRepository {
  /**
   * Charge toutes les leagues où l'utilisateur est creator OU membre (via player owned).
   * userId : id de la row `public.users` (NOT auth.users) — peut être anon ou auth.
   */
  async loadLeagues(userId?: string, anonymousUserId?: string): Promise<League[]> {
    if (!this.isSupabaseAvailable()) {
      return this.loadLeaguesFromLocalStorage();
    }
    // Both params are now the same `users.id` namespace; accept either for backwards compat.
    const myUserId = userId || anonymousUserId;
    if (!myUserId) {
      console.log('🔒 No user identity - returning empty leagues list');
      return [];
    }

    try {
      const leagueIds = new Set<string>();

      // 1. Leagues created by me
      const { data: created, error: createdErr } = await sb!
        .from('leagues')
        .select('id')
        .eq('creator_user_id', myUserId);
      if (createdErr) throw createdErr;
      (created || []).forEach((l: { id: string }) => leagueIds.add(l.id));

      // 2. Leagues where my player is a member — find via players → memberships
      const { data: myPlayer } = await sb!
        .from('players')
        .select('id')
        .eq('user_id', myUserId)
        .maybeSingle();
      if (myPlayer) {
        const playerId = (myPlayer as { id: string }).id;
        const { data: memberships } = await sb!
          .from('league_memberships')
          .select('league_id')
          .eq('player_id', playerId);
        (memberships || []).forEach((m: { league_id: string }) => leagueIds.add(m.league_id));
      }

      if (leagueIds.size === 0) return [];

      const ids = Array.from(leagueIds);

      // 3. Batch-load leagues, memberships, matches, events
      const [{ data: leaguesData }, { data: allMembers }, { data: allMatches }, { data: allTourns }] =
        await Promise.all([
          sb!.from('leagues').select('*').in('id', ids),
          sb!
            .from('league_memberships')
            .select('id, league_id, player_id, pseudo_override, elo, wins, losses, matches_played, streak, joined_at, archived_at, player:players(pseudo)')
            .in('league_id', ids),
          sb!.from('matches').select('*').in('league_id', ids).order('created_at', { ascending: false }),
          sb!.from('events').select('id, league_id').in('league_id', ids),
        ]);

      const leagueRows = (leaguesData ?? []) as LeagueRow[];

      const playersByLeague = new Map<string, Player[]>();
      ((allMembers ?? []) as unknown as Array<LeagueMembershipRow & { player: { pseudo: string } | null }>).forEach((m) => {
        const list = playersByLeague.get(m.league_id) ?? [];
        list.push({
          id: m.id,
          name: m.pseudo_override || m.player?.pseudo || 'Joueur',
          elo: m.elo,
          wins: m.wins,
          losses: m.losses,
          matchesPlayed: m.matches_played,
          streak: m.streak,
        });
        playersByLeague.set(m.league_id, list);
      });

      const matchesByLeague = new Map<string, Match[]>();
      ((allMatches ?? []) as MatchRow[]).forEach((m) => {
        if (!m.league_id) return;
        const list = matchesByLeague.get(m.league_id) ?? [];
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
        matchesByLeague.set(m.league_id, list);
      });

      const eventsByLeague = new Map<string, string[]>();
      ((allTourns ?? []) as { id: string; league_id: string | null }[]).forEach((t) => {
        if (!t.league_id) return;
        const list = eventsByLeague.get(t.league_id) ?? [];
        list.push(t.id);
        eventsByLeague.set(t.league_id, list);
      });

      return leagueRows.map((row) => ({
        id: row.id,
        name: row.name,
        type: row.type,
        createdAt: row.created_at || new Date().toISOString(),
        players: playersByLeague.get(row.id) || [],
        matches: matchesByLeague.get(row.id) || [],
        events: eventsByLeague.get(row.id) || [],
        joinCode: row.join_code ?? undefined,
        creator_user_id: row.creator_user_id,
        creator_anonymous_user_id: null,
        anti_cheat_enabled: row.anti_cheat_enabled || false,
      }));
    } catch (error) {
      console.error('Error loading leagues from Supabase:', error);
      return this.loadLeaguesFromLocalStorage();
    }
  }

  /**
   * Sauvegarde une league. Note : depuis mig 022, les players ne sont plus
   * stockés inline dans une row league_players ; ils existent dans `players` +
   * `league_memberships`. Cette méthode ne persiste plus les players (delegated
   * to PlayersRepository.addPlayerToLeague). Elle reste pour la mise à jour
   * des champs scalaires de `leagues`.
   */
  async saveLeague(league: League): Promise<void> {
    const validationResult = safeValidateLeague(league);
    if (!validationResult.success) {
      console.error('League validation failed:', validationResult.error.issues);
      throw new Error(
        `Invalid league data: ${validationResult.error.issues.map((i) => i.message).join(', ')}`
      );
    }
    if (!this.isSupabaseAvailable()) {
      this.saveLeagueToLocalStorage(league);
      return;
    }

    try {
      const { error: leagueError } = await sb!
        .from('leagues')
        .upsert(
          {
            id: league.id,
            name: league.name,
            type: league.type,
            created_at: league.createdAt,
            join_code: league.joinCode ?? null,
            creator_user_id: league.creator_user_id,
            anti_cheat_enabled: league.anti_cheat_enabled || false,
          },
          { onConflict: 'id' }
        );
      if (leagueError) throw leagueError;
      this.saveLeagueToLocalStorage(league);
    } catch (error) {
      console.error('Error saving league to Supabase:', error);
      this.saveLeagueToLocalStorage(league);
    }
  }

  /**
   * Supprime une league + toutes ses dépendances (cascade FK).
   */
  async deleteLeague(leagueId: string): Promise<void> {
    if (!this.isSupabaseAvailable()) {
      this.deleteLeagueFromLocalStorage(leagueId);
      return;
    }
    try {
      // matches + memberships cascade via FK ON DELETE CASCADE
      const { error } = await sb!.from('leagues').delete().eq('id', leagueId);
      if (error) throw error;
      this.deleteLeagueFromLocalStorage(leagueId);
    } catch (error) {
      console.error('Error deleting league from Supabase:', error);
      this.deleteLeagueFromLocalStorage(leagueId);
    }
  }

  async updateLeague(leagueId: string, name: string, type: 'one-shot' | 'season'): Promise<void> {
    if (!this.isSupabaseAvailable()) {
      const leagues = this.loadLeaguesFromLocalStorage();
      const league = leagues.find((l) => l.id === leagueId);
      if (league) {
        league.name = name;
        league.type = type;
        this.saveLeagueToLocalStorage(league);
      }
      return;
    }
    try {
      const { error } = await sb!.from('leagues').update({ name, type }).eq('id', leagueId);
      if (error) throw error;
      const leagues = this.loadLeaguesFromLocalStorage();
      const league = leagues.find((l) => l.id === leagueId);
      if (league) {
        league.name = name;
        league.type = type;
        this.saveLeagueToLocalStorage(league);
      }
    } catch (error) {
      console.error('Error updating league:', error);
    }
  }

  async getLeagueById(leagueId: string): Promise<{ name: string } | null> {
    if (!this.isSupabaseAvailable()) return null;
    const { data } = await sb!.from('leagues').select('name').eq('id', leagueId).maybeSingle();
    return data as { name: string } | null;
  }

  async leagueCodeExists(joinCode: string): Promise<boolean> {
    if (!this.isSupabaseAvailable()) return false;
    try {
      const { data } = await sb!
        .from('leagues')
        .select('id')
        .eq('join_code', joinCode)
        .maybeSingle();
      return data !== null;
    } catch (error) {
      console.error('Error in leagueCodeExists:', error);
      return false;
    }
  }

  // ===== localStorage fallback =====

  loadLeaguesFromLocalStorage(): League[] {
    const saved = localStorage.getItem('bpl_leagues');
    return saved ? JSON.parse(saved) : [];
  }

  saveLeagueToLocalStorage(league: League): void {
    const leagues = this.loadLeaguesFromLocalStorage();
    const index = leagues.findIndex((l) => l.id === league.id);
    if (index >= 0) leagues[index] = league;
    else leagues.push(league);
    localStorage.setItem('bpl_leagues', JSON.stringify(leagues));
  }

  private deleteLeagueFromLocalStorage(leagueId: string): void {
    const leagues = this.loadLeaguesFromLocalStorage();
    const filtered = leagues.filter((l) => l.id !== leagueId);
    localStorage.setItem('bpl_leagues', JSON.stringify(filtered));
  }
}

export const leaguesRepository = new LeaguesRepository();
