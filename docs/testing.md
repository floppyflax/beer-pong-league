# Testing

Stratégie multi-niveaux : tests unitaires (Vitest), tests d'intégration (Vitest + mocks Supabase), tests end-to-end (Playwright) et un guide de tests manuels pour les flows critiques d'identité.

## Organisation

```
tests/
├── unit/                  # Vitest, mocks légers
│   ├── components/
│   ├── services/
│   ├── hooks/
│   └── utils/
├── integration/           # Vitest, scénarios multi-services
│   ├── auth-flow.test.ts
│   └── identity-merge.test.ts
├── e2e/                   # Playwright
│   ├── anonymous-user-journey.spec.ts
│   ├── authentication-journey.spec.ts
│   └── identity-merge-journey.spec.ts
├── MANUAL_TESTING_GUIDE.md
└── README.md
```

Configuration Playwright : `playwright.config.ts` à la racine (multi-navigateurs Chromium/Firefox/WebKit, mobile Pixel 5 / iPhone 12, auto-start du dev server, traces et screenshots sur échec).

## Commandes

### Unitaires (Vitest)

```bash
npm run test              # tous les tests Vitest
npm run test:unit         # uniquement tests/unit
npm run test:watch        # mode watch
npm run test:ui           # interface Vitest UI
npm run test:coverage     # avec couverture
```

### Intégration

```bash
npm run test:integration
npm run test tests/integration/auth-flow.test.ts   # test unique
```

### E2E (Playwright)

Installation (première fois) :

```bash
npm install -D @playwright/test
npx playwright install
```

Exécution :

```bash
npm run test:e2e          # headless
npm run test:e2e:ui       # mode UI interactif
npm run test:e2e:debug    # mode debug pas-à-pas
npm run test:e2e:headed   # navigateur visible
```

### Tout en un

```bash
npm run test:all          # unit + integration + e2e
```

## Couverture

### Unit tests (tests/unit)

- `components/AuthModal`, `components/ErrorBoundary`
- `services/AuthService`, `services/AnonymousUserService`
- `hooks/useAuth`
- `utils/deviceFingerprint`, `utils/elo`

### Integration (tests/integration)

- **auth-flow** : flux OTP complet avec création de profil, callback avec profil existant, persistance de session, sign out, sessions expirées, gestion d'erreurs.
- **identity-merge** : merge anonyme → authentifié, pas de doublons de profil, migration de `league_players` / `tournament_players` / `matches` / `elo_history`, migration des créateurs, erreurs.

### E2E (tests/e2e)

- **anonymous-user-journey** : création auto d'anonyme, création de tournoi anonyme, persistance au refresh, join par QR, leaderboard, mode offline, enregistrement de matchs.
- **authentication-journey** : ouverture modal, validation email, envoi OTP, états de chargement, erreurs réseau, persistance du champ email. Certains tests (flow magic link complet, profil post-auth, logout) sont marqués `skip` car nécessitent un setup email réel.
- **identity-merge-journey** : merge post-auth, historique des matchs, migration de participations, device fingerprint préservé, isolation des données, merge offline.

### Tests manuels

`tests/MANUAL_TESTING_GUIDE.md` contient 25+ scénarios organisés en 6 groupes : utilisateur anonyme, authentification, merge d'identité, multi-device, réseau/performance, sécurité. Chaque scénario liste les étapes, le résultat attendu et les vérifications Supabase.

## Conseils

- **Navigation privée** pour simuler un nouveau device.
- Tester sur device réel mobile **et** desktop.
- Vérifier le Supabase Dashboard (Auth → Users, Table editor) pour valider les side-effects.
- Pour les tests d'intégration : mocker Supabase mais tester les interactions réelles entre services.
- Pour les tests E2E : privilégier les sélecteurs `data-testid`, utiliser `waitFor` / `waitForLoadState` pour les états async.

## CI

Pas encore de workflow GitHub Actions en place. Étapes prévues :

- Lancer `npm run lint` et `npm run test:unit` sur chaque PR.
- Lancer `npm run test:integration` sur merge vers `main`.
- Lancer `npm run test:e2e` en nightly.

## Dépannage

- **Tests unitaires cassés sans raison** → `npm run test -- --clearCache`.
- **Playwright ne s'installe pas (EPERM macOS)** → `sudo chown -R $(whoami) ~/.npm` puis réinstaller.
- **E2E échouent** → vérifier que `npm run dev` tourne, l'auto-start peut prendre quelques secondes.
