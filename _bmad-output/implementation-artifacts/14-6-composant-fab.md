# Story 14.6: FAB component (Floating Action Button)

Status: review

## Story

As a developer,
I want a reusable FAB component,
So that primary actions (Create tournament, New match) are consistent.

## Acceptance Criteria

1. **Given** the design system (sections 2.2, 4.5)
   **When** I use FAB
   **Then** size: 56px (mobile), 64px (desktop)

2. Background: gradient `from-blue-500 to-violet-600`

3. Icon: white, 24px

4. Shadow: `shadow-lg`

5. Position: `fixed bottom-20 right-4` (above bottom nav)

6. Props: icon, onClick, ariaLabel, variant? (primary, secondary)

7. The component is exported and documented

## Tasks / Subtasks

- [x] Task 1: Create FAB.tsx (AC: 1-6)
  - [x] Create `src/components/design-system/FAB.tsx`
  - [x] Props: icon, onClick, ariaLabel, variant?
  - [x] Gradient styles, responsive size
- [x] Task 2: BeerPongMatchIcon integration (AC: 7)
  - [x] Document usage with BeerPongMatchIcon for "New match"
- [x] Task 3: Design System showcase (Story 14-1b)
  - [x] Add FAB section in DesignSystemShowcase (primary/secondary variants)

## Dev Notes

- **Source:** design-system-convergence.md sections 2.2, 4.5
- **File:** `src/components/design-system/FAB.tsx`
- BeerPongMatchIcon already in `src/components/icons/BeerPongMatchIcon.tsx`
- Fixed position: bottom-20 right-4 (above bottom nav ~64px)

### Project Structure Notes

- `src/components/design-system/FAB.tsx`

### References

- [Source: _bmad-output/planning-artifacts/design-system-convergence.md#2.2]
- [Source: _bmad-output/planning-artifacts/design-system-convergence.md#4.5]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- FAB.tsx created with props icon, onClick, ariaLabel, variant (primary/secondary), inline (showcase)
- Gradient bg-gradient-fab (blue-500 → violet-600), size w-14 h-14 (56px) md:w-16 md:h-16 (64px)
- JSDoc documents BeerPongMatchIcon usage for "New match"
- DesignSystemShowcase: FAB section with primary/secondary variants and BeerPongMatchIcon
- 10 unit tests pass

### File List

- src/components/design-system/FAB.tsx (new)
- src/components/design-system/index.ts (modified)
- src/pages/DesignSystemShowcase.tsx (modified)
- tests/unit/components/design-system/FAB.test.tsx (new)

## Change Log

- 2026-02-13: Full implementation — FAB.tsx, tests, showcase, barrel export
