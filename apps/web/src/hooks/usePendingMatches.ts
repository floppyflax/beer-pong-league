/**
 * usePendingMatches — Mig 030
 *
 * Lists `matches.status = 'pending'` for an event and computes which ones
 * the current user is authorized to confirm/reject (mirrors the server-side
 * logic in `confirm_match`).
 *
 * Authorization branches on `events.score_validator`:
 *   - 'opponent' (default) : caller owns a player in the team OPPOSITE to
 *      the match creator. Admin bypass always allowed.
 *   - 'admin'              : caller is the event creator OR the linked
 *      league creator.
 *
 * The hook exposes `confirmMatch` / `rejectMatch` that wrap the RPC and
 * surface user-friendly errors via toast. After a successful action the
 * pending list is refreshed automatically.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import { sb } from '@/services/repositories/_base';
import { matchesRepository } from '@/services/repositories/MatchesRepository';
import { useAuthContext } from '@/context/AuthContext';
import { useIdentity } from '@/hooks/useIdentity';
import { useLeague } from '@/context/LeagueContext';

export interface PendingMatchSummary {
  id: string;
  createdAt: string;
  scoreA: number;
  scoreB: number;
  teamAPlayerIds: string[];
  teamBPlayerIds: string[];
  createdByUserId: string | null;
  /** True when the current user is allowed to confirm / reject this match. */
  canValidate: boolean;
}

interface UsePendingMatchesResult {
  pendingMatches: PendingMatchSummary[];
  /** Count of matches the current user can validate. Drives the banner badge. */
  count: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
  confirmMatch: (matchId: string) => Promise<void>;
  rejectMatch: (matchId: string) => Promise<void>;
}

interface MatchRow {
  id: string;
  created_at: string;
  score_a: number;
  score_b: number;
  team_a_player_ids: string[];
  team_b_player_ids: string[];
  created_by_user_id: string | null;
  status: string;
}

interface PlayerRow {
  id: string;
  user_id: string | null;
}

/**
 * Resolve the players.id values owned by the given user. Used to test
 * "caller in opposing team" without a server round-trip per match.
 */
async function loadPlayerIdsForUser(userId: string): Promise<Set<string>> {
  if (!sb) return new Set();
  const { data, error } = await sb
    .from('players')
    .select('id, user_id')
    .eq('user_id', userId);
  if (error || !data) return new Set();
  return new Set(
    (data as PlayerRow[]).map((p) => p.id),
  );
}

export function usePendingMatches(eventId: string | undefined): UsePendingMatchesResult {
  const { user, isAuthenticated } = useAuthContext();
  const { localUser } = useIdentity();
  const { events, leagues } = useLeague();

  const [pendingMatches, setPendingMatches] = useState<PendingMatchSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(eventId));

  const event = useMemo(() => events.find((e) => e.id === eventId), [events, eventId]);
  const league = useMemo(
    () => (event?.leagueId ? leagues.find((l) => l.id === event.leagueId) : null),
    [event?.leagueId, leagues],
  );

  // Caller's user_id — auth.users.id (post-mig 022 they live in `users`
  // unified, but the column on matches/events is the public.users.id).
  const callerUserId = useMemo(
    () =>
      isAuthenticated && user
        ? user.id
        : localUser?.anonymousUserId ?? null,
    [isAuthenticated, user, localUser?.anonymousUserId],
  );

  const isAdmin = useMemo(() => {
    if (!callerUserId || !event) return false;
    if (event.creator_user_id === callerUserId) return true;
    if (league && league.creator_user_id === callerUserId) return true;
    return false;
  }, [callerUserId, event, league]);

  const scoreValidator: 'opponent' | 'admin' = event?.scoreValidator ?? 'opponent';

  const refresh = useCallback(async () => {
    if (!eventId || !sb) {
      setPendingMatches([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await sb
        .from('matches')
        .select(
          'id, created_at, score_a, score_b, team_a_player_ids, team_b_player_ids, created_by_user_id, status',
        )
        .eq('event_id', eventId)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });
      if (error) throw error;

      const rows = (data ?? []) as MatchRow[];
      if (rows.length === 0) {
        setPendingMatches([]);
        return;
      }

      // For opponent-mode authorization we need to know which players the
      // current user owns. Skip when admin (bypass) or unauthenticated
      // (cannot validate at all in opponent mode).
      let myPlayerIds = new Set<string>();
      if (callerUserId && scoreValidator === 'opponent' && !isAdmin) {
        myPlayerIds = await loadPlayerIdsForUser(callerUserId);
      }

      // For opponent-mode we also need to know which players the creator
      // owns, but that varies per match. We cache lookups within the batch.
      const creatorPlayerIdsCache = new Map<string, Set<string>>();
      const loadCreatorPlayers = async (uid: string): Promise<Set<string>> => {
        if (creatorPlayerIdsCache.has(uid)) {
          return creatorPlayerIdsCache.get(uid)!;
        }
        const ids = await loadPlayerIdsForUser(uid);
        creatorPlayerIdsCache.set(uid, ids);
        return ids;
      };

      const enriched: PendingMatchSummary[] = [];
      for (const row of rows) {
        const base: Omit<PendingMatchSummary, 'canValidate'> = {
          id: row.id,
          createdAt: row.created_at,
          scoreA: row.score_a,
          scoreB: row.score_b,
          teamAPlayerIds: row.team_a_player_ids ?? [],
          teamBPlayerIds: row.team_b_player_ids ?? [],
          createdByUserId: row.created_by_user_id,
        };

        let canValidate = false;
        if (isAdmin) {
          canValidate = true; // admin bypass / admin mode
        } else if (scoreValidator === 'admin') {
          canValidate = false;
        } else if (callerUserId && row.created_by_user_id) {
          // Opponent mode: caller must own a player in the team OPPOSING
          // the team the creator is in.
          const creatorPlayerIds = await loadCreatorPlayers(row.created_by_user_id);
          const creatorInA = base.teamAPlayerIds.some((pid) =>
            creatorPlayerIds.has(pid),
          );
          const creatorInB = base.teamBPlayerIds.some((pid) =>
            creatorPlayerIds.has(pid),
          );
          if (creatorInA || creatorInB) {
            const opposing = creatorInA ? base.teamBPlayerIds : base.teamAPlayerIds;
            canValidate = opposing.some((pid) => myPlayerIds.has(pid));
          }
        }

        enriched.push({ ...base, canValidate });
      }

      setPendingMatches(enriched);
    } catch (err) {
      console.error('usePendingMatches.refresh failed:', err);
      toast.error("Impossible de charger les matchs en attente");
      setPendingMatches([]);
    } finally {
      setIsLoading(false);
    }
  }, [eventId, callerUserId, isAdmin, scoreValidator]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const confirmMatch = useCallback(
    async (matchId: string) => {
      if (!callerUserId) {
        toast.error('Identifie-toi pour valider un match.');
        return;
      }
      try {
        await matchesRepository.confirmMatch(matchId, 'confirmed', callerUserId);
        toast.success('Match confirmé');
        await refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Validation impossible');
      }
    },
    [callerUserId, refresh],
  );

  const rejectMatch = useCallback(
    async (matchId: string) => {
      if (!callerUserId) {
        toast.error('Identifie-toi pour rejeter un match.');
        return;
      }
      try {
        await matchesRepository.confirmMatch(matchId, 'rejected', callerUserId);
        toast.success('Match rejeté');
        await refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Refus impossible');
      }
    },
    [callerUserId, refresh],
  );

  const count = useMemo(
    () => pendingMatches.filter((m) => m.canValidate).length,
    [pendingMatches],
  );

  return { pendingMatches, count, isLoading, refresh, confirmMatch, rejectMatch };
}
