---
name: context-facade
description: Decouple a monolithic React Context progressively, before splitting the provider itself. Introduces "facade hooks" — focused entry points layered over an umbrella useContext. Use when a context grows past ~600 lines / ~15 props / 3+ domains, or when the user asks to refactor a large context.
---

# Context facade — Beer Pong League

Pattern used in audit wave 2.2 step 1 to start decoupling
`LeagueContext` (1157 lines, 27 props, 4 domains) without breaking 22
existing call sites in one go.

## When to introduce a facade

A facade is appropriate when **all** of the following are true:

- The provider exceeds **~600 lines** OR exposes **~15+ props/methods**.
- Two or more **distinct domains** live in the same context (leagues +
  events + players + matches; or auth + user profile + premium status).
- You **can't** split the provider in a single PR without rewriting
  every consumer + every test mock.

If the context is small or single-domain, skip the facade — refactor
the provider directly.

## The pattern

### 1. Write one focused hook per domain

```ts
// src/hooks/useLeagues.ts
import { useMemo } from 'react';
import { useLeague } from '../context/LeagueContext';

export const useLeagues = () => {
  const ctx = useLeague();
  return useMemo(
    () => ({
      leagues: ctx.leagues,
      currentLeague: ctx.currentLeague,
      isLoadingInitialData: ctx.isLoadingInitialData,
      createLeague: ctx.createLeague,
      updateLeague: ctx.updateLeague,
      deleteLeague: ctx.deleteLeague,
      selectLeague: ctx.selectLeague,
      getLeagueGlobalRanking: ctx.getLeagueGlobalRanking,
    }),
    [
      ctx.leagues,
      ctx.currentLeague,
      ctx.isLoadingInitialData,
      ctx.createLeague,
      ctx.updateLeague,
      ctx.deleteLeague,
      ctx.selectLeague,
      ctx.getLeagueGlobalRanking,
    ],
  );
};
```

Each facade re-exports **only** the slice its domain cares about. The
`useMemo` keeps referential identity stable across renders — important
for downstream `useEffect` deps.

### 2. Update the umbrella's JSDoc to redirect new code

```ts
/**
 * Hook to access ALL global application data — leagues, events, players,
 * matches, and the data-sync controls.
 *
 * **Prefer the focused facade hooks for new code:**
 * - `useLeagues()` — league list + CRUD + ranking
 * - `useEvents()`  — event list + CRUD + ranking + propagation
 * - `usePlayers()` — player ops
 * - `useMatches()` — match recording
 *
 * `useLeague()` itself stays available for orchestrators that genuinely
 * need a wide slice. Not deprecated, but no longer the default.
 */
export const useLeague = () => { … };
```

Don't `@deprecated` it — that creates noise on every existing caller and
discourages contributors from touching the file.

### 3. Pin the API surface with a smoke test

```ts
// tests/unit/hooks/useDomainHooks.test.ts
describe('useLeagues — league facade', () => {
  it('exposes leagues, currentLeague, CRUD ops and ranking', async () => {
    const { useLeagues } = await import('../../../src/hooks/useLeagues');
    const { result } = renderHook(() => useLeagues());

    expect(Object.keys(result.current).sort()).toEqual(
      [
        'createLeague', 'currentLeague', 'deleteLeague',
        'getLeagueGlobalRanking', 'isLoadingInitialData',
        'leagues', 'loadError', 'selectLeague', 'updateLeague',
      ].sort(),
    );
  });

  it('returns the same identity across renders when ctx values are stable', async () => {
    const { useLeagues } = await import('../../../src/hooks/useLeagues');
    const { result, rerender } = renderHook(() => useLeagues());
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});
```

The first test prevents accidentally dropping a re-export when the
umbrella context evolves. The second guards memoization.

## Migration plan — 3 phases

| Phase | Goal | Touches |
|---|---|---|
| **A — Facades** | Add `useLeagues` / `useEvents` / `usePlayers` / `useMatches` next to `useLeague`. Update doc + smoke tests. | New files only. No call site changed. |
| **B — Migration** | Replace `useLeague()` callers one PR per page (RecordMatch, dashboards, design-system showcase, DevPanel). | One page = one PR. Tests updated to mock the focused hook. |
| **C — Provider split** | Once a domain has zero direct umbrella callers, split its slice into a dedicated `<DomainProvider>` with its own state. The facade hook implementation flips from "useContext + slice" to "useContext on the domain provider". | Provider only. Facade signature unchanged → callers still work. |

Phase A is what audit wave 2.2 step 1 shipped. Phases B and C are
follow-ups, paced by feature work.

## Canonical example

- Facades: `apps/web/src/hooks/useLeagues.ts`, `useEvents.ts`,
  `usePlayers.ts`, `useMatches.ts`.
- Smoke test: `apps/web/tests/unit/hooks/useDomainHooks.test.ts`.
- Umbrella: `apps/web/src/context/LeagueContext.tsx` (still the source of
  state — the facades all consume it).

## Anti-patterns

- ❌ Returning the raw `ctx` slice without `useMemo` — every render
  produces a new object, breaking downstream `useEffect` deps.
- ❌ Adding *new* state to a facade hook (counters, refs, …) — facades
  are pure projections. State belongs in the provider.
- ❌ Aggregating multiple domains in one facade ("`useLeaguesAndEvents`")
  — defeats the whole point. One facade = one domain.
- ❌ Skipping phase B and jumping straight to provider split — the
  rewrite touches every caller + every mock at once. The facade exists
  precisely so you don't have to.
