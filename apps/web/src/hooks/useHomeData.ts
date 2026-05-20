import { useQuery } from "@tanstack/react-query";
import { supabase, isSupabaseAvailable } from "../lib/supabase";

interface Event {
  id: string;
  name: string;
  isFinished: boolean;
  playerCount: number;
  matchCount: number;
  format: string;
  updatedAt: string;
}

interface League {
  id: string;
  name: string;
  memberCount: number;
  updatedAt: string;
  status: "active" | "finished";
}

interface PersonalStats {
  totalMatches: number;
  winRate: number;
  /**
   * Plus longue série de victoires consécutives observée dans l'historique.
   * Remplace l'ancien `averageElo` (méta agrégée trompeuse — l'ELO se calibre
   * par contexte, pas globalement, cf. docs/architecture.md §ELO model).
   */
  bestStreak: number;
}

export interface RecentMatch {
  id: string;
  date: string;
  eloChange: number;
  format: string;
  scoreA: number;
  scoreB: number;
  contextName: string | null;
}

interface HomeData {
  lastEvent?: Event;
  lastLeague?: League;
  personalStats?: PersonalStats;
  recentMatches: RecentMatch[];
  /** Last 5 results (true=victoire, false=défaite) du plus récent au plus ancien. */
  recentResults: boolean[];
  /** Série en cours, signée : positive = victoires consécutives, négative = défaites, 0 si aucun match. */
  currentStreak: number;
  isLoading: boolean;
  error: Error | null;
}

async function fetchHomeData(userId: string) {
  try {
    // Guard: userId required (queryFn only runs when enabled: !!userId, but extra safety)
    if (!userId) {
      return {
        lastEvent: undefined,
        lastLeague: undefined,
        personalStats: undefined,
      };
    }
    // Project-context: Always check Supabase availability before operations
    if (!isSupabaseAvailable()) {
      return {
        lastEvent: undefined,
        lastLeague: undefined,
        personalStats: undefined,
      };
    }

    // Fetch last event (either created by user OR participated in)
    // First, get events created by the user
    if (!supabase)
      return {
        lastEvent: undefined,
        lastLeague: undefined,
        personalStats: undefined,
      };
    const { data: createdEvent } = await supabase
      .from("events")
      .select("id, name, is_finished, updated_at, team1_size, team2_size")
      .eq("creator_user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Also get events where user is a participant — mig 022:
    // event_memberships → players (filter by player.user_id = userId).
    const { data: myPlayer } = await supabase
      .from("players")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    const myPlayerId = (myPlayer as { id: string } | null)?.id ?? null;

    const { data: participatedEvent } = myPlayerId
      ? await supabase
          .from("event_memberships")
          .select("event:events(id, name, is_finished, updated_at, team1_size, team2_size)")
          .eq("player_id", myPlayerId)
          .order("joined_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : { data: null as null };

    let lastEvent: Event | undefined;

    // Get the most recent event (created or participated)
    const participatedEventData = participatedEvent
      ? Array.isArray(participatedEvent.event)
        ? participatedEvent.event[0]
        : participatedEvent.event
      : null;

    // Choose the most recent one
    let selectedEvent = null;
    if (createdEvent && participatedEventData) {
      const createdUpdated = createdEvent.updated_at ?? "";
      const participatedUpdated =
        (participatedEventData as { updated_at?: string | null })
          .updated_at ?? "";
      selectedEvent =
        new Date(createdUpdated) > new Date(participatedUpdated)
          ? createdEvent
          : participatedEventData;
    } else if (createdEvent) {
      selectedEvent = createdEvent;
    } else if (participatedEventData) {
      selectedEvent = participatedEventData;
    }

    if (selectedEvent) {
      const [{ count: playerCount }, { count: matchCount }] = await Promise.all([
        supabase
          .from("event_memberships")
          .select("*", { count: "exact", head: true })
          .eq("event_id", selectedEvent.id),
        supabase
          .from("matches")
          .select("*", { count: "exact", head: true })
          .eq("event_id", selectedEvent.id),
      ]);

      const t1 = (selectedEvent as { team1_size?: number | null }).team1_size;
      const t2 = (selectedEvent as { team2_size?: number | null }).team2_size;
      const format = t1 && t2 ? `${t1}v${t2}` : "2v2";

      lastEvent = {
        id: selectedEvent.id,
        name: selectedEvent.name,
        isFinished: selectedEvent.is_finished || false,
        playerCount: playerCount || 0,
        matchCount: matchCount || 0,
        format,
        updatedAt: selectedEvent.updated_at,
      };
    }

    // Fetch last league (either created by user OR participated in)
    // First, get leagues created by the user
    const { data: createdLeague } = await supabase
      .from("leagues")
      .select("id, name, updated_at")
      .eq("creator_user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Also get leagues where user is a member — mig 022 via league_memberships.
    const { data: joinedLeague } = myPlayerId
      ? await supabase
          .from("league_memberships")
          .select("league:leagues(id, name, updated_at)")
          .eq("player_id", myPlayerId)
          .order("joined_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : { data: null as null };

    let lastLeague: League | undefined;

    // Get the most recent league (created or joined)
    const joinedLeagueData = joinedLeague
      ? Array.isArray(joinedLeague.league)
        ? joinedLeague.league[0]
        : joinedLeague.league
      : null;

    // Choose the most recent one
    let selectedLeague = null;
    if (createdLeague && joinedLeagueData) {
      const createdUpdated = createdLeague.updated_at ?? "";
      const joinedUpdated =
        (joinedLeagueData as { updated_at?: string | null }).updated_at ?? "";
      selectedLeague =
        new Date(createdUpdated) > new Date(joinedUpdated)
          ? createdLeague
          : joinedLeagueData;
    } else if (createdLeague) {
      selectedLeague = createdLeague;
    } else if (joinedLeagueData) {
      selectedLeague = joinedLeagueData;
    }

    if (selectedLeague) {
      // Get member count for this league
      const { count: memberCount } = await supabase
        .from("league_memberships")
        .select("*", { count: "exact", head: true })
        .eq("league_id", selectedLeague.id);

      lastLeague = {
        id: selectedLeague.id,
        name: selectedLeague.name,
        status: "active", // Leagues don't have a status column, they're always active
        memberCount: memberCount || 0,
        updatedAt: selectedLeague.updated_at,
      };
    }

    // Fetch personal stats + recent matches from elo_history — mig 022:
    // elo_history is keyed by player_id (not user_id).
    const { data: eloHistory } = myPlayerId
      ? await supabase
          .from("elo_history")
          .select("elo_after, elo_change, match_id, created_at")
          .eq("player_id", myPlayerId)
          .order("created_at", { ascending: false })
      : { data: null as null };

    let personalStats: PersonalStats;
    let recentMatches: RecentMatch[] = [];
    let recentResults: boolean[] = [];
    let currentStreak = 0;

    if (eloHistory && eloHistory.length > 0) {
      // Mig 023 — un même match peut produire 2 lignes elo_history (event +
      // league) quand l'event propage à la ligue. On dédupe par match_id
      // pour le compte lifetime, en gardant la première occurrence (la plus
      // récente, puisque le tri est desc). Le résultat = "matchs joués
      // distincts", pas "delta ELO touchés".
      const seenMatchIds = new Set<string>();
      const uniqueByMatch: typeof eloHistory = [];
      for (const h of eloHistory) {
        if (h.match_id && seenMatchIds.has(h.match_id)) continue;
        if (h.match_id) seenMatchIds.add(h.match_id);
        uniqueByMatch.push(h);
      }

      const totalMatches = uniqueByMatch.length;
      const wins = uniqueByMatch.filter((h) => h.elo_change > 0).length;
      const winRate =
        totalMatches > 0 ? Math.round((wins / totalMatches) * 10000) / 100 : 0;

      // bestStreak — plus longue série de victoires consécutives, calculée
      // sur les matchs dédupliqués.
      let bestStreak = 0;
      let current = 0;
      for (const h of uniqueByMatch) {
        if (h.elo_change > 0) {
          current += 1;
          if (current > bestStreak) bestStreak = current;
        } else {
          current = 0;
        }
      }

      personalStats = { totalMatches, winRate, bestStreak };

      // 5 derniers résultats W/L, du plus récent au plus ancien — utilisé
      // par la home card pour afficher les billes de forme récente.
      recentResults = uniqueByMatch.slice(0, 5).map((h) => h.elo_change > 0);

      // Série en cours signée : on parcourt depuis le plus récent et on
      // compte tant que le signe du delta reste cohérent avec le premier.
      if (uniqueByMatch.length > 0) {
        const firstWon = uniqueByMatch[0].elo_change > 0;
        let streak = 0;
        for (const h of uniqueByMatch) {
          const won = h.elo_change > 0;
          if (won !== firstWon) break;
          streak += 1;
        }
        currentStreak = firstWon ? streak : -streak;
      }

      // Fetch match details for the 3 most recent entries
      const recentIds = eloHistory
        .slice(0, 3)
        .map((h) => h.match_id)
        .filter(Boolean) as string[];

      if (recentIds.length > 0) {
        const { data: matchRows } = await supabase
          .from("matches")
          .select("id, format, score_a, score_b, created_at, event_id, league_id, events(name), leagues(name)")
          .in("id", recentIds);

        if (matchRows) {
          recentMatches = recentIds.map((mid) => {
            const m = matchRows.find((r) => r.id === mid);
            const histEntry = eloHistory.find((h) => h.match_id === mid);
            if (!m) return null;
            const ctx = m.events
              ? (Array.isArray(m.events) ? m.events[0]?.name : (m.events as { name: string }).name)
              : m.leagues
              ? (Array.isArray(m.leagues) ? m.leagues[0]?.name : (m.leagues as { name: string }).name)
              : null;
            return {
              id: m.id,
              date: m.created_at ?? new Date().toISOString(),
              eloChange: histEntry?.elo_change ?? 0,
              format: m.format ?? "2v2",
              scoreA: m.score_a,
              scoreB: m.score_b,
              contextName: ctx ?? null,
            } satisfies RecentMatch;
          }).filter((m): m is RecentMatch => m !== null);
        }
      }
    } else {
      personalStats = { totalMatches: 0, winRate: 0, bestStreak: 0 };
    }

    return {
      lastEvent,
      lastLeague,
      personalStats,
      recentMatches,
      recentResults,
      currentStreak,
    };
  } catch (error) {
    console.error("Error fetching home data:", error);

    // TODO: Add Sentry integration when implemented (Architecture Decision 5.3)
    // if (import.meta.env.PROD && window.Sentry) {
    //   window.Sentry.captureException(error, {
    //     tags: { feature: 'home-data', userId },
    //     level: 'error',
    //   });
    // }

    // Return empty data instead of throwing
    return {
      lastEvent: undefined,
      lastLeague: undefined,
      personalStats: undefined,
      recentMatches: [],
      recentResults: [],
      currentStreak: 0,
    };
  }
}

export function useHomeData(userId: string | null | undefined): HomeData {
  const { data, isLoading, error } = useQuery({
    queryKey: ["homeData", userId],
    queryFn: () => {
      if (!userId) throw new Error("userId required");
      return fetchHomeData(userId);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1, // Only retry once on failure
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
  });

  return {
    lastEvent: data?.lastEvent,
    lastLeague: data?.lastLeague,
    personalStats: data?.personalStats,
    recentMatches: data?.recentMatches ?? [],
    recentResults: data?.recentResults ?? [],
    currentStreak: data?.currentStreak ?? 0,
    isLoading: isLoading && !!userId, // Only show loading if userId exists
    error: error as Error | null,
  };
}
