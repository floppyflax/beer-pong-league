# Code Review — Story 14-13: Tournament dashboard page (overhaul)

**Story:** 14-13-page-dashboard-tournoi-refonte.md  
**Reviewer:** floppyflax (AI)  
**Date:** 2026-02-13  
**Git vs Story Discrepancies:** 0 (no uncommitted changes in story files; git clean)  
**Issues Found:** 2 High, 4 Medium, 3 Low  
**Fixes Applied:** 2026-02-13 (option 1 — auto-fix)

---

## Summary

Story 14-13 aligns the tournament dashboard with the design system (section 5.2). The implementation integrates InfoCard, StatCards, SegmentedTabs, ListRow, FAB with BeerPongMatchIcon, and ContextualHeader. Most ACs are implemented. Several issues were found and **fixed automatically**.

---

## 🔴 CRITICAL / HIGH ISSUES

### 1. ~~[HIGH] QR code URLs incorrect~~ — N/A (already correct)

QR codes already use `/tournament/${tournament.id}/join`. No fix needed.

---

### 2. ~~[HIGH] ListRow delta not implemented~~ — FIXED

**File:** `src/pages/TournamentDashboard.tsx`  
**Line:** 428

**Problem:** AC5 requires "delta" in the ranking ListRow. The implementation passes `delta={undefined}`. Design system 5.2: "ListRow (avatar, rang, ELO, delta, recentResults 5 cercles)".

**Fix:** Added `getDeltaFromLastMatch()` helper and pass computed delta to ListRow.

---

## 🟡 MEDIUM ISSUES

### 3. ~~[MEDIUM] Magic number `pb-32`~~ — FIXED

**File:** `src/pages/TournamentDashboard.tsx`  
**Line:** 414

**Problem:** Content area uses `pb-32` (8rem) instead of design system tokens. Design system 3.4: "Margin bottom nav: pb-20 ou pb-24". Project uses `bottom-nav` token (5rem).

```tsx
// Current
<div className="flex-grow overflow-y-auto px-4 py-4 space-y-2 pb-32">

// Should use
**Fix:** Replaced with `pb-bottom-nav lg:pb-bottom-nav-lg`.

---

### 4. [MEDIUM] Four Match History tests skipped (Task 4) — Documented

**File:** `tests/unit/pages/TournamentDashboard.test.tsx`  
**Lines:** 194–266

**Problem:** Task 4 (Match History with timestamps, ELO, winner highlight) has 4 tests marked `it.skip`. Story claims Task 4 done, but test coverage for Match tab is incomplete.

- `should display match teams` — skipped  
- `should display relative timestamp` — skipped  
- `should display ELO changes for players` — skipped  
- `should highlight winning team` — skipped  

**Note:** Tests remain skipped; databaseService mock added to tabs/FAB tests. Match History tests need proper async handling (fake timers or higher-level mock).

---

### 5. ~~[MEDIUM] `alert()` used instead of toast~~ — FIXED

**File:** `src/pages/TournamentDashboard.tsx`  
**Lines:** 306–308

**Problem:** Project context: "Never use alert() or console.error() only" — use toast for user-facing messages.

```tsx
// Current
alert("Pour ajouter des joueurs, associez d'abord ce tournoi à une League...");

// Should use
**Fix:** Replaced with `toast.error()`.

---

### 6. ~~[MEDIUM] Relative imports instead of path aliases~~ — FIXED

**File:** `src/pages/TournamentDashboard.tsx`  
**Lines:** 1–35

**Fix:** Migrated all imports to `@/` path aliases.

---

## 🟢 LOW ISSUES

### 7. ~~[LOW] `error: any` in catch block~~ — FIXED

**File:** `src/pages/TournamentDashboard.tsx`  
**Line:** 292

**Problem:** Project context: "Never use `any` — use `unknown` if type is truly unknown".

**Fix:** Changed to `error: unknown` with `error instanceof Error` check.

---

### 8. ~~[LOW] databaseService not mocked in tabs/FAB tests~~ — FIXED

**Files:** `tests/unit/pages/TournamentDashboard.tabs.test.tsx`, `TournamentDashboard.floatingButton.test.tsx`

**Fix:** Added `vi.mock` for databaseService in both test files.

---

### 9. [LOW] InfoCard includes "joueurs" count — design system lists 4 items (accepted)

**File:** `src/pages/TournamentDashboard.tsx`  
**Lines:** 339–361

**Problem:** Design system 5.2: "InfoCard (statut, code, format, date)". Implementation adds "X joueurs" (Users icon). Minor deviation; may be intentional for UX.

---

## AC Validation Summary

| AC | Status | Notes |
|----|--------|-------|
| AC1: Header (name, back, actions) | ✅ | ContextualHeader |
| AC2: InfoCard (status, code, format, date) | ✅ | + joueurs |
| AC3: StatCards (3 columns) | ✅ | Joueurs, Matchs, Top ELO |
| AC4: SegmentedTabs (Ranking/Matchs/Settings) | ✅ | variant encapsulated |
| AC5: ListRow (avatar, rank, ELO, delta, recentResults) | ⚠️ | delta missing |
| AC6: FAB Nouveau match (BeerPongMatchIcon) | ✅ | |
| AC7: Bottom nav visible | ✅ | via 14-10 CORE_ROUTE_PATTERNS |
| AC8: Frame 4 alignment | ✅ | Layout structure matches |

---

## Task Audit

| Task | Marked | Evidence |
|------|--------|----------|
| Task 1: Integrate components (AC 2–6) | [x] | ✅ InfoCard, StatCard, SegmentedTabs, ListRow, FAB present |
| Task 2: Header and layout (AC 1, 7) | [x] | ✅ ContextualHeader, bottom nav via layout |
| Task 3: Frame 4 alignment (AC 8) | [x] | ✅ Structure matches |

---

## Recommendations

1. **Fix QR code URLs** — Replace `/tournament/join/${id}` with `/tournament/${id}/join` in both QR code instances.
2. **Implement delta** — Compute ELO change from last match and pass to ListRow.
3. **Replace pb-32** with design token `pb-bottom-nav`.
4. **Replace alert()** with `toast.error()`.
5. **Fix or remove** skipped Match History tests.
6. **Add databaseService mock** to tabs and FAB test files.
7. **Migrate to @/ path aliases** per project conventions.
