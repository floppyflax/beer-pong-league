# Story 14.28: Display photo and cups in match history

Status: done

## Story

As a player,
I want to see the photo and cups in match history,
So that I can relive the matches.

## Acceptance Criteria

1. **Given** a match with photo and/or cups
   **When** I view the history
   **Then** photo thumbnail if available

2. Badge "X cups remaining" if recorded

## Tasks / Subtasks

- [x] Task 1: Photo thumbnail (AC: 1)
  - [x] Display img if photo_url
  - [x] Lazy loading
  - [x] Option: click to enlarge
- [x] Task 2: Cups badge (AC: 2)
  - [x] Display if cups_remaining
  - [x] Format "X cups remaining"
- [x] Task 3: Integration
  - [x] TournamentDashboard: match list
  - [x] LeagueDashboard: match list

## Dev Notes

- **Files:** TournamentDashboard.tsx, LeagueDashboard.tsx
- Depends: 14.24, 14.26, 14.27

### References

- [Source: _bmad-output/planning-artifacts/design-system-convergence.md#7]

## Dev Agent Record

### Agent Model Used

Cursor / Composer

### Debug Log References

### Completion Notes List

- Created MatchEnrichedDisplay component: photo thumbnail (lazy loading, click-to-enlarge modal), cups badge ("X gobelet(s) restant(s)")
- Integrated in TournamentDashboard and LeagueDashboard match lists
- 12 unit tests for MatchEnrichedDisplay, integration tests for both dashboards
- Code review 2026-02-16: Fixed 5 MEDIUM issues (Escape key, backdrop click, image error handling, scroll lock, focus management)

### File List

- src/components/MatchEnrichedDisplay.tsx (new)
- src/pages/TournamentDashboard.tsx
- src/pages/LeagueDashboard.tsx
- tests/unit/components/MatchEnrichedDisplay.test.tsx (new)
- tests/unit/pages/TournamentDashboard.test.tsx
- tests/unit/pages/LeagueDashboard.test.tsx

## Senior Developer Review (AI)

**Reviewer:** floppyflax on 2026-02-16

**Findings addressed:**

- Escape key closes modal
- Backdrop click closes modal
- Image error handling (onError → placeholder "Erreur")
- Body scroll lock when modal open
- Focus management (focus close button on open, return to trigger on close)
- formatCupsBadge helper for maintainability

**Outcome:** Approved — 5 MEDIUM issues fixed automatically

## Change Log

- 2026-02-16: Code review — 5 MEDIUM issues fixed (Escape, backdrop click, image error, scroll lock, focus)
- 2026-02-13: Story 14-28 implemented — MatchEnrichedDisplay component, integration in TournamentDashboard and LeagueDashboard, unit and integration tests
