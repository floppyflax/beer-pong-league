# Story 14.10: Règles navigation (bottom nav toujours visible)

Status: ready-for-dev

## Story

As a developer,
I want la bottom nav visible sur toutes les routes core,
So que la navigation soit cohérente avec le design system.

## Acceptance Criteria

1. **Given** le design system (section 2.1)
   **When** l'utilisateur est sur une route core
   **Then** la bottom nav est affichée

2. Routes core : `/`, `/join`, `/tournaments`, `/leagues`, `/user/profile`, `/tournament/:id`, `/league/:id`, `/player/:id`

3. Exclusions : Landing (non connecté), Display views, Auth callback, modales plein écran

4. `shouldShowBottomMenu` (ou équivalent) retourne true pour tous les cas core

5. Le padding bottom du contenu (`pb-20` ou `pb-24`) est appliqué

## Tasks / Subtasks

- [ ] Task 1: Audit navigationHelpers (AC: 4)
  - [ ] Vérifier `src/utils/navigationHelpers.ts`
  - [ ] shouldShowBottomMenu, shouldShowBackButton
  - [ ] Mettre à jour pour retourner true sur routes core
- [ ] Task 2: Routes et exclusions (AC: 2, 3)
  - [ ] Lister routes core vs exclusions
  - [ ] Tester chaque route
- [ ] Task 3: Padding contenu (AC: 5)
  - [ ] pb-20 ou pb-24 sur contenu scrollable
  - [ ] Vérifier BottomTabMenu, BottomMenuSpecific

## Dev Notes

- **Source:** design-system-convergence.md section 2.1
- **Fichiers:** `src/utils/navigationHelpers.ts`, BottomTabMenu, BottomMenuSpecific
- Bottom nav: 64px min, touch target 48px+

### References

- [Source: _bmad-output/planning-artifacts/design-system-convergence.md#2.1]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
