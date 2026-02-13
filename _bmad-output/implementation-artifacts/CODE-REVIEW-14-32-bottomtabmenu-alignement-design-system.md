# Code Review: Story 14-32 — BottomTabMenu alignement design system

**Story:** 14-32-bottomtabmenu-alignement-design-system  
**Reviewer:** Adversarial Senior Developer (AI)  
**Date:** 2026-02-13  
**Git vs Story Discrepancies:** 0 (File List matches modified files for this story)  
**Issues Found:** 2 High, 3 Medium, 2 Low

---

## Summary

Story 14-32 verified BottomTabMenu alignment with design-system-convergence 2.1. The implementation was largely pre-existing (Story 14-10b); this story added one unit test and refined the DesignSystemShowcase description. The review identified 7 issues ranging from route-matching gaps to accessibility and API clarity.

---

## 🔴 HIGH ISSUES

### H1. Route matching ignores nested routes (design-system-convergence 2.1)

**File:** `src/components/navigation/BottomTabMenu.tsx:100`

**Problem:** The design-system-convergence section 2.1 states the bottom nav is visible on `/tournament/:id`, `/league/:id`, `/player/:id`. The implementation uses strict equality `currentPath === tab.route`. When the user is on `/tournament/abc123` or `/league/xyz`, no tab is highlighted—all tabs appear inactive.

**Evidence:**
```tsx
const isActive = currentPath === tab.route;
// /tournament/123 !== /tournaments → Tournaments tab inactive
// /league/456 !== /leagues → Leagues tab inactive
```

**Impact:** UX inconsistency: user navigates to a tournament detail, bottom nav is visible per spec, but no tab is active. Violates "visually consistent" goal.

**Fix:** Implement path matching for nested routes, e.g.:
- Tournaments tab: `pathname === '/' || pathname.startsWith('/tournament')`
- Leagues tab: `pathname.startsWith('/league')`
- Profile tab: `pathname.startsWith('/user/profile')` or `pathname.startsWith('/player')`

---

### H2. Missing focus-visible styles for keyboard accessibility (WCAG 2.1 AA)

**File:** `src/components/navigation/BottomTabMenu.tsx:105-116`

**Problem:** The project context requires WCAG 2.1 AA compliance. Tab buttons have no `focus-visible` or `focus:` ring. Keyboard users rely on visible focus to know which element is active. Default browser focus may be subtle or invisible on dark backgrounds.

**Evidence:** Buttons have `active:scale-95` but no `focus-visible:ring-2 focus-visible:ring-primary` or similar.

**Impact:** Keyboard users may not see which tab is focused when navigating with Tab key.

**Fix:** Add `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800` to the button className.

---

## 🟡 MEDIUM ISSUES

### M1. No keyboard navigation test

**File:** `tests/unit/components/BottomTabMenu.test.tsx`

**Problem:** Buttons are keyboard-accessible by default, but no test verifies that pressing Enter or Space activates the tab. The "Touch Targets & Accessibility (AC6)" describe block lacks keyboard coverage.

**Fix:** Add test:
```ts
it("should activate tab on Enter key press", () => {
  render(<BottomTabMenu />);
  const joinButton = screen.getByLabelText("Join");
  joinButton.focus();
  fireEvent.keyDown(joinButton, { key: "Enter" });
  expect(mockNavigate).toHaveBeenCalledWith("/join");
});
```

---

### M2. previewMode API can silently navigate when previewOnTabClick is omitted

**File:** `src/components/navigation/BottomTabMenu.tsx:80-86`

**Problem:** When `previewMode={true}` and `previewActiveRoute` are set but `previewOnTabClick` is omitted, clicking a tab calls `navigate(route)` instead of a no-op. A consumer using the component for a static demo might not pass `previewOnTabClick` and get unexpected navigation.

**Evidence:**
```tsx
if (previewMode && previewOnTabClick) {
  previewOnTabClick(route);
} else {
  navigate(route);  // Falls through when previewOnTabClick is undefined
}
```

**Fix:** Either require `previewOnTabClick` when `previewMode` is true (TypeScript), or when `previewMode` is true and `previewOnTabClick` is undefined, do nothing (prevent navigation). Document the behavior in JSDoc.

---

### M3. DesignSystemShowcase: no test for gradient on active tab in preview (AC6)

**File:** `tests/unit/pages/DesignSystemShowcase.test.tsx`

**Problem:** AC6 says "Design System showcase displays the navigation with active/inactive states." The test "should update active tab when clicking" verifies `aria-current` but not that the active tab has `bg-gradient-tab-active`. The gradient is covered by BottomTabMenu unit tests, but AC6 explicitly requires the showcase to display active/inactive states—a test that the active tab in the preview has the gradient would strengthen the claim.

**Fix:** Add assertion in the existing test or a new test:
```ts
it("should display active tab with gradient in BottomTabMenu preview (AC6)", () => {
  renderWithRouter();
  const homeTab = screen.getByLabelText("Home");
  expect(homeTab).toHaveClass("bg-gradient-tab-active");
});
```

---

## 🟢 LOW ISSUES

### L1. Redundant Icon className

**File:** `src/components/navigation/BottomTabMenu.tsx:120-123`

**Problem:** The Icon receives `className={isActive ? "text-white" : "text-slate-400"}`, but the parent button already has `text-white` when active and `text-slate-400` when inactive. The Icon inherits the color. The explicit className is redundant.

**Fix:** Remove the Icon className or simplify to `className={isActive ? "text-white" : ""}` (inherits from parent). Low priority; current code works.

---

### L2. Inconsistent label in showcase: "Leagues" vs French labels

**File:** `src/pages/DesignSystemShowcase.tsx:609-610`

**Problem:** The description says "Accueil, Rejoindre, Tournois, Leagues, Profil" — "Leagues" is in English while others are French. The design-system-convergence table uses "Leagues" (English). Minor inconsistency; consider "Leagues" for consistency with the spec or "Ligues" for full French.

---

## Validation Summary

| AC | Status | Notes |
|----|--------|-------|
| AC1: Active tab gradient + white text | ✅ IMPLEMENTED | bg-gradient-tab-active, text-white |
| AC2: Inactive text-slate-400 | ✅ IMPLEMENTED | text-slate-400 |
| AC3: Min height 64px, touch 48px+ | ✅ IMPLEMENTED | h-16, min-h-[48px] |
| AC4: 5 tabs | ✅ IMPLEMENTED | Accueil, Rejoindre, Tournois, Leagues, Profil |
| AC5: Icons | ✅ IMPLEMENTED | Home, QrCode, Trophy, Medal, User |
| AC6: Showcase active/inactive | ✅ IMPLEMENTED | BottomTabMenuPreview with state |

**Tasks marked [x]:** All verified as completed.

---

## Recommended Actions

1. ~~**Fix H1:** Implement path matching for nested routes.~~ ✅ FIXED
2. ~~**Fix H2:** Add focus-visible styles to tab buttons.~~ ✅ FIXED
3. ~~**Fix M1:** Add keyboard activation test.~~ ✅ FIXED
4. ~~**Fix M2:** Clarify previewMode API (prevent navigate when previewOnTabClick omitted, or document).~~ ✅ FIXED
5. ~~**Fix M3:** Add DesignSystemShowcase test for gradient on active tab.~~ ✅ FIXED
6. **L1, L2:** Optional, low priority (not fixed).
