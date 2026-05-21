/**
 * LeaguesRepository — gère les leagues + leurs membres (`league_memberships`)
 * + matches (mig 022).
 */

import type { League, LeagueSeasonArchive, Player, Match } from '../../types';
import { safeValidateLeague } from '../../utils/validation';
import {
  BaseRepository,
  sb,
  type LeagueRow,
  type LeagueMembershipRow,
  type LeagueSeasonArchiveRow,
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
      // Per-league map of players.id → league_memberships.id. After mig 022 the
      // canonical value stored in matches.team_*_player_ids is players.id, but
      // React state (league.players[i].id) is the membership id (it carries
      // per-league elo/wins/etc). We rewrite teamA/teamB into the membership-id
      // namespace at hydration time so UI lookups like `players.find(p => p.id
      // === teamA[i])` continue to work unchanged.
      const playerToMembershipByLeague = new Map<string, Map<string, string>>();
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

        const ptm = playerToMembershipByLeague.get(m.league_id) ?? new Map<string, string>();
        ptm.set(m.player_id, m.id);
        playerToMembershipByLeague.set(m.league_id, ptm);
      });

      const matchesByLeague = new Map<string, Match[]>();
      ((allMatches ?? []) as MatchRow[]).forEach((m) => {
        if (!m.league_id) return;
        const list = matchesByLeague.get(m.league_id) ?? [];
        const ptm = playerToMembershipByLeague.get(m.league_id);
        const remap = (ids: string[] | null): string[] =>
          (ids || []).map((id) => ptm?.get(id) ?? id);
        list.push({
          id: m.id,
          date: m.created_at || new Date().toISOString(),
          teamA: remap(m.team_a_player_ids),
          teamB: remap(m.team_b_player_ids),
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
        // Mig 028 — lifecycle + saisons
        pausedAt: row.paused_at ?? null,
        endedAt: row.ended_at ?? null,
        currentSeasonNumber: row.current_season_number ?? 1,
        currentSeasonStartedAt: row.current_season_started_at ?? row.created_at,
        // Mig 029 — between_seasons marker
        currentSeasonEndedAt: row.current_season_ended_at ?? null,
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

  // ── Lifecycle (mig 028) ────────────────────────────────────────────────

  private patchLocalLeague(
    leagueId: string,
    patch: Partial<
      Pick<
        League,
        'pausedAt' | 'endedAt' | 'currentSeasonNumber' | 'currentSeasonStartedAt' | 'currentSeasonEndedAt'
      >
    >,
  ): void {
    const leagues = this.loadLeaguesFromLocalStorage();
    const league = leagues.find((l) => l.id === leagueId);
    if (!league) return;
    Object.assign(league, patch);
    this.saveLeagueToLocalStorage(league);
  }

  /** Admin "Mettre en pause" — bloque l'enregistrement de nouveaux matchs. */
  async pauseLeague(leagueId: string): Promise<void> {
    const now = new Date().toISOString();
    if (!this.isSupabaseAvailable()) {
      this.patchLocalLeague(leagueId, { pausedAt: now });
      return;
    }
    const { error } = await sb!
      .from('leagues')
      .update({ paused_at: now })
      .eq('id', leagueId);
    if (error) throw error;
    this.patchLocalLeague(leagueId, { pausedAt: now });
  }

  /** Admin "Reprendre" — réautorise les matchs. */
  async resumeLeague(leagueId: string): Promise<void> {
    if (!this.isSupabaseAvailable()) {
      this.patchLocalLeague(leagueId, { pausedAt: null });
      return;
    }
    const { error } = await sb!
      .from('leagues')
      .update({ paused_at: null })
      .eq('id', leagueId);
    if (error) throw error;
    this.patchLocalLeague(leagueId, { pausedAt: null });
  }

  /** Admin "Clôturer la league" — état final, read-only. */
  async finishLeague(leagueId: string): Promise<void> {
    const now = new Date().toISOString();
    if (!this.isSupabaseAvailable()) {
      this.patchLocalLeague(leagueId, { endedAt: now });
      return;
    }
    const { error } = await sb!
      .from('leagues')
      .update({ ended_at: now })
      .eq('id', leagueId);
    if (error) throw error;
    this.patchLocalLeague(leagueId, { endedAt: now });
  }

  /** Admin "Réouvrir la league" — annule la clôture. */
  async reopenLeague(leagueId: string): Promise<void> {
    if (!this.isSupabaseAvailable()) {
      this.patchLocalLeague(leagueId, { endedAt: null });
      return;
    }
    const { error } = await sb!
      .from('leagues')
      .update({ ended_at: null })
      .eq('id', leagueId);
    if (error) throw error;
    this.patchLocalLeague(leagueId, { endedAt: null });
  }

  /**
   * Étape 1 du cycle de saison (mig 029) — `finish_current_league_season` :
   * snapshot le classement dans `league_season_archives` et pose
   * `current_season_ended_at`. La ligue entre en état `between_seasons` :
   * plus aucun match enregistrable jusqu'à `startNewSeason`. Les ELO et le
   * numéro de saison restent inchangés.
   */
  async finishCurrentSeason(leagueId: string): Promise<void> {
    if (!this.isSupabaseAvailable()) {
      throw new Error('Clore la saison nécessite une connexion serveur.');
    }
    const { error } = await sb!.rpc('finish_current_league_season', {
      p_league_id: leagueId,
    });
    if (error) throw error;
    const nowIso = new Date().toISOString();
    this.patchLocalLeague(leagueId, { currentSeasonEndedAt: nowIso });
  }

  /**
   * Étape 2 du cycle de saison (mig 029) — `start_new_league_season` :
   * reset les ELO à 1000, bump le numéro de saison, clear le marker
   * `current_season_ended_at`. Exige que `finishCurrentSeason` ait été
   * appelé préalablement (sinon erreur SQL "season not closed yet").
   * Renvoie le numéro de la nouvelle saison.
   */
  async startNewSeason(leagueId: string): Promise<number> {
    if (!this.isSupabaseAvailable()) {
      throw new Error('Démarrer une nouvelle saison nécessite une connexion serveur.');
    }
    const { data, error } = await sb!.rpc('start_new_league_season', {
      p_league_id: leagueId,
    });
    if (error) throw error;
    const newSeasonNumber = (data as number) ?? 1;
    const nowIso = new Date().toISOString();
    this.patchLocalLeague(leagueId, {
      currentSeasonNumber: newSeasonNumber,
      currentSeasonStartedAt: nowIso,
      currentSeasonEndedAt: null,
    });
    return newSeasonNumber;
  }

  /** Charge l'historique des saisons closes pour une league, DESC par numéro. */
  async loadSeasonArchives(leagueId: string): Promise<LeagueSeasonArchive[]> {
    if (!this.isSupabaseAvailable()) return [];
    const { data, error } = await sb!
      .from('league_season_archives')
      .select('*')
      .eq('league_id', leagueId)
      .order('season_number', { ascending: false });
    if (error) {
      console.error('Error loading season archives:', error);
      return [];
    }
    return ((data ?? []) as LeagueSeasonArchiveRow[]).map((row) => ({
      id: row.id,
      leagueId: row.league_id,
      seasonNumber: row.season_number,
      startedAt: row.started_at,
      endedAt: row.ended_at,
      matchCount: row.match_count,
      rankings: row.rankings,
      createdAt: row.created_at,
    }));
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
