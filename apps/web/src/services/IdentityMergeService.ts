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
}

export const identityMergeService = new IdentityMergeService();
