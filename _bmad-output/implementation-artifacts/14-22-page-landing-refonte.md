# Story 14.22: Landing page (overhaul)

Status: done

## Story

As a user,
I want the Landing page aligned with the design system,
So that onboarding is consistent.

## Acceptance Criteria

1. **Given** the design system
   **When** I am on the Landing (logged out)
   **Then** the page matches designs Frame 1

## Tasks / Subtasks

- [x] Task 1: Apply tokens and styles
- [x] Task 2: Frame 1 alignment

## Dev Notes

- **File:** `src/pages/LandingPage.tsx`
- Landing = unidentified visitor (bottom nav exclusion per design system)

### References

- [Source: _bmad-output/planning-artifacts/design-system-convergence.md#2.1]

## Dev Agent Record

### Agent Model Used

Composer (dev-story workflow)

### Debug Log References

### Completion Notes List

- Task 1: Applied design tokens (bg-slate-900, text-slate-400 labels, text-slate-300 tagline, bg-gradient-cta hero CTA, shadow-fab, border-slate-700 secondary buttons, rounded-xl, p-4 md:p-6).
- Task 2: Frame 1 alignment — branding, hero CTA, secondary CTAs (Tournoi/League), login section. Layout structure per design-system-convergence 3.x.

### File List

- src/pages/LandingPage.tsx (refactored)
- tests/unit/pages/LandingPage.test.tsx (updated visual design assertions)

## Change Log

- 2026-02-13: Refonte Landing page alignée design system (Frame 1). Tokens, gradient-cta, typography, spacing.
