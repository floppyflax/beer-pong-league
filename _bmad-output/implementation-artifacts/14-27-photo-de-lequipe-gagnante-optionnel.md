# Story 14.27: Photo de l'équipe gagnante (optionnel)

Status: ready-for-dev

## Story

As a player,
I want ajouter optionnellement une photo de l'équipe gagnante,
So que j'aie un souvenir du match.

## Acceptance Criteria

1. **Given** j'ai sélectionné le gagnant
   **When** le formulaire affiche les options
   **Then** bouton optionnel "Photo" (prise ou galerie)

2. Photo uploadée vers Supabase Storage

3. URL stockée dans `photo_url`

## Tasks / Subtasks

- [ ] Task 1: Capture photo (AC: 1)
  - [ ] input type="file" accept="image/\*" capture="environment"
  - [ ] Ou navigator.mediaDevices.getUserMedia
  - [ ] Gestion permissions
- [ ] Task 2: Upload Supabase Storage (AC: 2)
  - [ ] Bucket match-photos
  - [ ] Upload après création match (matchId)
  - [ ] Compression optionnelle mobile
- [ ] Task 3: Persistance (AC: 3)
  - [ ] URL publique dans matches.photo_url

## Dev Notes

- **Fichier:** `src/components/MatchRecordingForm.tsx`
- Dépend: 14.24 (schema), 14.25 (choix gagnant)
- design-system-convergence sections 7.2, 7.3

### References

- [Source: _bmad-output/planning-artifacts/design-system-convergence.md#7]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
