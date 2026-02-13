# Story 14.5: Composant InfoCard

Status: review

## Story

As a developer,
I want un composant InfoCard réutilisable,
So que les bandeaux de contexte (dashboard tournoi/league) soient cohérents.

## Acceptance Criteria

1. **Given** le design system (section 4.4)
   **When** j'utilise InfoCard
   **Then** structure : `bg-slate-800/50 rounded-xl p-4 border border-slate-700/50`

2. Titre + badge statut

3. Ligne d'infos avec icônes (calendrier, users, format)

4. Le composant est flexible (children ou props structurées)

5. Le composant est exporté et documenté

## Tasks / Subtasks

- [x] Task 1: Créer InfoCard.tsx (AC: 1, 2, 3)
  - [x] Structure selon design system
  - [x] Support titre, badge, infos
- [x] Task 2: Flexibilité (AC: 4)
  - [x] Props structurées ou children
  - [x] Exemple d'usage
- [x] Task 3: Export et tests (AC: 5)
- [x] Task 4: Design System showcase (Story 14-1b)
  - [x] Ajouter section InfoCard dans DesignSystemShowcase

## Dev Notes

- **Source:** design-system-convergence.md section 4.4
- **Fichier:** `src/components/design-system/InfoCard.tsx`
- Référence: screens Frame 4 (Dashboard tournoi), Frame 8 (Dashboard league)

### Project Structure Notes

- `src/components/design-system/InfoCard.tsx`

### References

- [Source: _bmad-output/planning-artifacts/design-system-convergence.md#4.4]

## Dev Agent Record

### Agent Model Used

Composer (dev-story workflow)

### Debug Log References

### Completion Notes List

- InfoCard créé avec structure design system (bg-slate-800/50, rounded-xl, p-4, border-slate-700/50)
- Support titre + badge statut (variantes: active, finished, cancelled)
- Ligne d'infos avec icônes Lucide (calendrier, users, format)
- Flexibilité: props structurées (infos[]) ou children
- Export dans design-system/index.ts
- 8 tests unitaires passants
- Section InfoCard ajoutée dans DesignSystemShowcase

### File List

- src/components/design-system/InfoCard.tsx (new)
- src/components/design-system/index.ts (modified)
- src/pages/DesignSystemShowcase.tsx (modified)
- tests/unit/components/design-system/InfoCard.test.tsx (new)

## Change Log

- 2026-02-13: Story 14-5 implémentée — composant InfoCard créé, exporté, testé et intégré au Design System Showcase
