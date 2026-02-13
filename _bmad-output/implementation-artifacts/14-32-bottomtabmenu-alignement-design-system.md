# Story 14.32: BottomTabMenu alignement design system (Frame 3)

Status: done

## Story

As a developer,
I want BottomTabMenu to match the design system (section 2.1) and Frame 3,
So that the active tab uses the blue-purple gradient and the bar is visually consistent.

## Acceptance Criteria

1. **Given** design-system-convergence.md section 2.1
   **When** I view the bottom nav
   **Then** active tab: `bg-gradient-tab-active` (blue-purple gradient) with white text

2. Inactive tabs: grey (text-slate-400)

3. Min height 64px, touch target 48px+

4. 5 tabs: Accueil, Rejoindre, Tournois, Leagues, Profil

5. Icons: Home, QrCode, Trophy, Medal, User

6. Design System showcase displays the navigation with active/inactive states

## Tasks / Subtasks

- [x] Task 1: Verify alignment (AC: 1, 2, 3, 4, 5)
  - [x] Audit BottomTabMenu styles
  - [x] Apply gradient-tab-active if not present
  - [x] Ensure inactive state text-slate-400
- [x] Task 2: Design System showcase (AC: 6)
  - [x] Verify Navigation section in DesignSystemShowcase (Story 14-10b)
  - [x] Add or refine demo if needed

## Dev Notes

- **Source:** design-system-convergence.md section 2.1
- **File:** `src/components/navigation/BottomTabMenu.tsx`
- Story 14-10b may have already implemented some of this
- Reference: Frame 3, design-system-convergence 2.1

### References

- [Source: _bmad-output/planning-artifacts/design-system-convergence.md#2.1]

## Dev Agent Record

### Agent Model Used

Cursor Composer

### Debug Log References

### Completion Notes List

- 2026-02-13: Audit confirmed BottomTabMenu already aligned with design-system-convergence 2.1 (AC1–5): active tab uses bg-gradient-tab-active + text-white, inactive tabs text-slate-400, h-16 (64px), min-h-[48px] touch targets, 5 tabs with correct labels and icons. Added unit test for nav bar h-16 (AC3). Refined DesignSystemShowcase BottomTabMenu description to explicitly document active/inactive states per AC6.
- 2026-02-13: Code review fixes: H1 route matching for nested routes (/tournament/:id, /league/:id, /player/:id). H2 focus-visible ring for WCAG 2.1. M1 keyboard activation tests (Enter/Space). M2 previewMode without previewOnTabClick no longer navigates. M3 DesignSystemShowcase gradient test for AC6.

### File List

- src/components/navigation/BottomTabMenu.tsx
- tests/unit/components/BottomTabMenu.test.tsx
- src/pages/DesignSystemShowcase.tsx
- tests/unit/pages/DesignSystemShowcase.test.tsx
- _bmad-output/implementation-artifacts/sprint-status.yaml

## Change Log

- 2026-02-13: Story 14-32 implementation complete. BottomTabMenu verified aligned with design-system-convergence 2.1. Added h-16 test for AC3. Refined DesignSystemShowcase description for active/inactive states.
- 2026-02-13: Code review complete. Fixed 5 issues: route matching for nested routes, focus-visible styles, keyboard tests, previewMode API, DesignSystemShowcase gradient test.
