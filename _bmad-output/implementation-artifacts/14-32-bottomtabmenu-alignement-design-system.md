# Story 14.32: BottomTabMenu alignement design system (Frame 3)

Status: ready-for-dev

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

- [ ] Task 1: Verify alignment (AC: 1, 2, 3, 4, 5)
  - [ ] Audit BottomTabMenu styles
  - [ ] Apply gradient-tab-active if not present
  - [ ] Ensure inactive state text-slate-400
- [ ] Task 2: Design System showcase (AC: 6)
  - [ ] Verify Navigation section in DesignSystemShowcase (Story 14-10b)
  - [ ] Add or refine demo if needed

## Dev Notes

- **Source:** design-system-convergence.md section 2.1
- **File:** `src/components/navigation/BottomTabMenu.tsx`
- Story 14-10b may have already implemented some of this
- Reference: Frame 3, design-system-convergence 2.1

### References

- [Source: _bmad-output/planning-artifacts/design-system-convergence.md#2.1]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
