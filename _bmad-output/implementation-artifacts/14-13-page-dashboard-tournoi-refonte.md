# Story 14.13: Page Dashboard tournoi (refonte)

Status: ready-for-dev

## Story

As a user,
I want le dashboard tournoi aligné sur le design system,
So que InfoCard, StatCards, tabs et classement soient cohérents.

## Acceptance Criteria

1. **Given** le design system (section 5.2)
   **When** je consulte un tournoi
   **Then** header : nom + retour + actions (+, …)

2. InfoCard (statut, code, format, date)

3. StatCards (3 colonnes)

4. SegmentedTabs (Classement / Matchs / Paramètres)

5. Liste classement avec ListRow (avatar, rang, ELO, delta)

6. FAB : Nouveau match (BeerPongMatchIcon)

7. Bottom nav visible

8. La page correspond aux designs Frame 4

## Tasks / Subtasks

- [ ] Task 1: Intégrer composants (AC: 2, 3, 4, 5, 6)
  - [ ] InfoCard, StatCard, SegmentedTabs, ListRow, FAB
  - [ ] BeerPongMatchIcon pour FAB Nouveau match
- [ ] Task 2: Header et layout (AC: 1, 7)
- [ ] Task 3: Alignement Frame 4 (AC: 8)

## Dev Notes

- **Source:** design-system-convergence.md section 5.2
- **Fichier:** `src/pages/TournamentDashboard.tsx`
- ContextualHeader déjà utilisé

### References

- [Source: _bmad-output/planning-artifacts/design-system-convergence.md#5.2]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
