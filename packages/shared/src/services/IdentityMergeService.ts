/**
 * IdentityMergeService — post-mig 022 simplified model.
 * All "merge / claim / rename / archive" operations boil down to plain CRUD
 * on `players` + `*_memberships`, plus the single `claim_player` RPC.
 */

import { sb } from './repositories/_base';

interface RpcResult<T> {
  data: T | null;
  error: { message: string } | null;
}
type Rpc = (fn: string, params: Record<string, unknown>) => Promise<RpcResult<unknown>>;

class IdentityMergeService {
  async mergeAnonymousToUser(
    anonymousUserId: string,
    _userId: string,
    _pseudo: string,
  ): Promise<{
    success: boolean;
    error?: string;
    stats?: { leagues: number; events: number; matches: number };
  }> {
    void _userId;
    void _pseudo;
    if (!sb) return { success: false, error: 'Supabase not configured' };
    try {
      const rpc = sb.rpc.bind(sb) as unknown as Rpc;
      const { error } = await rpc('link_anonymous_to_auth', {
        p_anonymous_user_id: anonymousUserId,
      });
      if (error) return { success: false, error: error.message };
      return { success: true, stats: { leagues: 0, events: 0, matches: 0 } };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  async claimAnonymousPlayer(
    _kind: 'event' | 'league',
    membershipOrPlayerId: string,
    _userId: string,
  ): Promise<{
    success: boolean;
    error?: string;
    stats?: { matchesMigrated: number; eloHistoryMigrated: number; anonymousFullyConsumed: boolean };
  }> {
    void _kind;
    void _userId;
    if (!sb) return { success: false, error: 'Supabase not configured' };
    try {
      const playerId = await this.resolvePlayerId(_kind, membershipOrPlayerId);
      const rpc = sb.rpc.bind(sb) as unknown as Rpc;
      const { error } = await rpc('claim_player', { p_player_id: playerId });
      if (error) return { success: false, error: error.message };
      return { success: true, stats: { matchesMigrated: 0, eloHistoryMigrated: 0, anonymousFullyConsumed: true } };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  async claimAnonymousPlayerAsAnonymous(
    kind: 'event' | 'league',
    membershipOrPlayerId: string,
    claimerAnonymousUserId: string,
  ): Promise<{
    success: boolean;
    error?: string;
    stats?: { matchesMigrated: number; eloHistoryMigrated: number; anonymousFullyConsumed: boolean; noop?: boolean };
  }> {
    if (!sb) return { success: false, error: 'Supabase not configured' };
    try {
      const playerId = await this.resolvePlayerId(kind, membershipOrPlayerId);

      const { data: existing } = await sb
        .from('players')
        .select('id')
        .eq('user_id', claimerAnonymousUserId)
        .neq('id', playerId)
        .maybeSingle();
      if (existing) return { success: false, error: 'Tu possèdes déjà un autre joueur — un user = un player.' };

      const { data: target } = await sb.from('players').select('user_id').eq('id', playerId).maybeSingle();
      if (!target) return { success: false, error: 'Joueur introuvable' };
      const targetUserId = (target as { user_id: string | null }).user_id;
      if (targetUserId && targetUserId !== claimerAnonymousUserId) {
        return { success: false, error: 'Ce joueur appartient déjà à un autre compte' };
      }

      const { error } = await sb.from('players').update({ user_id: claimerAnonymousUserId } as never).eq('id', playerId).is('user_id', null);
      if (error) return { success: false, error: error.message };
      return { success: true, stats: { matchesMigrated: 0, eloHistoryMigrated: 0, anonymousFullyConsumed: true } };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  async claimPlayerById(
    playerId: string,
    opts: { userId?: string | null; anonymousUserId?: string | null },
  ): Promise<{ success: boolean; error?: string; playerId?: string }> {
    if (!sb) return { success: false, error: 'Supabase not configured' };
    if (opts.userId) {
      const result = await this.claimAnonymousPlayer('event', playerId, opts.userId);
      return { success: result.success, error: result.error, playerId };
    }
    if (opts.anonymousUserId) {
      const result = await this.claimAnonymousPlayerAsAnonymous('event', playerId, opts.anonymousUserId);
      return { success: result.success, error: result.error, playerId };
    }
    return { success: false, error: 'No identity provided' };
  }

  async renameAnonymousPlayer(
    kind: 'event' | 'league',
    membershipOrPlayerId: string,
    newPseudo: string,
  ): Promise<{ success: boolean; error?: string; pseudo?: string; globalPseudoUpdated?: boolean }> {
    if (!sb) return { success: false, error: 'Supabase not configured' };
    const trimmed = newPseudo.trim();
    if (!trimmed) return { success: false, error: 'Pseudo cannot be empty' };
    if (trimmed.length > 100) return { success: false, error: 'Pseudo too long (max 100)' };
    try {
      const playerId = await this.resolvePlayerId(kind, membershipOrPlayerId);
      const { error } = await sb.from('players').update({ pseudo: trimmed } as never).eq('id', playerId);
      if (error) return { success: false, error: error.message };
      return { success: true, pseudo: trimmed, globalPseudoUpdated: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  async deleteAnonymousPlayer(
    kind: 'event' | 'league',
    membershipOrPlayerId: string,
  ): Promise<{ success: boolean; error?: string; anonymousUserDeleted?: boolean }> {
    if (!sb) return { success: false, error: 'Supabase not configured' };
    try {
      const playerId = await this.resolvePlayerId(kind, membershipOrPlayerId);
      const { data: matchRows } = await sb
        .from('matches')
        .select('id')
        .or(`team_a_player_ids.cs.{${playerId}},team_b_player_ids.cs.{${playerId}}`)
        .limit(1);
      if ((matchRows?.length ?? 0) > 0) return { success: false, error: 'match(es) already recorded for this player' };
      const { error } = await sb.from('players').delete().eq('id', playerId);
      if (error) return { success: false, error: error.message };
      return { success: true, anonymousUserDeleted: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  async archiveAnonymousPlayer(
    kind: 'event' | 'league',
    membershipOrPlayerId: string,
  ): Promise<{ success: boolean; error?: string }> {
    if (!sb) return { success: false, error: 'Supabase not configured' };
    try {
      const playerId = await this.resolvePlayerId(kind, membershipOrPlayerId);
      const { error } = await sb.from('players').update({ archived_at: new Date().toISOString() } as never).eq('id', playerId);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  async unarchiveAnonymousPlayer(
    kind: 'event' | 'league',
    membershipOrPlayerId: string,
  ): Promise<{ success: boolean; error?: string }> {
    if (!sb) return { success: false, error: 'Supabase not configured' };
    try {
      const playerId = await this.resolvePlayerId(kind, membershipOrPlayerId);
      const { error } = await sb.from('players').update({ archived_at: null } as never).eq('id', playerId);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  /**
   * Archive a membership in this context (event/league). Context-scoped:
   * sets `<context>_memberships.archived_at`, leaving the global player and
   * its other memberships untouched. Hides the member from match pickers
   * (which filter on membership.archived_at) while keeping past matches/ELO.
   *
   * Unlike `archiveAnonymousPlayer`, this is safe for real accounts — it never
   * touches `players.archived_at`.
   */
  async archiveMembership(
    kind: 'event' | 'league',
    membershipId: string,
  ): Promise<{ success: boolean; error?: string }> {
    if (!sb) return { success: false, error: 'Supabase not configured' };
    try {
      const table = kind === 'event' ? 'event_memberships' : 'league_memberships';
      const { error } = await sb.from(table).update({ archived_at: new Date().toISOString() } as never).eq('id', membershipId);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  /** Restore an archived membership back to the active roster. */
  async unarchiveMembership(
    kind: 'event' | 'league',
    membershipId: string,
  ): Promise<{ success: boolean; error?: string }> {
    if (!sb) return { success: false, error: 'Supabase not configured' };
    try {
      const table = kind === 'event' ? 'event_memberships' : 'league_memberships';
      const { error } = await sb.from(table).update({ archived_at: null } as never).eq('id', membershipId);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  /**
   * Remove a member from this context — deletes the membership row only.
   * Blocked (error contains "match") when the member already played in this
   * context (`membership.matches_played > 0`), so the caller can fall back to
   * archiving instead. Best-effort: if the removed player was a ghost
   * (user_id IS NULL) with no remaining memberships, deletes the orphan
   * player row too.
   *
   * Works for both ghosts and real accounts — the global player is never
   * deleted for an account, only the link to this event/league.
   */
  async removeMembership(
    kind: 'event' | 'league',
    membershipId: string,
  ): Promise<{ success: boolean; error?: string }> {
    if (!sb) return { success: false, error: 'Supabase not configured' };
    try {
      const table = kind === 'event' ? 'event_memberships' : 'league_memberships';
      const { data: m } = await sb
        .from(table)
        .select('player_id, matches_played')
        .eq('id', membershipId)
        .maybeSingle();
      if (!m) return { success: false, error: 'Membership not found' };
      const row = m as { player_id: string; matches_played: number | null };
      if ((row.matches_played ?? 0) > 0) {
        return { success: false, error: 'match(es) already recorded for this player' };
      }
      const { error } = await sb.from(table).delete().eq('id', membershipId);
      if (error) return { success: false, error: error.message };

      // Best-effort orphan ghost cleanup — never fail the removal on this.
      try {
        const { data: p } = await sb.from('players').select('user_id').eq('id', row.player_id).maybeSingle();
        if (p && (p as { user_id: string | null }).user_id === null) {
          const [{ data: em }, { data: lm }] = await Promise.all([
            sb.from('event_memberships').select('id').eq('player_id', row.player_id).limit(1),
            sb.from('league_memberships').select('id').eq('player_id', row.player_id).limit(1),
          ]);
          if ((em?.length ?? 0) === 0 && (lm?.length ?? 0) === 0) {
            await sb.from('players').delete().eq('id', row.player_id);
          }
        }
      } catch {
        // ignore — membership already removed
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  /**
   * Mig 037 — Promote / demote a membership to/from co-admin role.
   *
   * Calls the SECURITY DEFINER RPC `set_event_membership_role` or
   * `set_league_membership_role`. The server-side check ensures only the
   * context creator can call this, and rejects promoting a ghost
   * (player.user_id IS NULL) or the creator himself.
   *
   * The caller must pass `callerUserId` (their `users.id` — the same
   * identity passed to other admin RPCs like `confirm_match`). Anonymous
   * users cannot promote anyone, but they can pass their `localUser.anonymousUserId`
   * if they are the creator of the context (anon-created entities, pre-claim).
   */
  async setMembershipRole(
    kind: 'event' | 'league',
    membershipId: string,
    role: 'member' | 'admin',
    callerUserId: string,
  ): Promise<{ success: boolean; error?: string }> {
    if (!sb) return { success: false, error: 'Supabase not configured' };
    try {
      const rpcName = kind === 'event' ? 'set_event_membership_role' : 'set_league_membership_role';
      const rpc = sb.rpc.bind(sb) as unknown as Rpc;
      const { error } = await rpc(rpcName, {
        p_membership_id: membershipId,
        p_role: role,
        p_caller_user_id: callerUserId,
      });
      if (error) return { success: false, error: this.humanizeRoleError(error.message) };
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  private humanizeRoleError(message: string): string {
    if (/ghost player cannot be promoted/i.test(message)) {
      return 'Impossible de promouvoir un joueur fantôme — il doit d\'abord créer un compte.';
    }
    if (/creator cannot be promoted/i.test(message)) {
      return 'Le créateur est déjà admin.';
    }
    if (/only the .* creator can change roles/i.test(message)) {
      return 'Seul le créateur peut promouvoir ou retirer un admin.';
    }
    if (/invalid role/i.test(message)) {
      return 'Rôle invalide.';
    }
    if (/not found/i.test(message)) {
      return 'Joueur introuvable.';
    }
    return message;
  }

  /** @deprecated mig 022 */
  async generateGhostInviteToken(_kind: 'event' | 'league', _playerId: string): Promise<{ success: boolean; error?: string; token?: string; expiresAt?: string }> {
    void _kind; void _playerId;
    return { success: false, error: 'Ghost invite tokens disabled (mig 022). Share the join code instead.' };
  }

  /** @deprecated mig 022 */
  async revokeGhostInviteToken(_token: string): Promise<{ success: boolean; error?: string }> {
    void _token;
    return { success: false, error: 'Ghost invite tokens disabled (mig 022)' };
  }

  /** @deprecated mig 022 */
  async claimGhostByToken(
    _token: string,
    _opts: { userId?: string | null; anonymousUserId?: string | null },
  ): Promise<{ success: boolean; error?: string; kind?: 'event' | 'league'; contextId?: string; playerId?: string }> {
    void _token; void _opts;
    return { success: false, error: 'Ghost invite tokens disabled (mig 022)' };
  }

  private async resolvePlayerId(kind: 'event' | 'league', membershipOrPlayerId: string): Promise<string> {
    if (!sb) throw new Error('Supabase not configured');
    const table = kind === 'event' ? 'event_memberships' : 'league_memberships';
    const { data } = await sb.from(table).select('player_id').eq('id', membershipOrPlayerId).maybeSingle();
    if (data) return (data as { player_id: string }).player_id;
    return membershipOrPlayerId;
  }
}

export const identityMergeService = new IdentityMergeService();
