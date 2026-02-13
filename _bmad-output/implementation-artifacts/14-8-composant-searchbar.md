# Story 14.8: SearchBar component

Status: done

## Story

As a developer,
I want a reusable SearchBar component,
So that searches (tournaments, leagues) are consistent.

## Acceptance Criteria

1. **Given** the design system (section 4.7)
   **When** I use SearchBar
   **Then** magnifying glass icon on the left

2. Input: `bg-slate-800 border border-slate-700 rounded-lg pl-12`

3. Debounce 300ms

4. Props: value, onChange, placeholder

5. The component is exported and documented

## Tasks / Subtasks

- [x] Task 1: Create SearchBar.tsx (AC: 1, 2, 4)
  - [x] Create `src/components/design-system/SearchBar.tsx`
  - [x] Magnifying glass icon (lucide-react Search)
  - [x] Props: value, onChange, placeholder
- [x] Task 2: Debounce (AC: 3)
  - [x] useDebouncedCallback or equivalent 300ms
- [x] Task 3: Export and tests (AC: 5)
- [x] Task 4: Design System showcase (Story 14-1b)
  - [x] Add SearchBar section in DesignSystemShowcase with interactive demo (debounce)

## Dev Notes

- **Source:** design-system-convergence.md section 4.7
- **File:** `src/components/design-system/SearchBar.tsx`
- Reference: screens Frame 3, Frame 7
- Story 10.2/10.3: 300ms debounce already used on Tournaments/Leagues

### References

- [Source: _bmad-output/planning-artifacts/design-system-convergence.md#4.7]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- SearchBar created with Search icon (lucide-react), input bg-slate-800 border-slate-700 rounded-lg pl-12
- 300ms debounce via useEffect + setTimeout (pattern consistent with Tournaments/Leagues)
- 8 SearchBar unit tests + 1 DesignSystemShowcase test
- SearchBar section in DesignSystemShowcase with interactive demo (debounced value display)
- Code review 2026-02-13: 2 MEDIUM fixed (onChangeRef for stability, clear input test), 2 LOW (JSDoc @param, autocomplete="off")

### File List

- src/components/design-system/SearchBar.tsx (new)
- src/components/design-system/index.ts (modified — SearchBar export)
- src/pages/DesignSystemShowcase.tsx (modified — SearchBarShowcase)
- tests/unit/components/design-system/SearchBar.test.tsx (new)
- tests/unit/pages/DesignSystemShowcase.test.tsx (modified — SearchBar test)

## Senior Developer Review (AI)

**Date:** 2026-02-13  
**Outcome:** Approve (after fixes)

**Findings addressed:**

- [MEDIUM] onChange in effect deps → fixed with onChangeRef
- [MEDIUM] Missing test for clear input → added test
- [LOW] JSDoc @param → added
- [LOW] autocomplete="off" → added

**Remaining (out of scope):** SearchBar not used in Tournaments/Leagues — planned for Story 14-12.

## Change Log

- 2026-02-13: Full implementation of SearchBar component (Story 14-8). Component with magnifying glass icon, 300ms debounce, export, tests, DesignSystemShowcase.
- 2026-02-13: Code review — fixes: onChangeRef to avoid effect re-runs, clear input test, JSDoc @param, autocomplete="off".
