# Story 14.16: My leagues page (overhaul)

Status: done

## Story

As a user,
I want the My leagues page aligned with the design system,
So that search, filters, cards and FAB are consistent.

## Acceptance Criteria

1. Header: title + button + search
2. SearchBar
3. SegmentedTabs (All / Active / Finished)
4. List or grid of cards (ListRow or LeagueCard)
5. FAB: Create league
6. Bottom nav visible
7. The page matches designs Frame 7

## Tasks / Subtasks

- [x] Task 1: Integrate components (AC: 2, 3, 4, 5)
- [x] Task 2: Header and layout (AC: 1, 6)
- [x] Task 3: Frame 7 alignment (AC: 7)

## Dev Notes

- **File:** `src/pages/Leagues.tsx`
- LeagueCard: `src/components/leagues/LeagueCard.tsx`

### References

- [Source: _bmad-output/planning-artifacts/design-system-convergence.md#5.1]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- Task 1: Replaced custom search with SearchBar, FilterTab with SegmentedTabs (encapsulated), BottomMenuSpecific with FAB. Updated LeagueCard to use gradient-card, TournamentCard format (header + date + 3 stats + chevron), green/slate badges per design system 4.8.
- Task 2: ContextualHeader already provides title + Create button. Removed /leagues from PAGES_WITH_SPECIFIC_MENU so content uses pb-20 (bottom nav visible via layout).
- Task 3: Page structure aligned with Tournaments (14-12) and design system 5.1 Frame 7.
- Code review fixes: path aliases @/, invalid date handling (Date inconnue fallback), keyboard a11y (role/tabIndex/onKeyDown), comment navigationHelpers, test for invalid date.

### Change Log

- 2026-02-13: Refonte page Mes Leagues alignée design system (SearchBar, SegmentedTabs encapsulated, LeagueCard gradient-card, FAB, navigationHelpers)
- 2026-02-13: Code review fixes — path aliases @/, invalid date handling, keyboard a11y, comment navigationHelpers

### File List

- src/pages/Leagues.tsx (modified)
- src/components/leagues/LeagueCard.tsx (modified)
- src/utils/navigationHelpers.ts (modified)
- tests/unit/pages/Leagues.test.tsx (modified)
- tests/unit/components/leagues/LeagueCard.test.tsx (modified)
- tests/unit/utils/navigationHelpers.test.ts (modified)
- _bmad-output/implementation-artifacts/14-16-page-mes-leagues-refonte.md (modified)
