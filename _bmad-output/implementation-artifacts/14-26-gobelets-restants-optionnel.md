# Story 14.26: Gobelets restants (optionnel)

Status: ready-for-dev

## Story

As a player,
I want indiquer optionnellement les gobelets restants de l'équipe gagnante,
So que l'on puisse suivre l'intensité du match.

## Acceptance Criteria

1. **Given** j'ai sélectionné le gagnant
   **When** le formulaire affiche les options
   **Then** champ optionnel "Gobelets restants" (1–10)

2. Valeur stockée dans `cups_remaining`

## Tasks / Subtasks

- [ ] Task 1: Champ formulaire (AC: 1)
  - [ ] Input number ou stepper, min 1, max 10
  - [ ] Label "optionnel"
  - [ ] Affiché après sélection gagnant
- [ ] Task 2: Persistance (AC: 2)
  - [ ] Passer cupsRemaining à DatabaseService
  - [ ] Stocker dans matches.cups_remaining

## Dev Notes

- **Fichier:** `src/components/MatchRecordingForm.tsx`
- Dépend: 14.24 (schema), 14.25 (choix gagnant)
- design-system-convergence section 7.2

### References

- [Source: _bmad-output/planning-artifacts/design-system-convergence.md#7.2]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
