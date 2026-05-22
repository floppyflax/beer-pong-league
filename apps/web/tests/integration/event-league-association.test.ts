/**
 * Integration test for migration 034 — associate_event_to_league.
 *
 * Verifies that EventsRepository.associateEventToLeague:
 *   - delegates to the `associate_event_to_league` RPC (no direct table
 *     writes — in particular NO direct event_memberships.elo write, which
 *     would re-introduce the ELO inheritance the product decision removed);
 *   - normalizes the detach sentinel "" to null;
 *   - maps the snake_case JSONB result to the camelCase shape callers expect.
 *
 * We mock the `_base` module so `sb` is a pure rpc spy with NO `from` — any
 * attempt at a direct table write would throw, proving the wrapper is
 * RPC-only.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Minimal in-memory localStorage so the repository's post-RPC cache update
// works regardless of the test environment's DOM storage support.
const __lsStore = new Map<string, string>();
const __ls: Storage = {
  get length() {
    return __lsStore.size;
  },
  clear: () => __lsStore.clear(),
  getItem: (k: string) => (__lsStore.has(k) ? __lsStore.get(k)! : null),
  setItem: (k: string, v: string) => {
    __lsStore.set(k, String(v));
  },
  removeItem: (k: string) => {
    __lsStore.delete(k);
  },
  key: (i: number) => Array.from(__lsStore.keys())[i] ?? null,
};
(globalThis as unknown as { localStorage: Storage }).localStorage = __ls;

const rpcMock = vi.fn();

vi.mock('@/services/repositories/_base', () => ({
  sb: { rpc: rpcMock }, // intentionally no `from` — direct writes would throw
  supabase: { rpc: rpcMock },
  BaseRepository: class {
    isSupabaseAvailable() {
      return true;
    }
  },
}));

describe('associate_event_to_league — EventsRepository client wrapper (mig 034)', () => {
  beforeEach(() => {
    rpcMock.mockReset();
    __lsStore.clear();
  });

  it('calls the RPC with the right args and maps the JSONB result', async () => {
    rpcMock.mockResolvedValue({
      data: {
        matches_propagated: 5,
        old_league_replayed: null,
        new_league_replayed: 5,
        matches_predating_season: 1,
        noop: false,
      },
      error: null,
    });

    const { eventsRepository } = await import('@/services/repositories/EventsRepository');
    const result = await eventsRepository.associateEventToLeague('event-1', 'league-1', 'user-1');

    expect(rpcMock).toHaveBeenCalledTimes(1);
    expect(rpcMock).toHaveBeenCalledWith('associate_event_to_league', {
      p_event_id: 'event-1',
      p_league_id: 'league-1',
      p_caller_user_id: 'user-1',
    });

    expect(result).toEqual({
      matchesPropagated: 5,
      oldLeagueReplayed: null,
      newLeagueReplayed: 5,
      matchesPredatingSeason: 1,
      noop: false,
    });
  });

  it('normalizes the detach sentinel "" to a null league id', async () => {
    rpcMock.mockResolvedValue({
      data: { matches_propagated: 3, old_league_replayed: 3, new_league_replayed: null, matches_predating_season: 0, noop: false },
      error: null,
    });

    const { eventsRepository } = await import('@/services/repositories/EventsRepository');
    await eventsRepository.associateEventToLeague('event-1', '', 'user-1');

    expect(rpcMock).toHaveBeenCalledWith('associate_event_to_league', {
      p_event_id: 'event-1',
      p_league_id: null,
      p_caller_user_id: 'user-1',
    });
  });

  it('passes null through for an explicit detach', async () => {
    rpcMock.mockResolvedValue({ data: { matches_propagated: 0, noop: false }, error: null });

    const { eventsRepository } = await import('@/services/repositories/EventsRepository');
    await eventsRepository.associateEventToLeague('event-1', null, 'user-1');

    expect(rpcMock).toHaveBeenCalledWith('associate_event_to_league', {
      p_event_id: 'event-1',
      p_league_id: null,
      p_caller_user_id: 'user-1',
    });
  });

  it('is RPC-only — never performs a direct table write (no ELO inheritance path)', async () => {
    rpcMock.mockResolvedValue({ data: { matches_propagated: 2, noop: false }, error: null });

    const { eventsRepository } = await import('@/services/repositories/EventsRepository');
    // If the implementation tried sb.from('event_memberships').update(...),
    // it would throw because the mocked `sb` has no `from`.
    await expect(
      eventsRepository.associateEventToLeague('event-1', 'league-1', 'user-1'),
    ).resolves.toBeDefined();

    expect(rpcMock).toHaveBeenCalledTimes(1);
  });

  it('surfaces RPC errors by throwing', async () => {
    rpcMock.mockResolvedValue({
      data: null,
      error: { message: 'insufficient_privilege' },
    });

    const { eventsRepository } = await import('@/services/repositories/EventsRepository');
    await expect(
      eventsRepository.associateEventToLeague('event-1', 'league-1', 'user-1'),
    ).rejects.toBeTruthy();
  });
});
