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
