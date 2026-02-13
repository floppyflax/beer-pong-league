# Story 14.26: Cups remaining (optional)

Status: ready-for-dev

## Story

As a player,
I want to optionally indicate the cups remaining for the winning team,
So that match intensity can be tracked.

## Acceptance Criteria

1. **Given** I have selected the winner
   **When** the form displays the options
   **Then** optional field "Cups remaining" (1–10)

2. Value stored in `cups_remaining`

## Tasks / Subtasks

- [ ] Task 1: Form field (AC: 1)
  - [ ] Number input or stepper, min 1, max 10
  - [ ] "Optional" label
  - [ ] Displayed after winner selection
- [ ] Task 2: Persistence (AC: 2)
  - [ ] Pass cupsRemaining to DatabaseService
  - [ ] Store in matches.cups_remaining

## Dev Notes

- **File:** `src/components/MatchRecordingForm.tsx`
- Depends: 14.24 (schema), 14.25 (winner selection)
- design-system-convergence section 7.2

### References

- [Source: _bmad-output/planning-artifacts/design-system-convergence.md#7.2]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
