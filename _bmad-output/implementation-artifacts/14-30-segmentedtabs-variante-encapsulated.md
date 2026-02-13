# Story 14.30: SegmentedTabs variante encapsulated

Status: review

## Story

As a developer,
I want SegmentedTabs to support a variant `encapsulated`,
So that filters (Tous / Actifs / Terminés) appear in a single rounded block as in Frame 3.

## Acceptance Criteria

1. **Given** design-system-convergence.md section 4.2 (variante encapsulated)
   **When** I use SegmentedTabs with `variant="encapsulated"`
   **Then** container: `bg-slate-800 rounded-xl p-1` (single block)

2. Tabs: `flex` inside, no gap between them

3. Active tab: `bg-gradient-tab-active text-white rounded-lg`

4. Inactive tab: transparent background, `text-slate-400`

5. Component remains backward compatible (default variant = current behavior)

6. Design System showcase demonstrates both variants

## Tasks / Subtasks

- [x] Task 1: Add variant prop to SegmentedTabs (AC: 1, 2, 3, 4, 5)
  - [x] Add `variant?: 'default' | 'encapsulated'`
  - [x] Implement encapsulated layout
  - [x] Keep default variant unchanged
- [x] Task 2: Design System showcase (AC: 6)
  - [x] Add encapsulated demo in DesignSystemShowcase

## Dev Notes

- **Source:** design-system-convergence.md section 4.2
- **File:** `src/components/design-system/SegmentedTabs.tsx`
- Reference: Frame 3 (Mes tournois)
- Existing: Story 14-3 implemented default variant

### References

- [Source: _bmad-output/planning-artifacts/design-system-convergence.md#4.2]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- Task 1: Added `variant?: 'default' | 'encapsulated'` to SegmentedTabs. Encapsulated: container `bg-slate-800 rounded-xl p-1 flex`, tabs without gap, active `bg-gradient-tab-active text-white rounded-lg`, inactive `bg-transparent text-slate-400`. Default variant unchanged (backward compatible).
- Task 2: DesignSystemShowcase now demonstrates both default and encapsulated variants with interactive filter tabs.
- Unit tests: 6 new tests for encapsulated variant in SegmentedTabs.test.tsx; DesignSystemShowcase test updated for duplicate filter tabs.

### File List

- src/components/design-system/SegmentedTabs.tsx (modified)
- src/components/design-system/index.ts (modified)
- src/pages/DesignSystemShowcase.tsx (modified)
- tests/unit/components/design-system/SegmentedTabs.test.tsx (modified)
- tests/unit/pages/DesignSystemShowcase.test.tsx (modified)

## Change Log

- 2026-02-13: Story 14-30 implemented. SegmentedTabs variant encapsulated (Frame 3 Mes tournois). DesignSystemShowcase demonstrates both variants.
