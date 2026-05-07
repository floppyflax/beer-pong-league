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
      design-system/    # Primitives DS Everything ELO (Banner, Card, ScreenLayout, Sheet, ...)
      layout/           # MenuDrawer, wrappers
      ponglo/           # Wordmark, PButton, EloDelta, PRankBadge (primitives "marque")
    context/            # AuthContext, IdentityContext, LeagueContext (monolithique — cf. roadmap)
    hooks/              # useAuth, useIdentity, useEventsList, useLeaguesList, ...
    lib/                # Client Supabase (supabase.ts)
    pages/              # Vues route-level
    services/           # Auth, Database, Identity, Migration, Stripe, ELO + repositories/
    types/              # Types Supabase générés + métier
    utils/              # deviceFingerprint, elo, dateUtils
    App.tsx
    main.tsx
  mobile/src/           # React Native / Expo — 15 screens (squelette UI ; services Supabase non branchés)
packages/
  shared/src/           # Types Supabase + utils partagés (validation, dateUtils, string, extractCodeFromQR)
                        # NB : la couche métier (services, repositories) n'est pas encore extraite ici
supabase/
  functions/            # Edge functions (create-checkout-session, verify-payment-session)
  migrations/           # 24 migrations (état mai 2026) — voir liste ci-dessous
```

Config à la racine : `package.json`, `vercel.json`, `turbo.json` (dormant tant que les workspaces ne sont pas activés). Config par app : `vite.config.ts` (alias `@/` et `@elofight/shared`), `tsconfig.json`, `tailwind.config.js`, `playwright.config.ts`, `vitest.config.ts`.

## Modèle de données (Supabase Postgres)

Les migrations vivent dans `supabase/migrations/` (24 migrations cumulées). RLS activée sur toutes les tables (15). Les migrations majeures à connaître :

- **001** — schéma initial : `users`, `anonymous_users`, `leagues`, `league_players`, `tournaments`, `tournament_players`, `matches`, `elo_history`, `user_identity_merges`.
- **002** — anti-cheat : `matches.status` (`pending` / `confirmed` / `rejected`), `confirmed_by_*`, `confirmed_at`.
- **003** — fonction `merge_anonymous_identity` (fusion anonyme → user).
- **010** — `achievements` + `player_achievements` + trigger `check_achievements_on_match`.
- **015** — `ghost_invite_tokens` (invitation par token signé).
- **022** — modèle unifié **player ↔ user** : nouvelles tables `players`, `league_memberships`, `event_memberships` qui supersèdent `league_players` / `tournament_players`. Les `matches.team_*_player_ids` pointent désormais vers `players.id`.
- **023** — `tournament_memberships.elo` (ELO par event indépendant) + `tournaments.propagates_to_league_elo`.
- **024** — rename `tournaments` → `events` (côté DB ; certaines colonnes `*_tournament_id` historiques restent à aligner).

### Tables principales

**`users`** — étend `auth.users`, profil des comptes authentifiés.
- `id` (UUID PK, FK `auth.users.id`), `pseudo`, `avatar_url`, `is_anonymous`, `device_fingerprint?`, `auth_user_id?`, `created_at`, `updated_at`. Depuis mig 022, `users` couvre aussi les identités anonymes (champ `is_anonymous`).

**`anonymous_users`** — table historique conservée pour audit / compatibilité ascendante.

**`players`** (mig 022) — entité de jeu. Optionnellement claimée par un user via `user_id`. `null` = ghost.

**`leagues`** — `id`, `name`, `type` (`one-shot` | `season` depuis mig 019), `creator_user_id`, `anti_cheat_enabled`, `join_code?`, timestamps.

**`league_memberships`** (mig 022) — pivot league ↔ player avec stats ELO : `elo` (défaut 1000), `wins`, `losses`, `matches_played`, `streak`, `pseudo_override?`, `joined_at`, `archived_at?`.

**`events`** (renommé depuis `tournaments` en mig 024) — `id`, `name`, `date`, `league_id?`, `is_finished`, `format_type` (`fixed` | `free`), `team1_size?`, `team2_size?`, `mode` (`elo` | `bracket`), `propagates_to_league_elo`, `anti_cheat_enabled`, `join_code?`.

**`event_memberships`** (mig 022 — anciennement `tournament_memberships`) — pivot event ↔ player. Depuis mig 023, contient son propre `elo` indépendant de la ligue.

**`matches`** — `event_id?` et/ou `league_id?`, `format` (`1v1`|`2v2`|`3v3`), `team_a_player_ids[]`, `team_b_player_ids[]` (pointent vers `players.id`), `score_a`, `score_b`, `is_ranked`, `status` (`pending`|`confirmed`|`rejected`), `confirmed_by_user_id?`, `confirmed_at?`, `cups_remaining?`, `photo_url?`, `is_live?`, `balloon_possession?`, `is_match_point?`.

**`elo_history`** — une ligne par joueur impacté par un match. Colonnes `tournament_id?` / `league_id?` indiquent le **contexte** dans lequel la modification ELO s'applique. Un match propagé peut produire 2 lignes par joueur (event + ligue).

**`achievements`** + **`player_achievements`** (mig 010) — succès débloquables, déclenchés par trigger PG `check_achievements_on_match`.

**`ghost_invite_tokens`** (mig 015) — tokens d'invitation signés pour rattacher un ghost à un compte.

**`user_identity_merges`** — audit des fusions anonyme → compte.

### Règles clés

- Mig 022 a unifié `users` (anonymes et authentifiés) — l'identité de jeu vit dans `players`, distincte de l'identité de compte.
- Pseudos uniques par league/event, pas globalement.
- Types Supabase générés dans `apps/web/src/types/supabase.ts`. Tables introduites par mig 022 (`players`, `*_memberships`) sont accédées via un cast loose dans `services/repositories/_base.ts` jusqu'à régénération des types.

### Modèle ELO (canonique)

**Principe** : l'ELO est **toujours local** à un cluster d'adversaires. Un ELO n'est calibré que par les matchs effectivement joués entre des joueurs de ce cluster ; agréger des ELO entre clusters disjoints (ex. deux groupes d'amis qui ne se sont jamais croisés) ne produit pas un classement comparable. **Pas d'ELO global.**

**Trois niveaux de granularité** :

1. **Event ELO** (per-event) — chaque match enregistré dans un événement met à jour l'ELO **dans le contexte de cet événement**. Source de vérité : `tournament_memberships.elo` (mig 023). Les events autonomes ont leur propre bulle ELO ; les events liés à une ligue héritent du ELO ligue à l'inscription puis évoluent indépendamment.
2. **League ELO** (per-league) — les matchs d'un événement rattaché à une ligue mettent à jour `league_memberships.elo` **si le paramétrage de l'événement le permet** (`tournaments.propagates_to_league_elo`, default TRUE). Le delta league est calculé indépendamment du delta event (chacun avec sa propre baseline). Un match de ligue hors événement met aussi à jour `league_memberships.elo`.
3. **Stats lifetime** (per-user, app-wide) — agrégat lifetime non-ELO : `totalMatches`, `winRate`, `bestStreak`. Calculé à la volée depuis `elo_history`, **dédupliqué par `match_id`** pour éviter de compter deux fois un match propagé. **Pas d'ELO agrégé** — ces stats n'ont pas besoin de calibration cross-cluster.

**Auto-add à la ligue** — quand un joueur rejoint un event rattaché à une ligue (via lien/code/admin), une `league_memberships` est créée automatiquement si elle n'existe pas. Inversement, quand un event est rattaché à une ligue _a posteriori_ (`associateTournamentToLeague`), tous les joueurs de l'event sont synchronisés vers la ligue.

**`elo_history` post-mig-023** — un match peut produire jusqu'à 2 lignes par joueur :
- Une ligne avec `tournament_id` set, `league_id` NULL → delta event.
- Une ligne avec `league_id` set, `tournament_id` NULL → delta league (uniquement si propagation active).

Cela permet de tracer l'évolution ELO **par contexte** indépendamment, et d'alimenter un futur graph ELO par contexte sans ambiguïté.

**Surface UI** :
- Event Dashboard, League Dashboard : afficher l'ELO du contexte courant (Event ELO ou League ELO).
- Page `/leaderboard` (« Stats globales ») : classement par activité (matchs / wins / win rate), **pas par ELO**.
- Home : stat hero card sur les matchs joués lifetime (pas d'ELO global).
- Profil joueur : ELO **par contexte** (chart + tableau par ligue/event), jamais une moyenne agrégée.

**Anti-cheat** (cible) : l'invariant produit est que l'ELO doit être calculé serveur pour les matchs ranked confirmés. **Implémentation actuelle : 100 % côté client** via [`apps/web/src/utils/elo.ts`](../apps/web/src/utils/elo.ts) et [`apps/web/src/services/EloRecalcService.ts`](../apps/web/src/services/EloRecalcService.ts) — gap connu, à corriger via une fonction Postgres `SECURITY DEFINER` (cf. roadmap §2.1 du plan d'audit). Le squelette anti-cheat (`status` + `confirmed_by_*`) est en place ; seul le calcul reste à déplacer côté serveur.

## Composants

### Design system Everything ELO (Epic 15 — actuel)
- Palette canonique dans `apps/web/tailwind.config.js` : `navy` / `navy-deep` / `navy-soft` (surfaces), `cool-gray` (texte secondaire), `electric-blue` (CTA primaire, focus), `signal-red` (alerte, delta négatif), `ping-yellow` (highlight, podium 1er), `lime` (delta positif, ELO hero), `bronze` (podium 3e). Variantes `*-deep` pour les états pressés.
- Typo : `Sora` (body/display via `font-sans`), `Teko` (chiffres ELO/scoreboard via `font-display`), `JetBrains Mono` (codes/monospace), `Archivo` conservé en legacy.
- Composants dans `src/components/design-system/` — APIs stables : `Avatar`, `Badge`, `Banner`, `Button`, `Card`, `CodeInput`, `DetailHero`, `FAB`, `FormField`, `HelpCard`, `Input`, `ListRow`, `MatchHistoryCard`, `PageHero`, `PlayerCard`, `PremiumGate`, `ScreenLayout`, `SearchBar`, `SegmentedTabs`, `Select`, `Sheet` + dérivés (`SettingsSheet`, `InviteSheet`, `IdentityGateSheet`, `ClaimGuestSheet`, `GhostManagementSheet`), `StatCard`, `StickyCTA`, `ToggleRow`. Sous-dossiers `atoms/`, `molecules/`, `page-specific/`, `showcase/`.
- Primitives "marque" dans `src/components/ponglo/` (frontière à durcir — cf. roadmap §3.1) : `Wordmark`, `PButton` (variants `primary` / `accent` / `lime` / `dark` / `ghost`), `EloDelta`, `PRankBadge` (tiers par ELO), `PAvatar`, `LeaderRow`, `Podium`, `MatchRow`, `Sparkline`, `EloChart`, `BeerCupLoader`, `DayGroup`, `FAB`.
- Showcase vivant : route `/design-system` (`apps/web/src/pages/DesignSystemShowcase.tsx`).

### Form Page Pattern (Sticky CTA)

**Pages concernées :** `CreateEvent`, `CreateLeague`, et toute page de formulaire création/édition.

**Règle :** le CTA principal (submit) est **sticky** au-dessus du bottom nav, toujours visible pendant le scroll. Composant utilitaire dédié : `components/design-system/StickyCTA`.

**Structure :**
- Zone contenu : `overflow-y-auto pb-24` (réserve d'espace pour la barre CTA)
- Barre CTA : positionnée via `StickyCTA` au-dessus du bottom nav, fond `navy` / bord `cool-gray/10`
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
`Home`, `Landing`, `Join`, `Events`, `Leagues`, `Competitions`, `CreateLeague`, `LeagueDashboard`, `LeagueJoin`, `CreateEvent`, `EventDashboard`, `EventDisplayView`, `EventInvite`, `EventJoin`, `RecordMatch`, `PlayerProfile`, `UserProfile`, `GlobalLeaderboard`, `DisplayView`, `AuthCallback`, `PaymentSuccess`, `PaymentCancel`, `DesignSystemShowcase`.

### Contexts et hooks
- `AuthContext` / `useAuth` — session Supabase.
- `IdentityContext` / `useIdentity` — identité unifiée (user authentifié ou anonyme local).
- `LeagueContext` — **monolithique** (1100+ lignes — gère leagues, events, players, matches). Refactor planifié (cf. plan d'audit §2.2).
- Hooks data : `useEventsList`, `useLeaguesList`, `useHomeData`, `useJoinEvent`, `useUnclaimedGuests`, `useDetailPagePermissions`, `usePremium`, `usePremiumLimits`, `useRequireIdentity`, `useFullDisconnect`, `useBreakpoint`, `useIsAnonymous`, `useNativeInit`.

## Contrats API

Pas d'API REST maison : tout passe par le client `@supabase/supabase-js` exporté depuis `src/lib/supabase.ts`.

### Auth (Supabase Auth)
- Méthodes : email + OTP (magic link) en production, email + password pour les comptes de test en dev.
- Redirection : `${window.location.origin}/auth/callback` (page `AuthCallback`).
- Session gérée par `AuthContext` et `AuthService`.

### Base de données
Accès CRUD via `.from(table).select/insert/update/upsert/delete`. RLS Postgres appliquée avec la publishable key + JWT utilisateur.

### Couche services
- **`DatabaseService`** — façade qui ré-exporte les repositories (`src/services/repositories/`) : `LeaguesRepository`, `EventsRepository`, `PlayersRepository`, `MatchesRepository` (+ `_base.ts`). `DataTransformer` (normalized ↔ nested) vit aux côtés.
- **`AuthService`** — wrappers Supabase Auth, détection des comptes de test en dev.
- **`AnonymousUserService`** — création et lookup d'utilisateurs anonymes + fingerprint.
- **`LocalUserService`** — persistance locale du profil actif.
- **`IdentityMergeService`** — fusion anonyme → utilisateur authentifié.
- **`MigrationService`** — migration `localStorage` → Supabase.
- **`StripeService`** — appel des edge functions `create-checkout-session` et `verify-payment-session`. Récupère le JWT user via `supabase.auth.getSession()` pour authentifier l'appel ; tombe sur la publishable key en mode anonyme.
- **`EloRecalcService`** — replay chronologique des matchs ranked pour reconstruire `league_memberships.elo` après edit/delete admin (mig 021/022). À déplacer côté serveur (cf. plan d'audit §2.1).
- **`PremiumService`**, **`PhotoService`**, **`MatchAdminService`**, **`ExportService`**, **`DevAuthService`**.

### Edge Functions Supabase
Déployées dans `supabase/functions/` :
- `create-checkout-session` — crée une session Stripe Checkout. Validation du payload via `zod`. Vérifie le JWT user via `supabaseAdmin.auth.getUser(jwt)` quand `userId` est fourni ; valide l'existence de `anonymous_users.id` sinon. Whitelist optionnelle de `priceId` via `STRIPE_ALLOWED_PRICE_IDS` (csv).
- `verify-payment-session` — vérifie le paiement après redirection succès.

URLs : `https://<project-ref>.supabase.co/functions/v1/<function-name>`.

### Realtime
Canaux Supabase Realtime disponibles pour live views (projection tournoi). Activé selon les pages.

### Fallback offline
Les services basculent sur `localStorage` (clés `bpl_*`) quand Supabase est injoignable. Les données locales sont synchronisées au retour de connexion via `MigrationService`.
