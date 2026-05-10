import { useState, useEffect } from 'react';
import { getSupabase } from '../lib/supabase';

export interface LeaderboardEntry {
  id: string;
  pseudo: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  avatarUrl: string | null;
}

export type LeaderboardSort = 'matches' | 'wins' | 'winrate';

export function useGlobalLeaderboard(sort: LeaderboardSort = 'matches') {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = getSupabase();
      if (!supabase) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const { data, error: queryError } = await supabase
          .from('players')
          .select('id, pseudo, wins, losses, matches_played, user_id, archived_at')
          .is('archived_at', null)
          .not('matches_played', 'is', null)
          .gt('matches_played', 0)
          .limit(100);

        if (queryError) throw queryError;

        const rows = (data ?? []) as unknown as {
          id: string;
          pseudo: string;
          wins: number | null;
          losses: number | null;
          matches_played: number | null;
          user_id: string | null;
          archived_at: string | null;
        }[];

        // Deduplicate by user_id (keep best win total per user)
        const seen = new Map<string, LeaderboardEntry>();
        for (const row of rows) {
          const matchesPlayed = row.matches_played ?? 0;
          const wins = row.wins ?? 0;
          const losses = row.losses ?? 0;
          const winRate = matchesPlayed > 0 ? Math.round((wins / matchesPlayed) * 100) : 0;
          const key = row.user_id ?? row.id;
          const existing = seen.get(key);
          if (!existing || wins > existing.wins) {
            seen.set(key, {
              id: row.id,
              pseudo: row.pseudo,
              matchesPlayed,
              wins,
              losses,
              winRate,
              avatarUrl: null,
            });
          }
        }

        let sorted = Array.from(seen.values());
        if (sort === 'matches') sorted.sort((a, b) => b.matchesPlayed - a.matchesPlayed);
        else if (sort === 'wins') sorted.sort((a, b) => b.wins - a.wins);
        else sorted.sort((a, b) => b.winRate - a.winRate);

        setEntries(sorted);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [sort]);

  return { entries, isLoading, error };
}
