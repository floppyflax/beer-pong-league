# Story 14.3: Composant SegmentedTabs

Status: review

## Story

As a developer,
I want un composant SegmentedTabs réutilisable,
So que les filtres (Tous/Actifs/Terminés) et onglets (Classement/Matchs/Paramètres) soient cohérents.

## Acceptance Criteria

1. **Given** le design system (section 4.2)
   **When** j'utilise SegmentedTabs
   **Then** le composant affiche une liste d'onglets

2. Onglet actif : `bg-primary text-white` ou gradient

3. Onglet inactif : `bg-slate-800 text-slate-400 hover:bg-slate-700`

4. Structure : `flex gap-2`, `px-4 py-2 rounded-lg font-semibold`

5. Callback onClick pour changement d'onglet

6. Le composant est exporté et documenté

## Tasks / Subtasks

- [x] Task 1: Créer SegmentedTabs.tsx (AC: 1, 2, 3, 4, 5)
  - [x] Créer `src/components/design-system/SegmentedTabs.tsx`
  - [x] Props: tabs: { id: string, label: string }[], activeId, onChange
  - [x] Styles actif/inactif
- [x] Task 2: Export et tests (AC: 6)
  - [x] Export depuis design-system
  - [x] Test unitaire
- [x] Task 3: Design System showcase (Story 14-1b)
  - [x] Ajouter section SegmentedTabs dans DesignSystemShowcase avec démo interactive

## Dev Notes

- **Source:** design-system-convergence.md section 4.2
- **Fichier:** `src/components/design-system/SegmentedTabs.tsx`
- Props : tabs, activeId, onChange: (id: string) => void
- Accessible: aria-selected, role="tablist"

### Project Structure Notes

- `src/components/design-system/SegmentedTabs.tsx`

### References

- [Source: _bmad-output/planning-artifacts/design-system-convergence.md#4.2]

## Dev Agent Record

### Agent Model Used

Cursor / Composer

### Debug Log References

### Completion Notes List

- SegmentedTabs créé avec props tabs, activeId, onChange
- Styles: actif = gradient-tab-active, inactif = bg-slate-800 text-slate-400 hover:bg-slate-700
- Accessible: role="tablist", role="tab", aria-selected
- Export via src/components/design-system/index.ts
- Démo interactive dans DesignSystemShowcase (filtres + onglets dashboard)
- Test StatCard DesignSystemShowcase mis à jour (getAllByText pour "Matchs" car doublon avec SegmentedTabs)

### File List

- src/components/design-system/SegmentedTabs.tsx (new)
- src/components/design-system/index.ts (new)
- src/pages/DesignSystemShowcase.tsx (modified)
- tests/unit/components/design-system/SegmentedTabs.test.tsx (new)
- tests/unit/pages/DesignSystemShowcase.test.tsx (modified)

## Change Log

- 2026-02-13: Story 14-3 implémentée — SegmentedTabs créé, exporté, testé, intégré au DesignSystemShowcase
