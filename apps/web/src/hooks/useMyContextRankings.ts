/**
 * useMyContextRankings — calcule mon rang `#N/total` dans chaque league et
 * chaque event auxquels je participe.
 *
 * - **League** : dérivé synchrone depuis `LeagueContext.leagues[].players`
 *   (déjà chargé avec l'ELO courant). Tri desc + index sur le membership id
 *   retourné par `useCurrentUserMemberships`.
 * - **Event** : asynchrone via un batch sur `event_memberships` (mig 023 —
 *   colonne `elo` autoritative pour l'ELO event-local).
 *
 * Règle d'égalité — si plusieurs joueurs partagent strictement le même ELO
 * que moi, le rang n'est pas significatif (cas typique : event sans match,
 * tous à 1000) → renvoie `null` pour ce contexte.
 *
 * Conforme invariant #1 — `isSupabaseAvailable()` checked.
 */

import { useContext, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase, isSupabaseAvailable } from "@/lib/supabase";
import { AuthContext } from "@/context/AuthContext";
import { LeagueContext } from "@/context/LeagueContext";
import { useCurrentUserMemberships } from "./useCurrentUserMemberships";

export interface ContextRank {
  rank: number;
  total: number;
}

export interface MyContextRankings {
  leagueRanks: Map<string, ContextRank>;
  eventRanks: Map<string, ContextRank>;
}

const EMPTY: MyContextRankings = {
  leagueRanks: new Map(),
  eventRanks: new Map(),
};

interface EventMembershipRankRow {
  id: string;
  event_id: string;
  elo: number;
}

async function fetchEventMembershipsForRanks(
  eventIds: string[],
): Promise<EventMembershipRankRow[]> {
  if (!isSupabaseAvailable() || !supabase || eventIds.length === 0) return [];
  // Mig 023 added `elo` to event_memberships; the generated Supabase types
  // may lag behind, so we cast through `unknown` like the repository does.
  const { data, error } = await supabase
    .from("event_memberships")
    .select("id, event_id, elo")
    .in("event_id", eventIds);
  if (error) return [];
  return (data ?? []) as unknown as EventMembershipRankRow[];
}

/**
 * Calcule le rang d'un membre dans un classement. Renvoie `null` si :
 * - le membre n'est pas trouvé,
 * - plusieurs membres partagent exactement le même ELO (rang non significatif).
 */
export function computeContextRank(
  rows: Array<{ id: string; elo: number }>,
  myId: string,
): ContextRank | null {
  const me = rows.find((r) => r.id === myId);
  if (!me) return null;
  const sameElo = rows.filter((r) => r.elo === me.elo).length;
  if (sameElo > 1) return null;
  const better = rows.filter((r) => r.elo > me.elo).length;
  return { rank: better + 1, total: rows.length };
}

export function useMyContextRankings(): MyContextRankings {
  // Defensive context reads — when a card is rendered outside the full app
  // tree (some unit tests render just a card with a router), the providers
  // may not be mounted. We degrade gracefully to "no rank" instead of
  // throwing.
  const authContext = useContext(AuthContext);
  const leagueContext = useContext(LeagueContext);
  const user = authContext?.user ?? null;
  const leagues = leagueContext?.leagues ?? [];
  const memberships = useCurrentUserMemberships(user?.id);

  const eventIds = useMemo(() => {
    const ids = Array.from(memberships.eventMembershipByEvent.keys());
    ids.sort();
    return ids;
  }, [memberships.eventMembershipByEvent]);

  const { data: eventRows } = useQuery({
    queryKey: ["myEventMembershipsForRanks", eventIds],
    queryFn: () => fetchEventMembershipsForRanks(eventIds),
    enabled: eventIds.length > 0,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  return useMemo(() => {
    if (!user) return EMPTY;

    const leagueRanks = new Map<string, ContextRank>();
    for (const league of leagues) {
      const myLeagueMembershipId = memberships.leagueMembershipByLeague.get(
        league.id,
      );
      if (!myLeagueMembershipId) continue;
      if (!league.players || league.players.length === 0) continue;
      const rows = league.players.map((p) => ({ id: p.id, elo: p.elo }));
      const r = computeContextRank(rows, myLeagueMembershipId);
      if (r) leagueRanks.set(league.id, r);
    }

    const eventRanks = new Map<string, ContextRank>();
    if (eventRows && eventRows.length > 0) {
      const byEvent = new Map<string, EventMembershipRankRow[]>();
      for (const row of eventRows) {
        const arr = byEvent.get(row.event_id) ?? [];
        arr.push(row);
        byEvent.set(row.event_id, arr);
      }
      for (const [eventId, rows] of byEvent) {
        const myMembershipId = memberships.eventMembershipByEvent.get(eventId);
        if (!myMembershipId) continue;
        const r = computeContextRank(
          rows.map((row) => ({ id: row.id, elo: row.elo })),
          myMembershipId,
        );
        if (r) eventRanks.set(eventId, r);
      }
    }

    return { leagueRanks, eventRanks };
  }, [user, leagues, memberships, eventRows]);
}

export function useMyLeagueRank(leagueId: string): ContextRank | null {
  const { leagueRanks } = useMyContextRankings();
  return leagueRanks.get(leagueId) ?? null;
}

export function useMyEventRank(eventId: string): ContextRank | null {
  const { eventRanks } = useMyContextRankings();
  return eventRanks.get(eventId) ?? null;
}
