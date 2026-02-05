# 📋 Plan de Test - EPIC 2: Identity & Authentication

**Date de création:** 27 janvier 2026  
**Statut:** ✅ Plan complet créé

---

## 🎯 Vue d'Ensemble

Ce document résume le plan de test complet créé pour valider l'EPIC 2 (User Identity & Authentication) du projet Beer Pong League.

### Objectifs

✅ Valider le système d'identité dual (authentifié/anonyme)  
✅ Tester tous les flux d'authentification  
✅ Vérifier le merge d'identité  
✅ Assurer la sécurité et la performance  
✅ Automatiser au maximum les tests critiques

---

## 📊 Statistiques Globales

| Type de Test | Nombre | Statut | Priorité |
|-------------|--------|--------|----------|
| **Tests Unitaires** | 47 | ✅ 100% passent | Critique |
| **Tests d'Intégration** | 18 | 🔲 Créés, à exécuter | Importante |
| **Tests E2E** | 25 | 🔲 Créés, à exécuter | Importante |
| **Tests Manuels** | 25+ | 📋 Guide créé | Souhaitable |
| **Tests Sécurité** | 8+ | 📋 Checklist créée | Critique |
| **TOTAL** | **120+** | **Mix** | **-** |

---

## 📁 Fichiers Créés

### Tests Automatisés

#### Tests d'Intégration ✅
1. **`tests/integration/auth-flow.test.ts`** (8 tests)
   - Flux OTP complet avec création de profil
   - Callback d'authentification avec profil existant
   - Persistance de session après refresh
   - Sign out et gestion des erreurs

2. **`tests/integration/identity-merge.test.ts`** (10 tests)
   - Merge complet anonyme → authentifié
   - Migration de league_players, tournament_players, matches
   - Gestion des conflits (utilisateur déjà dans une ligue)
   - Migration des arrays de player IDs dans les matches
   - Gestion des erreurs de merge

#### Tests E2E ✅
3. **`tests/e2e/anonymous-user-journey.spec.ts`** (7 tests)
   - Création d'utilisateur anonyme au premier lancement
   - Création de tournoi en tant qu'anonyme
   - Persistance après refresh
   - Join de tournoi via QR
   - Mode offline/online
   - Enregistrement de matches

4. **`tests/e2e/authentication-journey.spec.ts`** (10 tests)
   - Ouverture du modal d'authentification
   - Validation du format email
   - Requête OTP avec états de chargement
   - Gestion des erreurs réseau
   - Fermeture du modal
   - Flux complet magic link (skip, nécessite setup)

5. **`tests/e2e/identity-merge-journey.spec.ts`** (8 tests)
   - Merge de données anonymes après authentification
   - Maintien de l'historique de matches
   - Migration de participations aux ligues
   - Préservation du device fingerprint
   - Isolation des données entre utilisateurs
   - Mode offline pendant le merge

### Configuration ✅

6. **`playwright.config.ts`**
   - Configuration complète Playwright
   - Support multi-navigateurs (Chromium, Firefox, WebKit)
   - Support mobile (Pixel 5, iPhone 12)
   - WebServer auto-start
   - Traces et screenshots automatiques

### Documentation ✅

7. **`tests/README.md`**
   - Guide complet d'utilisation des tests
   - Instructions d'installation
   - Commandes pour exécuter chaque type de test
   - Structure du projet de tests
   - FAQ et troubleshooting
   - Statut actuel de tous les tests

8. **`tests/MANUAL_TESTING_GUIDE.md`** (25+ scénarios)
   - **Groupe 1:** Tests utilisateur anonyme (5 tests)
   - **Groupe 2:** Tests authentification (6 tests)
   - **Groupe 3:** Tests merge d'identité (4 tests)
   - **Groupe 4:** Tests multi-device (3 tests)
   - **Groupe 5:** Tests réseau & performance (3 tests)
   - **Groupe 6:** Tests sécurité (3 tests)
   - Checklist finale complète
   - Template de rapport de bugs

9. **`package.json`** (Scripts ajoutés)
   ```json
   "test:unit": "vitest run tests/unit"
   "test:integration": "vitest run tests/integration"
   "test:e2e": "playwright test"
   "test:e2e:ui": "playwright test --ui"
   "test:e2e:debug": "playwright test --debug"
   "test:all": "npm run test:unit && npm run test:integration && npm run test:e2e"
   ```

---

## 🚀 Prochaines Étapes Recommandées

### Phase 1 - CRITIQUE (À faire immédiatement) 🔴

1. **Installation de Playwright**
   ```bash
   npm install -D @playwright/test
   npx playwright install
   ```

2. **Exécuter les tests d'intégration**
   ```bash
   npm run test:integration
   ```

3. **Tests manuels critiques** (voir guide)
   - [ ] Test 2.3: Envoi de l'OTP
   - [ ] Test 2.4: Callback d'authentification
   - [ ] Test 3.1: Merge simple anonyme → authentifié
   - [ ] Test 6.1: RLS Policies Supabase

### Phase 2 - IMPORTANT (Cette semaine) 🟡

4. **Exécuter les tests E2E**
   ```bash
   npm run test:e2e
   ```

5. **Tests manuels approfondis**
   - [ ] Groupe 1: Utilisateur anonyme (tous)
   - [ ] Groupe 2: Authentification (tous)
   - [ ] Groupe 3: Merge d'identité (tous)

6. **Fixer les bugs trouvés**

### Phase 3 - SOUHAITABLE (Avant production) 🟢

7. **Tests multi-device complets**
   - [ ] Test 4.1, 4.2, 4.3

8. **Tests performance**
   - [ ] Test 5.1, 5.2, 5.3

9. **Tests sécurité approfondis**
   - [ ] Test 6.1, 6.2, 6.3

10. **Setup CI/CD**
    - Créer `.github/workflows/test.yml`
    - Exécuter tests automatiquement sur PR
    - Bloquer merge si tests échouent

---

## 📈 Métriques de Succès

Pour considérer EPIC 2 comme **complètement validé:**

| Critère | Objectif | Statut Actuel |
|---------|----------|---------------|
| Tests Unitaires | 100% passent | ✅ **47/47** |
| Tests d'Intégration | 90%+ passent | 🔲 0/18 |
| Tests E2E | 80%+ passent | 🔲 0/25 |
| Tests Manuels | Checklist 100% | 🔲 0/25+ |
| Couverture Code | >80% identity/auth | 🔲 À mesurer |
| Performance | Toutes métriques OK | 🔲 À mesurer |
| Sécurité | 100% vérifications OK | 🔲 0/8 |

---

## 🎯 Coverage Attendue

### Tests Unitaires ✅ (Déjà couverts)

```
AuthModal.tsx           ✅ 9 tests
AuthService.ts          ✅ 15 tests
useAuth.ts              ✅ 7 tests
AnonymousUserService.ts ✅ 9 tests
deviceFingerprint.ts    ✅ 7 tests
```

### Tests d'Intégration 🔲 (À exécuter)

```
Auth Flow               🔲 8 scénarios
Identity Merge          🔲 10 scénarios
```

### Tests E2E 🔲 (À exécuter)

```
Anonymous Journey       🔲 7 scénarios
Authentication Journey  🔲 10 scénarios
Identity Merge Journey  🔲 8 scénarios
```

---

## 🐛 Processus de Reporting de Bugs

Si vous trouvez un bug pendant les tests:

1. **Créer une issue GitHub** (recommandé)
2. **Ou remplir le template** dans le guide manuel:
   - Numéro de test
   - Étape où le bug survient
   - Comportement attendu vs observé
   - Captures d'écran
   - Erreurs console
   - Navigateur/Device

3. **Priorité:**
   - 🔴 **P0 (Bloquant):** Empêche l'authentification ou le merge
   - 🟡 **P1 (Majeur):** Perte de données ou erreur critique
   - 🟢 **P2 (Mineur):** UX dégradée mais fonctionnel
   - ⚪ **P3 (Nice-to-have):** Cosmétique

---

## 💡 Conseils pour les Tests

### Tests d'Intégration
- Mock Supabase mais teste l'interaction entre services
- Vérifie les side-effects (localStorage, state updates)
- Teste les scénarios d'erreur

### Tests E2E
- Utilise des sélecteurs stables (`data-testid`)
- Attend les états asynchrones (`waitFor`, `waitForLoadState`)
- Teste dans plusieurs navigateurs
- Prends des screenshots sur échec

### Tests Manuels
- Utilise la navigation privée pour simuler nouveaux utilisateurs
- Teste sur device réel (mobile + desktop)
- Note TOUS les détails (même mineurs)
- Vérifie Supabase Dashboard pour valider les données

---

## 📞 Support

**Questions sur les tests?**
- Voir `tests/README.md` pour la doc complète
- Voir `tests/MANUAL_TESTING_GUIDE.md` pour les tests manuels
- Contacter l'équipe dev

**Problèmes d'installation?**
```bash
# Reset complet
rm -rf node_modules package-lock.json
npm install
npx playwright install
```

---

## ✅ Validation Finale

Une fois TOUS les tests complétés et passés:

- [ ] 47 tests unitaires passent ✅
- [ ] 18 tests d'intégration passent
- [ ] 20+ tests E2E passent (80%+)
- [ ] 25+ tests manuels complétés
- [ ] 8 vérifications sécurité OK
- [ ] Couverture code >80%
- [ ] Performance: chargement <2s
- [ ] Aucun bug P0 ou P1 ouvert
- [ ] Documentation à jour

**🎉 EPIC 2 peut être considérée comme Production-Ready! 🎉**

---

**Créé le:** 27 janvier 2026  
**Version:** 1.0  
**Maintenu par:** Équipe Beer Pong League
