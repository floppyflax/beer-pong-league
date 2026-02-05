import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

interface Tournament {
  id: string;
  name: string;
  isFinished: boolean;
  playerCount: number;
  updatedAt: string;
}

interface League {
  id: string;
  name: string;
  memberCount: number;
  updatedAt: string;
  status: 'active' | 'finished';
}

interface PersonalStats {
  totalMatches: number;
  winRate: number;
  averageElo: number;
}

interface HomeData {
  lastTournament?: Tournament;
  lastLeague?: League;
  personalStats?: PersonalStats;
  isLoading: boolean;
  error: Error | null;
}

async function fetchHomeData(userId: string) {
  try {
    // Fetch last tournament (either created by user OR participated in)
    // First, get tournaments created by the user
    const { data: createdTournament, error: createdError } = await supabase
      .from('tournaments')
      .select('id, name, is_finished, updated_at')
      .eq('creator_user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Also get tournaments where user is a participant
    const { data: participatedTournament, error: participationError } = await supabase
      .from('tournament_players')
      .select('tournament:tournaments(id, name, is_finished, updated_at)')
      .eq('user_id', userId)
      .order('joined_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let lastTournament: Tournament | undefined;
    
    // Get the most recent tournament (created or participated)
    const participatedTournamentData = participatedTournament
      ? (Array.isArray(participatedTournament.tournament) 
          ? participatedTournament.tournament[0] 
          : participatedTournament.tournament)
      : null;

    // Choose the most recent one
    let selectedTournament = null;
    if (createdTournament && participatedTournamentData) {
      selectedTournament = new Date(createdTournament.updated_at) > new Date(participatedTournamentData.updated_at)
        ? createdTournament
        : participatedTournamentData;
    } else if (createdTournament) {
      selectedTournament = createdTournament;
    } else if (participatedTournamentData) {
      selectedTournament = participatedTournamentData;
    }

    if (selectedTournament) {
      // Get player count for this tournament
      const { count: playerCount } = await supabase
        .from('tournament_players')
        .select('*', { count: 'exact', head: true })
        .eq('tournament_id', selectedTournament.id);

      lastTournament = {
        id: selectedTournament.id,
        name: selectedTournament.name,
        isFinished: selectedTournament.is_finished || false,
        playerCount: playerCount || 0,
        updatedAt: selectedTournament.updated_at,
      };
    }

    // Fetch last league (either created by user OR participated in)
    // First, get leagues created by the user
    const { data: createdLeague, error: leagueCreatedError } = await supabase
      .from('leagues')
      .select('id, name, updated_at')
      .eq('creator_user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Also get leagues where user is a member
    const { data: joinedLeague, error: leagueMemberError } = await supabase
      .from('league_players')
      .select('league:leagues(id, name, updated_at)')
      .eq('user_id', userId)
      .order('joined_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let lastLeague: League | undefined;
    
    // Get the most recent league (created or joined)
    const joinedLeagueData = joinedLeague
      ? (Array.isArray(joinedLeague.league)
          ? joinedLeague.league[0]
          : joinedLeague.league)
      : null;

    // Choose the most recent one
    let selectedLeague = null;
    if (createdLeague && joinedLeagueData) {
      selectedLeague = new Date(createdLeague.updated_at) > new Date(joinedLeagueData.updated_at)
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
        .from('league_players')
        .select('*', { count: 'exact', head: true })
        .eq('league_id', selectedLeague.id);

      lastLeague = {
        id: selectedLeague.id,
        name: selectedLeague.name,
        status: 'active', // Leagues don't have a status column, they're always active
        memberCount: memberCount || 0,
        updatedAt: selectedLeague.updated_at,
      };
    }

    // Fetch personal stats from elo_history
    const { data: eloHistory } = await supabase
      .from('elo_history')
      .select('elo_after, elo_change')
      .eq('user_id', userId);

    let personalStats: PersonalStats | undefined;
    if (eloHistory && eloHistory.length > 0) {
      const totalMatches = eloHistory.length;
      const wins = eloHistory.filter((h) => h.elo_change > 0).length;
      const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 10000) / 100 : 0;
      
      // Calculate average ELO from history
      const averageElo = Math.round(
        eloHistory.reduce((sum, h) => sum + h.elo_after, 0) / eloHistory.length
      );

      personalStats = {
        totalMatches,
        winRate,
        averageElo,
      };
    } else {
      // No history yet - return zeros
      personalStats = {
        totalMatches: 0,
        winRate: 0,
        averageElo: 0,
      };
    }

    return {
      lastTournament,
      lastLeague,
      personalStats,
    };
  } catch (error) {
    console.error('Error fetching home data:', error);
    
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
    };
  }
}

export function useHomeData(userId: string | null | undefined): HomeData {
  const { data, isLoading, error } = useQuery({
    queryKey: ['homeData', userId],
    queryFn: () => fetchHomeData(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1, // Only retry once on failure
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
  });

  return {
    lastTournament: data?.lastTournament,
    lastLeague: data?.lastLeague,
    personalStats: data?.personalStats,
    isLoading: isLoading && !!userId, // Only show loading if userId exists
    error: error as Error | null,
  };
}
