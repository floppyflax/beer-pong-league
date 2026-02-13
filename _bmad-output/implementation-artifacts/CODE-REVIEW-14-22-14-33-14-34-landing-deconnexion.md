# Code Review — Stories 14-22, 14-33, 14-34 (Landing + Déconnexion)

**Reviewer:** floppyflax (AI Adversarial)  
**Date:** 2026-02-13  
**Stories:** 14-22 (Landing overhaul), 14-33 (Landing Frame 1), 14-34 (Bouton déconnexion)  
**Git vs Story Discrepancies:** 15+ files changed, many not in story File Lists  
**Issues Found:** 1 Critical, 3 High, 5 Medium, 3 Low

---

## 🔴 CRITICAL ISSUES

### 1. Test en échec — LandingPage background (tests/unit/pages/LandingPage.test.tsx:167-173)

**Problème:** Le test `should use slate-900 background` cherche `.bg-slate-900` alors que la Landing utilise désormais `bg-slate-950` (design system mis à jour).

**Preuve:** Le test échoue avec `expect(mainContainer).toBeInTheDocument()` → `null` car `container.querySelector('.bg-slate-900')` ne trouve rien.

**Impact:** CI/CD en échec, suite de tests non fiable.

**Fichier:** `tests/unit/pages/LandingPage.test.tsx`

---

## 🟠 HIGH ISSUES

### 2. Frame 1 Hero — icône star manquante (Story 14-33)

**Problème:** La référence Frame 1 indique « Hero: Circular icon (trophy + star) ». L’implémentation n’affiche que le Trophy, pas la star.

**AC2 partiel:** « the page matches the reference layout and styling ».

**Fichier:** `src/pages/LandingPage.tsx` — Hero section (lignes 63-68)

### 3. useFullDisconnect — localStorage non testé

**Problème:** Le hook vide `bpl_leagues`, `bpl_tournaments`, `bpl_current_league_id`, `bpl_current_tournament_id` mais aucun test ne le vérifie.

**Impact:** Risque de régression si le nettoyage du cache LeagueContext est modifié.

**Fichier:** `tests/unit/hooks/useFullDisconnect.test.ts`

### 4. UserProfile — pas de test pour utilisateur anonyme seul

**Problème:** Le bouton de déconnexion doit s’afficher pour auth ET anonyme (AC 14-34). Les tests mockent `isAuthenticated: true` + `localUser`. Aucun test avec `isAuthenticated: false` et `localUser` défini (anonyme seul).

**Fichier:** `tests/unit/pages/UserProfile.test.tsx`

---

## 🟡 MEDIUM ISSUES

### 5. Git vs Story — File List incomplet

**Problème:** Plusieurs fichiers modifiés ne figurent dans aucune story :

- `tailwind.config.js`, `src/styles/design-tokens.css` (gradient-card-transparent)
- `src/components/design-system/StatCard.tsx`, `LastLeagueCard.tsx`, `LastTournamentCard.tsx`
- `src/components/leagues/LeagueCard.tsx`, `src/components/tournaments/TournamentCard.tsx`
- `src/pages/Home.tsx`, suppression de `NewUserWelcome.tsx`
- `_bmad-output/planning-artifacts/design-system-convergence.md`

**Impact:** Traçabilité réduite, difficulté à comprendre l’impact des changements.

### 6. AC3 Story 14-34 — sessionStorage « any auth-related keys »

**Problème:** L’AC indique « sessionStorage is cleared (authReturnTo and any auth-related keys) ». Seul `authReturnTo` est supprimé. Aucune recherche des autres clés liées à l’auth.

**Fichier:** `src/hooks/useFullDisconnect.ts`

### 7. LandingPage — overflow sur petits écrans

**Problème:** Avec `min-h-[568px] max-h-[932px]` et `overflow-hidden`, sur un viewport de 568px de hauteur le contenu peut déborder et être coupé (footer « Déjà membre ? »).

**AC3 14-33:** « all content fits on one screen without scrolling » — le clipping n’est pas du scroll, mais le contenu peut être invisible.

### 8. Test AC7 obsolète

**Problème:** Le test « Visual Design (AC7) » référence un AC7 absent des stories 14-22 et 14-33. Probable reliquat d’une ancienne story.

**Fichier:** `tests/unit/pages/LandingPage.test.tsx`

### 9. UserProfile — pas de test « pas de bouton sans identité »

**Problème:** Aucun test ne vérifie que le bouton de déconnexion n’apparaît pas quand `!isAuthenticated && !localUser` (cas théorique si la page est atteinte sans identité).

---

## 🟢 LOW ISSUES

### 10. LandingPage — inline style pour radial-gradient

**Problème:** Les radial-gradients du background sont en `style={{ backgroundImage: ... }}` au lieu de classes Tailwind. Moins cohérent avec le design system.

**Fichier:** `src/pages/LandingPage.tsx` (lignes 49-55)

### 11. useFullDisconnect — ordre des opérations

**Problème:** `clearIdentity()` est appelé après `signOut()`. Si `signOut()` échoue, l’identité locale est quand même effacée. À discuter selon le comportement souhaité.

### 12. Documentation design-system-convergence

**Problème:** La section 3.7 a été mise à jour mais la règle « Règle : Utiliser le gradient... » contient encore des références à l’ancienne formulation (apostrophe typographique).

---

## Résumé des actions recommandées

| #   | Sévérité | Action                                                                        |
| --- | -------- | ----------------------------------------------------------------------------- |
| 1   | CRITICAL | Corriger ou adapter le test background (slate-900 → slate-950)                |
| 2   | HIGH     | Ajouter l’icône star au Hero Frame 1                                          |
| 3   | HIGH     | Ajouter des tests pour le nettoyage localStorage dans useFullDisconnect       |
| 4   | HIGH     | Ajouter un test UserProfile pour utilisateur anonyme seul                     |
| 5   | MEDIUM   | Mettre à jour les File Lists des stories concernées                           |
| 6   | MEDIUM   | Documenter ou implémenter le nettoyage des autres clés auth en sessionStorage |
| 7   | MEDIUM   | Vérifier le comportement sur viewport 568px                                   |
| 8   | MEDIUM   | Supprimer ou adapter le test AC7 obsolète                                     |
| 9   | MEDIUM   | Ajouter un test « pas de bouton sans identité »                               |
| 10  | LOW      | Migrer les radial-gradients vers Tailwind si possible                         |
| 11  | LOW      | Revoir l’ordre signOut/clearIdentity en cas d’erreur                          |
| 12  | LOW      | Nettoyer la doc design-system-convergence                                     |

---

## Checklist de validation

- [x] Story files loaded
- [x] Git changes cross-referenced
- [x] Acceptance Criteria validated
- [x] Task completion audited
- [x] Code quality reviewed
- [x] Test quality reviewed
- [x] Issues fixed (option 1 — corrections automatiques)
- [ ] Story status updated
- [ ] Sprint status synced

## Fixes appliqués (2026-02-13)

| #   | Fix                                                                         |
| --- | --------------------------------------------------------------------------- |
| 1   | Test background: slate-900 → slate-950                                      |
| 2   | Hero: ajout icône Star (Frame 1)                                            |
| 3   | useFullDisconnect: test localStorage clearing                               |
| 4   | UserProfile: tests anonymous-only + no-identity                             |
| 5   | sessionStorage: AUTH_SESSION_KEYS extensible                                |
| 6   | Landing: responsive spacing (py-3 sm:py-4, space-y-3 sm:space-y-4), min-h-0 |
| 8   | Test AC7 renommé "Visual Design"                                            |
