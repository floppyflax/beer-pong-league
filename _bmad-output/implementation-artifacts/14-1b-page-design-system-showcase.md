# Story 14.1b: Page Design System (showcase)

Status: done

## Story

As a developer,
I want une page Design System qui affiche les tokens et permet de tester les composants atomiques,
So que je puisse visualiser et valider les fondations (couleurs, typo, gradients, etc.) et chaque composant au fur et à mesure de leur création.

## Acceptance Criteria

1. **Given** la route `/design-system`
   **When** j'accède à cette page
   **Then** une page showcase s'affiche avec le fond et typographie du design system

2. **Section Design Tokens** (Story 14-1) — en tête de page :
   - **Couleurs** : swatches pour background (primary/secondary/tertiary), text (primary/secondary/tertiary/muted), accents (primary, success, error, elo, info), sémantique (status-active, status-finished, delta-positive/negative)
   - **Gradients** : barres ou carrés pour gradient-cta, gradient-cta-alt, gradient-fab, gradient-tab-active
   - **Typographie** : exemples pour page-title, section-title, body, label, stat
   - **Espacements** : exemples visuels (page, card-gap, bottom-nav)
   - **Radius** : exemples pour card, button, input
   - **Bordures** : exemples pour border-card, border-card-muted

3. **Section Composants** : StatCard, SegmentedTabs, ListRow, InfoCard, FAB, Banner, SearchBar, Navigation (BottomTabMenu, BottomMenuSpecific — ajouté par Story 14.10b)

4. Chaque section composant affiche le composant s'il existe, ou un placeholder "À venir" avec le nom du composant

5. Les sections permettent de tester les variantes (ex. StatCard primary/success/accent, Banner success/error)

6. La page est accessible en dev via le DevPanel ou un lien direct

7. La bottom nav est masquée sur cette page (page outil dev)

## Tasks / Subtasks

- [x] Task 1: Créer la page et la route (AC: 1, 6, 7)
  - [x] Créer `src/pages/DesignSystemShowcase.tsx`
  - [x] Ajouter route `/design-system` dans App.tsx
  - [x] Exclure `/design-system` de `shouldShowBottomMenu`
  - [x] Ajouter lien "Design System" dans DevPanel
- [x] Task 2: Section Design Tokens (AC: 2)
  - [x] Sous-section Couleurs : grille de swatches avec noms (bg-background-primary, text-text-primary, etc.)
  - [x] Sous-section Gradients : barres colorées (gradient-cta, gradient-fab, etc.)
  - [x] Sous-section Typographie : exemples text-page-title, text-section-title, text-body, text-label, text-stat
  - [x] Sous-section Espacements : blocs avec p-page, gap-card, etc.
  - [x] Sous-section Radius : carrés/cartes avec rounded-card, rounded-button, rounded-input
  - [x] Sous-section Bordures : exemples border-card, border-card-muted
- [x] Task 3: Structure des sections composants (AC: 3, 4)
  - [x] Sections avec titres (h2) pour StatCard, SegmentedTabs, ListRow, InfoCard, FAB, Banner, SearchBar
  - [x] Placeholder "À venir" pour composants non encore implémentés
  - [x] Import conditionnel ou barrel pour éviter erreurs si composant absent
- [x] Task 4: Intégration progressive (AC: 5)
  - [x] Chaque story 14-2 à 14-8 ajoutera sa démo dans la section correspondante

## Dev Notes

- **Fichier:** `src/pages/DesignSystemShowcase.tsx`
- **Route:** `/design-system`
- **Accès:** Lien dans DevPanel (visible uniquement en `import.meta.env.DEV`)
- **Structure:** Page scrollable, sections avec `space-y-8`, titre page "Design System — Beer Pong League"
- **Section Tokens (Story 14-1):** Les tokens sont déjà implémentés dans `tailwind.config.js` et `src/styles/design-tokens.css`. La showcase les affiche visuellement pour validation.
- **Placeholder:** Composant non créé → afficher `<div className="p-4 bg-slate-800 rounded-xl border border-dashed border-slate-600 text-slate-400">StatCard — À venir</div>`
- **Import dynamique:** Utiliser des imports directs ; si le composant n'existe pas encore, le fichier DesignSystemShowcase peut importer depuis un barrel qui n'exporte que les composants existants, ou utiliser des blocs conditionnels par composant

### Stratégie d'intégration progressive

Option A (recommandée) : La page importe tous les composants du barrel `design-system/index.ts`. Au début, le barrel n'exporte rien (ou seulement ce qui existe). Chaque story 14-2 à 14-8 :

1. Crée son composant
2. L'exporte depuis le barrel
3. Ajoute une section démo dans DesignSystemShowcase

Option B : La page utilise des sous-composants `DesignSystemShowcase/StatCardSection.tsx` etc., créés au fur et à mesure. Plus modulaire mais plus de fichiers.

**Recommandation :** Option A — une seule page avec des sections inline, mises à jour par chaque story composant.

### Project Structure Notes

- `src/pages/DesignSystemShowcase.tsx`
- Mise à jour : `src/App.tsx`, `src/components/DevPanel.tsx`, `src/utils/navigationHelpers.ts`

### References

- [Source: _bmad-output/planning-artifacts/design-system-convergence.md]
- [Source: Story 14-1 — design tokens (tailwind.config.js, design-tokens.css)]
- [Source: Stories 14-2 à 14-8 — composants à showcase]

## Dev Agent Record

### Agent Model Used

Composer (dev-story workflow)

### Debug Log References

### Completion Notes List

- Page DesignSystemShowcase créée avec section Design Tokens (couleurs, gradients, typographie, espacements, radius, bordures) et sections composants avec placeholders
- Route /design-system ajoutée dans App.tsx (lazy-loaded)
- Lien "Design System" ajouté dans DevPanel (visible en mode dev)
- /design-system exclu de shouldShowBottomMenu dans navigationHelpers.ts
- 14 tests unitaires DesignSystemShowcase + 1 test navigationHelpers pour /design-system
- **Code review (2026-02-13):** 5 issues corrigés — imports @/ alias, token mb-bottom-nav, suppression ComponentPlaceholder mort, démo Banner position=top, tests InfoCard/FAB/Banner

### Senior Developer Review (AI)

**Reviewer:** floppyflax on 2026-02-13  
**Outcome:** Approve (after fixes)

**Findings addressed:**
1. Imports harmonisés sur alias `@/` (project-context)
2. Magic number remplacé par token `mb-bottom-nav`
3. Suppression `ComponentPlaceholder` (code mort)
4. Démo Banner `position="top"` ajoutée
5. Tests InfoCard, FAB, Banner renforcés

### File List

- src/pages/DesignSystemShowcase.tsx (new)
- src/App.tsx (modified)
- src/components/DevPanel.tsx (modified)
- src/utils/navigationHelpers.ts (modified)
- tests/unit/pages/DesignSystemShowcase.test.tsx (new)
- tests/unit/utils/navigationHelpers.test.ts (modified)

## Code Review (AI) - 2026-02-13 (Batch 10-1, 10-3, 10-4, 14-1, 14-1b)

### Fixes Applied

- **[14-1b]** Banner test: Added assertion for Banner component (success, error, dismissable)
- **[14-1b]** BannerShowcase: Dismissable demo now uses useState — clicking X hides the banner
- **[14-1b]** Padding: Changed pb-24 to pb-8 (bottom nav hidden on /design-system)

### File List (Code Review)

- src/pages/DesignSystemShowcase.tsx (modified — BannerShowcase, pb-8)
- tests/unit/pages/DesignSystemShowcase.test.tsx (modified — Banner test)

## Change Log

- 2026-02-13: Implémentation complète Story 14-1b — Page Design System (showcase) avec tokens et placeholders composants
- 2026-02-13: Code review batch — Banner test, BannerShowcase dismiss demo, pb-8
- 2026-02-13: Code review — 5 corrections (imports @/, token bottom-nav, dead code, Banner position top, tests)
