# Product Context — Règles & Patterns

Règles de codage, patterns à suivre et anti-patterns à éviter pour tout contributeur (humain ou agent IA) sur Beer Pong League.

Les **invariants critiques** (non négociables) sont résumés dans `/CLAUDE.md`. Ce document détaille les conventions complètes.

> Pour l'architecture système, voir `architecture.md`. Pour la roadmap produit, voir `roadmap.md`.

---

## TypeScript

### Strict mode
- `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`, `noFallthroughCasesInSwitch: true`
- **Jamais de `any`** — utiliser `unknown` si le type est réellement inconnu
- Types explicites sur les params et returns de fonctions
- `interface` pour les shapes d'objets, `type` pour les unions/intersections
- `import type { X }` quand on importe uniquement un type

### Path aliases
- `@/components/...` au lieu de `../components/...`
- `@/services/...` au lieu de `../services/...`
- Configurés dans `tsconfig.json` + `vite.config.ts` de chaque app

---

## React

### Composants
- Fonctionnels uniquement (pas de class components)
- Named export : `export const ComponentName = (...) => {}`
- Fichier en PascalCase matchant le nom (`EmptyState.tsx`)
- Props interface : `{ComponentName}Props` (ex. `EmptyStateProps`, **pas** `IEmptyStateProps` ni `emptyStateProps`)

### Hooks
- camelCase avec préfixe `use` (`useAuth`, `useIdentity`)
- Toujours au top-level, jamais dans des conditionnels ou boucles
- `useMemo` / `useCallback` pour computations coûteuses

### State
- **Updates immutables** avec functional setState
  - ✅ `setLeagues(prev => [...prev, newLeague])`
  - ❌ `leagues.push(newLeague)`
- Global state via React Context (`AuthContext`, `IdentityContext`, `LeagueContext`) — pas de Redux/MobX
- Local state via `useState`

### Error boundaries
- Route-level components wrappés
- `react-hot-toast` pour messages utilisateur
- Jamais d'`alert()` ni `console.error()` seul comme feedback UX

---

## Supabase & Data

### Client
- Instance unique importée depuis `apps/web/src/lib/supabase.ts`
- **Toujours vérifier `isSupabaseAvailable()`** avant opération DB (fallback localStorage sinon)

### Data transformation (snake_case ↔ camelCase)
- DB → App : `created_at` → `createdAt`, `user_id` → `userId`
- App → DB : inverse
- Helpers dans `DataTransformer` (cf. `apps/web/src/services/repositories/`)

### Error handling
- `try-catch` systématique sur les async ops
- Vérifier `error` sur les responses Supabase
- Fallback `localStorage` en cas d'erreur
- `toast.error('message user-friendly')` — jamais l'erreur technique brute

### Service layer
- Classes stateless
- Singleton : `export const serviceName = new ServiceName()`
- Méthodes async, retournent des Promises
- Gestion offline via fallback localStorage

---

## Naming Conventions

### Fichiers
- Composants / Pages : **PascalCase** (`EmptyState.tsx`, `LeagueDashboard.tsx`)
- Services / Utils : **camelCase** (`databaseService.ts`, `elo.ts`)
- Types : `types.ts` (camelCase file), `Player` / `League` (PascalCase types)

### Code
- Composants : `PascalCase` (`EmptyState`, `AuthModal`)
- Fonctions : `camelCase` verbe (`createLeague`, `loadLeagues`)
- Variables : `camelCase` (`userId`, `isLoading`)
- Constantes : `UPPER_SNAKE_CASE` (`MIGRATION_FLAG_KEY`)
- Tables / colonnes DB : `snake_case` (`leagues`, `created_at`, `user_id`)

---

## Organization

### Structure (monorepo)
```
apps/
  web/src/
    components/       # UI réutilisables
      design-system/  # Primitives Ponglo Arcade (Banner, Card, ScreenLayout, etc.)
      layout/         # MenuDrawer, shells
      ponglo/         # Wordmark, PButton, EloDelta, PRankBadge
    context/          # AuthContext, IdentityContext, LeagueContext
    hooks/            # useAuth, useIdentity
    lib/              # Client Supabase
    pages/            # Routes
    services/         # Business logic + repositories
    types/            # Types Supabase générés + métier
    utils/            # elo, deviceFingerprint, dateUtils
  mobile/src/         # Miroir React Native (9 screens)
packages/
  shared/src/         # Types, services, utils partagés web/mobile
```

### Tests
- `apps/web/tests/unit/` — unit tests
- `apps/web/tests/integration/`
- `apps/web/tests/e2e/flows/` — Playwright
- **Non co-localisés** avec la source

---

## Formats

### Dates
- **ISO 8601** uniquement : `"2026-01-23T10:30:00Z"` ou `"2026-01-23"`
- Jamais de Unix timestamp ni format custom

### Booleans
- `true` / `false` — pas `1` / `0`
- DB : `is_finished: boolean` (pas `isFinished?` côté DB)

### Null handling
- `null` pour les champs DB optionnels (pas `undefined`)
- Type : `creator_user_id: string | null`

### Arrays
- Toujours un array pour les collections (jamais un objet unique quand plusieurs sont possibles)

---

## UX Patterns

### Loading states
- Nom : `isLoading{Context}` (ex. `isLoadingInitialData`, `authLoading`)
- Global : états de loading Context pour les données initiales
- Local : état composant pour loading d'actions
- UI : toujours via `<LoadingSpinner />`

### Optimistic updates
- Update UI immédiat, sync Supabase en arrière-plan
- State first, async après
- Rollback + notification user en cas d'erreur

### Error messages
- User-facing : `toast.error('Message clair')`
- Dev : `console.error('Context technique', error)`
- **Jamais exposer une erreur technique** à l'utilisateur

### Form Page Pattern (Sticky CTA)
**Pages concernées :** Créer tournoi, Créer league, et toute page de formulaire création/édition.

**Règle :** Le CTA principal (submit) doit être **sticky** au-dessus du bottom nav, toujours visible pendant le scroll.

**Structure :**
- Zone contenu : `overflow-y-auto pb-24` (réserve d'espace pour la barre CTA)
- Barre CTA : `fixed bottom-16 inset-x-0 z-20 bg-paper border-t border-ink/10 p-4 md:p-6`
- Bouton : `form="form-id"` pour associer au formulaire (bouton hors du `<form>`)

---

## Design System (Ponglo Arcade)

- Tokens définis dans `apps/web/tailwind.config.js` — **jamais** de couleurs hardcodées
- Palette : `cream`, `paper`, `ink`/`ink-soft`/`ink-mute`, `cup-red` / `cup-blue` / `lime`, `gold`, `ruby`
- Tailwind utilitaires : `p-page`, `rounded-card`, `shadow-modal` — préférer à `p-4` / `rounded-lg`
- Typos : `Space Grotesk` (body), `Archivo` (display uppercase), `JetBrains Mono` (chiffres)
- Primitives Ponglo : `PongloWordmark`, `PButton`, `EloDelta`, `PRankBadge` (dans `components/ponglo/`)
- Composants DS : voir showcase vivant `/design-system` (`DesignSystemShowcase.tsx`)

Détails complets : `architecture.md` section "Design system Ponglo Arcade".

---

## Sécurité

- **Aucun secret côté client** — `STRIPE_SECRET_KEY`, `service_role` key restent en edge function
- **RLS activée** sur toutes les tables Supabase — pas d'exception
- **ELO calculé côté serveur** pour les matchs ranked confirmés (anti-cheat)
- **ELO toujours local** — par event ou par league, jamais agrégé globalement (cf. `docs/architecture.md` §Modèle ELO). Stats lifetime app-wide = matchs joués / win rate / streak, pas d'ELO moyen.
- **Validation des inputs** côté edge function, pas seulement côté client

---

## Testing

### Structure
- `tests/unit/services/`, `tests/unit/utils/`
- `tests/integration/` (flows auth, identity merge)
- `tests/e2e/flows/` (Playwright, scenarios user)

### Naming
- Fichiers : `{name}.test.ts` ou `.spec.ts`
- Describe : nom du composant/fonction
- Test case : `should {behavior} when {condition}`

### Mocking
- Mock Supabase dans `tests/__mocks__/supabase.ts`
- Factories pour les test data
- Cleanup après chaque test

### Exigences
- Nouveau composant → au moins un test unitaire
- Nouvelle logique métier (ELO, merge, premium gating) → test obligatoire
- Feature user-facing → happy path E2E

---

## Anti-patterns

### ❌ Naming incohérent
```ts
export const empty_state = () => { ... }   // → EmptyState
const user_id = "123";                     // → userId
class databaseService { ... }              // → DatabaseService
```

### ❌ Mutation directe
```ts
leagues.push(newLeague);                   // → setLeagues(prev => [...prev, newLeague])
```

### ❌ Pas d'error handling
```ts
const data = await supabase.from('leagues').select('*');   // doit check error
```

### ❌ Pas de data transformation
```ts
const league = { created_at: "2026-01-23", user_id: "123" };   // doit convertir en camelCase
```

### ❌ Timestamps custom
```ts
const date = 1706006400;   // → "2026-01-23T10:30:00Z"
```

### ❌ Messages d'erreur génériques exposés
```ts
catch (error) {
  console.error(error);   // manque contexte + manque message user friendly
}
```

### ❌ Imports non utilisés (strict mode casse le build)
```ts
import { unusedFunction } from "./utils";
import { User } from "@supabase/supabase-js";   // → import type { User }
```

---

## Workflow Git

- Branches : `feature/`, `fix/`, `refactor/`
- Commit messages : clairs, descriptifs, en français ou anglais selon contexte
- PR : description → scope, files touchés, tests, risques (voir `CLAUDE.md` section "Planning new work")
- **Pas de fichiers `.md` de stories ou code-reviews versionnés** — le PR + git log sont le record
