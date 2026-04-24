/**
 * useLiveMatch — Supabase Realtime subscription for a single match.
 *
 * Phase D.4 — Beer Pong ELO redesign.
 *
 * Subscribes to postgres_changes on `matches` for a given match ID.
 * Returns the latest live state: is_live, balloon_possession, is_match_point.
 * Respects invariant #1: checks isSupabaseAvailable() before subscribing.
 */

import { useEffect, useState } from "react";
import { supabase, isSupabaseAvailable } from "../lib/supabase";

export interface LiveMatchState {
  isLive: boolean;
  balloonPossession: "team_a" | "team_b" | null;
  isMatchPoint: boolean;
}

const DEFAULT_STATE: LiveMatchState = {
  isLive: false,
  balloonPossession: null,
  isMatchPoint: false,
};

/**
 * Subscribe to realtime updates for a specific match.
 * Returns null when Supabase is unavailable or matchId is not provided.
 */
export function useLiveMatch(matchId: string | null | undefined): LiveMatchState | null {
  const [state, setState] = useState<LiveMatchState | null>(null);

  useEffect(() => {
    if (!matchId || !isSupabaseAvailable() || !supabase) return;

    // Fetch initial state
    const client = supabase as any; // new DB columns not yet in generated types

    client
      .from("matches")
      .select("is_live, balloon_possession, is_match_point")
      .eq("id", matchId)
      .single()
      .then(({ data }: { data: Record<string, unknown> | null }) => {
        if (data) {
          setState({
            isLive: Boolean(data["is_live"]),
            balloonPossession: (data["balloon_possession"] as "team_a" | "team_b" | null) ?? null,
            isMatchPoint: Boolean(data["is_match_point"]),
          });
        } else {
          setState(DEFAULT_STATE);
        }
      });

    // Subscribe to realtime changes
    const channel = client
      .channel(`live-match-${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "matches",
          filter: `id=eq.${matchId}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          const row = payload.new;
          setState({
            isLive: Boolean(row["is_live"]),
            balloonPossession: (row["balloon_possession"] as "team_a" | "team_b" | null) ?? null,
            isMatchPoint: Boolean(row["is_match_point"]),
          });
        },
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [matchId]);

  return state;
}
