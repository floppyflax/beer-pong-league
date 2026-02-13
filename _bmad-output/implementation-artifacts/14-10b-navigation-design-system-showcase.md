# Story 14.10b: Navigation in Design System (showcase)

Status: done

## Story

As a developer,
I want navigation components (BottomTabMenu, BottomMenuSpecific) documented and visible in the Design System showcase,
So that navigation is an official part of the design system and I can visualize and validate it.

## Acceptance Criteria

1. **Given** the Design System page (`/design-system`)
   **When** I access the Navigation section
   **Then** a "Navigation" section displays BottomTabMenu and BottomMenuSpecific

2. **BottomTabMenu:** preview in a mobile-style frame (or dedicated area) with the 5 tabs (Home, Join, Tournaments, Leagues, Profile)

3. Active/inactive states are demonstrated (e.g. active tab with primary color)

4. **BottomMenuSpecific:** demo with 1 or 2 actions (e.g. Scan QR, Create tournament)

5. **BottomTabMenu aligned** with design-system-convergence section 2.1:
   - Leagues icon: Medal (not Users)
   - Min height 64px, touch target 48px+
   - Active state: primary color / gradient

6. Components remain in `src/components/navigation/` (no duplication in design-system/)

## Tasks / Subtasks

- [x] Task 1: Align BottomTabMenu with design-system-convergence (AC: 5)
  - [x] Replace Users icon with Medal for Leagues tab
  - [x] Verify height 64px min, touch target 48px+
  - [x] Verify active state (primary color / gradient-tab-active)
- [x] Task 2: Navigation section in DesignSystemShowcase (AC: 1, 2, 3, 4)
  - [x] Add "3. Navigation" section after Components section
  - [x] BottomTabMenu subsection: preview with MemoryRouter or iframe
  - [x] Mobile-style frame (e.g. max-w-sm, border, simulated height) to show rendering
  - [x] BottomMenuSpecific subsection: demo with actions (Scan QR, Create tournament)
- [x] Task 3: Tests (AC: 1)
  - [x] Test: Navigation section present in DesignSystemShowcase
  - [x] Test: BottomTabMenu and BottomMenuSpecific rendered in section

## Dev Notes

- **Source:** design-system-convergence.md sections 2.1, 2.2
- **Files:** `src/pages/DesignSystemShowcase.tsx`, `src/components/navigation/BottomTabMenu.tsx`
- **Preview:** The /design-system page hides the bottom nav (AC 7 of 14.1b). For the demo, use an isolated preview area (div with fixed height, MemoryRouter with mock routes) — no global display at bottom of page.
- **MemoryRouter:** Wrap the preview in `<MemoryRouter initialEntries={['/']}>` so BottomTabMenu works with useLocation/useNavigate.

### References

- [Source: _bmad-output/planning-artifacts/design-system-convergence.md#2.1]
- [Source: _bmad-output/planning-artifacts/design-system-convergence.md#2.2]
- [Source: Story 14-1b — Design System showcase]

## Senior Developer Review (AI)

**Date:** 2026-02-13  
**Outcome:** Approve (after fixes applied)  
**Issues found:** 2 HIGH, 4 MEDIUM, 2 LOW

**Action items (all fixed):**

- [x] [HIGH] Add unit tests for BottomTabMenu preview mode
- [x] [HIGH] Add DesignSystemShowcase interactive preview test
- [x] [MEDIUM] Update BottomTabMenu JSDoc (gradient active state)
- [x] [MEDIUM] BottomMenuSpecific: key={label-index}, imports @/
- [x] [MEDIUM] DesignSystemShowcase header: mention 14-10b

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- 2026-02-13: Full implementation of Story 14-10b. BottomTabMenu: replaced Users with Medal for Leagues tab, active state uses bg-gradient-tab-active (design-system-convergence 2.1), height 64px, touch target 48px+. Added previewMode/previewActiveRoute/previewOnTabClick props for isolated showcase. BottomMenuSpecific: added previewMode prop. DesignSystemShowcase: new "3. Navigation" section with BottomTabMenuPreview (state-driven interactive demo) and BottomMenuSpecific demo (Scanner QR, Créer un tournoi). Tests: AuthProvider, IdentityProvider wrappers; 2 new tests for Navigation section. BottomTabMenu unit tests updated for gradient-tab-active.
- 2026-02-13: Code review fixes (6 issues): JSDoc updated (gradient not top border); BottomMenuSpecific imports → @/ path alias; key={label-index} for actions; DesignSystemShowcase header mentions 14-10b; 3 new BottomTabMenu preview-mode tests; 1 DesignSystemShowcase interactive preview test.

### File List

- src/components/navigation/BottomTabMenu.tsx (modified)
- src/components/navigation/BottomMenuSpecific.tsx (modified)
- src/pages/DesignSystemShowcase.tsx (modified)
- tests/unit/components/BottomTabMenu.test.tsx (modified)
- tests/unit/pages/DesignSystemShowcase.test.tsx (modified)
