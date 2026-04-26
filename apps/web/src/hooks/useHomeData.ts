import { useQuery } from "@tanstack/react-query";
import { supabase, isSupabaseAvailable } from "../lib/supabase";

interface Tournament {
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
  lastTournament?: Tournament;
  lastLeague?: League;
  personalStats?: PersonalStats;
  recentMatches: RecentMatch[];
  isLoading: boolean;
  error: Error | null;
}

async function fetchHomeData(userId: string) {
  try {
    // Guard: userId required (queryFn only runs when enabled: !!userId, but extra safety)
    if (!userId) {
      return {
        lastTournament: undefined,
        lastLeague: undefined,
        personalStats: undefined,
      };
    }
    // Project-context: Always check Supabase availability before operations
    if (!isSupabaseAvailable()) {
      return {
        lastTournament: undefined,
        lastLeague: undefined,
        personalStats: undefined,
      };
    }

    // Fetch last tournament (either created by user OR participated in)
    // First, get tournaments created by the user
    if (!supabase)
      return {
        lastTournament: undefined,
        lastLeague: undefined,
        personalStats: undefined,
      };
    const { data: createdTournament } = await supabase
      .from("tournaments")
      .select("id, name, is_finished, updated_at, team1_size, team2_size")
      .eq("creator_user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Also get tournaments where user is a participant
    const { data: participatedTournament } = await supabase
      .from("tournament_players")
      .select("tournament:tournaments(id, name, is_finished, updated_at, team1_size, team2_size)")
      .eq("user_id", userId)
      .order("joined_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let lastTournament: Tournament | undefined;

    // Get the most recent tournament (created or participated)
    const participatedTournamentData = participatedTournament
      ? Array.isArray(participatedTournament.tournament)
        ? participatedTournament.tournament[0]
        : participatedTournament.tournament
      : null;

    // Choose the most recent one
    let selectedTournament = null;
    if (createdTournament && participatedTournamentData) {
      const createdUpdated = createdTournament.updated_at ?? "";
      const participatedUpdated =
        (participatedTournamentData as { updated_at?: string | null })
          .updated_at ?? "";
      selectedTournament =
        new Date(createdUpdated) > new Date(participatedUpdated)
          ? createdTournament
          : participatedTournamentData;
    } else if (createdTournament) {
      selectedTournament = createdTournament;
    } else if (participatedTournamentData) {
      selectedTournament = participatedTournamentData;
    }

    if (selectedTournament) {
      const [{ count: playerCount }, { count: matchCount }] = await Promise.all([
        supabase
          .from("tournament_players")
          .select("*", { count: "exact", head: true })
          .eq("tournament_id", selectedTournament.id),
        supabase
          .from("matches")
          .select("*", { count: "exact", head: true })
          .eq("tournament_id", selectedTournament.id),
      ]);

      const t1 = (selectedTournament as { team1_size?: number | null }).team1_size;
      const t2 = (selectedTournament as { team2_size?: number | null }).team2_size;
      const format = t1 && t2 ? `${t1}v${t2}` : "2v2";

      lastTournament = {
        id: selectedTournament.id,
        name: selectedTournament.name,
        isFinished: selectedTournament.is_finished || false,
        playerCount: playerCount || 0,
        matchCount: matchCount || 0,
        format,
        updatedAt: selectedTournament.updated_at,
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

    // Also get leagues where user is a member
    const { data: joinedLeague } = await supabase
      .from("league_players")
      .select("league:leagues(id, name, updated_at)")
      .eq("user_id", userId)
      .order("joined_at", { ascending: false })
      .limit(1)
      .maybeSingle();

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
        .from("league_players")
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

    // Fetch personal stats + recent matches from elo_history
    const { data: eloHistory } = await supabase
      .from("elo_history")
      .select("elo_after, elo_change, match_id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    let personalStats: PersonalStats;
    let recentMatches: RecentMatch[] = [];

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

      // Fetch match details for the 3 most recent entries
      const recentIds = eloHistory
        .slice(0, 3)
        .map((h) => h.match_id)
        .filter(Boolean) as string[];

      if (recentIds.length > 0) {
        const { data: matchRows } = await supabase
          .from("matches")
          .select("id, format, score_a, score_b, created_at, tournament_id, league_id, tournaments(name), leagues(name)")
          .in("id", recentIds);

        if (matchRows) {
          recentMatches = recentIds.map((mid) => {
            const m = matchRows.find((r) => r.id === mid);
            const histEntry = eloHistory.find((h) => h.match_id === mid);
            if (!m) return null;
            const ctx = m.tournaments
              ? (Array.isArray(m.tournaments) ? m.tournaments[0]?.name : (m.tournaments as { name: string }).name)
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
      lastTournament,
      lastLeague,
      personalStats,
      recentMatches,
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
      lastTournament: undefined,
      lastLeague: undefined,
      personalStats: undefined,
      recentMatches: [],
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
    lastTournament: data?.lastTournament,
    lastLeague: data?.lastLeague,
    personalStats: data?.personalStats,
    recentMatches: data?.recentMatches ?? [],
    isLoading: isLoading && !!userId, // Only show loading if userId exists
    error: error as Error | null,
  };
}
