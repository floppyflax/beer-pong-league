# Story 14.8: Composant SearchBar

Status: done

## Story

As a developer,
I want un composant SearchBar réutilisable,
So que les recherches (tournois, leagues) soient cohérentes.

## Acceptance Criteria

1. **Given** le design system (section 4.7)
   **When** j'utilise SearchBar
   **Then** icône loupe à gauche

2. Input : `bg-slate-800 border border-slate-700 rounded-lg pl-12`

3. Debounce 300ms

4. Props : value, onChange, placeholder

5. Le composant est exporté et documenté

## Tasks / Subtasks

- [x] Task 1: Créer SearchBar.tsx (AC: 1, 2, 4)
  - [x] Créer `src/components/design-system/SearchBar.tsx`
  - [x] Icône loupe (lucide-react Search)
  - [x] Props: value, onChange, placeholder
- [x] Task 2: Debounce (AC: 3)
  - [x] useDebouncedCallback ou équivalent 300ms
- [x] Task 3: Export et tests (AC: 5)
- [x] Task 4: Design System showcase (Story 14-1b)
  - [x] Ajouter section SearchBar dans DesignSystemShowcase avec démo interactive (debounce)

## Dev Notes

- **Source:** design-system-convergence.md section 4.7
- **Fichier:** `src/components/design-system/SearchBar.tsx`
- Référence: screens Frame 3, Frame 7
- Story 10.2/10.3: debounce 300ms déjà utilisé sur Tournaments/Leagues

### References

- [Source: _bmad-output/planning-artifacts/design-system-convergence.md#4.7]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- SearchBar créé avec icône Search (lucide-react), input bg-slate-800 border-slate-700 rounded-lg pl-12
- Debounce 300ms via useEffect + setTimeout (pattern cohérent avec Tournaments/Leagues)
- 8 tests unitaires SearchBar + 1 test DesignSystemShowcase
- Section SearchBar dans DesignSystemShowcase avec démo interactive (affichage valeur débouncée)
- Code review 2026-02-13: 2 MEDIUM corrigés (onChangeRef pour stabilité, test clear input), 2 LOW (JSDoc @param, autocomplete="off")

### File List

- src/components/design-system/SearchBar.tsx (new)
- src/components/design-system/index.ts (modified — export SearchBar)
- src/pages/DesignSystemShowcase.tsx (modified — SearchBarShowcase)
- tests/unit/components/design-system/SearchBar.test.tsx (new)
- tests/unit/pages/DesignSystemShowcase.test.tsx (modified — test SearchBar)

## Senior Developer Review (AI)

**Date:** 2026-02-13  
**Outcome:** Approve (after fixes)

**Findings addressed:**
- [MEDIUM] onChange in effect deps → fixed with onChangeRef
- [MEDIUM] Missing test for clear input → added test
- [LOW] JSDoc @param → added
- [LOW] autocomplete="off" → added

**Remaining (out of scope):** SearchBar non utilisé dans Tournaments/Leagues — prévu pour Story 14-12.

## Change Log

- 2026-02-13: Implémentation complète du composant SearchBar (Story 14-8). Composant avec icône loupe, debounce 300ms, export, tests, DesignSystemShowcase.
- 2026-02-13: Code review — corrections: onChangeRef pour éviter re-runs effet, test clear input, JSDoc @param, autocomplete="off".
