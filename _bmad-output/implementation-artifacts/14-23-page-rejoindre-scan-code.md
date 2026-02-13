# Story 14.23: Join page (scan + code)

Status: done

## Story

As a user,
I want the Join (scan, code) page aligned with the design system,
So that the entry flow is consistent.

## Acceptance Criteria

1. **Given** the design system
   **When** I am on Join (scan + code)
   **Then** the page matches designs Frame 2

## Tasks / Subtasks

- [x] Task 1: Apply design system
- [x] Task 2: Frame 2 alignment

## Dev Notes

- **File:** `src/pages/Join.tsx`
- QR scan + code entry

### References

- [Source: _bmad-output/planning-artifacts/design-system-convergence.md]

## Dev Agent Record

### Agent Model Used

Composer (dev-story workflow)

### Debug Log References

### Completion Notes List

- Task 1: Applied design system — bg-slate-900, bg-slate-800 card with border-slate-700/50, gradient CTA (from-blue-500 to-violet-600), getContentPaddingBottom for bottom nav clearance, BottomMenuSpecific variant="gradient"
- Task 2: Frame 2 alignment — HelpCard "Comment ça marche ?" with 3 steps, icon area with gradient accent, desktop buttons with gradient primary / slate secondary
- Code review 2026-02-13: 5 issues fixed (1 CRITICAL, 2 HIGH, 2 MEDIUM) — handleScanCode await+toast, @/ imports, typed mocks, variant test, error-handling test

### File List

- src/pages/Join.tsx
- src/components/navigation/BottomMenuSpecific.tsx (variant prop)
- tests/unit/pages/Join.test.tsx

## Change Log

- 2026-02-13: Refonte page Rejoindre (scan + code) — design system Frame 2. HelpCard, gradient CTA, BottomMenuSpecific variant.
- 2026-02-13: Code review — 5 issues corrigés (CRITICAL: handleScanCode await+toast, HIGH: @/ imports, typed mocks, MEDIUM: variant + error tests).
