# Story 14.8: Composant SearchBar

Status: ready-for-dev

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

- [ ] Task 1: Créer SearchBar.tsx (AC: 1, 2, 4)
  - [ ] Créer `src/components/design-system/SearchBar.tsx`
  - [ ] Icône loupe (lucide-react Search)
  - [ ] Props: value, onChange, placeholder
- [ ] Task 2: Debounce (AC: 3)
  - [ ] useDebouncedCallback ou équivalent 300ms
- [ ] Task 3: Export et tests (AC: 5)
- [ ] Task 4: Design System showcase (Story 14-1b)
  - [ ] Ajouter section SearchBar dans DesignSystemShowcase avec démo interactive (debounce)

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

### File List
