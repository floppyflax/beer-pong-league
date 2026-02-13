# Story 14.11: Bouton fermer modales (design system)

Status: ready-for-dev

## Story

As a user,
I want un bouton X sur toutes les modales,
So que je puisse toujours fermer sans être bloqué.

## Acceptance Criteria

1. **Given** toute modale de l'app
   **When** la modale est affichée
   **Then** bouton X visible en haut à droite

2. Clic sur X ferme la modale

3. Modales concernées : Nouveau match, Saisir code, Limite atteinte, Ajouter joueur, etc.

## Tasks / Subtasks

- [ ] Task 1: Audit modales (AC: 3)
  - [ ] MatchRecordingForm
  - [ ] CodeInputModal
  - [ ] PaymentModal
  - [ ] AddPlayerModal (LeagueDashboard, TournamentDashboard)
  - [ ] Autres modales
- [ ] Task 2: Ajouter/garantir bouton X (AC: 1, 2)
  - [ ] X en haut à droite sur chaque modale
  - [ ] onClick appelle onClose
- [ ] Task 3: Vérification
  - [ ] Tester chaque modale

## Dev Notes

- **Source:** design-system-convergence.md section 6.1
- Toujours un X même si autres boutons (ex. "Plus tard")
- Icône: lucide-react X

### References

- [Source: _bmad-output/planning-artifacts/design-system-convergence.md#6]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
