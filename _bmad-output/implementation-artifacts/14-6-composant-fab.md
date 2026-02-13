# Story 14.6: Composant FAB (Floating Action Button)

Status: review

## Story

As a developer,
I want un composant FAB réutilisable,
So que les actions principales (Créer tournoi, Nouveau match) soient cohérentes.

## Acceptance Criteria

1. **Given** le design system (sections 2.2, 4.5)
   **When** j'utilise FAB
   **Then** taille : 56px (mobile), 64px (desktop)

2. Fond : gradient `from-blue-500 to-violet-600`

3. Icône : blanche, 24px

4. Ombre : `shadow-lg`

5. Position : `fixed bottom-20 right-4` (au-dessus bottom nav)

6. Props : icon, onClick, ariaLabel, variant? (primary, secondary)

7. Le composant est exporté et documenté

## Tasks / Subtasks

- [x] Task 1: Créer FAB.tsx (AC: 1-6)
  - [x] Créer `src/components/design-system/FAB.tsx`
  - [x] Props: icon, onClick, ariaLabel, variant?
  - [x] Styles gradient, taille responsive
- [x] Task 2: Intégration BeerPongMatchIcon (AC: 7)
  - [x] Documenter usage avec BeerPongMatchIcon pour "Nouveau match"
- [x] Task 3: Design System showcase (Story 14-1b)
  - [x] Ajouter section FAB dans DesignSystemShowcase (variants primary/secondary)

## Dev Notes

- **Source:** design-system-convergence.md sections 2.2, 4.5
- **Fichier:** `src/components/design-system/FAB.tsx`
- BeerPongMatchIcon déjà dans `src/components/icons/BeerPongMatchIcon.tsx`
- Position fixed: bottom-20 right-4 (au-dessus bottom nav ~64px)

### Project Structure Notes

- `src/components/design-system/FAB.tsx`

### References

- [Source: _bmad-output/planning-artifacts/design-system-convergence.md#2.2]
- [Source: _bmad-output/planning-artifacts/design-system-convergence.md#4.5]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- FAB.tsx créé avec props icon, onClick, ariaLabel, variant (primary/secondary), inline (showcase)
- Gradient bg-gradient-fab (blue-500 → violet-600), taille w-14 h-14 (56px) md:w-16 md:h-16 (64px)
- JSDoc documente usage BeerPongMatchIcon pour "Nouveau match"
- DesignSystemShowcase: section FAB avec variants primary/secondary et BeerPongMatchIcon
- 10 tests unitaires passent

### File List

- src/components/design-system/FAB.tsx (new)
- src/components/design-system/index.ts (modified)
- src/pages/DesignSystemShowcase.tsx (modified)
- tests/unit/components/design-system/FAB.test.tsx (new)

## Change Log

- 2026-02-13: Implémentation complète — FAB.tsx, tests, showcase, export barrel
