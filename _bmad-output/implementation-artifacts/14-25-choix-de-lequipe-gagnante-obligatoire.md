# Story 14.25: Winning team selection (mandatory)

Status: ready-for-dev

## Story

As a player,
I want to choose the winning team instead of scores,
So that I can validate a match quickly.

## Acceptance Criteria

1. **Given** I am recording a match
   **When** I have selected the teams
   **Then** I see "Who won?" — Team 1 / Team 2 (mandatory)

2. The form replaces teamAScore/teamBScore with this choice

3. ELO uses the winner

## Tasks / Subtasks

- [ ] Task 1: Refactor MatchRecordingForm (AC: 1, 2)
  - [ ] Remove teamAScore, teamBScore
  - [ ] Add winner: 'A' | 'B' | null
  - [ ] UI: two buttons/chips Team 1 / Team 2
- [ ] Task 2: Mapping and ELO (AC: 3)
  - [ ] Map winner to score format (1-0 or 0-1)
  - [ ] DatabaseService: accept winner
- [ ] Task 3: Validation
  - [ ] Winner mandatory before submit

## Dev Notes

- **File:** `src/components/MatchRecordingForm.tsx`
- design-system-convergence section 7.4
- Depends on 14.24 (schema) for consistency

### References

- [Source: _bmad-output/planning-artifacts/design-system-convergence.md#7.4]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
