# Architecture

SPA React + TypeScript déployée sur Vercel, adossée à Supabase (Postgres, Auth, Edge Functions). Mode offline-first avec fallback `localStorage`.

## Stack technique

| Catégorie | Technologie |
|-----------|-------------|
| Framework UI | React 18 |
| Langage | TypeScript 5 |
| Build | Vite 5 |
| Styling | Tailwind CSS |
| Routing | React Router 6 |
| Data fetching | @tanstack/react-query |
| Icônes | lucide-react |
| Toasts | react-hot-toast |
| QR codes | qrcode.react, react-qr-code, html5-qrcode |
| Validation | zod |
| Backend | Supabase (Auth, Postgres, Realtime, Edge Functions) |
| Paiement | Stripe (`@stripe/stripe-js`) |
| PWA / cache | Workbox |
| Hébergement | Vercel |

## Arborescence monorepo

```
apps/
  web/src/
    components/         # UI réutilisables
      design-system/    # Primitives Arcade (Banner, Card, ScreenLayout, etc.)
      layout/           # MenuDrawer, wrappers
      ponglo/           # Wordmark, PButton, EloDelta, PRankBadge
    context/            # AuthContext, IdentityContext, LeagueContext
    hooks/              # useAuth, useIdentity
    lib/                # Client Supabase (supabase.ts)
    pages/              # Vues route-level
    services/           # Auth, Database, Identity, Migration, Stripe + repositories/
    types/              # Types Supabase générés + métier
    utils/              # deviceFingerprint, elo, dateUtils
    App.tsx
    main.tsx
  mobile/src/           # React Native — miroir des 9 principaux screens
packages/
  shared/src/           # Types, services, utils partagés web ↔ mobile
supabase/
  functions/            # Edge functions (create-checkout-session, verify-payment-session)
  migrations/           # 001_initial_schema.sql, 002_add_anti_cheat.sql, ...
```

Config à la racine : `package.json` (workspaces), `vercel.json`, `playwright.config.ts`. Config par app : `vite.config.ts` (alias `@/`), `tsconfig.json`, `tailwind.config.js`.

## Modèle de données (Supabase Postgres)

Les migrations vivent dans `supabase/migrations/` : `001_initial_schema.sql` et `002_add_anti_cheat.sql`. RLS activée sur toutes les tables.

### Tables principales

**`users`** — étend `auth.users`, profil des comptes authentifiés.
- `id` (UUID PK, FK `auth.users.id`), `pseudo`, `avatar_url`, `created_at`, `updated_at`.

**`anonymous_users`** — identités locales liées à un device.
- `id`, `pseudo`, `device_fingerprint`, `created_at`, `merged_to_user_id`, `merged_at`.

**`leagues`** — `id`, `name`, `type` (`event` | `season`), `creator_user_id` **ou** `creator_anonymous_user_id` (exclusif), `anti_cheat_enabled`, timestamps.

**`league_players`** — pivot league ↔ joueur avec stats ELO.
- `league_id`, `user_id` **ou** `anonymous_user_id`, `pseudo_in_league`, `elo` (défaut 1000), `wins`, `losses`, `matches_played`, `streak`, `joined_at`.

**`tournaments`** — comme `leagues` avec `league_id` optionnel, `date`, `is_finished`.

**`tournament_players`** — pivot tournoi ↔ joueur, `pseudo_in_tournament`.

**`matches`** — `tournament_id` et/ou `league_id`, `format` (`1v1`|`2v2`|`3v3`), `team_a_player_ids[]`, `team_b_player_ids[]`, `score_a`, `score_b`, `is_ranked`, `created_by_*`, et pour l'anti-cheat : `status` (`pending`|`confirmed`|`rejected`), `confirmed_by_*`, `confirmed_at`.

**`elo_history`** — `match_id`, `tournament_id?`, `league_id?`, `user_id`/`anonymous_user_id`, `elo_before`, `elo_after`, `elo_change`. Une ligne par joueur impacté par un match. Les colonnes `tournament_id` / `league_id` indiquent dans quel contexte la modification ELO s'applique.

**`user_identity_merges`** — audit des fusions anonyme → compte.

### Règles clés

- Exactement un des deux couples `user_id` / `anonymous_user_id` doit être défini (CHECK constraints).
- Les pseudos sont uniques par league ou tournoi, pas globalement.
- Les types TypeScript sont générés dans `src/types/supabase.ts`, les types métier partagés dans `src/types.ts`.

### Modèle ELO (canonique)

**Principe** : l'ELO est **toujours local** à un cluster d'adversaires. Un ELO n'est calibré que par les matchs effectivement joués entre des joueurs de ce cluster ; agréger des ELO entre clusters disjoints (ex. deux groupes d'amis qui ne se sont jamais croisés) ne produit pas un classement comparable. **Pas d'ELO global.**

**Trois niveaux de granularité** :

1. **Event ELO** (per-event) — chaque match enregistré dans un événement met à jour l'ELO **dans le contexte de cet événement**. Source de vérité : `tournament_players.elo` (cf. roadmap §gap connu : la colonne n'est pas encore wired pour les events autonomes — actuellement, les events liés à une ligue exposent l'ELO de la ligue, et les events autonomes affichent un ELO par défaut non persisté).
2. **League ELO** (per-league) — les matchs d'un événement rattaché à une ligue mettent à jour `league_players.elo` **si le paramétrage de l'événement le permet** (propagation activable / désactivable). Un match de ligue hors événement met aussi à jour `league_players.elo`.
3. **Stats lifetime** (per-user, app-wide) — agrégat lifetime non-ELO : `totalMatches`, `winRate`, `bestStreak`. Calculé à la volée depuis `elo_history`. **Pas d'ELO agrégé** — ces stats n'ont pas besoin de calibration cross-cluster.

**Surface UI** :
- Event Dashboard, League Dashboard : afficher l'ELO du contexte courant (Event ELO ou League ELO).
- Page `/leaderboard` (« Stats globales ») : classement par activité (matchs / wins / win rate), **pas par ELO**.
- Home : stat hero card sur les matchs joués lifetime (pas d'ELO global).
- Profil joueur : ELO **par contexte** (chart + tableau par ligue/event), jamais une moyenne agrégée.

**Anti-cheat** : ELO calculé serveur pour les matchs ranked confirmés (cf. skill `elo-logic`).

## Composants

### Design system Ponglo Arcade (Epic 15)
- Palette Arcade définie dans `tailwind.config.js` : `cream` (background deep navy `#0B0D14`), `paper`, `ink`/`ink-soft`/`ink-mute`, brand `cup-red` / `cup-blue` / `lime`, signals `gold` / `ruby`.
- Typo : `Space Grotesk` (body), `Archivo` (display, labels uppercase), `JetBrains Mono` (chiffres, codes).
- Composants dans `src/components/design-system/` — APIs stables : `Banner`, `HelpCard`, `PlayerCard`, `StatCard`, `InfoCard`, `FAB`, `ListRow`, `SegmentedTabs`, `SearchBar`, `ScreenLayout` (wrapper header + max-width + overlay), `LastActivityCard` (carte générique leagues/tournaments).
- Primitives Ponglo dans `src/components/ponglo/` : `PongloWordmark`, `PButton` (variants `primary` / `accent` / `lime` / `dark` / `ghost`), `EloDelta` (badge `+14`/`-12`), `PRankBadge` (tiers par ELO).
- Showcase vivant : route `/design-system` (`apps/web/src/pages/DesignSystemShowcase.tsx`).

### Form Page Pattern (Sticky CTA)

**Pages concernées :** `CreateTournament`, `CreateLeague`, et toute page de formulaire création/édition.

**Règle :** le CTA principal (submit) est **sticky** au-dessus du bottom nav, toujours visible pendant le scroll.

**Structure :**
- Zone contenu : `overflow-y-auto pb-24` (réserve d'espace pour la barre CTA)
- Barre CTA : `fixed bottom-16 inset-x-0 z-20 bg-paper border-t border-ink/10 p-4 md:p-6`
- Bouton : attribut `form="form-id"` pour l'associer au formulaire (bouton hors du `<form>`)

### Layout et shell
- `components/layout/MenuDrawer` — drawer de navigation principal.
- `components/design-system/ScreenLayout` — wrapper standard (header `ContextualHeader` + max-width narrow/wide/full + overlay pour CTAs sticky et modales).

### Modals
- `AuthModal` — email + OTP (et password en dev pour comptes de test).
- `IdentityModal`, `CreateIdentityModal` — gestion et création d'identité locale.
- `CreateMenuModal` — choix tournoi/ligue + gating premium.
- `PaymentModal` — déclenche le checkout Stripe ou simule en dev.
- `DevPanel` — panneau flottant dev-only (connexion rapide, inspection identité).

### Affichage / feedback
- `EloChangeDisplay`, `EmptyState`, `LoadingSpinner`, `IdentityInitializer`.
- `HelpCard`, `PlayerCard` (design refactor Epic 14).

### Pages (routes)
`CreateLeague`, `LeagueDashboard`, `CreateTournament`, `TournamentDashboard`, `PlayerProfile`, `UserProfile`, `DisplayView`, `TournamentDisplayView`, `TournamentInvite`, `TournamentJoin`, `AuthCallback`, `PaymentSuccess`, `PaymentCancel`.

### Contexts et hooks
- `AuthContext` / `useAuth` — session Supabase.
- `IdentityContext` / `useIdentity` — identité unifiée (user authentifié ou anonyme local).
- `LeagueContext` — données league / tournaments / matches.

## Contrats API

Pas d'API REST maison : tout passe par le client `@supabase/supabase-js` exporté depuis `src/lib/supabase.ts`.

### Auth (Supabase Auth)
- Méthodes : email + OTP (magic link) en production, email + password pour les comptes de test en dev.
- Redirection : `${window.location.origin}/auth/callback` (page `AuthCallback`).
- Session gérée par `AuthContext` et `AuthService`.

### Base de données
Accès CRUD via `.from(table).select/insert/update/upsert/delete`. RLS Postgres appliquée avec la publishable key + JWT utilisateur.

### Couche services
- **`DatabaseService`** — façade qui ré-exporte les repositories (`src/services/repositories/`) : `LeaguesRepository`, `TournamentsRepository`, `PlayersRepository`, `MatchesRepository`, `DataTransformer` (normalized ↔ nested).
- **`AuthService`** — wrappers Supabase Auth, détection des comptes de test en dev.
- **`AnonymousUserService`** — création et lookup d'utilisateurs anonymes + fingerprint.
- **`LocalUserService`** — persistance locale du profil actif.
- **`IdentityMergeService`** — fusion anonyme → utilisateur authentifié.
- **`MigrationService`** — migration `localStorage` → Supabase.
- **`StripeService`** — appel des edge functions `create-checkout-session` et `verify-payment-session`.

### Edge Functions Supabase
Déployées dans `supabase/functions/` :
- `create-checkout-session` — crée une session Stripe Checkout (utilise `STRIPE_SECRET_KEY`).
- `verify-payment-session` — vérifie le paiement après redirection succès.

URLs : `https://<project-ref>.supabase.co/functions/v1/<function-name>`.

### Realtime
Canaux Supabase Realtime disponibles pour live views (projection tournoi). Activé selon les pages.

### Fallback offline
Les services basculent sur `localStorage` (clés `bpl_*`) quand Supabase est injoignable. Les données locales sont synchronisées au retour de connexion via `MigrationService`.
