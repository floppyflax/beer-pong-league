# Story 14.28: Affichage photo et gobelets dans l'historique des matchs

Status: ready-for-dev

## Story

As a player,
I want voir la photo et les gobelets dans l'historique des matchs,
So que je puisse revivre les matchs.

## Acceptance Criteria

1. **Given** un match avec photo et/ou gobelets
   **When** je consulte l'historique
   **Then** thumbnail photo si disponible

2. Badge "X gobelets restants" si enregistré

## Tasks / Subtasks

- [ ] Task 1: Thumbnail photo (AC: 1)
  - [ ] Afficher img si photo_url
  - [ ] Lazy loading
  - [ ] Option: clic pour agrandir
- [ ] Task 2: Badge gobelets (AC: 2)
  - [ ] Afficher si cups_remaining
  - [ ] Format "X gobelets restants"
- [ ] Task 3: Intégration
  - [ ] TournamentDashboard: liste matchs
  - [ ] LeagueDashboard: liste matchs

## Dev Notes

- **Fichiers:** TournamentDashboard.tsx, LeagueDashboard.tsx
- Dépend: 14.24, 14.26, 14.27

### References

- [Source: _bmad-output/planning-artifacts/design-system-convergence.md#7]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
