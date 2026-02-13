# Story 14.21: My profile page (overhaul)

Status: done

## Story

As a user,
I want the My profile page aligned with the design system,
So that elements are consistent.

## Acceptance Criteria

1. **Given** the design system
   **When** I view My profile
   **Then** the page is aligned with the designs
2. Bottom nav visible

## Tasks / Subtasks

- [x] Task 1: Apply design system
- [x] Task 2: Bottom nav (AC: 2)

## Dev Notes

- **File:** `src/pages/UserProfile.tsx`

### References

- [Source: _bmad-output/planning-artifacts/design-system-convergence.md]

## Dev Agent Record

### Agent Model Used

Composer (dev-story workflow)

### Debug Log References

### Completion Notes List

- Task 1: Applied design system to UserProfile — StatCard component for Leagues/Tournois/Matchs, design tokens (p-4 md:p-6, rounded-xl, border-slate-700/50), bg-gradient-card for league/tournament list items, gradient avatar, typography (text-xl, text-lg)
- Task 2: Bottom nav visible — /user/profile in CORE_ROUTES (navigationHelpers), App adds pb-20 via getContentPaddingBottom; content area has overflow-y-auto for scroll clearance
- Code review 2026-02-13: 6 issues fixed — totalMatches bug (user's matches only), path aliases @/, a11y (role/onKeyDown), tournament date null safety, tests (navigation, empty state, userEvent)

### File List

- src/pages/UserProfile.tsx (modified)
- tests/unit/pages/UserProfile.test.tsx (created)

## Change Log

- 2026-02-13: Story 14-21 implemented — UserProfile aligned with design system (StatCard, tokens, gradient cards), bottom nav visible via navigationHelpers
- 2026-02-13: Code review — 6 issues fixed (totalMatches bug, path aliases, a11y, date null safety, tests)
