# Story 14.7: Composant Banner (feedback)

Status: review

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

- [x] Task 1: Créer Banner.tsx (AC: 1-4)
  - [x] Créer `src/components/design-system/Banner.tsx`
  - [x] Variants success/error
  - [x] onDismiss optionnel
- [x] Task 2: Export et tests (AC: 5)
- [x] Task 3: Design System showcase (Story 14-1b)
  - [x] Ajouter section Banner dans DesignSystemShowcase (variants success/error, avec onDismiss)

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

- Banner.tsx créé avec variants success (bg-success, CheckCircle) et error (bg-error, XCircle)
- Props: message, variant, position ('top' | 'inline'), onDismiss?
- 11 tests unitaires couvrant tous les AC
- Export dans design-system/index.ts
- Section Banner dans DesignSystemShowcase avec exemples success, error, dismissable

### File List

- src/components/design-system/Banner.tsx (new)
- src/components/design-system/index.ts (modified)
- src/pages/DesignSystemShowcase.tsx (modified)
- tests/unit/components/design-system/Banner.test.tsx (new)

## Change Log

- 2026-02-13: Story 14-7 implémentée — composant Banner créé (success/error, position top/inline, onDismiss), tests, export, DesignSystemShowcase
