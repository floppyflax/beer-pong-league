/**
 * useCurrentUserMemberships — résout les membership ids du user courant à
 * travers ses leagues et ses events.
 *
 * Côté React state, `league.players[i].id` et `event_players[i].id` portent
 * des membership ids (pas la `players.id` canonique). Cette résolution est
 * nécessaire pour la page `/stats` qui agrège les matchs du user en
 * cross-context : on a besoin de savoir "quel id me représente dans
 * chaque league/event ?" pour filtrer `match.teamA / teamB`.
 *
 * Conforme invariant #1 — `isSupabaseAvailable()` checked.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase, isSupabaseAvailable } from "../lib/supabase";

export interface CurrentUserMemberships {
  /** leagueId → membership id (matche `league.players[i].id`). */
  leagueMembershipByLeague: Map<string, string>;
  /** eventId → event membership id (matche `event.playerIds[i]` / `match.teamA[i]`). */
  eventMembershipByEvent: Map<string, string>;
}

const EMPTY: CurrentUserMemberships = {
  leagueMembershipByLeague: new Map(),
  eventMembershipByEvent: new Map(),
};

async function fetchMemberships(userId: string): Promise<CurrentUserMemberships> {
  if (!isSupabaseAvailable() || !supabase) return EMPTY;

  const { data: players } = await supabase
    .from("players")
    .select("id")
    .eq("user_id", userId);
  const playerIds = (players ?? []).map((p) => (p as { id: string }).id);
  if (playerIds.length === 0) return EMPTY;

  const [{ data: lm }, { data: em }] = await Promise.all([
    supabase
      .from("league_memberships")
      .select("id, league_id")
      .in("player_id", playerIds),
    supabase
      .from("event_memberships")
      .select("id, event_id")
      .in("player_id", playerIds),
  ]);

  const leagueMembershipByLeague = new Map<string, string>();
  for (const row of (lm ?? []) as Array<{ id: string; league_id: string }>) {
    leagueMembershipByLeague.set(row.league_id, row.id);
  }
  const eventMembershipByEvent = new Map<string, string>();
  for (const row of (em ?? []) as Array<{ id: string; event_id: string }>) {
    eventMembershipByEvent.set(row.event_id, row.id);
  }
  return { leagueMembershipByLeague, eventMembershipByEvent };
}

export function useCurrentUserMemberships(userId: string | null | undefined) {
  const { data } = useQuery({
    queryKey: ["currentUserMemberships", userId],
    queryFn: () => {
      if (!userId) throw new Error("userId required");
      return fetchMemberships(userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
  return data ?? EMPTY;
}
