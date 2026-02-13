# Code Review — Stories 14-19 & 14-20 (Adversarial)

**Date:** 2026-02-13  
**Reviewer:** AI Senior Developer (Adversarial)  
**Stories:** 14-19 (Create tournament page), 14-20 (Player profile page)

**Auto-fix applied:** 2026-02-13 — limit-reached test, MatchEnrichedDisplay in PlayerProfile, getInitials tests.

---

## Git vs Story Discrepancies

| File | Story 14-19 | Story 14-20 | Git Status |
|------|-------------|-------------|------------|
| CreateTournament.tsx | ✓ File List | — | M |
| CreateTournament.test.tsx | ✓ File List | — | M |
| PlayerProfile.tsx | — | ✓ File List | M |
| ListRow.tsx | — | ✓ File List | M |
| string.ts | — | ✓ File List | ?? (untracked) |
| PlayerProfile.test.tsx | — | ✓ File List | M |

**Discrepancy:** `string.ts` is untracked (??) — should be committed. File List is accurate.

---

## Story 14-19: Create Tournament Page

### 🔴 CRITICAL

1. **Stale review follow-ups (story file)**  
   - **Location:** `14-19-page-creer-tournoi-refonte.md` lines 32-33  
   - **Issue:** Tasks marked `[ ]` for "Tests: 14/14 fail" and "Tests: limit-reached..." — but tests **pass** (14/14). The `skipPremiumCheck` + `waitForFormReady` fix was applied.  
   - **Impact:** Story file claims unresolved CRITICAL when it is fixed. Misleading for future reviewers.  
   - **Fix:** Mark `[x]` the CRITICAL item (tests fixed). Keep deferred item as `[ ]` or add note "deferred — mock stability".

### 🟡 MEDIUM

2. **No test for limit-reached modal**  
   - **Location:** `CreateTournament.test.tsx`  
   - **Issue:** When `canCreate === false`, the "Limite atteinte" modal is shown. No test verifies this.  
   - **Impact:** Regression risk if modal logic changes.  
   - **Fix:** Add test with `skipPremiumCheck` and mock `premiumService.canCreateTournament` returning `{ allowed: false }` to assert modal renders.

3. **"Plus tard" always navigates to "/"**  
   - **Location:** `CreateTournament.tsx` line 283  
   - **Issue:** `onClick={() => navigate("/")}` — user always lands on home. If they arrived via `/tournaments` or deep link, context is lost.  
   - **Impact:** Minor UX — acceptable for MVP, but `navigate(-1)` would preserve back stack.  
   **Severity:** LOW (downgraded — "/" is reasonable for "Plus tard").

### 🟢 LOW

4. **PREMIUM_PRICE hardcoded**  
   - **Location:** `CreateTournament.tsx` line 31  
   - **Issue:** `const PREMIUM_PRICE = '3€'` — if price changes, multiple files may need updates.  
   - **Fix:** Centralize in config or PremiumService.

---

## Story 14-20: Player Profile Page

### 🟡 MEDIUM

5. **Recent matches missing MatchEnrichedDisplay**  
   - **Location:** `PlayerProfile.tsx` lines 374-382  
   - **Issue:** TournamentDashboard and LeagueDashboard (Story 14-28) show photo + cups in match history. PlayerProfile "Matchs récents" does not.  
   - **Impact:** Inconsistent UX — user sees photo/cups in league/tournament dashboards but not in player profile.  
   - **Note:** Story 14-28 scope was only TournamentDashboard + LeagueDashboard. This is a **consistency gap** for future consideration, not a 14-20 implementation bug.

### 🟢 LOW

6. **getInitials edge case: whitespace-only string**  
   - **Location:** `src/utils/string.ts`  
   - **Issue:** `getInitials("   ")` → `parts = [""]` after trim/split, `first = ""`, `slice(0,2) = ""`, returns `"" || "?"` = `"?"`. Works. But `getInitials("  A  ")` → `parts = ["A"]`, returns `"A".slice(0,2) = "A"`. OK.  
   - **Verdict:** No bug. Optional: add unit test for `getInitials("")` and `getInitials("  ")`.

7. **ListRow elo={0} in head-to-head**  
   - **Location:** `PlayerProfile.tsx` line 363  
   - **Issue:** `elo={0}` is a placeholder when `rightLabel` is used. Works correctly but is a magic value.  
   - **Fix:** Consider `elo={stats.wins + stats.losses}` for semantic value, or add comment.

---

## Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 1 |
| MEDIUM   | 2 |
| LOW      | 3 |

**Total:** 6 findings

---

## Recommendations

1. **Fix CRITICAL:** Update story 14-19 to mark resolved review items `[x]`.
2. **Fix MEDIUM:** Add limit-reached modal test (optional, can defer).
3. **LOW:** Address when convenient (PREMIUM_PRICE config, getInitials tests, ListRow comment).
