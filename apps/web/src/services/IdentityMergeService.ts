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
}

export const identityMergeService = new IdentityMergeService();
