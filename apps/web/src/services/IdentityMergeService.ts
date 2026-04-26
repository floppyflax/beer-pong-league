/**
 * IdentityMergeService — kept under the legacy name to minimize consumer
 * churn, but post-mig 022 the model is much simpler. All "merge / claim /
 * rename / archive" operations now boil down to plain CRUD on `players` +
 * `*_memberships`, plus the single `claim_player` RPC.
 *
 * Most legacy methods are kept as thin shims so existing callers (Auth flow,
 * EventJoin/LeagueJoin, dashboards) compile without change. Their stats
 * payload is mostly empty (the new model doesn't migrate row-by-row, just
 * flips player.user_id).
 */

import { sb } from "./repositories/_base";

interface RpcResult<T> {
  data: T | null;
  error: { message: string } | null;
}
type Rpc = (fn: string, params: Record<string, unknown>) => Promise<RpcResult<unknown>>;

class IdentityMergeService {
  // ────────────────────────────────────────────────────────────────────────
  // SIGN-UP / LINK ANON → AUTH
  // ────────────────────────────────────────────────────────────────────────
  /**
   * Called from the auth callback after a fresh sign-up. The caller has been
   * operating as an anonymous `users` row (identified by anonymousUserId);
   * link that row to their freshly-authed auth.users.id. All players +
   * memberships keep their owner.
   */
  async mergeAnonymousToUser(
    anonymousUserId: string,
    _userId: string, // ignored — we use auth.uid() server-side
    _pseudo: string, // ignored — pseudo is on `users`, not changed by linking
  ): Promise<{
    success: boolean;
    error?: string;
    stats?: { leagues: number; events: number; matches: number };
  }> {
    void _userId;
    void _pseudo;
    if (!sb) return { success: false, error: "Supabase not configured" };
    try {
      const rpc = sb.rpc.bind(sb) as unknown as Rpc;
      const { error } = await rpc("link_anonymous_to_auth", {
        p_anonymous_user_id: anonymousUserId,
      });
      if (error) return { success: false, error: error.message };
      // Stats-shape kept for backwards compat; the link is a single update so
      // there's nothing to count.
      return { success: true, stats: { leagues: 0, events: 0, matches: 0 } };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  // CLAIM A GHOST PLAYER
  // ────────────────────────────────────────────────────────────────────────
  /**
   * Claim a ghost player. The caller must be authenticated. Backed by the
   * `claim_player(player_id)` RPC (mig 022).
   *
   * Note: in the new model, `playerId` is the `players.id` directly (not a
   * event_players.id). Callers that have a membership id need to resolve
   * to player_id first via the membership row.
   */
  async claimAnonymousPlayer(
    _kind: "event" | "league",
    membershipOrPlayerId: string,
    _userId: string,
  ): Promise<{
    success: boolean;
    error?: string;
    stats?: {
      matchesMigrated: number;
      eloHistoryMigrated: number;
      anonymousFullyConsumed: boolean;
    };
  }> {
    void _kind;
    void _userId;
    if (!sb) return { success: false, error: "Supabase not configured" };

    try {
      const playerId = await this.resolvePlayerId(_kind, membershipOrPlayerId);
      const rpc = sb.rpc.bind(sb) as unknown as Rpc;
      const { error } = await rpc("claim_player", { p_player_id: playerId });
      if (error) return { success: false, error: error.message };
      return {
        success: true,
        stats: { matchesMigrated: 0, eloHistoryMigrated: 0, anonymousFullyConsumed: true },
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  }

  /**
   * Anonymous claim (caller has no auth account yet). Post-mig 022 we don't
   * support anon→ghost reassignment as a separate flow — anonymous users are
   * just `users` rows themselves, and the canonical "this is me" gesture is
   * to first sign in (or anon-sign-in) then call claim_player. Kept as a
   * shim that bubbles up a "auth required" message so the UI nudges sign-in.
   */
  async claimAnonymousPlayerAsAnonymous(
    _kind: "event" | "league",
    _playerId: string,
    _claimerAnonymousUserId: string,
  ): Promise<{
    success: boolean;
    error?: string;
    stats?: {
      matchesMigrated: number;
      eloHistoryMigrated: number;
      anonymousFullyConsumed: boolean;
      noop?: boolean;
    };
  }> {
    void _kind;
    void _playerId;
    void _claimerAnonymousUserId;
    return {
      success: false,
      error: "Connecte-toi pour réclamer ce joueur",
    };
  }

  // ────────────────────────────────────────────────────────────────────────
  // GHOST PLAYER ADMIN — CRUD on `players`
  // ────────────────────────────────────────────────────────────────────────
  /**
   * Rename a ghost player. Updates `players.pseudo` directly. Caller must
   * have admin rights at the app level (gated client-side). RLS is permissive
   * on `players.update` for now (cf. mig 022 §7).
   */
  async renameAnonymousPlayer(
    kind: "event" | "league",
    membershipOrPlayerId: string,
    newPseudo: string,
  ): Promise<{
    success: boolean;
    error?: string;
    pseudo?: string;
    globalPseudoUpdated?: boolean;
  }> {
    if (!sb) return { success: false, error: "Supabase not configured" };
    const trimmed = newPseudo.trim();
    if (!trimmed) return { success: false, error: "Pseudo cannot be empty" };
    if (trimmed.length > 100) return { success: false, error: "Pseudo too long (max 100)" };

    try {
      const playerId = await this.resolvePlayerId(kind, membershipOrPlayerId);
      const { error } = await sb
        .from("players")
        .update({ pseudo: trimmed } as never)
        .eq("id", playerId);
      if (error) return { success: false, error: error.message };
      return { success: true, pseudo: trimmed, globalPseudoUpdated: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  }

  /**
   * Hard-delete a ghost player. Refuses if any match references this player
   * (analogue of the legacy `delete_anonymous_player` block-on-played).
   */
  async deleteAnonymousPlayer(
    kind: "event" | "league",
    membershipOrPlayerId: string,
  ): Promise<{
    success: boolean;
    error?: string;
    anonymousUserDeleted?: boolean;
  }> {
    if (!sb) return { success: false, error: "Supabase not configured" };
    try {
      const playerId = await this.resolvePlayerId(kind, membershipOrPlayerId);

      // Block if matches reference this player.
      const { data: matchRows } = await sb
        .from("matches")
        .select("id")
        .or(
          `team_a_player_ids.cs.{${playerId}},team_b_player_ids.cs.{${playerId}}`,
        )
        .limit(1);
      if ((matchRows?.length ?? 0) > 0) {
        return { success: false, error: "match(es) already recorded for this player" };
      }

      const { error } = await sb.from("players").delete().eq("id", playerId);
      if (error) return { success: false, error: error.message };
      return { success: true, anonymousUserDeleted: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  }

  /**
   * Soft-delete via `players.archived_at`. Hides from future pickers while
   * preserving past matches.
   */
  async archiveAnonymousPlayer(
    kind: "event" | "league",
    membershipOrPlayerId: string,
  ): Promise<{ success: boolean; error?: string }> {
    if (!sb) return { success: false, error: "Supabase not configured" };
    try {
      const playerId = await this.resolvePlayerId(kind, membershipOrPlayerId);
      const { error } = await sb
        .from("players")
        .update({ archived_at: new Date().toISOString() } as never)
        .eq("id", playerId);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  // GHOST INVITE TOKENS — removed in mig 022
  // ────────────────────────────────────────────────────────────────────────
  /** @deprecated mig 022. Returns a no-op error. */
  async generateGhostInviteToken(
    _kind: "event" | "league",
    _playerId: string,
  ): Promise<{ success: boolean; error?: string; token?: string; expiresAt?: string }> {
    void _kind;
    void _playerId;
    return {
      success: false,
      error: "Ghost invite tokens disabled (mig 022). Share the join code instead.",
    };
  }

  /** @deprecated mig 022. */
  async revokeGhostInviteToken(_token: string): Promise<{ success: boolean; error?: string }> {
    void _token;
    return { success: false, error: "Ghost invite tokens disabled (mig 022)" };
  }

  /** @deprecated mig 022. */
  async claimGhostByToken(
    _token: string,
    _opts: { userId?: string | null; anonymousUserId?: string | null },
  ): Promise<{
    success: boolean;
    error?: string;
    kind?: "event" | "league";
    contextId?: string;
    playerId?: string;
  }> {
    void _token;
    void _opts;
    return { success: false, error: "Ghost invite tokens disabled (mig 022)" };
  }

  // ────────────────────────────────────────────────────────────────────────
  // INTERNAL — accept either a membership id (legacy) or a players.id (new)
  // ────────────────────────────────────────────────────────────────────────
  private async resolvePlayerId(
    kind: "event" | "league",
    membershipOrPlayerId: string,
  ): Promise<string> {
    if (!sb) throw new Error("Supabase not configured");
    const table = kind === "event" ? "event_memberships" : "league_memberships";
    const { data } = await sb
      .from(table)
      .select("player_id")
      .eq("id", membershipOrPlayerId)
      .maybeSingle();
    if (data) return (data as { player_id: string }).player_id;
    // Caller already passed a players.id directly.
    return membershipOrPlayerId;
  }
}

export const identityMergeService = new IdentityMergeService();
