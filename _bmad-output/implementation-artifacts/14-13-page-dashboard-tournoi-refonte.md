# Story 14.13: Tournament dashboard page (overhaul)

Status: done

## Story

As a user,
I want the tournament dashboard aligned with the design system,
So that InfoCard, StatCards, tabs and ranking are consistent.

## Acceptance Criteria

1. **Given** the design system (section 5.2)
   **When** I view a tournament
   **Then** header: name + back + actions (+, …)

2. InfoCard (status, code, format, date)

3. StatCards (3 columns)

4. SegmentedTabs (Ranking / Matches / Settings)

5. Ranking list with ListRow (avatar, rank, ELO, delta, recentResults 5 circles)

6. FAB: New match (BeerPongMatchIcon)

7. Bottom nav visible

8. The page matches designs Frame 4

## Tasks / Subtasks

- [x] Task 1: Integrate components (AC: 2, 3, 4, 5, 6)
  - [x] InfoCard, StatCard, SegmentedTabs, ListRow, FAB
  - [x] BeerPongMatchIcon for FAB New match
- [x] Task 2: Header and layout (AC: 1, 7)
- [x] Task 3: Frame 4 alignment (AC: 8)

## Dev Notes

- **Source:** design-system-convergence.md section 5.2
- **File:** `src/pages/TournamentDashboard.tsx`
- ContextualHeader already used

### References

- [Source: _bmad-output/planning-artifacts/design-system-convergence.md#5.2]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- InfoCard: statut, code, format, date (section 5.2)
- StatCards: 3 colonnes (Joueurs, Matchs, Top ELO)
- SegmentedTabs encapsulated: Classement / Matchs / Paramètres
- ListRow: classement avec avatar, rang, ELO, delta, recentResults (5 cercles vert/rouge), full width
- FAB: Nouveau match (BeerPongMatchIcon) quand tournoi non terminé
- Header: ContextualHeader avec nom, retour, Inviter (si droits)
- Bottom nav visible (14-10)

### File List

- src/pages/TournamentDashboard.tsx
- tests/unit/pages/TournamentDashboard.test.tsx
- tests/unit/pages/TournamentDashboard.tabs.test.tsx
- tests/unit/pages/TournamentDashboard.floatingButton.test.tsx

## Senior Developer Review (AI)

**Date:** 2026-02-13  
**Reviewer:** floppyflax (AI)

### Summary

Code review performed. 7 issues fixed automatically (delta ELO, pb-32 token, alert→toast, imports @/, error typing, databaseService mock). 4 Match History tests remain skipped (async timing); documented for future fix.

### Fixes Applied

- **Delta ELO (AC5):** Added `getDeltaFromLastMatch()` and pass to ListRow
- **Design token:** Replaced `pb-32` with `pb-bottom-nav lg:pb-bottom-nav-lg`
- **Toast:** Replaced `alert()` with `toast.error()`
- **Imports:** Migrated to `@/` path aliases
- **Error handling:** `catch (error: unknown)` with `instanceof Error` check
- **Tests:** Added databaseService mock to tabs and FAB test files

### Remaining

- [ ] [AI-Review][MEDIUM] Fix or remove 4 skipped Match History tests (Task 4) — async loadTournamentParticipants timing [TournamentDashboard.test.tsx:197-266]
