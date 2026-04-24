# Beer Pong League — Agent Context

Application web + mobile de gestion de ligues et événements de beer-pong avec classement ELO. Backend Supabase, paiement Stripe, hébergement Vercel. Monorepo **web (React + Vite) / mobile (React Native) / shared**.

> **Ce fichier est lu par Claude à chaque session.** Il reste volontairement court : pointeurs denses vers `docs/` et `.claude/`. Pour les règles complètes, voir `docs/product-context.md`.

---

## Monorepo

```
apps/
  web/       # React 18 + Vite 5 + Tailwind (app principale)
  mobile/    # React Native / Expo (9 screens miroirs)
packages/
  shared/    # Types, services, utils partagés
supabase/
  functions/ # Edge functions (Stripe checkout, verify-payment)
  migrations/
docs/        # Documentation vivante
.claude/     # Agents + skills spécifiques projet
```

## Commandes

Depuis la racine (`npm` est configuré avec workspaces) :

| Commande | Usage |
|---|---|
| `npm run dev` | Dev server Vite web (port 5173) |
| `npm run build` | `tsc && vite build` |
| `npm run test -- --run` | Suite Vitest unit + integration |
| `npm run test:e2e` | Playwright (lent, autostart dev server) |
| `npm run lint` | ESLint strict (`--max-warnings 0`) |
| `supabase functions deploy <name>` | Déployer une edge function |

---

## Invariants critiques

**Règles non négociables.** Un agent qui les viole casse la prod ou la sécurité.

1. **Toujours vérifier `isSupabaseAvailable()`** avant toute opération DB. Fallback `localStorage` sinon.
2. **Data transformation snake_case ↔ camelCase** systématique entre DB et app. Helpers dans `DataTransformer`.
3. **State updates immutables uniquement** : `setLeagues(prev => [...prev, x])`, jamais `leagues.push(x)`.
4. **Tokens Everything ELO obligatoires** — aucune couleur hardcodée. Palette dans `apps/web/tailwind.config.js` (`navy`, `electric-blue`, `ping-yellow`, `signal-red`, `lime`, `cool-gray`, `bronze`). Utilitaires : `rounded-card`, `shadow-modal`, `border-card`.
5. **Secrets serveur uniquement** — `STRIPE_SECRET_KEY`, `service_role` key restent en edge function. Aucune exception.
6. **RLS sur chaque table Supabase** — pas de table sans policies. Voir skill `supabase-migrations`.
7. **ELO calculé côté serveur** pour les matchs ranked confirmés (anti-cheat). Voir skill `elo-logic`.
8. **Jamais de `any`** — `unknown` si le type est réellement inconnu. Strict mode enforce.
9. **Jamais exposer une erreur technique à l'utilisateur** — `toast.error('message user-friendly')`, pas `console.error(err)` tout seul.

---

## Où vit la connaissance

| Sujet | Où |
|---|---|
| Patterns, anti-patterns, naming conventions | [`docs/product-context.md`](docs/product-context.md) |
| Architecture système, schéma DB, services | [`docs/architecture.md`](docs/architecture.md) |
| Roadmap + fonctionnalités livrées/backlog | [`docs/roadmap.md`](docs/roadmap.md) |
| Auth flow anonyme → OTP → merge | [`docs/auth-identity.md`](docs/auth-identity.md) |
| Paiements Stripe + premium | [`docs/payments.md`](docs/payments.md) |
| Supabase config + edge functions | [`docs/supabase.md`](docs/supabase.md) |
| Testing strategy | [`docs/testing.md`](docs/testing.md) |
| Déploiement Vercel | [`docs/deployment.md`](docs/deployment.md) |
| Mémoire historique (BMAD 2026-01) | [`docs/archive/bmad-legacy/`](docs/archive/bmad-legacy/) |

---

## Agents & skills disponibles

**Agents** (`.claude/agents/`) :
- **`bpl-planner`** — planning structuré pour features complexes cross-layer ou cross-app. Output en conversation, jamais fichier `.md` versionné.
- **`bpl-reviewer`** — review diff-par-diff avant commit/merge. Output en conversation ou PR comments.
- **`bpl-qa`** — suite de tests (unit + E2E), analyse des échecs, fixes ciblés.

**Skills** (`.claude/skills/`) :
- **`ui-component`** — créer/modifier un composant UI conforme au DS Everything ELO (Beer Pong ELO).
- **`elo-logic`** — calculs ELO, confirmation de match, anti-cheat.
- **`supabase-migrations`** — nouvelles migrations SQL conformes (RLS, types générés).
- **`stripe-premium`** — checkout, entitlement premium, edge functions.
- **`e2e-test`** — écrire/déboguer tests Vitest unit ou Playwright E2E.
- **`doc-curator`** — maintenance de la doc consolidée dans `docs/`.

Invoquer les skills via `/<skill-name>` quand le contexte matche.

---

## Planning new work (replaces BMAD)

**Plus de pipeline epic → story → CODE-REVIEW.md versionnés.**

1. **Plan** — plan mode Claude Code natif pour la majorité des changements. Pour les features cross-layer complexes (UI + service + DB, ou web + mobile), invoquer l'agent `bpl-planner`. Le plan vit **dans la conversation** ou en tête de description de PR — pas dans un fichier versionné.
2. **Execute** — session normale, skills invoqués selon le contexte.
3. **Review** — agent `bpl-reviewer` avant commit/PR. Output en conversation ou commentaires PR.
4. **QA** — agent `bpl-qa` avant merge. Lance tests + rapport.

**Record long-terme** : PR title + description + commits + conversation transcript. Pas de stories, pas de sprint-status YAML, pas de CODE-REVIEW fichiers versionnés.

---

## Documentation discipline

- Nouveau doc → toujours dans `docs/` (jamais à la racine, jamais dans `_<truc>-output/`).
- Maintenance doc → skill `doc-curator`.
- Doc figée / historique → `docs/archive/`.
