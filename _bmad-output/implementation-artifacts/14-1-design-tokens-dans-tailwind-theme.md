# Story 14.1: Design tokens dans Tailwind / thème

Status: done

## Story

As a developer,
I want design tokens centralisés (couleurs, typo, radius, espacements),
So that l'application a une base visuelle cohérente et facile à maintenir.

## Acceptance Criteria

1. **Given** le design system (design-system-convergence.md section 3)
   **When** j'implémente les tokens
   **Then** les couleurs sont définies (fond slate-900/800/700, texte, accents primaire/succès/erreur/ELO)

2. Les gradients sont définis (CTA, FAB, onglet actif)

3. La typographie est définie (titres page, section, corps, labels, stats)

4. Les espacements sont définis (padding page, gap cartes, margin bottom nav)

5. Les radius et bordures sont définis (cartes, boutons, inputs)

6. Les tokens sont dans `tailwind.config.js` ou fichier thème dédié

7. Les tokens sont utilisables via classes Tailwind existantes ou variables CSS

## Tasks / Subtasks

- [x] Task 1: Couleurs (AC: 1)
  - [x] Définir fonds: slate-900, slate-800, slate-700
  - [x] Définir texte: white, slate-300, slate-400, slate-500
  - [x] Définir accents: primaire, succès, erreur, ELO, info
  - [x] Définir sémantique: statut actif, terminé, delta ELO
- [x] Task 2: Gradients (AC: 2)
  - [x] CTA principal: amber→yellow ou blue→violet
  - [x] FAB / boutons: blue-500→violet-600
  - [x] Onglet actif
- [x] Task 3: Typographie (AC: 3)
  - [x] Titres page: text-xl/2xl, font-bold
  - [x] Titres section: text-lg font-bold
  - [x] Corps, labels, stats
- [x] Task 4: Espacements (AC: 4)
  - [x] Padding page: p-4, p-6
  - [x] Gap cartes: gap-4, gap-6
  - [x] Margin bottom nav: pb-20, pb-24
- [x] Task 5: Radius et bordures (AC: 5)
  - [x] rounded-xl, rounded-lg
  - [x] border-slate-700
- [x] Task 6: Intégration Tailwind (AC: 6, 7)
  - [x] Mettre à jour tailwind.config.js
  - [x] Vérifier cohérence avec screens Frame 1–11

## Dev Notes

- **Source:** `_bmad-output/planning-artifacts/design-system-convergence.md` sections 3.1 à 3.6
- Vérifier `tailwind.config.js` existant pour extensions (theme.extend)
- Projet: Vite + React + Tailwind CSS
- Ne pas casser les styles existants — migration progressive

### Project Structure Notes

- `tailwind.config.js` à la racine
- Optionnel: `src/styles/design-tokens.css` pour variables CSS si besoin

### References

- [Source: _bmad-output/planning-artifacts/design-system-convergence.md#3]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md]

## Dev Agent Record

### Agent Model Used

Composer (dev-story workflow)

### Debug Log References

### Completion Notes List

- Design tokens centralisés dans `tailwind.config.js` (theme.extend)
- Couleurs: background (primary/secondary/tertiary), text (primary/secondary/tertiary/muted), accents (primary, success, error, elo, info), sémantique (status-active, status-finished, delta-positive/negative)
- Gradients: gradient-cta, gradient-cta-alt, gradient-fab, gradient-tab-active
- Typographie: page-title, section-title, body, label, stat
- Espacements: page, page-lg, card-gap, bottom-nav, bottom-nav-lg
- Radius: card (rounded-xl), button (rounded-lg), input (rounded-xl)
- Bordures: border-card, border-card-muted
- Screens: sm/md/lg/xl alignés avec Frame 1–11
- Variables CSS dans `src/styles/design-tokens.css` pour usage optionnel
- primary conservé en amber pour migration progressive (compatibilité existante)
- 9 tests unitaires validant la structure du thème

### File List

- tailwind.config.js (modified)
- src/styles/design-tokens.css (new)
- src/index.css (modified — import design-tokens.css)
- tests/unit/config/tailwind-design-tokens.test.ts (new)

## Senior Developer Review (AI)

**Date:** 2026-02-13  
**Outcome:** Changes Requested → Fixed  
**Reviewer:** Adversarial Code Review

### Summary

- **Git vs Story:** File List cohérent avec les changements (tailwind.config.js, design-tokens.css, index.css, tests)
- **ACs:** Tous implémentés
- **Tasks:** Tous réalisés

### Action Items (résolus automatiquement)

- [x] **[HIGH]** Typographie: `page-title` et `page-title-lg` étaient identiques (1.5rem). Spec: text-xl mobile = 1.25rem, text-2xl desktop = 1.5rem. Corrigé: page-title = 1.25rem [tailwind.config.js]
- [x] **[MEDIUM]** design-tokens.css: variables de gradient manquantes pour parité avec Tailwind. Ajout de --gradient-cta et --gradient-fab [src/styles/design-tokens.css]
- [x] **[MEDIUM]** Tests: ajout d’assertions sur les tailles typo (page-title 1.25rem, page-title-lg 1.5rem) [tests/unit/config/tailwind-design-tokens.test.ts]

### Code Review (AI) - 2026-02-13 (Batch)

#### ✅ FIXED: design-tokens.css gradient parity (MEDIUM)
**Issue:** --gradient-cta-alt and --gradient-tab-active missing from CSS variables.  
**Fix:** Added both variables to design-tokens.css.  
**File:** `src/styles/design-tokens.css`

### Action Items (reste — LOW)

- [ ] [AI-Review][LOW] Aucun composant n’utilise encore les nouveaux tokens (bg-background-primary, text-text-primary, etc.). Migration progressive prévue — documenter l’usage dans les Dev Notes ou un README design-tokens.
- [ ] [AI-Review][LOW] Tests ne valident pas la sortie CSS réelle (computed styles). Les tests vérifient uniquement la structure du config. Optionnel: test d’intégration avec rendu DOM.

### Review Notes

- Tokens bien structurés, alignés avec design-system-convergence.md
- primary conservé en amber pour compatibilité — choix pertinent
- 9 tests unitaires passent

---

## Change Log

- 2026-02-13: Implémentation complète des design tokens (Story 14-1). Tokens dans tailwind.config.js + design-tokens.css. Tests unitaires ajoutés.
- 2026-02-13: Code review — 3 issues corrigés (typographie page-title, gradients CSS, tests typo). 2 items LOW restants (doc usage, test CSS output).
