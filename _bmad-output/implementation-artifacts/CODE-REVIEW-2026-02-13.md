# Code Review — Stories 10-1, 10-3, 10-4, 14-1

**Date:** 2026-02-13  
**Reviewer:** Adversarial Code Review Workflow  
**Stories:** 10-1 (Home), 10-3 (Leagues), 10-4 (Join), 14-1 (Design Tokens)

---

## Summary

| Story | Issues Found | Critical | High | Medium | Low |
|-------|--------------|----------|------|--------|-----|
| 10-1 | 2 | 1 | 1 | 0 | 0 |
| 10-3 | 2 | 1 | 1 | 0 | 0 |
| 10-4 | 2 | 1 | 1 | 0 | 0 |
| 14-1 | 1 | 0 | 0 | 0 | 1 |

**Total:** 7 issues (3 CRITICAL, 3 HIGH, 1 LOW)

---

## Story 10-1: Home Page Connected

### CRITICAL #1: userId undefined — Home ne charge jamais les données
**File:** `src/pages/Home.tsx:15`  
**Issue:** `const { userId } = useIdentity()` — useIdentity ne retourne PAS `userId`. Il retourne `localUser`, `createIdentity`, etc. Donc `userId` est toujours `undefined`, et `useHomeData(userId)` ne fetch jamais (enabled: !!userId).  
**Impact:** La page Home affiche toujours l'état vide ou loading pour tous les utilisateurs.  
**Fix:** Utiliser `user?.id` (useAuth) pour les authentifiés et `localUser?.anonymousUserId` (useIdentity) pour les anonymes, comme dans LeagueContext.

### HIGH #2: LastLeagueCard EmptyCard — pas de vérification premium
**File:** `src/components/home/LastLeagueCard.tsx:26-42`  
**Issue:** AC3 dit "Créer une league → check premium limit". L'EmptyCard navigue directement vers `/create-league` sans vérifier la limite premium.  
**Impact:** Un utilisateur free avec 1 league peut cliquer et créer une 2e league (le formulaire gère la limite, mais l'UX devrait être cohérente).  
**Fix:** Passer le check premium au parent et afficher le bouton avec lock si à la limite, ou ouvrir le modal premium.

---

## Story 10-3: Leagues List Page

### CRITICAL #3: LeagueCard — anonymousUser n'existe pas
**File:** `src/components/leagues/LeagueCard.tsx:29`  
**Issue:** `const { anonymousUser } = useIdentity()` — useIdentity retourne `localUser`, pas `anonymousUser`.  
**Impact:** Le badge "Propriétaire" ne s'affiche jamais pour les utilisateurs anonymes créateurs.  
**Fix:** Remplacer par `const { localUser } = useIdentity()` et comparer `localUser?.anonymousUserId === league.creator_anonymous_user_id`.

### HIGH #4: Status badge "Active" — incohérence design system
**File:** `src/components/leagues/LeagueCard.tsx:63-66`  
**Issue:** Le badge "Active" utilise `bg-green-500/20 text-green-400`. Le design-system-convergence.md section 3.1 indique "Statut actif: bg-amber-500/20 text-amber-500" (primary).  
**Fix:** Utiliser `bg-primary/20 text-primary` ou `bg-status-active/20 text-status-active` pour cohérence.

---

## Story 10-4: Join Page QR Scanner

### CRITICAL #5: useJoinTournament — initializeAnonymousUser n'existe pas
**File:** `src/hooks/useJoinTournament.ts:18,75`  
**Issue:** `const { localUser, initializeAnonymousUser } = useIdentity()` — useIdentity ne fournit pas `initializeAnonymousUser`.  
**Impact:** Erreur runtime quand un utilisateur anonyme rejoint un tournoi : "initializeAnonymousUser is not a function".  
**Fix:** Utiliser `createIdentity('Joueur')` ou équivalent pour initialiser l'identité anonyme, ou ajouter `initializeAnonymousUser` au hook useIdentity.

### HIGH #6: AC1 Header title — "Rejoindre" vs "Rejoindre un Tournoi"
**File:** `src/pages/Join.tsx:56`  
**Issue:** AC1 exige "Header with title 'Rejoindre un Tournoi'". Le ContextualHeader affiche "Rejoindre".  
**Fix:** Changer le titre en "Rejoindre un Tournoi".

---

## Story 14-1: Design Tokens

### LOW #7: Documentation usage tokens
**Issue:** Aucun composant n'utilise encore les tokens (bg-background-primary, etc.). Migration progressive prévue.  
**Fix:** Documenter l'usage dans les Dev Notes ou un README design-tokens (déjà noté dans Review Follow-ups).

---

## Git vs Story Discrepancies

- Les fichiers listés dans les stories correspondent aux changements git pour les stories reviewées.
- Pas de fichiers modifiés non documentés dans les File Lists des stories 10-1, 10-3, 10-4, 14-1.

---

## Corrections appliquées (2026-02-13)

| # | Story | Fix |
|---|-------|-----|
| 1 | 10-1 | Home: userId = user?.id ?? localUser?.anonymousUserId (useIdentity ne retourne pas userId) |
| 2 | 10-1 | LastLeagueCard: onEmptyAction + emptyActionLocked pour check premium (AC3) |
| 3 | 10-3 | LeagueCard: anonymousUser → localUser, compare anonymousUserId |
| 4 | 10-3 | LeagueCard: status Active → bg-primary/20 text-primary (design system) |
| 5 | 10-4 | useIdentity: ajout initializeAnonymousUser() pour useJoinTournament |
| 6 | 10-4 | Join: titre "Rejoindre un Tournoi" (AC1) |

**Fichiers modifiés:**
- src/pages/Home.tsx
- src/components/home/LastLeagueCard.tsx
- src/hooks/useIdentity.ts
- src/context/IdentityContext.tsx
- src/components/leagues/LeagueCard.tsx
- src/pages/Join.tsx
- tests/unit/components/home/LastLeagueCard.test.tsx
- tests/unit/components/leagues/LeagueCard.test.tsx
- tests/unit/pages/Home.refactored.test.tsx
