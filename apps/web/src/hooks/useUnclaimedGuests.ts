/**
 * useUnclaimedGuests
 *
 * Returns the list of "ghost" players (anonymous_user_id NOT NULL, user_id NULL,
 * source anonymous_users not yet merged) for a given tournament or league.
 *
 * Use case (PR3 of the join-flow refactor): both authenticated AND anonymous
 * users land on `/tournament/:id/join` or `/league/:id/join` and may want to
 * adopt a ghost row pre-created by an admin (e.g. "L'admin a créé un joueur
 * 'Toto' — c'est moi"). We expose the same list for both, and the consuming
 * page picks the right RPC:
 *   - authenticated → `claim_anonymous_player`
 *   - anonymous     → `claim_anonymous_player_anon` (mig 014, capability-based)
 *
 * Pass `mode: "auth-only"` to restore the legacy behaviour (post-account
 * banner on the dashboard, where claim only makes sense for auth users).
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";

export interface UnclaimedGuest {
  /** tournament_players.id OR league_players.id (depending on kind). */
  playerId: string;
  /** anonymous_users.id — the source identity to merge from. */
  anonymousUserId: string;
  /** Display name (pseudo_in_* takes precedence over anonymous_users.pseudo). */
  pseudo: string;
  joinedAt: string;
}

interface RawTournamentRow {
  id: string;
  anonymous_user_id: string | null;
  pseudo_in_tournament: string | null;
  joined_at: string | null;
  anonymous_user:
    | { id: string; pseudo: string | null; merged_to_user_id: string | null }
    | null;
}

interface RawLeagueRow {
  id: string;
  anonymous_user_id: string | null;
  pseudo_in_league: string | null;
  joined_at: string | null;
  anonymous_user:
    | { id: string; pseudo: string | null; merged_to_user_id: string | null }
    | null;
}

export function useUnclaimedGuests(
  kind: "tournament" | "league",
  contextId: string | null | undefined,
  options: { mode?: "auth-only" | "any" } = {},
) {
  const mode = options.mode ?? "auth-only";
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [guests, setGuests] = useState<UnclaimedGuest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (authLoading) return;
    // In "auth-only" mode (legacy dashboard banner) we bail for anon users.
    // In "any" mode (PR3 join flow), we serve the list to everyone — the RLS
    // SELECT policy on tournament_players/league_players is permissive for
    // reads, and the claim RPC enforces caller identity at write time.
    if (!contextId || !supabase) {
      setGuests([]);
      return;
    }
    if (mode === "auth-only" && !isAuthenticated) {
      setGuests([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (kind === "tournament") {
        const { data, error: queryError } = await supabase
          .from("tournament_players")
          .select(
            `
            id,
            anonymous_user_id,
            pseudo_in_tournament,
            joined_at,
            anonymous_user:anonymous_users (
              id,
              pseudo,
              merged_to_user_id
            )
          `,
          )
          .eq("tournament_id", contextId)
          .is("user_id", null)
          .not("anonymous_user_id", "is", null)
          .order("joined_at", { ascending: true });

        if (queryError) throw queryError;

        const rows = (data ?? []) as unknown as RawTournamentRow[];
        const filtered: UnclaimedGuest[] = rows
          .filter(
            (r) =>
              r.anonymous_user_id &&
              r.anonymous_user &&
              r.anonymous_user.merged_to_user_id === null,
          )
          .map((r) => ({
            playerId: r.id,
            anonymousUserId: r.anonymous_user_id as string,
            pseudo:
              r.pseudo_in_tournament ||
              r.anonymous_user?.pseudo ||
              "Joueur",
            joinedAt: r.joined_at ?? "",
          }));

        setGuests(filtered);
      } else {
        const { data, error: queryError } = await supabase
          .from("league_players")
          .select(
            `
            id,
            anonymous_user_id,
            pseudo_in_league,
            joined_at,
            anonymous_user:anonymous_users (
              id,
              pseudo,
              merged_to_user_id
            )
          `,
          )
          .eq("league_id", contextId)
          .is("user_id", null)
          .not("anonymous_user_id", "is", null)
          .order("joined_at", { ascending: true });

        if (queryError) throw queryError;

        const rows = (data ?? []) as unknown as RawLeagueRow[];
        const filtered: UnclaimedGuest[] = rows
          .filter(
            (r) =>
              r.anonymous_user_id &&
              r.anonymous_user &&
              r.anonymous_user.merged_to_user_id === null,
          )
          .map((r) => ({
            playerId: r.id,
            anonymousUserId: r.anonymous_user_id as string,
            pseudo:
              r.pseudo_in_league || r.anonymous_user?.pseudo || "Joueur",
            joinedAt: r.joined_at ?? "",
          }));

        setGuests(filtered);
      }
    } catch (err) {
      console.error("[useUnclaimedGuests] load failed:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setGuests([]);
    } finally {
      setIsLoading(false);
    }
  }, [kind, contextId, isAuthenticated, authLoading, mode]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    guests,
    isLoading,
    error,
    refresh: load,
  };
}
