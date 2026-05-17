/**
 * useUnclaimedGuests
 *
 * Returns the list of "ghost" players (players whose user_id IS NULL,
 * not yet claimed by anyone) for a given event or league.
 *
 * Post mig 022: a single join `event_memberships` (or `league_memberships`)
 * → `players` filtered by `players.user_id IS NULL` and `archived_at IS NULL`.
 */

import { useState, useEffect, useCallback } from "react";
import { sb } from "../services/repositories/_base";
import { useAuth } from "./useAuth";

function matchesArchivedFilter(
  archivedAt: string | null,
  filter: "active" | "archived" | "all",
): boolean {
  if (filter === "all") return true;
  return filter === "archived" ? archivedAt !== null : archivedAt === null;
}

export interface UnclaimedGuest {
  /** membership.id (event_memberships.id OR league_memberships.id). */
  playerId: string;
  /** players.id — the underlying entity. */
  anonymousUserId: string; // legacy field name kept for consumer compatibility
  /** Display name (pseudo_override > players.pseudo). */
  pseudo: string;
  joinedAt: string;
  /** True if the underlying player is soft-deleted (players.archived_at IS NOT NULL). */
  archived: boolean;
}

interface RawEventRow {
  id: string;
  joined_at: string | null;
  pseudo_override: string | null;
  player: { id: string; pseudo: string; user_id: string | null; archived_at: string | null } | null;
}

interface RawLeagueRow {
  id: string;
  joined_at: string | null;
  pseudo_override: string | null;
  player: { id: string; pseudo: string; user_id: string | null; archived_at: string | null } | null;
}

export function useUnclaimedGuests(
  kind: "event" | "league",
  contextId: string | null | undefined,
  options: {
    mode?: "auth-only" | "any";
    /** Which subset of ghosts to return. Defaults to active only. */
    archivedFilter?: "active" | "archived" | "all";
  } = {},
) {
  const mode = options.mode ?? "auth-only";
  const archivedFilter = options.archivedFilter ?? "active";
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [guests, setGuests] = useState<UnclaimedGuest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (authLoading) return;
    if (!contextId || !sb) {
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
      const select = `
        id,
        joined_at,
        pseudo_override,
        player:players ( id, pseudo, user_id, archived_at )
      `;

      if (kind === "event") {
        const { data, error: queryError } = await sb
          .from("event_memberships")
          .select(select)
          .eq("event_id", contextId)
          .order("joined_at", { ascending: true });
        if (queryError) throw queryError;

        const rows = (data ?? []) as unknown as RawEventRow[];
        const filtered: UnclaimedGuest[] = rows
          .filter((r) => r.player && r.player.user_id === null && matchesArchivedFilter(r.player.archived_at, archivedFilter))
          .map((r) => ({
            playerId: r.id,
            anonymousUserId: r.player!.id,
            pseudo: r.pseudo_override || r.player!.pseudo || "Joueur",
            joinedAt: r.joined_at ?? "",
            archived: r.player!.archived_at !== null,
          }));
        setGuests(filtered);
      } else {
        const { data, error: queryError } = await sb
          .from("league_memberships")
          .select(select)
          .eq("league_id", contextId)
          .order("joined_at", { ascending: true });
        if (queryError) throw queryError;

        const rows = (data ?? []) as unknown as RawLeagueRow[];
        const filtered: UnclaimedGuest[] = rows
          .filter((r) => r.player && r.player.user_id === null && matchesArchivedFilter(r.player.archived_at, archivedFilter))
          .map((r) => ({
            playerId: r.id,
            anonymousUserId: r.player!.id,
            pseudo: r.pseudo_override || r.player!.pseudo || "Joueur",
            joinedAt: r.joined_at ?? "",
            archived: r.player!.archived_at !== null,
          }));
        setGuests(filtered);
      }
    } catch (err) {
      const detail = err instanceof Error ? err.message : JSON.stringify(err);
      console.error("[useUnclaimedGuests] load failed:", detail);
      setError(detail);
      setGuests([]);
    } finally {
      setIsLoading(false);
    }
  }, [kind, contextId, isAuthenticated, authLoading, mode, archivedFilter]);

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
