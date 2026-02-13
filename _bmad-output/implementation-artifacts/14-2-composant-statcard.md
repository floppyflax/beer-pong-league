# Story 14.2: Composant StatCard

Status: review

## Story

As a developer,
I want un composant StatCard réutilisable,
So que les résumés chiffrés (Joueurs, Matchs, ELO, etc.) soient cohérents partout.

## Acceptance Criteria

1. **Given** le design system (section 4.1)
   **When** j'utilise StatCard
   **Then** le composant affiche une valeur (texte ou nombre) et un label

2. Les variantes : primary, success, accent (couleurs sémantiques)

3. Structure : `bg-slate-800 p-3 rounded-xl text-center`

4. Valeur : `text-2xl font-bold` + couleur selon variante

5. Label : `text-[10px] text-slate-400 uppercase font-bold`

6. Le composant est exporté et documenté

## Tasks / Subtasks

- [x] Task 1: Créer StatCard.tsx (AC: 1, 3, 4, 5)
  - [x] Créer `src/components/design-system/StatCard.tsx`
  - [x] Props: value, label, variant?
  - [x] Structure selon design system
- [x] Task 2: Variantes (AC: 2)
  - [x] primary: bleu/violet
  - [x] success: vert
  - [x] accent: ambre/jaune
- [x] Task 3: Export et tests (AC: 6)
  - [x] Export depuis design-system index
  - [x] Test unitaire basique
- [x] Task 4: Design System showcase (Story 14-1b)
  - [x] Ajouter section StatCard dans DesignSystemShowcase avec variantes primary/success/accent

## Dev Notes

- **Source:** design-system-convergence.md section 4.1
- **Fichier:** `src/components/design-system/StatCard.tsx`
- Props : value (ReactNode), label (string), variant? ('primary' | 'success' | 'accent')
- Créer `src/components/design-system/index.ts` si absent pour exports barrel

### Project Structure Notes

- Nouveau dossier: `src/components/design-system/`
- Composants design system isolés, testables

### References

- [Source: _bmad-output/planning-artifacts/design-system-convergence.md#4.1]

## Dev Agent Record

### Agent Model Used

Composer (dev-story workflow)

### Debug Log References

### Completion Notes List

- StatCard créé dans `src/components/design-system/StatCard.tsx` avec props value (ReactNode), label (string), variant? ('primary' | 'success' | 'accent')
- Structure: bg-slate-800 p-3 rounded-xl text-center, valeur text-2xl font-bold, label text-[10px] text-slate-400 uppercase font-bold
- Variantes: primary → text-info (bleu), success → text-success (vert), accent → text-primary (ambre)
- Export barrel dans design-system/index.ts
- 9 tests unitaires StatCard + mise à jour DesignSystemShowcase avec 3 StatCards (Joueurs, Matchs, Top ELO)
- SegmentedTabs ajouté à l'index design-system (fix import manquant dans DesignSystemShowcase)

### File List

- src/components/design-system/StatCard.tsx (new)
- src/components/design-system/index.ts (modified — StatCard + SegmentedTabs exports)
- src/pages/DesignSystemShowcase.tsx (modified — StatCard section avec variantes)
- tests/unit/components/design-system/StatCard.test.tsx (new)

## Change Log

- 2026-02-13: Implémentation complète du composant StatCard (Story 14-2). StatCard avec variantes primary/success/accent, tests unitaires, intégration DesignSystemShowcase.
