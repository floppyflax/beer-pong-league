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

// Since the shared extraction, MatchesRepository / EloRecalcService read the
// live `sb` / `supabase` bindings from
// `@elofight/shared/services/repositories/_base` — the web `src/lib/supabase`
// shim is no longer on that path. Those bindings are normally populated by
// `initShared()` → `_initBaseRepositoryClient()` → `getSupabase()`, which
// returns null under the test env (empty url/key). Mocking the lower-level
// `lib/supabase` factory is ineffective here: vitest.setup's `beforeAll`
// imports `@elofight/shared` (→ `_base`) and runs `initShared()` before this
// file's mocks register, freezing the real `_base` singleton with `sb=null`.
// So intercept `_base` directly — inject the mock client as `sb`/`supabase`
// and force `isSupabaseAvailable()` true on the BaseRepository the services
// extend.
vi.mock('@elofight/shared/services/repositories/_base', () => ({
  supabase: supabaseMock,
  sb: supabaseMock,
  BaseRepository: class {
    protected isSupabaseAvailable(): boolean {
      return true;
    }
  },
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

// mig 025 invariant: the client never *writes* elo_history / *_memberships
// stats directly — every mutation goes through the apply_match_elo RPC. A
// table may still be *read* (resolveToPlayerIds selects *_memberships to map
// membership ids → players.id), so we assert no insert/update/delete was
// issued rather than that the table was never accessed.
const expectNoStatWrites = (table?: QueryBuilder): void => {
  if (!table) return; // table never accessed at all
  expect(table.insert).not.toHaveBeenCalled();
  expect(table.update).not.toHaveBeenCalled();
  expect(table.delete).not.toHaveBeenCalled();
};

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
    expectNoStatWrites(tablesTouched.elo_history);
    expectNoStatWrites(tablesTouched.league_memberships);
    expectNoStatWrites(tablesTouched.event_memberships);
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
    expectNoStatWrites(tablesTouched.elo_history);
    expectNoStatWrites(tablesTouched.league_memberships);
    expectNoStatWrites(tablesTouched.event_memberships);
  });
});

describe('Anti-cheat status decision (mig 030) — admin auto-confirm', () => {
  beforeEach(() => {
    Object.keys(tablesTouched).forEach((k) => delete tablesTouched[k]);
    rpcCalls.length = 0;
    vi.clearAllMocks();
  });

  it('recordMatch under anti-cheat: a non-admin caller lands the match in pending and skips apply_match_elo', async () => {
    tablesTouched.leagues = makeBuilder();
    tablesTouched.leagues.single = vi.fn().mockResolvedValue({
      data: { anti_cheat_enabled: true, creator_user_id: 'admin-user' },
      error: null,
    });

    const { matchesRepository } = await import('../../src/services/repositories/MatchesRepository');
    const match = buildMatch();

    const result = await matchesRepository.recordMatch('league-1', match, {}, 'other-user', null);

    expect(result).toEqual({ status: 'pending' });
    expect(tablesTouched.matches.insert).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'pending' }),
    );
    // No ELO applied while the match awaits opponent confirmation.
    expect(rpcCalls).toEqual([]);
  });

  it('recordMatch under anti-cheat: the league admin (creator) auto-confirms and ELO applies immediately', async () => {
    tablesTouched.leagues = makeBuilder();
    tablesTouched.leagues.single = vi.fn().mockResolvedValue({
      data: { anti_cheat_enabled: true, creator_user_id: 'admin-user' },
      error: null,
    });

    const { matchesRepository } = await import('../../src/services/repositories/MatchesRepository');
    const match = buildMatch();

    const result = await matchesRepository.recordMatch('league-1', match, {}, 'admin-user', null);

    expect(result).toEqual({ status: 'confirmed' });
    expect(tablesTouched.matches.insert).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'confirmed' }),
    );
    expect(rpcCalls).toEqual([{ name: 'apply_match_elo', args: { p_match_id: match.id } }]);
  });

  it('recordEventMatch under anti-cheat: the event admin (creator) auto-confirms', async () => {
    tablesTouched.events = makeBuilder();
    tablesTouched.events.single = vi.fn().mockResolvedValue({
      data: { league_id: null, anti_cheat_enabled: true, creator_user_id: 'admin-user' },
      error: null,
    });

    const { matchesRepository } = await import('../../src/services/repositories/MatchesRepository');
    const match = buildMatch();

    const result = await matchesRepository.recordEventMatch('event-1', match, {}, 'admin-user', null);

    expect(result).toEqual({ status: 'confirmed' });
    expect(tablesTouched.matches.insert).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'confirmed', event_id: 'event-1' }),
    );
    expect(rpcCalls).toEqual([{ name: 'apply_match_elo', args: { p_match_id: match.id } }]);
  });

  it('recordEventMatch under a linked anti-cheat league: a non-admin (neither event nor league creator) lands in pending', async () => {
    tablesTouched.events = makeBuilder();
    tablesTouched.events.single = vi.fn().mockResolvedValue({
      data: { league_id: 'league-1', anti_cheat_enabled: false, creator_user_id: 'event-creator' },
      error: null,
    });
    tablesTouched.leagues = makeBuilder();
    tablesTouched.leagues.single = vi.fn().mockResolvedValue({
      data: { anti_cheat_enabled: true, creator_user_id: 'league-admin' },
      error: null,
    });

    const { matchesRepository } = await import('../../src/services/repositories/MatchesRepository');
    const match = buildMatch();

    const result = await matchesRepository.recordEventMatch('event-1', match, {}, 'random-user', null);

    expect(result).toEqual({ status: 'pending' });
    expect(tablesTouched.matches.insert).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'pending' }),
    );
    expect(rpcCalls).toEqual([]);
  });

  it('recordEventMatch under a linked anti-cheat league: the league admin auto-confirms even when the event is not the anti-cheat source', async () => {
    tablesTouched.events = makeBuilder();
    tablesTouched.events.single = vi.fn().mockResolvedValue({
      data: { league_id: 'league-1', anti_cheat_enabled: false, creator_user_id: 'event-creator' },
      error: null,
    });
    tablesTouched.leagues = makeBuilder();
    tablesTouched.leagues.single = vi.fn().mockResolvedValue({
      data: { anti_cheat_enabled: true, creator_user_id: 'league-admin' },
      error: null,
    });

    const { matchesRepository } = await import('../../src/services/repositories/MatchesRepository');
    const match = buildMatch();

    const result = await matchesRepository.recordEventMatch('event-1', match, {}, 'league-admin', null);

    expect(result).toEqual({ status: 'confirmed' });
    expect(rpcCalls).toEqual([{ name: 'apply_match_elo', args: { p_match_id: match.id } }]);
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
    expectNoStatWrites(tablesTouched.league_memberships);
    expectNoStatWrites(tablesTouched.elo_history);
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

describe('Anti-cheat — confirmMatch wrapper (mig 030)', () => {
  beforeEach(() => {
    Object.keys(tablesTouched).forEach((k) => delete tablesTouched[k]);
    rpcCalls.length = 0;
    vi.clearAllMocks();
  });

  it("calls confirm_match RPC with correct params on 'confirmed' decision", async () => {
    const { matchesRepository } = await import(
      '../../src/services/repositories/MatchesRepository'
    );

    await matchesRepository.confirmMatch('match-abc', 'confirmed', 'user-1');

    expect(rpcCalls).toEqual([
      {
        name: 'confirm_match',
        args: { p_match_id: 'match-abc', p_decision: 'confirmed', p_caller_user_id: 'user-1' },
      },
    ]);
  });

  it("passes p_decision 'rejected' through to the RPC unchanged", async () => {
    const { matchesRepository } = await import(
      '../../src/services/repositories/MatchesRepository'
    );

    await matchesRepository.confirmMatch('match-abc', 'rejected', 'user-1');

    expect(rpcCalls).toEqual([
      {
        name: 'confirm_match',
        args: { p_match_id: 'match-abc', p_decision: 'rejected', p_caller_user_id: 'user-1' },
      },
    ]);
  });

  it("throws a rights error on ERRCODE 'insufficient_privilege'", async () => {
    supabaseMock.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'permission denied', code: 'insufficient_privilege' },
    });
    const { matchesRepository } = await import(
      '../../src/services/repositories/MatchesRepository'
    );

    await expect(
      matchesRepository.confirmMatch('match-abc', 'confirmed', 'user-1'),
    ).rejects.toThrow("Tu n'as pas les droits pour valider ce match.");
  });

  it("throws an already-validated error on ERRCODE 'check_violation'", async () => {
    supabaseMock.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'check violation', code: 'check_violation' },
    });
    const { matchesRepository } = await import(
      '../../src/services/repositories/MatchesRepository'
    );

    await expect(
      matchesRepository.confirmMatch('match-abc', 'confirmed', 'user-1'),
    ).rejects.toThrow('Ce match ne peut plus être validé (déjà confirmé ou rejeté).');
  });

  it('throws a fallback message on unknown RPC errors', async () => {
    supabaseMock.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'unexpected db error', code: 'XXXXX' },
    });
    const { matchesRepository } = await import(
      '../../src/services/repositories/MatchesRepository'
    );

    await expect(
      matchesRepository.confirmMatch('match-abc', 'confirmed', 'user-1'),
    ).rejects.toThrow('La validation a échoué. Réessaie dans un instant.');
  });
});
