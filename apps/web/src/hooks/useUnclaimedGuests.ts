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
  archived: boolean,
  filter: "active" | "archived" | "all",
): boolean {
  if (filter === "all") return true;
  return filter === "archived" ? archived : !archived;
}

export interface UnclaimedGuest {
  /** membership.id (event_memberships.id OR league_memberships.id). */
  playerId: string;
  /** players.id — the underlying entity. */
  anonymousUserId: string; // legacy field name kept for consumer compatibility
  /** Display name (pseudo_override > players.pseudo). */
  pseudo: string;
  joinedAt: string;
  /**
   * True if removed from this context — either the membership is archived
   * (membership.archived_at) or the underlying player is soft-deleted
   * (players.archived_at). The first is context-scoped (correct for real
   * accounts), the second is the legacy ghost-level archive.
   */
  archived: boolean;
  /** True when the underlying player has no account yet (players.user_id IS NULL). */
  isGhost: boolean;
}

interface RawRow {
  id: string;
  joined_at: string | null;
  pseudo_override: string | null;
  archived_at: string | null;
  player: { id: string; pseudo: string; user_id: string | null; archived_at: string | null } | null;
}

export function useUnclaimedGuests(
  kind: "event" | "league",
  contextId: string | null | undefined,
  options: {
    mode?: "auth-only" | "any";
    /** Which subset to return. Defaults to active only. */
    archivedFilter?: "active" | "archived" | "all";
    /**
     * Which members to return:
     *   - "ghosts" (default): only unclaimed players (user_id IS NULL).
     *   - "all": every member (ghosts + real accounts).
     */
    scope?: "ghosts" | "all";
    /**
     * users.id to drop from the list (typically the context creator/admin,
     * so the admin can't manage themselves). Compared against players.user_id.
     */
    excludeUserId?: string | null;
  } = {},
) {
  const mode = options.mode ?? "auth-only";
  const archivedFilter = options.archivedFilter ?? "active";
  const scope = options.scope ?? "ghosts";
  const excludeUserId = options.excludeUserId ?? null;
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
        archived_at,
        player:players ( id, pseudo, user_id, archived_at )
      `;

      const table = kind === "event" ? "event_memberships" : "league_memberships";
      const fk = kind === "event" ? "event_id" : "league_id";

      const { data, error: queryError } = await sb
        .from(table)
        .select(select)
        .eq(fk, contextId)
        .order("joined_at", { ascending: true });
      if (queryError) throw queryError;

      const rows = (data ?? []) as unknown as RawRow[];
      const filtered: UnclaimedGuest[] = rows
        .filter((r) => {
          if (!r.player) return false;
          const isGhost = r.player.user_id === null;
          if (scope === "ghosts" && !isGhost) return false;
          if (excludeUserId && r.player.user_id === excludeUserId) return false;
          const archived = r.archived_at !== null || r.player.archived_at !== null;
          return matchesArchivedFilter(archived, archivedFilter);
        })
        .map((r) => ({
          playerId: r.id,
          anonymousUserId: r.player!.id,
          pseudo: r.pseudo_override || r.player!.pseudo || "Joueur",
          joinedAt: r.joined_at ?? "",
          archived: r.archived_at !== null || r.player!.archived_at !== null,
          isGhost: r.player!.user_id === null,
        }));
      setGuests(filtered);
    } catch (err) {
      const detail = err instanceof Error ? err.message : JSON.stringify(err);
      console.error("[useUnclaimedGuests] load failed:", detail);
      setError(detail);
      setGuests([]);
    } finally {
      setIsLoading(false);
    }
  }, [kind, contextId, isAuthenticated, authLoading, mode, archivedFilter, scope, excludeUserId]);

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
