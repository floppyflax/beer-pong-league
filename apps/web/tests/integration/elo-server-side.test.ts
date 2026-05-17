/**
 * Integration test for migration 025 (ELO server-side).
 *
 * Verifies that MatchesRepository routes ELO writes through the
 * `apply_match_elo` RPC instead of writing directly to elo_history /
 * league_memberships / event_memberships. The previous implementation
 * was the surface of the anti-cheat invariant violation; this test
 * ensures we don't regress.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Match } from '../../src/types';

interface QueryBuilder {
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
}

const tablesTouched: Record<string, QueryBuilder> = {};
const rpcCalls: Array<{ name: string; args: Record<string, unknown> | undefined }> = [];

const makeBuilder = (): QueryBuilder => {
  const builder: QueryBuilder = {
    insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    // Membership lookup terminal (membership.id → player_id). Default to "no
    // mapping found" so the write-path falls back to the original ids — the
    // existing assertions on team_*_player_ids stay valid for player-id inputs.
    in: vi.fn().mockResolvedValue({ data: [], error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: { league_id: null }, error: null }),
    single: vi.fn().mockResolvedValue({ data: { league_id: null }, error: null }),
  };
  return builder;
};

const supabaseMock = {
  from: vi.fn((table: string) => {
    if (!tablesTouched[table]) tablesTouched[table] = makeBuilder();
    return tablesTouched[table];
  }),
  rpc: vi.fn(async (name: string, args?: Record<string, unknown>) => {
    rpcCalls.push({ name, args });
    return { data: null, error: null };
  }),
};

vi.mock('../../src/lib/supabase', () => ({
  supabase: supabaseMock,
  isSupabaseAvailable: () => true,
}));

vi.mock('../../src/services/repositories/LeaguesRepository', () => ({
  leaguesRepository: {
    loadLeaguesFromLocalStorage: () => [],
    saveLeagueToLocalStorage: vi.fn(),
  },
}));

vi.mock('../../src/services/repositories/EventsRepository', () => ({
  eventsRepository: {
    loadEventsFromLocalStorage: () => [],
    saveEventToLocalStorage: vi.fn(),
  },
}));

const buildMatch = (): Match => ({
  id: 'match-uuid-1',
  date: new Date().toISOString(),
  teamA: ['player-a-1'],
  teamB: ['player-b-1'],
  scoreA: 10,
  scoreB: 7,
  eloChanges: { 'player-a-1': 8, 'player-b-1': -8 },
  cups_remaining: 3,
  created_by_user_id: 'user-1',
  created_by_anonymous_user_id: null,
});

describe('ELO server-side (migration 025) — MatchesRepository delegates to apply_match_elo RPC', () => {
  beforeEach(() => {
    Object.keys(tablesTouched).forEach((k) => delete tablesTouched[k]);
    rpcCalls.length = 0;
    vi.clearAllMocks();
  });

  it('recordMatch inserts the match and calls apply_match_elo, never writes elo_history or league_memberships directly', async () => {
    const { matchesRepository } = await import('../../src/services/repositories/MatchesRepository');
    const match = buildMatch();
    const fakeEloChanges = { 'player-a-1': { before: 1000, after: 1008, change: 8 } };

    await matchesRepository.recordMatch('league-1', match, fakeEloChanges, 'user-1', null);

    // Match row inserted
    expect(tablesTouched.matches).toBeDefined();
    expect(tablesTouched.matches.insert).toHaveBeenCalledTimes(1);
    expect(tablesTouched.matches.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: match.id,
        league_id: 'league-1',
        event_id: null,
        team_a_player_ids: match.teamA,
        team_b_player_ids: match.teamB,
        score_a: match.scoreA,
        score_b: match.scoreB,
      }),
    );

    // RPC called once with the right match_id
    expect(rpcCalls).toEqual([
      { name: 'apply_match_elo', args: { p_match_id: match.id } },
    ]);

    // No direct write to elo_history / league_memberships / event_memberships
    expect(tablesTouched.elo_history?.insert).toBeUndefined();
    expect(tablesTouched.league_memberships?.update).toBeUndefined();
    expect(tablesTouched.event_memberships?.update).toBeUndefined();
  });

  it('recordEventMatch inserts the match (with event_id + league_id) and calls apply_match_elo once', async () => {
    // Make events.select(...).eq(...).single() return a league_id
    tablesTouched.events = makeBuilder();
    tablesTouched.events.single = vi
      .fn()
      .mockResolvedValue({ data: { league_id: 'league-1' }, error: null });

    const { matchesRepository } = await import('../../src/services/repositories/MatchesRepository');
    const match = buildMatch();
    const fakeEventEloChanges = { 'player-a-1': { before: 1000, after: 1008, change: 8 } };
    const fakeLeagueEloChanges = { 'player-a-1': { before: 1000, after: 1009, change: 9 } };

    await matchesRepository.recordEventMatch(
      'event-1',
      match,
      fakeEventEloChanges,
      'user-1',
      null,
      fakeLeagueEloChanges,
    );

    // Match row inserted with both event_id and league_id (single row, both contexts)
    expect(tablesTouched.matches).toBeDefined();
    expect(tablesTouched.matches.insert).toHaveBeenCalledTimes(1);
    expect(tablesTouched.matches.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: match.id,
        event_id: 'event-1',
        league_id: 'league-1',
      }),
    );

    // Server-side function called once — it walks both event + league
    // contexts internally (cf. mig 025 §3+§4)
    expect(rpcCalls).toEqual([
      { name: 'apply_match_elo', args: { p_match_id: match.id } },
    ]);

    // Still no direct stat writes
    expect(tablesTouched.elo_history?.insert).toBeUndefined();
    expect(tablesTouched.league_memberships?.update).toBeUndefined();
    expect(tablesTouched.event_memberships?.update).toBeUndefined();
  });
});

describe('ELO server-side — EloRecalcService delegates to recalculate_league_elo RPC', () => {
  beforeEach(() => {
    Object.keys(tablesTouched).forEach((k) => delete tablesTouched[k]);
    rpcCalls.length = 0;
    vi.clearAllMocks();
  });

  it('recalculateLeagueElo calls the RPC and returns matchesReplayed from the response', async () => {
    supabaseMock.rpc.mockResolvedValueOnce({ data: 7, error: null });

    const { eloRecalcService } = await import('../../src/services/EloRecalcService');
    const result = await eloRecalcService.recalculateLeagueElo('league-1');

    expect(supabaseMock.rpc).toHaveBeenCalledWith('recalculate_league_elo', {
      p_league_id: 'league-1',
    });
    expect(result).toEqual({ success: true, matchesReplayed: 7 });

    // No direct table writes — the whole thing is the RPC
    expect(tablesTouched.league_memberships?.update).toBeUndefined();
    expect(tablesTouched.elo_history?.delete).toBeUndefined();
  });

  it('recalculateLeagueElo surfaces RPC errors as { success: false, error }', async () => {
    supabaseMock.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'permission denied for function recalculate_league_elo' },
    });

    const { eloRecalcService } = await import('../../src/services/EloRecalcService');
    const result = await eloRecalcService.recalculateLeagueElo('league-1');

    expect(result).toEqual({
      success: false,
      error: 'permission denied for function recalculate_league_elo',
    });
  });
});
