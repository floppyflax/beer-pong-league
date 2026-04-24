/**
 * Service for merging anonymous user identity to authenticated user
 * Handles the migration of all data from anonymous_user_id to user_id
 */

import { supabase } from "../lib/supabase";
// import type { LocalUser } from './LocalUserService'; // Unused
import { authService } from "./AuthService";

class IdentityMergeService {
  /**
   * Merge anonymous user identity to authenticated user
   * This is called when a user claims their account
   *
   * Uses atomic PostgreSQL function to ensure transactional integrity
   */
  async mergeAnonymousToUser(
    anonymousUserId: string,
    userId: string,
    pseudo: string,
  ): Promise<{
    success: boolean;
    error?: string;
    stats?: { leagues: number; tournaments: number; matches: number };
  }> {
    if (!supabase) {
      return { success: false, error: "Supabase not configured" };
    }

    try {
      // 1. Create user profile if doesn't exist
      const profile = await authService.getUserProfile(userId);
      if (!profile) {
        const created = await authService.createUserProfile(userId, pseudo);
        if (!created) {
          return { success: false, error: "Failed to create user profile" };
        }
      }

      // 2. Call atomic merge function (all-or-nothing transaction)
      const { data, error: rpcError } = await supabase.rpc(
        "merge_anonymous_identity",
        {
          p_anonymous_user_id: anonymousUserId,
          p_user_id: userId,
        },
      );

      if (rpcError) {
        console.error("Error merging identity:", rpcError);
        return { success: false, error: rpcError.message };
      }

      // 3. Return success with stats (RPC returns Json, cast for typed access)
      const stats = data as {
        leagues_migrated?: number;
        tournaments_migrated?: number;
        matches_migrated?: number;
      } | null;
      return {
        success: true,
        stats: {
          leagues: stats?.leagues_migrated ?? 0,
          tournaments: stats?.tournaments_migrated ?? 0,
          matches: stats?.matches_migrated ?? 0,
        },
      };
    } catch (error) {
      console.error("Error merging identity:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Claim a single anonymous (guest) player row in a tournament or league.
   *
   * Use case: an admin manually added "Florian" as a ghost participant before
   * Florian created an account. Once authenticated, Florian opens the
   * event/league and confirms "C'est moi" on the unclaimed pseudo.
   *
   * Backed by the atomic `claim_anonymous_player` RPC (migration 012):
   *   - Reassigns the player row, scoped matches and elo_history.
   *   - Marks the source anonymous_user as merged if no remaining refs.
   *   - Server-side `auth.uid()` check enforces the caller can only claim on
   *     their own behalf.
   */
  async claimAnonymousPlayer(
    kind: "tournament" | "league",
    playerId: string,
    userId: string,
  ): Promise<{
    success: boolean;
    error?: string;
    stats?: {
      matchesMigrated: number;
      eloHistoryMigrated: number;
      anonymousFullyConsumed: boolean;
    };
  }> {
    if (!supabase) {
      return { success: false, error: "Supabase not configured" };
    }

    try {
      // Cast to bypass generated type (migration 012 RPC not yet in types).
      // Regenerate via `supabase gen types typescript` once migration is applied
      // to remove this escape hatch.
      const rpc = supabase.rpc.bind(supabase) as unknown as (
        fn: string,
        params: Record<string, unknown>,
      ) => Promise<{ data: unknown; error: { message: string } | null }>;

      const { data, error: rpcError } = await rpc("claim_anonymous_player", {
        p_kind: kind,
        p_player_id: playerId,
        p_user_id: userId,
      });

      if (rpcError) {
        console.error("Error claiming anonymous player:", rpcError);
        return { success: false, error: rpcError.message };
      }

      const result = data as {
        matches_migrated?: number;
        elo_history_migrated?: number;
        anonymous_fully_consumed?: boolean;
      } | null;

      return {
        success: true,
        stats: {
          matchesMigrated: result?.matches_migrated ?? 0,
          eloHistoryMigrated: result?.elo_history_migrated ?? 0,
          anonymousFullyConsumed: result?.anonymous_fully_consumed ?? false,
        },
      };
    } catch (error) {
      console.error("Error claiming anonymous player:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Claim a single anonymous (guest) player row as ANOTHER anonymous user
   * (i.e. the caller has no Supabase auth account, just a localUser).
   *
   * Backed by migration 014's `claim_anonymous_player_anon` RPC. Capability
   * check on the server: caller proves ownership of their anonymous_user_id
   * by passing the UUID. Acceptable for the POC per product decision; the
   * UI surfaces playerId only on screens that already required the join code.
   */
  async claimAnonymousPlayerAsAnonymous(
    kind: "tournament" | "league",
    playerId: string,
    claimerAnonymousUserId: string,
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
    if (!supabase) {
      return { success: false, error: "Supabase not configured" };
    }

    try {
      const rpc = supabase.rpc.bind(supabase) as unknown as (
        fn: string,
        params: Record<string, unknown>,
      ) => Promise<{ data: unknown; error: { message: string } | null }>;

      const { data, error: rpcError } = await rpc(
        "claim_anonymous_player_anon",
        {
          p_kind: kind,
          p_player_id: playerId,
          p_claimer_anonymous_user_id: claimerAnonymousUserId,
        },
      );

      if (rpcError) {
        console.error("Error claiming anonymous player (anon):", rpcError);
        return { success: false, error: rpcError.message };
      }

      const result = data as {
        matches_migrated?: number;
        elo_history_migrated?: number;
        anonymous_fully_consumed?: boolean;
        noop?: boolean;
      } | null;

      return {
        success: true,
        stats: {
          matchesMigrated: result?.matches_migrated ?? 0,
          eloHistoryMigrated: result?.elo_history_migrated ?? 0,
          anonymousFullyConsumed: result?.anonymous_fully_consumed ?? false,
          noop: result?.noop ?? false,
        },
      };
    } catch (error) {
      console.error("Error claiming anonymous player (anon):", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Generate a single-use ghost-invite token. Admin-only (auth required;
   * server checks `auth.uid() = context.creator_user_id`).
   *
   * Backed by migration 015's `generate_ghost_invite_token` RPC.
   */
  async generateGhostInviteToken(
    kind: "tournament" | "league",
    playerId: string,
  ): Promise<{
    success: boolean;
    error?: string;
    token?: string;
    expiresAt?: string;
  }> {
    if (!supabase) {
      return { success: false, error: "Supabase not configured" };
    }

    try {
      const rpc = supabase.rpc.bind(supabase) as unknown as (
        fn: string,
        params: Record<string, unknown>,
      ) => Promise<{ data: unknown; error: { message: string } | null }>;

      const { data, error: rpcError } = await rpc(
        "generate_ghost_invite_token",
        { p_kind: kind, p_player_id: playerId },
      );

      if (rpcError) {
        console.error("Error generating ghost invite token:", rpcError);
        return { success: false, error: rpcError.message };
      }

      const result = data as {
        token?: string;
        expires_at?: string;
      } | null;

      return {
        success: true,
        token: result?.token,
        expiresAt: result?.expires_at,
      };
    } catch (error) {
      console.error("Error generating ghost invite token:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Revoke an active ghost invite token. Admin-only.
   * Backed by migration 015's `revoke_ghost_invite_token` RPC.
   */
  async revokeGhostInviteToken(
    token: string,
  ): Promise<{ success: boolean; error?: string }> {
    if (!supabase) {
      return { success: false, error: "Supabase not configured" };
    }

    try {
      const rpc = supabase.rpc.bind(supabase) as unknown as (
        fn: string,
        params: Record<string, unknown>,
      ) => Promise<{ data: unknown; error: { message: string } | null }>;

      const { error: rpcError } = await rpc("revoke_ghost_invite_token", {
        p_token: token,
      });

      if (rpcError) {
        console.error("Error revoking ghost invite token:", rpcError);
        return { success: false, error: rpcError.message };
      }

      return { success: true };
    } catch (error) {
      console.error("Error revoking ghost invite token:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Consume a ghost invite token from a URL `?ghost=TOKEN` and reassign the
   * underlying player row to the caller. Pass exactly one of `userId` or
   * `anonymousUserId` (XOR, enforced server-side).
   *
   * Backed by migration 015's `claim_ghost_by_token` RPC, which delegates
   * internally to either `claim_anonymous_player` (auth) or
   * `claim_anonymous_player_anon` (anon).
   */
  async claimGhostByToken(
    token: string,
    caller: { userId: string } | { anonymousUserId: string },
  ): Promise<{
    success: boolean;
    error?: string;
    kind?: "tournament" | "league";
    contextId?: string;
    playerId?: string;
  }> {
    if (!supabase) {
      return { success: false, error: "Supabase not configured" };
    }

    try {
      const rpc = supabase.rpc.bind(supabase) as unknown as (
        fn: string,
        params: Record<string, unknown>,
      ) => Promise<{ data: unknown; error: { message: string } | null }>;

      const params: Record<string, unknown> = { p_token: token };
      if ("userId" in caller) {
        params.p_user_id = caller.userId;
      } else {
        params.p_anonymous_user_id = caller.anonymousUserId;
      }

      const { data, error: rpcError } = await rpc(
        "claim_ghost_by_token",
        params,
      );

      if (rpcError) {
        console.error("Error claiming ghost by token:", rpcError);
        return { success: false, error: rpcError.message };
      }

      const result = data as {
        kind?: "tournament" | "league";
        context_id?: string;
        player_id?: string;
      } | null;

      return {
        success: true,
        kind: result?.kind,
        contextId: result?.context_id,
        playerId: result?.player_id,
      };
    } catch (error) {
      console.error("Error claiming ghost by token:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

export const identityMergeService = new IdentityMergeService();
