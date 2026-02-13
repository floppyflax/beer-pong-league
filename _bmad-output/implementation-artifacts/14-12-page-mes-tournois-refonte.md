# Story 14.12: Page Mes tournois (refonte)

Status: ready-for-dev

## Story

As a user,
I want la page Mes tournois alignée sur le design system,
So que les éléments des designs (recherche, filtres, cartes, FAB) soient présents.

## Acceptance Criteria

1. **Given** le design system (section 5.1)
   **When** je consulte Mes tournois
   **Then** header : titre + bouton + search (ou barre dédiée)

2. SearchBar (debounce 300ms)

3. SegmentedTabs (Tous / Actifs / Terminés)

4. Liste ou grille de cartes (ListRow ou TournamentCard)

5. FAB : Créer un tournoi

6. Bottom nav visible

7. La page correspond aux designs Frame 3

## Tasks / Subtasks

- [ ] Task 1: Intégrer composants design system (AC: 2, 3, 4, 5)
  - [ ] SearchBar, SegmentedTabs, ListRow/TournamentCard, FAB
  - [ ] Remplacer composants existants
- [ ] Task 2: Header et layout (AC: 1, 6)
  - [ ] ContextualHeader si pertinent
  - [ ] Bottom nav visible
- [ ] Task 3: Alignement Frame 3 (AC: 7)
  - [ ] Comparer avec design référence

## Dev Notes

- **Source:** design-system-convergence.md section 5.1
- **Fichier:** `src/pages/Tournaments.tsx`
- Dépend des stories 14.1-14.8, 14.10
- TournamentCard existant: `src/components/tournaments/TournamentCard.tsx`

### References

- [Source: _bmad-output/planning-artifacts/design-system-convergence.md#5.1]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
