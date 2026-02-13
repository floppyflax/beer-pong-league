# Story 14.12: My tournaments page (overhaul)

Status: review

## Story

As a user,
I want the My tournaments page aligned with the design system,
So that design elements (search, filters, cards, FAB) are present.

## Acceptance Criteria

1. **Given** the design system (section 5.1)
   **When** I view My tournaments
   **Then** header: title + button + search (or dedicated bar)

2. SearchBar (debounce 300ms)

3. SegmentedTabs (All / Active / Finished)

4. List or grid of cards (ListRow or TournamentCard)

5. FAB: Create tournament

6. Bottom nav visible

7. The page matches designs Frame 3

## Tasks / Subtasks

- [x] Task 1: Integrate design system components (AC: 2, 3, 4, 5)
  - [x] SearchBar, SegmentedTabs, ListRow/TournamentCard, FAB
  - [x] Replace existing components
- [x] Task 2: Header and layout (AC: 1, 6)
  - [x] ContextualHeader if relevant
  - [x] Bottom nav visible
- [x] Task 3: Frame 3 alignment (AC: 7)
  - [x] Compare with reference design

## Dev Notes

- **Source:** design-system-convergence.md section 5.1
- **File:** `src/pages/Tournaments.tsx`
- Depends on stories 14.1-14.8, 14.10
- Existing TournamentCard: `src/components/tournaments/TournamentCard.tsx`

### References

- [Source: _bmad-output/planning-artifacts/design-system-convergence.md#5.1]

## Dev Agent Record

### Agent Model Used

Composer (Cursor)

### Debug Log References

### Completion Notes List

- ✅ Replaced custom search input with SearchBar (debounce 300ms)
- ✅ Replaced FilterTab with SegmentedTabs (Tous / Actifs / Terminés)
- ✅ Replaced BottomMenuSpecific with FAB for create action
- ✅ ContextualHeader with title + CRÉER TOURNOI action (desktop)
- ✅ Empty state aligned with design system (ContextualHeader + FAB)
- ✅ Removed /tournaments from PAGES_WITH_SPECIFIC_MENU (uses FAB)
- ✅ TournamentCard retained per AC4 (ListRow or TournamentCard)
- ✅ Bottom nav visible via CORE_ROUTES (Story 14-10)

### File List

- src/pages/Tournaments.tsx
- src/utils/navigationHelpers.ts
- tests/unit/pages/Tournaments.test.tsx
- tests/unit/utils/navigationHelpers.test.ts

## Change Log

- 2026-02-13: Story 14-12 implementation complete. SearchBar, SegmentedTabs, FAB integrated. BottomMenuSpecific replaced by FAB. ContextualHeader + empty state aligned.
