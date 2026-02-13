# Story 14.18: Create league page (overhaul)

Status: done

## Story

As a user,
I want the Create league page aligned with the design system,
So that the form is consistent.

## Acceptance Criteria

1. Header: title + back
2. Fields with labels, inline validation
3. Primary CTA at bottom
4. Bottom nav visible (or hidden per choice)
5. The page matches designs Frame 9

## Tasks / Subtasks

- [x] Task 1: Apply tokens and styles (AC: 2, 3)
- [x] Task 2: Header and layout (AC: 1, 4)
- [x] Task 3: Frame 9 alignment (AC: 5)

## Dev Notes

- **File:** `src/pages/CreateLeague.tsx`
- design-system-convergence section 5.3

### References

- [Source: _bmad-output/planning-artifacts/design-system-convergence.md#5.3]

## Dev Agent Record

### Agent Model Used

Composer (dev-story workflow)

### Debug Log References

### Completion Notes List

- Task 1: Applied design tokens (bg-slate-800, border-slate-700, rounded-xl, text-slate-400 labels). CTA gradient from-blue-500 to-violet-600. Inline validation for name (required, min 2 chars).
- Task 2: ContextualHeader with title + back (navigates to /leagues). Added /create-league and /create-tournament to CORE_ROUTES for bottom nav visibility.
- Task 3: Full Frame 9 alignment - bg-slate-900, form structure, design-system-convergence 5.3.
- CTA sticky au-dessus du bottom nav (design-system 5.3, project-context Form Page Pattern).
- Code review: Path aliases @/, isSubmitting, aria-pressed, maxLength 100, error handling, z-30 CTA.

### File List

- src/pages/CreateLeague.tsx (refactored, CTA sticky)
- src/pages/CreateTournament.tsx (CTA sticky aligné)
- src/utils/navigationHelpers.ts (added create-league, create-tournament to CORE_ROUTES)
- \_bmad-output/planning-artifacts/design-system-convergence.md (section 5.3 CTA sticky)
- \_bmad-output/project-context.md (Form Page Pattern)
- tests/unit/pages/CreateLeague.test.tsx (new)
- tests/unit/utils/navigationHelpers.test.ts (added create-league/create-tournament tests)

## Senior Developer Review (AI)

**Date:** 2026-02-13  
**Outcome:** Changes Requested → Fixed

**Issues addressed:**

- [x] Path aliases: ../ → @/ (project-context)
- [x] Loading state: isSubmitting, button disabled during submit
- [x] aria-pressed on type selector buttons
- [x] maxLength 100 on name input
- [x] Error handling: try/catch + toast on createLeague failure
- [x] CTA z-index: z-20 → z-30
- [x] Tests: unauthenticated, loading state, createLeague error, CTA sticky

## Change Log

- 2026-02-13: Refonte page Créer league (design-system 5.3). Tokens, validation inline, CTA gradient, bottom nav visible.
- 2026-02-13: CTA sticky au-dessus du menu. Ajout pattern Form Page (design-system 5.3, project-context). Créer tournoi aligné.
- 2026-02-13: Code review – 7 issues corrigés (path aliases, loading, accessibilité, erreurs, tests).
