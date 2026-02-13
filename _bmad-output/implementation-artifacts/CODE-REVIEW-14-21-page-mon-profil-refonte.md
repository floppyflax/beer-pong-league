# Code Review — Story 14-21: My profile page (overhaul)

**Reviewer:** Senior Developer (Adversarial)  
**Date:** 2026-02-13  
**Story:** 14-21-page-mon-profil-refonte  
**Status:** done — 6 issues fixed (1 HIGH, 3 MEDIUM, 2 LOW)

---

## Git vs Story Discrepancies

- **Story File List:** src/pages/UserProfile.tsx (modified), tests/unit/pages/UserProfile.test.tsx (created)
- **Git status:** UserProfile.tsx modified (M), UserProfile.test.tsx untracked (??)
- **Note:** UserProfile has been extended with useFullDisconnect (Story 14.34) since 14-21 implementation — out of scope for this review
- **Discrepancy count:** 0 (File List matches git reality)

---

## Issues Found

**Summary:** 1 High, 3 Medium, 2 Low

---

## 🔴 HIGH

### 1. totalMatches shows global count instead of user's matches [UserProfile.tsx:36-39]

**Problem:** `totalMatches` sums matches from ALL leagues in the app, not just the user's leagues/tournaments.

```typescript
const totalMatches = leagues.reduce(
  (acc, league) => acc + league.matches.length,
  0,
);
```

**Impact:** A user sees "Matchs: 150" when they only created 3 leagues with 10 matches total — misleading.

**Fix:** Sum only from user's leagues and tournaments:

```typescript
const totalMatches =
  userLeagues.reduce((acc, l) => acc + l.matches.length, 0) +
  userTournaments.reduce((acc, t) => acc + t.matches.length, 0);
```

---

## 🟡 MEDIUM

### 2. Path aliases not used (project-context violation) [UserProfile.tsx:2-7]

**Problem:** UserProfile uses relative imports (`../context/`, `../components/`) instead of `@/` path aliases per project-context.

**Reference:** project-context.md — "Use `@/components/...` instead of `../components/...`"

**Fix:** Replace with:

```typescript
import { useAuthContext } from "@/context/AuthContext";
import { useLeague } from "@/context/LeagueContext";
import { useIdentity } from "@/hooks/useIdentity";
import { useFullDisconnect } from "@/hooks/useFullDisconnect";
import { ContextualHeader } from "@/components/navigation/ContextualHeader";
import { StatCard } from "@/components/design-system/StatCard";
```

### 3. Accessibility: league/tournament cards lack keyboard support [UserProfile.tsx:120-131, 145-164]

**Problem:** Clickable divs have `onClick` only — no `role="button"`, `tabIndex={0}`, or `onKeyDown`. Screen readers and keyboard users cannot activate them.

**Reference:** LeagueCard.tsx implements `handleKeyDown` for Enter/Space. Same pattern expected.

**Fix:** Add `role="button"`, `tabIndex={0}`, `onKeyDown` to each card, or use `<Link to={...}>` for navigation.

### 4. Missing tests: navigation and empty state [UserProfile.test.tsx]

**Problem:**

- No test verifies that clicking a league card navigates to `/league/:id`
- No test verifies that clicking a tournament card navigates to `/tournament/:id`
- No test for empty state (user with no leagues, no tournaments)

---

## 🟢 LOW

### 5. Tournament date null safety [UserProfile.tsx:161]

**Problem:** `new Date(tournament.date).toLocaleDateString("fr-FR")` — if `tournament.date` is null/undefined, shows "Invalid Date".

**Fix:** Add fallback: `tournament.date ? new Date(tournament.date).toLocaleDateString("fr-FR") : "—"`

### 6. fireEvent vs userEvent [UserProfile.test.tsx:152]

**Problem:** Disconnect test uses `fireEvent.click`. Project pattern (CreateLeague.test.tsx) uses `userEvent` for more realistic interaction.

---

## Acceptance Criteria Validation

| AC                                   | Status         | Evidence                                                                |
| ------------------------------------ | -------------- | ----------------------------------------------------------------------- |
| AC1: Page aligned with design system | ✅ IMPLEMENTED | StatCard, tokens (p-4 md:p-6, rounded-xl), bg-gradient-card, typography |
| AC2: Bottom nav visible              | ✅ IMPLEMENTED | /user/profile in CORE_ROUTES, getContentPaddingBottom in App            |

## Task Completion Audit

| Task                        | Status  | Evidence                                |
| --------------------------- | ------- | --------------------------------------- |
| Task 1: Apply design system | ✅ DONE | StatCard, design tokens, gradient cards |
| Task 2: Bottom nav (AC: 2)  | ✅ DONE | navigationHelpers, App layout           |
