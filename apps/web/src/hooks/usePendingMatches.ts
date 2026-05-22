/**
 * usePendingMatches — Mig 030 + Mig 032
 *
 * Lists `matches.status = 'pending'` for an event OR a league and computes
 * which ones the current user is authorized to confirm/reject (mirrors the
 * server-side logic in `confirm_match`).
 *
 * Context discriminator:
 *   - `{ eventId }`  → all pending matches attached to this event. Authz
 *                       branches on events.score_validator. Admin = event
 *                       creator OR linked-league creator.
 *   - `{ leagueId }` → pending matches attached to this league with
 *                       event_id IS NULL (event-linked pending matches are
 *                       validated via the event's validation page).
 *                       Authz branches on leagues.score_validator. Admin
 *                       = league creator.
 *
 * Authorization branches on `score_validator`:
 *   - 'opponent' (default) : caller owns a player in the team OPPOSITE to
 *      the match creator. Admin bypass always allowed.
 *   - 'admin'              : caller is the admin (event/league creator).
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

export type UsePendingMatchesContext =
  | { eventId: string | undefined; leagueId?: never }
  | { leagueId: string | undefined; eventId?: never };

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

export function usePendingMatches(ctx: UsePendingMatchesContext): UsePendingMatchesResult {
  const eventId = 'eventId' in ctx ? ctx.eventId : undefined;
  const leagueId = 'leagueId' in ctx ? ctx.leagueId : undefined;
  const contextId = eventId ?? leagueId;

  const { user, isAuthenticated } = useAuthContext();
  const { localUser } = useIdentity();
  const { events, leagues, reloadData } = useLeague();

  const [pendingMatches, setPendingMatches] = useState<PendingMatchSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(contextId));

  const event = useMemo(
    () => (eventId ? events.find((e) => e.id === eventId) : null),
    [events, eventId],
  );
  // League selected via two paths: (a) the event's linked league for event ctx,
  // (b) the league directly for league ctx.
  const league = useMemo(() => {
    if (leagueId) return leagues.find((l) => l.id === leagueId) ?? null;
    if (event?.leagueId) return leagues.find((l) => l.id === event.leagueId) ?? null;
    return null;
  }, [leagueId, event?.leagueId, leagues]);

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
    if (!callerUserId) return false;
    // Event ctx: admin = event creator OR linked league creator.
    if (eventId) {
      if (!event) return false;
      if (event.creator_user_id === callerUserId) return true;
      if (league && league.creator_user_id === callerUserId) return true;
      return false;
    }
    // League ctx: admin = league creator only.
    if (!league) return false;
    return league.creator_user_id === callerUserId;
  }, [callerUserId, eventId, event, league]);

  // Score validator source depends on the context. Mirror of the server-side
  // resolution in mig 032 (events.score_validator wins for event-linked
  // matches, leagues.score_validator for league-only matches).
  const scoreValidator: 'opponent' | 'admin' = useMemo(() => {
    if (eventId) return event?.scoreValidator ?? 'opponent';
    return league?.scoreValidator ?? 'opponent';
  }, [eventId, event?.scoreValidator, league?.scoreValidator]);

  const refresh = useCallback(async () => {
    if (!contextId || !sb) {
      setPendingMatches([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      let query = sb
        .from('matches')
        .select(
          'id, created_at, score_a, score_b, team_a_player_ids, team_b_player_ids, created_by_user_id, status',
        )
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (eventId) {
        query = query.eq('event_id', eventId);
      } else if (leagueId) {
        // League-only matches: exclude event-linked rows (those are validated
        // via the event's validation page).
        query = query.eq('league_id', leagueId).is('event_id', null);
      }

      const { data, error } = await query;
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
  }, [contextId, eventId, leagueId, callerUserId, isAdmin, scoreValidator]);

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
        // Refresh both the local pending list AND the LeagueContext cache so
        // the dashboard match cards reflect the new status + ELO deltas.
        await Promise.all([refresh(), reloadData()]);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Validation impossible');
      }
    },
    [callerUserId, refresh, reloadData],
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
        // Same reasoning as confirmMatch — the rejected match disappears from
        // the dashboard for non-admins (RLS) and gets the X badge for admins.
        await Promise.all([refresh(), reloadData()]);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Refus impossible');
      }
    },
    [callerUserId, refresh, reloadData],
  );

  const count = useMemo(
    () => pendingMatches.filter((m) => m.canValidate).length,
    [pendingMatches],
  );

  return { pendingMatches, count, isLoading, refresh, confirmMatch, rejectMatch };
}
