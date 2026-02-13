# Story 14.2: StatCard component

Status: review

## Story

As a developer,
I want a reusable StatCard component,
So that numeric summaries (Players, Matches, ELO, etc.) are consistent everywhere.

## Acceptance Criteria

1. **Given** the design system (section 4.1)
   **When** I use StatCard
   **Then** the component displays a value (text or number) and a label

2. Variants: primary, success, accent (semantic colors)

3. Structure: `bg-slate-800 p-3 rounded-xl text-center`

4. Value: `text-2xl font-bold` + color per variant

5. Label: `text-[10px] text-slate-400 uppercase font-bold`

6. The component is exported and documented

## Tasks / Subtasks

- [x] Task 1: Create StatCard.tsx (AC: 1, 3, 4, 5)
  - [x] Create `src/components/design-system/StatCard.tsx`
  - [x] Props: value, label, variant?
  - [x] Structure per design system
- [x] Task 2: Variants (AC: 2)
  - [x] primary: blue/violet
  - [x] success: green
  - [x] accent: amber/yellow
- [x] Task 3: Export and tests (AC: 6)
  - [x] Export from design-system index
  - [x] Basic unit test
- [x] Task 4: Design System showcase (Story 14-1b)
  - [x] Add StatCard section in DesignSystemShowcase with primary/success/accent variants

## Dev Notes

- **Source:** design-system-convergence.md section 4.1
- **File:** `src/components/design-system/StatCard.tsx`
- Props: value (ReactNode), label (string), variant? ('primary' | 'success' | 'accent')
- Create `src/components/design-system/index.ts` if missing for barrel exports

### Project Structure Notes

- New folder: `src/components/design-system/`
- Design system components isolated, testable

### References

- [Source: _bmad-output/planning-artifacts/design-system-convergence.md#4.1]

## Dev Agent Record

### Agent Model Used

Composer (dev-story workflow)

### Debug Log References

### Completion Notes List

- StatCard created in `src/components/design-system/StatCard.tsx` with props value (ReactNode), label (string), variant? ('primary' | 'success' | 'accent')
- Structure: bg-slate-800 p-3 rounded-xl text-center, value text-2xl font-bold, label text-[10px] text-slate-400 uppercase font-bold
- Variants: primary → text-info (blue), success → text-success (green), accent → text-primary (amber)
- Barrel export in design-system/index.ts
- 9 StatCard unit tests + DesignSystemShowcase update with 3 StatCards (Players, Matches, Top ELO)
- SegmentedTabs added to design-system index (fix missing import in DesignSystemShowcase)

### File List

- src/components/design-system/StatCard.tsx (new)
- src/components/design-system/index.ts (modified — StatCard + SegmentedTabs exports)
- src/pages/DesignSystemShowcase.tsx (modified — StatCard section with variants)
- tests/unit/components/design-system/StatCard.test.tsx (new)

## Change Log

- 2026-02-13: Full implementation of StatCard component (Story 14-2). StatCard with primary/success/accent variants, unit tests, DesignSystemShowcase integration.
