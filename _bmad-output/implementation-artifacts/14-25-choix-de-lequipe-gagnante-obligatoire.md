# Story 14.25: Winning team selection (mandatory)

Status: done

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

- [x] Task 1: Refactor MatchRecordingForm (AC: 1, 2)
  - [x] Remove teamAScore, teamBScore
  - [x] Add winner: 'A' | 'B' | null
  - [x] UI: two buttons/chips Team 1 / Team 2
- [x] Task 2: Mapping and ELO (AC: 3)
  - [x] Map winner to score format (1-0 or 0-1)
  - [x] DatabaseService: accept winner
- [x] Task 3: Validation
  - [x] Winner mandatory before submit

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

- Refactored MatchRecordingForm: removed score inputs, added winner selection (Équipe 1 / Équipe 2) per design-system 7.4
- Winner mapped to score format 10-0 or 0-10 for ELO and DB compatibility
- Submit button disabled until winner selected (AC3)
- TournamentDashboard handleMatchFormSuccess unchanged: derives winner from match.scoreA/scoreB
- All 22 unit tests updated and passing
- Code review 2026-02-16: 6 issues fixed — design-system 7.4 (Équipe A/B → Équipe 1/2), GAME_MAX_SCORE constant, Équipe 2 mapping test, test describe Story 14-25, aria-pressed on winner buttons

### File List

- src/components/MatchRecordingForm.tsx
- tests/unit/components/MatchRecordingForm.test.tsx

### Senior Developer Review (AI)

**Reviewer:** floppyflax on 2026-02-16

**Findings:** 7 issues (1 HIGH, 3 MEDIUM, 3 LOW). All HIGH and MEDIUM fixed automatically.

- Design-system 7.4: Équipe A/B → Équipe 1/2 (headers + validation messages)
- GAME_MAX_SCORE constant extracted
- Test for Équipe 2 winner mapping added
- Test describe updated to Story 5.1, 14-25
- aria-pressed on winner buttons for accessibility

**Outcome:** Approved. Status → done.

## Change Log

- 2026-02-13: Story 14-25 implementation complete — winner selection replaces score inputs
- 2026-02-16: Code review complete — 6 issues fixed (design-system 7.4, GAME_MAX_SCORE, tests, aria-pressed). Status → done.