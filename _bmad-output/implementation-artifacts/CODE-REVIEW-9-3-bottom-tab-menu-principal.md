# Code Review: Story 9-3 - Bottom Tab Menu Principal (Mobile)

**Reviewer:** AI Adversarial Code Review  
**Date:** 2026-02-16  
**Story:** 9-3-bottom-tab-menu-principal.md  
**Status:** review → in-progress (issues found)

---

## Executive Summary

**Git vs Story Discrepancies:** 1 (BottomTabMenu.tsx modified but story not updated)  
**Issues Found:** 2 High, 4 Medium, 3 Low

The implementation has **diverged significantly** from Story 9-3's original Acceptance Criteria due to design-system evolution (design-system-convergence 2.1, Story 14-10, 14-32). The story file has not been updated to reflect these changes, creating documentation drift and false claims.

---

## 🔴 CRITICAL / HIGH ISSUES

### 1. [HIGH] AC4 Visibility Rules — Implementation Contradicts Story

**Story AC4 states:**
- **SHOW** on: `/` (Home), `/profile` only
- **HIDE** on: `/join`, `/tournaments`, `/leagues` (has Bottom Menu Spécifique - Story 9.4)
- **HIDE** on: `/tournament/:id`, `/league/:id` (detail pages)

**Actual implementation** (`navigationHelpers.ts`):
- **SHOW** on: `/`, `/join`, `/tournaments`, `/leagues`, `/user/profile`, `/create-league`, `/create-tournament`
- **SHOW** on: `/tournament/:id`, `/league/:id`, `/player/:id`, `/tournament/:id/invite`, `/tournament/:id/join`

**Evidence:** `src/utils/navigationHelpers.ts` lines 12-33 define CORE_ROUTES and CORE_ROUTE_PATTERNS that include all these routes.

**Root cause:** design-system-convergence.md §2.1 explicitly states "Visibilité : Toujours affichée sur les routes core (y compris pages de détail)" — the design system evolved after Story 9-3.

**Impact:** Story claims are false. A developer reading the story would expect different behavior than what is implemented.

**Recommendation:** Update Story 9-3 AC4 to align with design-system-convergence 2.1, or add a "Superseded by" note referencing the design system doc. The implementation is correct per current design; the story is outdated.

---

### 2. [HIGH] AC2 Active Tab — Orange (#f59e0b) + 2px Top Border NOT Implemented

**Story AC2 states:**
- Active: Orange color (#f59e0b) + orange top border (2px)
- Inactive: Gray color (#94a3b8)

**Actual implementation** (`BottomTabMenu.tsx` line 143):
```tsx
? "border-transparent bg-gradient-tab-active text-white"
```

- Uses `bg-gradient-tab-active` = `linear-gradient(to right, #3b82f6, #7c3aed)` (blue-purple)
- Uses `border-transparent` — **no 2px orange top border**
- No orange (#f59e0b) anywhere on active tab

**Evidence:** `tailwind.config.js` line 41: `"gradient-tab-active": "linear-gradient(to right, #3b82f6, #7c3aed)"`

**Root cause:** Story 14-32 and design-system-convergence §2.1 migrated to gradient for active tab. Story 9-3 was never updated.

**Impact:** AC2 is not implemented as written. The story's "Review Follow-ups" claim "AC2 primary color (#f59e0b) verified" is incorrect — the active tab uses gradient, not primary.

**Recommendation:** Update AC2 in the story to reference design-system-convergence 2.1 (gradient active state). If orange is still required for this story, the implementation must change.

---

## 🟡 MEDIUM ISSUES

### 3. [MEDIUM] AC3 Profile Route Mismatch

**Story AC3 states:** Profil → `/profile`  
**Implementation:** Profil → `/user/profile` (`BottomTabMenu.tsx` line 60)

The app uses `/user/profile` consistently. The story AC3 should be updated to reflect the actual route.

---

### 4. [MEDIUM] Integration Test Uses Wrong Display Route

**File:** `tests/integration/BottomTabMenu.integration.test.tsx` line 119-124

```tsx
it('should not show on display view', () => {
  render(<TestApp initialRoute="/display/123" />);
```

The actual display routes in the app are:
- `/tournament/:id/display`
- `/league/:id/display`

There is no `/display/:id` route. The test passes because `EXCLUDED_PATTERNS` includes `/\/display/` which matches any path containing "display", but the route `/display/123` is not a real app route. The test should use `/tournament/abc/display` or `/league/xyz/display` for accuracy.

---

### 5. [MEDIUM] Story Dev Agent Record — False Claim About Visibility

**Story line 291:** "Bottom Tab Menu is hidden on `/join`, `/tournaments`, `/leagues` to avoid overlap with Bottom Menu Spécifique (Story 9.4)"

**Reality:** The menu is **shown** on all these routes. `shouldShowBottomMenu('/join')` returns `true`. `PAGES_WITH_SPECIFIC_MENU` only includes `/join` for extra padding; the bottom menu is still visible.

**Recommendation:** Update Dev Agent Record to reflect design-system-convergence 2.1 visibility rules.

---

### 6. [MEDIUM] Test Count Mismatch in Story

**Story claims:** "Total: 69/69 tests passing"  
**Actual run:** 72 tests (39 BottomTabMenu + 33 navigationHelpers). Integration tests add 12 more.

The story's test count is outdated. Update to reflect current test suite.

---

## 🟢 LOW ISSUES

### 7. [LOW] Missing Test for AC2 "2px Top Border"

Story's remaining review item: "Missing test verification for AC2 2px top border requirement."

**Note:** The implementation does not use a 2px top border (uses gradient instead). If the story is updated to gradient, this test gap becomes irrelevant. If orange + border is required, add a test that verifies `border-t-2 border-primary` or equivalent on the active tab.

---

### 8. [LOW] No Error Handling for Navigation Failures

**File:** `src/components/navigation/BottomTabMenu.tsx` — `handleTabClick` calls `navigate(route)` with no try/catch or error boundary.

React Router's `navigate()` can fail in edge cases (e.g., invalid route, programmatic errors). The project context states "Always handle errors with try-catch and user-friendly messages." Consider wrapping navigation in error handling or relying on React Router's built-in behavior (document if intentional).

---

### 9. [LOW] Component Documentation Could Reference Design System

**File:** `BottomTabMenu.tsx` lines 11-24

The JSDoc mentions "design-system-convergence 2.1" for gradient but could add:
- Link to design-system-convergence.md section 2.1
- Note that AC4 visibility is defined in navigationHelpers (Story 14-10)

---

## Summary Table

| AC | Status | Notes |
|----|--------|-------|
| AC1: 5 tabs, icon+label | ✅ | Implemented |
| AC2: Active orange + 2px border | ❌ | Uses gradient, no border — design system override |
| AC3: Tab navigation | ⚠️ | Profile route is `/user/profile` not `/profile` |
| AC4: Visibility rules | ❌ | Story says hide on join/tournaments/leagues/detail — implementation shows on all |
| AC5: Responsive (lg:hidden) | ✅ | Implemented |
| AC6: Touch targets, aria | ✅ | 48px, aria-label, aria-current |

---

## Recommendations

1. **Update Story 9-3** to align with design-system-convergence 2.1:
   - AC2: Change to "Active: bg-gradient-tab-active (design-system 2.1)"
   - AC4: Replace with design-system 2.1 visibility rules (show on core + detail, hide on display/auth/landing)
   - AC3: Profil → `/user/profile`
   - Dev Agent Record: Correct visibility description

2. **Fix integration test** to use real display route (`/tournament/123/display`).

3. **Update test count** in story to 72+ unit tests, 12 integration tests.

4. **Add "Superseded by" section** in story referencing design-system-convergence.md and Story 14-10 for visibility, Story 14-32 for gradient.

---

## Next Steps

**Choose one:**
1. **Fix automatically** — Update story file, fix integration test route
2. **Create action items** — Add tasks to story Tasks/Subtasks for later
3. **Show details** — Deep dive into specific issues

Reply with [1], [2], or specify which issue to examine.
