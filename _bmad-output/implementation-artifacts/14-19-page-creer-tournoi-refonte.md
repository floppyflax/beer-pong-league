# Story 14.19: Create tournament page (overhaul)

Status: review

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

### File List

- src/pages/CreateTournament.tsx
- tests/unit/pages/CreateTournament.test.tsx
