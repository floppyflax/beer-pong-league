# Story 14.3: SegmentedTabs component

Status: review

## Story

As a developer,
I want a reusable SegmentedTabs component,
So that filters (All/Active/Finished) and tabs (Ranking/Matches/Settings) are consistent.

## Acceptance Criteria

1. **Given** the design system (section 4.2)
   **When** I use SegmentedTabs
   **Then** the component displays a list of tabs

2. Active tab: `bg-primary text-white` or gradient

3. Inactive tab: `bg-slate-800 text-slate-400 hover:bg-slate-700`

4. Structure: `flex gap-2`, `px-4 py-2 rounded-lg font-semibold`

5. onClick callback for tab change

6. The component is exported and documented

## Tasks / Subtasks

- [x] Task 1: Create SegmentedTabs.tsx (AC: 1, 2, 3, 4, 5)
  - [x] Create `src/components/design-system/SegmentedTabs.tsx`
  - [x] Props: tabs: { id: string, label: string }[], activeId, onChange
  - [x] Active/inactive styles
- [x] Task 2: Export and tests (AC: 6)
  - [x] Export from design-system
  - [x] Unit test
- [x] Task 3: Design System showcase (Story 14-1b)
  - [x] Add SegmentedTabs section in DesignSystemShowcase with interactive demo

## Dev Notes

- **Source:** design-system-convergence.md section 4.2
- **File:** `src/components/design-system/SegmentedTabs.tsx`
- Props: tabs, activeId, onChange: (id: string) => void
- Accessible: aria-selected, role="tablist"

### Project Structure Notes

- `src/components/design-system/SegmentedTabs.tsx`

### References

- [Source: _bmad-output/planning-artifacts/design-system-convergence.md#4.2]

## Dev Agent Record

### Agent Model Used

Cursor / Composer

### Debug Log References

### Completion Notes List

- SegmentedTabs created with props tabs, activeId, onChange
- Styles: active = gradient-tab-active, inactive = bg-slate-800 text-slate-400 hover:bg-slate-700
- Accessible: role="tablist", role="tab", aria-selected
- Export via src/components/design-system/index.ts
- Interactive demo in DesignSystemShowcase (filters + dashboard tabs)
- StatCard DesignSystemShowcase test updated (getAllByText for "Matchs" due to SegmentedTabs duplicate)

### File List

- src/components/design-system/SegmentedTabs.tsx (new)
- src/components/design-system/index.ts (new)
- src/pages/DesignSystemShowcase.tsx (modified)
- tests/unit/components/design-system/SegmentedTabs.test.tsx (new)
- tests/unit/pages/DesignSystemShowcase.test.tsx (modified)

## Change Log

- 2026-02-13: Story 14-3 implemented — SegmentedTabs created, exported, tested, integrated into DesignSystemShowcase
