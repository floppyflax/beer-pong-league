# Story 14.7: Composant Banner (feedback)

Status: ready-for-dev

## Story

As a developer,
I want un composant Banner réutilisable pour les feedbacks (succès, erreur),
So que les toasts et bannières soient cohérents.

## Acceptance Criteria

1. **Given** le design system (section 4.6)
   **When** j'utilise Banner
   **Then** structure : fond vert (succès) ou rouge (erreur)

2. Icône + texte

3. Position : top ou inline selon contexte

4. Props : message, variant ('success' | 'error'), onDismiss?

5. Le composant est exporté et documenté

## Tasks / Subtasks

- [ ] Task 1: Créer Banner.tsx (AC: 1-4)
  - [ ] Créer `src/components/design-system/Banner.tsx`
  - [ ] Variants success/error
  - [ ] onDismiss optionnel
- [ ] Task 2: Export et tests (AC: 5)
- [ ] Task 3: Design System showcase (Story 14-1b)
  - [ ] Ajouter section Banner dans DesignSystemShowcase (variants success/error, avec onDismiss)

## Dev Notes

- **Source:** design-system-convergence.md section 4.6
- **Fichier:** `src/components/design-system/Banner.tsx`
- Peut compléter react-hot-toast pour certains cas

### References

- [Source: _bmad-output/planning-artifacts/design-system-convergence.md#4.6]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
