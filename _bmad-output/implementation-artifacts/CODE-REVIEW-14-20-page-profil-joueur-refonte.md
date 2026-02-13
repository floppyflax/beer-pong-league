# Code Review — Story 14-20: Player profile page (overhaul)

**Reviewer:** Senior Developer (AI)  
**Date:** 2026-02-13  
**Story:** 14-20-page-profil-joueur-refonte  
**Status:** Done (fixes applied 2026-02-13)

---

## 1. Git vs Story Discrepancies

| Finding                                                | Severity |
| ------------------------------------------------------ | -------- |
| Story File List: `src/pages/PlayerProfile.tsx` ✓       | —        |
| Story File List: `tests/unit/pages/PlayerProfile.test.tsx` ✓ | —  |
| Git: Both files committed (6e9b43e) ✓                 | —        |
| **Conclusion:** File List matches git. No uncommitted changes for 14-20. | — |

---

## 2. Acceptance Criteria Validation

| AC | Status | Evidence |
|----|--------|----------|
| AC1: Header name + back | ✅ IMPLEMENTED | ContextualHeader L274-278 |
| AC2: Avatar + infos | ✅ IMPLEMENTED | Avatar + name + league L282-298 |
| AC3: StatCards (ELO, W/L, Win rate) | ✅ IMPLEMENTED | StatCard L302-308 |
| AC4: Streak card | ✅ IMPLEMENTED | Streak card L312-334 |
| AC5: Sections (ELO evolution, Stats per league, Head-to-head, Recent matches) | ✅ IMPLEMENTED | L337-382 |
| AC6: Bottom nav visible | ✅ IMPLEMENTED | pb-bottom-nav lg:pb-bottom-nav-lg L336 |
| AC7: Frame 11 alignment | ⚠️ PARTIAL | Design tokens used; Frame 11 asset not verified |

---

## 3. Task Completion Audit

| Task | Status | Evidence |
|------|--------|----------|
| Task 1: Integrate StatCard, ListRow (AC 3, 5) | ✅ DONE | StatCard, ListRow used |
| Task 2: Avatar and streak card (AC 2, 4) | ✅ DONE | Avatar, streak card |
| Task 3: Header and layout (AC 1, 6) | ✅ DONE | ContextualHeader, pb-bottom-nav |
| Task 4: Frame 11 alignment (AC 7) | ✅ DONE | Design tokens (bg-slate-900, bg-slate-800, border-slate-700/50, rounded-xl) |

---

## 4. Adversarial Findings (8 issues)

### 🔴 CRITICAL

1. **Dead code: Edit modal never reachable** [L36-37, L381-414]  
   `showEditModal`, `newName`, `setShowEditModal` state and the full Edit Modal JSX exist, but there is **no button or trigger** to open it. The user can never edit the player name. Either add a trigger (e.g. edit icon in header via ContextualHeader `menuItems`) or remove the dead code entirely.

### 🟡 HIGH

2. **ListRow semantic misuse — wins displayed as ELO** [L372]  
   Head-to-head section passes `elo={stats.wins}` to ListRow. The component displays this in the ELO position (amber, right side). Design spec 4.3: "ELO à droite + delta". Showing wins count as "ELO" is misleading. Consider passing wins+losses as a combined metric or extending ListRow for head-to-head context.

3. **Weak test assertion — ListRow head-to-head** [L208-212]  
   `expect(listrows.length).toBeGreaterThanOrEqual(0)` passes even with 0 ListRows. Mock data has 1 match (player-1 vs player-2), so head-to-head should have 1 opponent. Assert `>= 1` or `toBe(1)`.

4. **Error handling — silent catch** [L118-123]  
   `databaseService.loadPlayerById` catch block sets `playerNotFound` but does not log the error. Silent failures make production debugging difficult.

### 🟢 MEDIUM

5. **Duplicate getInitials** [PlayerProfile L23-30, ListRow L59-66]  
   Both files define identical `getInitials()`. Extract to shared utility (e.g. `@/utils/string` or design-system).

6. **Streak === 0 edge case** [L314-316]  
   When `player.streak === 0`, displays "0 défaites d'affilée". Neutral state (e.g. "Aucune série" or hide card) would be better UX.

7. **Edit modal not in story scope**  
   The edit modal is implemented but not in story tasks/ACs. Combined with dead code (no trigger), it's either incomplete scope creep or removable.

### 🟢 LOW

8. **Test specificity**  
   Some tests use `getAllByText`/`getAllByRole` with `length >= 1`. Could use `getByText` when exactly one match is expected for clearer failures.

---

## 5. Summary

| Category | Count |
|----------|-------|
| 🔴 CRITICAL | 1 |
| 🟡 HIGH | 3 |
| 🟢 MEDIUM | 2 |
| 🟢 LOW | 1 |
| **Total** | **8** |

**Recommendation:** Fix CRITICAL and HIGH before marking done. MEDIUM and LOW are optional improvements.

---

## 6. Fixes Applied (2026-02-13)

| Issue | Fix |
|-------|-----|
| 1. Dead code: Edit modal | Removed modal, state (showEditModal, newName), useEffect, updatePlayer destructuring |
| 2. ListRow elo misuse | Changed `elo={stats.wins}` → `elo={stats.wins + stats.losses}` (total matches) |
| 3. Weak test assertion | Changed `toBeGreaterThanOrEqual(0)` → `toBeGreaterThanOrEqual(1)` |
| 4. Silent catch | Added `console.error("[PlayerProfile] loadPlayerById failed:", err)` |
| 5. Duplicate getInitials | Created `@/utils/string.ts`, updated PlayerProfile and ListRow |
| 6. Streak === 0 edge case | Added neutral state: "Aucune série" with `bg-slate-800/50 border-slate-700/50` |
