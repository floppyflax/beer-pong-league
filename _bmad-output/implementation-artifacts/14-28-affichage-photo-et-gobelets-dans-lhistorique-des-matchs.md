# Story 14.28: Display photo and cups in match history

Status: ready-for-dev

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

- [ ] Task 1: Photo thumbnail (AC: 1)
  - [ ] Display img if photo_url
  - [ ] Lazy loading
  - [ ] Option: click to enlarge
- [ ] Task 2: Cups badge (AC: 2)
  - [ ] Display if cups_remaining
  - [ ] Format "X cups remaining"
- [ ] Task 3: Integration
  - [ ] TournamentDashboard: match list
  - [ ] LeagueDashboard: match list

## Dev Notes

- **Files:** TournamentDashboard.tsx, LeagueDashboard.tsx
- Depends: 14.24, 14.26, 14.27

### References

- [Source: _bmad-output/planning-artifacts/design-system-convergence.md#7]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
