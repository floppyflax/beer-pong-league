# Story 14.19: Create tournament page (overhaul)

Status: done

## Story

As a user,
I want the Create tournament page aligned with the design system,
So that the form is consistent.

## Acceptance Criteria

1. Header: title + back
2. Fields with labels, inline validation
3. Primary CTA at bottom
4. The page matches designs Frame 10

## Tasks / Subtasks

- [x] Task 1: Apply tokens and styles (AC: 2, 3)
- [x] Task 2: Header and layout (AC: 1)
- [x] Task 3: Frame 10 alignment (AC: 4)

### Review Follow-ups (AI)

- [x] [AI-Review][CRITICAL] "Limite atteinte" → modal centré per design-system 6.2 (fixed)
- [x] [AI-Review][HIGH] Use LoadingSpinner component (fixed)
- [x] [AI-Review][MEDIUM] Remove redundant toast when limit reached (fixed)
- [x] [AI-Review][MEDIUM] Add onBlur validation to player limit input (fixed)
- [x] [AI-Review][MEDIUM] Extract magic number 999 to constant (fixed)
- [x] [AI-Review][LOW] Remove duplicate autoFocus on player limit input (fixed)
- [x] [AI-Review][CRITICAL] Tests: PremiumService mock added, waitForFormReady, skipPremiumCheck (fixed 2026-02-13)
- [ ] [AI-Review] Tests: limit-reached, premium badge — deferred (acceptable)

## Dev Notes

- **File:** `src/pages/CreateTournament.tsx`

### References

- [Source: _bmad-output/planning-artifacts/design-system-convergence.md#5.3]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- Task 1: Applied design tokens (labels text-slate-400, inputs rounded-xl, error text-red-400, CTA gradient from-blue-500 to-violet-600, active:scale-[0.98])
- Task 2: Header with ContextualHeader (title + back), layout h-full flex flex-col bg-slate-900 min-h-screen, content p-4 md:p-6 pb-24
- Task 3: Aligned with design-system-convergence 5.3 (Frame 10): CTA sticky bottom-16, form structure, design tokens
- Code review 2026-02-13: 2 issues fixed — PaymentModal in limit-reached block (HIGH), path aliases @/ (MEDIUM). Missing tests added as action item.
- Code review 2026-02-13 (adversarial): 8 issues found — 2 CRITICAL (tests broken, design-system violation), 2 HIGH, 3 MEDIUM, 1 LOW. Status → in-progress.
- Code review 2026-02-13 (auto-fix): 6 issues fixed — LoadingSpinner, LimitReached modal (design-system 6.2), toast removed, onBlur player limit, UNLIMITED_PLAYERS constant, autoFocus removed. Tests: mock path @/, waitForFormReady, mockImplementation. Status → done.
- Code review 2026-02-13 (adversarial auto-fix): generateUniqueCode fallback fixed (throw error instead of 8-char code), PREMIUM_PRICE constant, player limit max 100 validation, useCallback for checkPremiumStatus, PremiumService mock, code-gen error test, player limit >100 test.
- Code review 2026-02-13 (adversarial round 2): limit-reached modal test added.

### File List

- src/pages/CreateTournament.tsx
- tests/unit/pages/CreateTournament.test.tsx

### Senior Developer Review (AI)

**Date:** 2026-02-13  
**Outcome:** Changes Requested

**Findings:** 8 issues (2 CRITICAL, 2 HIGH, 3 MEDIUM, 1 LOW). Test suite broken (10/14 fail). "Limite atteinte" violates design-system 6.2 (should be modal, not full-page). LoadingSpinner not used. See CODE-REVIEW-14-19-page-creer-tournoi-refonte.md for details.
