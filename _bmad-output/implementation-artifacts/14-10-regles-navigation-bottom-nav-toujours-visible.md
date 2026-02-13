# Story 14.10: Navigation rules (bottom nav always visible)

Status: done

## Story

As a developer,
I want the bottom nav visible on all core routes,
So that navigation is consistent with the design system.

## Acceptance Criteria

1. **Given** the design system (section 2.1)
   **When** the user is on a core route
   **Then** the bottom nav is displayed

2. Core routes: `/`, `/join`, `/tournaments`, `/leagues`, `/user/profile`, `/tournament/:id`, `/league/:id`, `/player/:id`

3. Exclusions: Landing (logged out), Display views, Auth callback, full-screen modals

4. `shouldShowBottomMenu` (or equivalent) returns true for all core cases

5. Content bottom padding (`pb-20` or `pb-24`) is applied

## Tasks / Subtasks

- [x] Task 1: Audit navigationHelpers (AC: 4)
  - [x] Verify `src/utils/navigationHelpers.ts`
  - [x] shouldShowBottomMenu, shouldShowBackButton
  - [x] Update to return true on core routes (/, /join, /tournaments, /leagues, /user/profile, /tournament/:id, /league/:id, /player/:id)
- [x] Task 2: Routes and exclusions (AC: 2, 3)
  - [x] List core routes vs exclusions
  - [x] Exclusions: Landing, /display/*, /auth/*, full-screen modals
  - [x] Test each route
- [x] Task 3: Content padding (AC: 5)
  - [x] pb-20 or pb-24 on scrollable content
  - [x] Verify BottomTabMenu, BottomMenuSpecific
- [x] Task 4: App.tsx integration
  - [x] Ensure BottomTabMenu displays when shouldShowBottomMenu true
  - [x] Handle coexistence with BottomMenuSpecific if needed (join, tournaments, leagues)

## Dev Notes

- **Source:** design-system-convergence.md section 2.1
- **Files:** `src/utils/navigationHelpers.ts`, BottomTabMenu, BottomMenuSpecific
- Bottom nav: 64px min, touch target 48px+

### References

- [Source: _bmad-output/planning-artifacts/design-system-convergence.md#2.1]

## Dev Agent Record

### Agent Model Used

Composer (dev-story workflow)

### Debug Log References

### Completion Notes List

- ✅ **Task 1:** Refactored `shouldShowBottomMenu` to return true for all core routes (/, /join, /tournaments, /leagues, /user/profile, /tournament/:id, /league/:id, /player/:id). Exclusions: /display/*, /auth/*, /payment-success, /payment-cancel, /design-system.
- ✅ **Task 2:** Routes validated via unit and integration tests.
- ✅ **Task 3:** Added `getContentPaddingBottom()` helper: pb-20 for core routes, pb-36 when BottomMenuSpecific coexists (join, tournaments, leagues). Applied in App.tsx content wrapper.
- ✅ **Task 4:** BottomTabMenu displays when `shouldShowBottomMenu && hasIdentity`. BottomMenuSpecific stacks above (bottom-16) when both visible on join/tournaments/leagues.
- ✅ **Code review (2026-02-13):** Fixed 5 issues – BottomMenuSpecific now uses hasIdentity for stack positioning; padding added for anonymous users on join/tournaments/leagues; doc fixes (/user/profile); PAGES_WITH_SPECIFIC_MENU deduplication; test and key fixes.

### Change Log

- 2026-02-13: Story 14-10 implemented. Bottom nav visible on all core routes. Coexistence with BottomMenuSpecific. Padding helper for content clearance.
- 2026-02-13: Code review – 5 issues fixed (2 HIGH, 3 MEDIUM).

### File List

- src/utils/navigationHelpers.ts (modified)
- src/App.tsx (modified)
- src/components/navigation/BottomMenuSpecific.tsx (modified)
- src/pages/Tournaments.tsx (modified)
- src/pages/Leagues.tsx (modified)
- src/pages/PlayerProfile.tsx (modified)
- tests/unit/utils/navigationHelpers.test.ts (modified)
- tests/unit/components/BottomTabMenu.test.tsx (modified)
- tests/integration/BottomTabMenu.integration.test.tsx (modified)
