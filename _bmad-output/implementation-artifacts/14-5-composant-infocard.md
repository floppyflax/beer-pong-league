# Story 14.5: InfoCard component

Status: review

## Story

As a developer,
I want a reusable InfoCard component,
So that context banners (tournament/league dashboard) are consistent.

## Acceptance Criteria

1. **Given** the design system (section 4.4)
   **When** I use InfoCard
   **Then** structure: `bg-slate-800/50 rounded-xl p-4 border border-slate-700/50`

2. Title + status badge

3. Info line with icons (calendar, users, format)

4. The component is flexible (children or structured props)

5. The component is exported and documented

## Tasks / Subtasks

- [x] Task 1: Create InfoCard.tsx (AC: 1, 2, 3)
  - [x] Structure per design system
  - [x] Support title, badge, infos
- [x] Task 2: Flexibility (AC: 4)
  - [x] Structured props or children
  - [x] Usage example
- [x] Task 3: Export and tests (AC: 5)
- [x] Task 4: Design System showcase (Story 14-1b)
  - [x] Add InfoCard section in DesignSystemShowcase

## Dev Notes

- **Source:** design-system-convergence.md section 4.4
- **File:** `src/components/design-system/InfoCard.tsx`
- Reference: screens Frame 4 (Tournament dashboard), Frame 8 (League dashboard)

### Project Structure Notes

- `src/components/design-system/InfoCard.tsx`

### References

- [Source: _bmad-output/planning-artifacts/design-system-convergence.md#4.4]

## Dev Agent Record

### Agent Model Used

Composer (dev-story workflow)

### Debug Log References

### Completion Notes List

- InfoCard created with design system structure (bg-slate-800/50, rounded-xl, p-4, border-slate-700/50)
- Support title + status badge (variants: active, finished, cancelled)
- Info line with Lucide icons (calendar, users, format)
- Flexibility: structured props (infos[]) or children
- Export in design-system/index.ts
- 8 passing unit tests
- InfoCard section added in DesignSystemShowcase

### File List

- src/components/design-system/InfoCard.tsx (new)
- src/components/design-system/index.ts (modified)
- src/pages/DesignSystemShowcase.tsx (modified)
- tests/unit/components/design-system/InfoCard.test.tsx (new)

## Change Log

- 2026-02-13: Story 14-5 implemented — InfoCard component created, exported, tested and integrated into Design System Showcase
