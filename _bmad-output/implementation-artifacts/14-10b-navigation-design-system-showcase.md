# Story 14.10b: Navigation dans le Design System (showcase)

Status: ready-for-dev

## Story

As a developer,
I want les composants de navigation (BottomTabMenu, BottomMenuSpecific) documentés et visibles dans le Design System showcase,
So que la navigation soit une partie officielle du design system et que je puisse la visualiser et la valider.

## Acceptance Criteria

1. **Given** la page Design System (`/design-system`)
   **When** j'accède à la section Navigation
   **Then** une section "Navigation" affiche BottomTabMenu et BottomMenuSpecific

2. **BottomTabMenu** : prévisualisation dans un cadre type mobile (ou zone dédiée) avec les 5 onglets (Accueil, Rejoindre, Tournois, Leagues, Profil)

3. Les états actif/inactif sont démontrés (ex. onglet actif avec couleur primaire)

4. **BottomMenuSpecific** : démo avec 1 ou 2 actions (ex. Scanner QR, Créer un tournoi)

5. **BottomTabMenu aligné** sur design-system-convergence section 2.1 :
   - Icône Leagues : Medal (pas Users)
   - Hauteur min 64px, touch target 48px+
   - État actif : couleur primaire / gradient

6. Les composants restent dans `src/components/navigation/` (pas de duplication dans design-system/)

## Tasks / Subtasks

- [ ] Task 1: Aligner BottomTabMenu avec design-system-convergence (AC: 5)
  - [ ] Remplacer icône Users par Medal pour l'onglet Leagues
  - [ ] Vérifier hauteur 64px min, touch target 48px+
  - [ ] Vérifier état actif (couleur primaire / gradient-tab-active)
- [ ] Task 2: Section Navigation dans DesignSystemShowcase (AC: 1, 2, 3, 4)
  - [ ] Ajouter section "3. Navigation" après la section Composants
  - [ ] Sous-section BottomTabMenu : prévisualisation avec MemoryRouter ou iframe
  - [ ] Cadre type mobile (ex. max-w-sm, border, hauteur simulée) pour montrer le rendu
  - [ ] Sous-section BottomMenuSpecific : démo avec actions (Scanner QR, Créer tournoi)
- [ ] Task 3: Tests (AC: 1)
  - [ ] Test : section Navigation présente dans DesignSystemShowcase
  - [ ] Test : BottomTabMenu et BottomMenuSpecific rendus dans la section

## Dev Notes

- **Source:** design-system-convergence.md sections 2.1, 2.2
- **Fichiers:** `src/pages/DesignSystemShowcase.tsx`, `src/components/navigation/BottomTabMenu.tsx`
- **Prévisualisation:** La page /design-system masque la bottom nav (AC 7 de 14.1b). Pour la démo, utiliser une zone de prévisualisation isolée (div avec hauteur fixe, MemoryRouter avec routes mock) — pas d'affichage global en bas de page.
- **MemoryRouter:** Envelopper la prévisualisation dans `<MemoryRouter initialEntries={['/']}>` pour que BottomTabMenu fonctionne avec useLocation/useNavigate.

### References

- [Source: _bmad-output/planning-artifacts/design-system-convergence.md#2.1]
- [Source: _bmad-output/planning-artifacts/design-system-convergence.md#2.2]
- [Source: Story 14-1b — Design System showcase]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
