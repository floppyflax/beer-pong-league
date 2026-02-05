# Tests - Beer Pong League

Ce répertoire contient tous les tests pour le projet Beer Pong League.

## 📁 Structure

```
tests/
├── unit/                          # Tests unitaires (Vitest)
│   ├── components/                # Tests de composants React
│   ├── services/                  # Tests de services
│   ├── hooks/                     # Tests de hooks React
│   └── utils/                     # Tests de fonctions utilitaires
├── integration/                   # Tests d'intégration (Vitest)
│   ├── auth-flow.test.ts         # Flux d'authentification complet
│   └── identity-merge.test.ts    # Flux de merge d'identité
├── e2e/                           # Tests End-to-End (Playwright)
│   ├── anonymous-user-journey.spec.ts
│   ├── authentication-journey.spec.ts
│   └── identity-merge-journey.spec.ts
├── MANUAL_TESTING_GUIDE.md        # Guide de tests manuels détaillé
└── README.md                      # Ce fichier
```

---

## 🚀 Installation

### Tests Unitaires et d'Intégration (Vitest)

**Déjà installé!** Vitest est configuré dans le projet.

```bash
# Vérifier l'installation
npm list vitest
```

### Tests E2E (Playwright)

**Installation requise:**

```bash
# Installer Playwright
npm install -D @playwright/test

# Installer les navigateurs
npx playwright install

# Installer les dépendances système (si nécessaire)
npx playwright install-deps
```

---

## ▶️ Exécution des Tests

### Tests Unitaires

```bash
# Exécuter tous les tests unitaires
npm run test

# Mode watch (re-exécute les tests modifiés)
npm run test:watch

# Avec couverture de code
npm run test:coverage

# Tests unitaires spécifiques
npm run test tests/unit/components/AuthModal.test.tsx
npm run test tests/unit/services/AuthService.test.ts
```

### Tests d'Intégration

```bash
# Tous les tests d'intégration
npm run test:integration

# Test spécifique
npm run test tests/integration/auth-flow.test.ts
npm run test tests/integration/identity-merge.test.ts
```

### Tests E2E (Playwright)

```bash
# Installer Playwright (première fois uniquement)
npm install -D @playwright/test
npx playwright install

# Exécuter tous les tests E2E
npm run test:e2e

# Mode UI (interface graphique)
npm run test:e2e:ui

# Tests E2E en mode debug
npm run test:e2e:debug

# Générer un rapport HTML
npx playwright show-report

# Tests sur un navigateur spécifique
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Tous les Tests

```bash
# Exécuter TOUS les tests (unit + integration + e2e)
npm run test:all
```

---

## 📊 Statut Actuel des Tests

### ✅ Tests Unitaires (47 tests - 100% passent)

| Module | Tests | Status |
|--------|-------|--------|
| `AuthModal` | 9 | ✅ |
| `AuthService` | 15 | ✅ |
| `useAuth` | 7 | ✅ |
| `AnonymousUserService` | 9 | ✅ |
| `deviceFingerprint` | 7 | ✅ |
| **TOTAL** | **47** | **✅** |

### 🔲 Tests d'Intégration (Créés, à exécuter)

| Suite | Tests | Status |
|-------|-------|--------|
| Auth Flow | 8 | 🔲 À exécuter |
| Identity Merge | 10 | 🔲 À exécuter |
| **TOTAL** | **18** | **🔲** |

### 🔲 Tests E2E (Créés, à exécuter)

| Suite | Tests | Status |
|-------|-------|--------|
| Anonymous User Journey | 7 | 🔲 À exécuter |
| Authentication Journey | 10 | 🔲 À exécuter |
| Identity Merge Journey | 8 | 🔲 À exécuter |
| **TOTAL** | **25** | **🔲** |

### 📋 Tests Manuels

Voir le [Guide de Tests Manuels](./MANUAL_TESTING_GUIDE.md) pour 25+ scénarios de tests manuels détaillés.

---

## 🎯 Guide de Contribution

### Ajouter un Nouveau Test Unitaire

1. Créer le fichier dans `tests/unit/[category]/[name].test.ts`
2. Suivre la structure existante:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('MyComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should do something', () => {
    // Test implementation
    expect(result).toBe(expected);
  });
});
```

3. Exécuter le test: `npm run test tests/unit/[category]/[name].test.ts`

### Ajouter un Nouveau Test E2E

1. Créer le fichier dans `tests/e2e/[name].spec.ts`
2. Utiliser la structure Playwright:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should perform action', async ({ page }) => {
    await page.click('button');
    await expect(page.locator('h1')).toContainText('Result');
  });
});
```

3. Exécuter: `npm run test:e2e tests/e2e/[name].spec.ts`

---

## 🔧 Configuration

### Vitest (`vitest.config.ts`)

```typescript
export default defineConfig({
  test: {
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
  },
});
```

### Playwright (`playwright.config.ts`)

```typescript
export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:5173',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
  },
});
```

---

## 📈 Couverture de Code

Pour générer un rapport de couverture:

```bash
npm run test:coverage
```

Le rapport sera généré dans `coverage/` et peut être ouvert dans le navigateur:

```bash
open coverage/index.html
```

**Objectifs de couverture:**
- Ligne: > 80%
- Branches: > 75%
- Fonctions: > 80%
- Statements: > 80%

---

## 🐛 Debugging

### Tests Unitaires

```bash
# Mode debug avec console.log visible
npm run test -- --reporter=verbose

# Test spécifique avec logs
npm run test -- tests/unit/path/to/test.ts --reporter=verbose
```

### Tests E2E

```bash
# Mode headed (voir le navigateur)
npx playwright test --headed

# Mode debug (pause à chaque étape)
npx playwright test --debug

# Inspecter un test spécifique
npx playwright test tests/e2e/auth.spec.ts --debug
```

---

## 🚦 CI/CD

Les tests sont automatiquement exécutés dans la pipeline CI/CD sur:
- Chaque push vers une branche
- Chaque Pull Request
- Avant chaque merge vers `main`

**Configuration:** Voir `.github/workflows/test.yml` (à créer)

---

## 📚 Ressources

### Documentation
- [Vitest](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright](https://playwright.dev/)

### Best Practices
- **Arrange-Act-Assert:** Structure claire des tests
- **Isolation:** Chaque test doit être indépendant
- **Mocking:** Mock les dépendances externes (Supabase, API)
- **Descriptif:** Noms de tests clairs et explicites
- **Coverage:** Viser >80% mais privilégier la qualité à la quantité

---

## ❓ FAQ

**Q: Pourquoi mes tests unitaires échouent localement mais passent en CI?**
A: Vérifiez que vos mocks sont bien configurés et que localStorage est bien nettoyé dans `beforeEach`.

**Q: Comment tester un hook React?**
A: Utilisez `@testing-library/react-hooks` ou renderez un composant wrapper.

**Q: Les tests E2E sont lents, comment les optimiser?**
A: Utilisez `test.describe.configure({ mode: 'parallel' })` et exécutez seulement les tests nécessaires.

**Q: Comment tester Supabase localement?**
A: Utilisez `supabase start` pour lancer une instance locale, ou mockez les appels.

---

## 🎖️ Statut des Epic

### EPIC 2: User Identity & Authentication ✅

- ✅ Story 2.1: Email + OTP Authentication Flow
- ✅ Story 2.2: Anonymous User Support
- ✅ Story 2.3: Identity Merge Service
- ✅ Story 2.4: Dual Identity State Management

**Tests:** 47 tests unitaires, 18 tests d'intégration, 25 tests E2E créés

---

**Pour toute question, voir le [Guide de Tests Manuels](./MANUAL_TESTING_GUIDE.md) ou contacter l'équipe.**
