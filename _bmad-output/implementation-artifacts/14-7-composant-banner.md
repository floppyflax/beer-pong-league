# Story 14.7: Banner component (feedback)

Status: review

## Story

As a developer,
I want a reusable Banner component for feedback (success, error),
So that toasts and banners are consistent.

## Acceptance Criteria

1. **Given** the design system (section 4.6)
   **When** I use Banner
   **Then** structure: green background (success) or red (error)

2. Icon + text

3. Position: top or inline depending on context

4. Props: message, variant ('success' | 'error'), onDismiss?

5. The component is exported and documented

## Tasks / Subtasks

- [x] Task 1: Create Banner.tsx (AC: 1-4)
  - [x] Create `src/components/design-system/Banner.tsx`
  - [x] Success/error variants
  - [x] Optional onDismiss
- [x] Task 2: Export and tests (AC: 5)
- [x] Task 3: Design System showcase (Story 14-1b)
  - [x] Add Banner section in DesignSystemShowcase (success/error variants, with onDismiss)

## Dev Notes

- **Source:** design-system-convergence.md section 4.6
- **File:** `src/components/design-system/Banner.tsx`
- May complement react-hot-toast for some cases

### References

- [Source: _bmad-output/planning-artifacts/design-system-convergence.md#4.6]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- Banner.tsx created with success (bg-success, CheckCircle) and error (bg-error, XCircle) variants
- Props: message, variant, position ('top' | 'inline'), onDismiss?
- 11 unit tests covering all ACs
- Export in design-system/index.ts
- Banner section in DesignSystemShowcase with success, error, dismissable examples

### File List

- src/components/design-system/Banner.tsx (new)
- src/components/design-system/index.ts (modified)
- src/pages/DesignSystemShowcase.tsx (modified)
- tests/unit/components/design-system/Banner.test.tsx (new)

## Change Log

- 2026-02-13: Story 14-7 implemented — Banner component created (success/error, position top/inline, onDismiss), tests, export, DesignSystemShowcase
