---
name: e2e-test
description: Write, debug, or maintain Vitest unit tests and Playwright E2E tests for this project. Use when adding a feature that needs test coverage, debugging a failing test, or refactoring tests.
---

# Tests — Beer Pong League

## Stack

- **Unit / intégration** : Vitest + React Testing Library + happy-dom
- **E2E** : Playwright (Chromium, Firefox, WebKit, mobile Pixel 5 / iPhone 12)

Configs :
- `vitest.config.ts` — alias `@` → `./src`, coverage v8
- `playwright.config.ts` — baseURL `http://localhost:5173`, autostart `npm run dev`
- Mock Supabase : `tests/__mocks__/supabase.ts`
- Setup : `tests/setup/vitest.setup.ts`

## Conventions Vitest

```tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

describe('ComponentName', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should ...', () => {
    render(<Component />);
    expect(screen.getByRole('button', { name: /go/i })).toBeInTheDocument();
  });
});
```

- Prioriser `getByRole` > `getByText` > `getByTestId`.
- `fireEvent` pour interactions simples, `userEvent` si workflow complexe.
- Mock Supabase via le fichier mock partagé — pas de mock inline répétitif.

## Conventions Playwright

- Fichiers : `tests/e2e/*.spec.ts`
- **Pas de `page.waitForTimeout`** — utiliser `expect(...).toBeVisible()` qui retry.
- **Sélecteurs** : `data-testid` d'abord, `getByRole` / `getByLabel` ensuite.
- Anonymous journey : créer un tournoi sans auth, vérifier persistance localStorage.
- Auth journey : mock OTP si possible (sinon, Mailhog / Inbucket local).

## Lancer les tests

```bash
npm run test                    # Vitest watch
npm run test -- --run           # Vitest one-shot
npm run test:coverage           # coverage
npm run test:e2e                # Playwright
npm run test:e2e -- --ui        # mode UI
npm run test:e2e -- --headed    # voir le navigateur
```

## Debug Playwright

```bash
npm run test:e2e -- --debug
# ou lancer un seul test
npx playwright test tests/e2e/anonymous-flow.spec.ts --headed
```

Traces disponibles après échec : `playwright-report/` + `test-results/`.

## Checklist nouvelle feature

- [ ] Test unitaire du composant principal
- [ ] Test du service / util si logique métier (ex. ELO)
- [ ] Test E2E du happy path si user-facing
- [ ] CI : vérifier que les tests tournent localement avec `--run` avant de push
