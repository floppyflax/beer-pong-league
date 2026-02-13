# Story 14.25: Choix de l'équipe gagnante (obligatoire)

Status: ready-for-dev

## Story

As a player,
I want choisir l'équipe gagnante au lieu des scores,
So que je valide un match rapidement.

## Acceptance Criteria

1. **Given** j'enregistre un match
   **When** j'ai sélectionné les équipes
   **Then** je vois "Qui a gagné ?" — Équipe 1 / Équipe 2 (obligatoire)

2. Le formulaire remplace teamAScore/teamBScore par ce choix

3. ELO utilise le gagnant

## Tasks / Subtasks

- [ ] Task 1: Refactor MatchRecordingForm (AC: 1, 2)
  - [ ] Supprimer teamAScore, teamBScore
  - [ ] Ajouter winner: 'A' | 'B' | null
  - [ ] UI: deux boutons/chips Équipe 1 / Équipe 2
- [ ] Task 2: Mapping et ELO (AC: 3)
  - [ ] Mapper winner vers format score (1-0 ou 0-1)
  - [ ] DatabaseService: accepter winner
- [ ] Task 3: Validation
  - [ ] Winner obligatoire avant submit

## Dev Notes

- **Fichier:** `src/components/MatchRecordingForm.tsx`
- design-system-convergence section 7.4
- Dépend de 14.24 (schema) pour cohérence

### References

- [Source: _bmad-output/planning-artifacts/design-system-convergence.md#7.4]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
