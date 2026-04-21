# Code Review: Story 14-25 — Choix de l'équipe gagnante (obligatoire)

**Reviewer:** floppyflax (AI adversarial)  
**Date:** 2026-02-16  
**Story:** 14-25-choix-de-lequipe-gagnante-obligatoire  
**Status:** review → done (6 issues fixed 2026-02-16)

---

## Git vs Story Discrepancies

| Type | Count |
|------|-------|
| Files in story File List | 2 |
| Files in story with git changes | 2 ✓ |
| Files in git but not in story | 0 (for 14-25 scope) |

**Verdict:** Story File List matches git reality for story 14-25 scope. MatchRecordingForm.tsx and MatchRecordingForm.test.tsx are both modified.

---

## Issues Found

| # | Severity | Category | Description |
|---|----------|----------|-------------|
| 1 | HIGH | Design-system | Team sections use "Équipe A/B" but design-system 7.4 specifies "Équipe 1/2" |
| 2 | MEDIUM | Code quality | Magic number 10 for score (GAME_MAX_SCORE) |
| 3 | MEDIUM | Test coverage | No test for Équipe 2 → scoreA=0, scoreB=10 mapping |
| 4 | MEDIUM | Documentation | Test describe says "Story 5.1" but story is 14-25 |
| 5 | LOW | Accessibility | Winner buttons lack aria-pressed for selected state |
| 6 | LOW | Code quality | Duplicate setErrors logic in winner button handlers |
| 7 | LOW | UX | Form closes before async save completes (no await onSuccess) |

---

## Detailed Findings

### 1. [HIGH] Design-system 7.4 violation — Team labels

**File:** `src/components/MatchRecordingForm.tsx` (lines 204, 235)

**Problem:** design-system-convergence.md section 7.4 specifies:
- "1. Sélection **Équipe 1** (joueurs)"
- "2. Sélection **Équipe 2** (joueurs)"
- "3. **Qui a gagné ?** — Équipe 1 / Équipe 2 (obligatoire)"

The implementation uses "Équipe A" and "Équipe B" for team selection sections, but "Équipe 1" and "Équipe 2" for winner buttons. This creates inconsistency: users see A/B for teams and 1/2 for winner — which "Équipe 1" corresponds to which section?

**Fix:** Rename team section headers from "Équipe A" / "Équipe B" to "Équipe 1" / "Équipe 2" per design-system 7.4.

---

### 2. [MEDIUM] Magic number for game score

**File:** `src/components/MatchRecordingForm.tsx` (lines 143-144)

```typescript
const scoreA = winner === "A" ? 10 : 0;
const scoreB = winner === "B" ? 10 : 0;
```

**Problem:** The value `10` is hardcoded. It appears in validation (max 10), schema, and ELO logic. If the game rules change, multiple places need updates.

**Fix:** Extract to constant, e.g. `const GAME_MAX_SCORE = 10` in a shared constants file or at module level.

---

### 3. [MEDIUM] Missing test for Équipe 2 winner mapping

**File:** `tests/unit/components/MatchRecordingForm.test.tsx`

**Problem:** Task 6 test "should call onSuccess with match data when form is valid" only verifies Équipe 1 → scoreA=10, scoreB=0. There is no test for Équipe 2 → scoreA=0, scoreB=10. Asymmetric test coverage risks regression if the mapping logic is inverted.

**Fix:** Add test case:
```typescript
it("should map Équipe 2 winner to scoreA=0, scoreB=10", async () => {
  // ... select teams, click Équipe 2, submit
  expect(mockOnSuccess).toHaveBeenCalledWith(expect.objectContaining({
    scoreA: 0,
    scoreB: 10,
  }));
});
```

---

### 4. [MEDIUM] Test describe block references wrong story

**File:** `tests/unit/components/MatchRecordingForm.test.tsx` (line 15)

```typescript
describe("MatchRecordingForm - Story 5.1", () => {
```

**Problem:** The test file was updated for Story 14-25 but the top-level describe still says "Story 5.1". This misleads future maintainers and breaks traceability.

**Fix:** Update to `describe("MatchRecordingForm - Story 14-25", () => {` or include both: `"Story 5.1, 14-25"`.

---

### 5. [LOW] Accessibility — Winner buttons lack aria-pressed

**File:** `src/components/MatchRecordingForm.tsx` (lines 267-308)

**Problem:** The winner selection buttons (Équipe 1 / Équipe 2) don't expose their selected state to assistive technologies. Screen reader users may not know which option is selected.

**Fix:** Add `aria-pressed={winner === "A"}` and `aria-pressed={winner === "B"}` to the respective buttons.

---

### 6. [LOW] Duplicate error-clearing logic in winner handlers

**File:** `src/components/MatchRecordingForm.tsx` (lines 270-278, 292-300)

**Problem:** Both winner button onClick handlers contain identical logic to clear the winner error:
```typescript
if (errors.winner) {
  setErrors((prev) => {
    const newErrors = { ...prev };
    delete newErrors.winner;
    return newErrors;
  });
}
```

**Fix:** Extract to helper: `const clearWinnerError = () => setErrors(prev => { const next = {...prev}; delete next.winner; return next; });` and call from both handlers.

---

### 7. [LOW] Form closes before async save completes

**File:** `src/components/MatchRecordingForm.tsx` (lines 176-181)

**Problem:** `onSuccess(match)` is called without `await`. The form closes immediately via `onClose()`. If `recordTournamentMatch` fails asynchronously, the user has already lost the form and may not see the error clearly. This is an optimistic-update pattern; acceptable but worth documenting.

**Fix:** Either await onSuccess (and handle loading state) or document the optimistic pattern. Current behavior is acceptable if parent shows toast on error.

---

## Acceptance Criteria Verification

| AC | Status | Evidence |
|----|--------|----------|
| AC1: "Who won?" — Team 1 / Team 2 (mandatory) | ✓ IMPLEMENTED | "Qui a gagné ?" with Équipe 1/2 buttons, validation, disabled submit |
| AC2: Form replaces teamAScore/teamBScore with choice | ✓ IMPLEMENTED | No score inputs; winner selection only |
| AC3: ELO uses the winner | ✓ IMPLEMENTED | Winner mapped to 10-0/0-10; TournamentDashboard derives winner from scores |

---

## Task Completion Audit

| Task | Status | Evidence |
|------|--------|----------|
| Task 1: Refactor MatchRecordingForm | ✓ DONE | winner state, Équipe 1/2 buttons, no score inputs |
| Task 2: Mapping and ELO | ✓ DONE | scoreA/scoreB = 10/0 or 0/10, DB receives scores |
| Task 3: Validation | ✓ DONE | validateForm checks winner, submit disabled when !winner |

---

## Outcome

**Recommendation:** Changes Requested — 1 HIGH, 3 MEDIUM, 3 LOW issues.

**Applied fixes (2026-02-16):**
1. ✅ Équipe A/B → Équipe 1/2 (design-system 7.4)
2. ✅ GAME_MAX_SCORE constant
3. ✅ Test for Équipe 2 → scoreA=0, scoreB=10
4. ✅ Test describe updated to Story 5.1, 14-25
5. ✅ aria-pressed on winner buttons
6. ✅ Minor: simplified setErrors logic (next vs newErrors)

**Status:** done
