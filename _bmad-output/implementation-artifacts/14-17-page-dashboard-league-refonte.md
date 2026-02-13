# Story 14.17: League dashboard page (overhaul)

Status: done

## Story

As a user,
I want the league dashboard aligned with the design system,
So that InfoCard, StatCards, tabs and ranking are consistent.

## Acceptance Criteria

1. Header: name + back + actions
2. InfoCard (status, format, date)
3. StatCards (3 columns)
4. SegmentedTabs (Ranking / Matches / Settings)
5. Ranking list with ListRow
6. FAB: New match (BeerPongMatchIcon)
7. Bottom nav visible
8. The page matches designs Frame 8

## Tasks / Subtasks

- [x] Task 1: Integrate components (AC: 2-6)
- [x] Task 2: Header and layout (AC: 1, 7)
- [x] Task 3: Frame 8 alignment (AC: 8)

## Dev Notes

- **File:** `src/pages/LeagueDashboard.tsx`

### References

- [Source: _bmad-output/planning-artifacts/design-system-convergence.md#5.2]

## Dev Agent Record

### Agent Model Used

Composer (dev-story workflow)

### Debug Log References

### Completion Notes List

- ✅ AC1: ContextualHeader with name, back, Invite action, menu (Mode Diffusion, Supprimer). Nouveau match moved to FAB.
- ✅ AC2: InfoCard with status "En cours", format (Par Saison/Continue), date (createdAt), joueurs count.
- ✅ AC3: StatCards 3 columns (Joueurs, Matchs, Top ELO) using design-system StatCard.
- ✅ AC4: SegmentedTabs encapsulated variant (Classement / Matchs / Paramètres). Consolidated 5 tabs → 3.
- ✅ AC5: Ranking list with ListRow player variant (rank, delta, recentResults).
- ✅ AC6: FAB with BeerPongMatchIcon for Nouveau match.
- ✅ AC7: Bottom nav visible via /league/:id in CORE_ROUTE_PATTERNS.
- ✅ AC8: Design tokens (pb-bottom-nav, bg-slate-800, border-slate-700/50, rounded-xl).
- ✅ Code review fixes (2026-02-13): URL.revokeObjectURL, tests, memoized sortedMatches, @/ import, addPlayer validation (trim, max 50).

### File List

- src/pages/LeagueDashboard.tsx (modified)
- tests/unit/pages/LeagueDashboard.test.tsx (created)

## Change Log

- 2026-02-13: Refonte LeagueDashboard alignée design system (InfoCard, StatCards, SegmentedTabs, ListRow, FAB)
- 2026-02-13: Code review fixes (memory leak, tests, performance, imports, validation)
