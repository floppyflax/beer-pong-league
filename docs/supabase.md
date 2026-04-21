# Supabase

Supabase fournit l'Auth, Postgres, Realtime et les Edge Functions. Le projet utilise le **nouveau système de clés API** (publishable keys `sb_publishable_*`), les anciennes `anon keys` étant deprecated.

## Projet

- **Dashboard** : [supabase.com/dashboard](https://supabase.com/dashboard)
- **URL** : `https://<project-ref>.supabase.co`
- **Reference ID** : Dashboard → Project Settings → General → Reference ID

## Clés API

### Nouveau système (actuel)

- **Publishable key** (`sb_publishable_xxx`) : utilisée côté client (Vite). Se trouve dans Dashboard → Project Settings → API → Publishable key. Peut être révoquée/rotée indépendamment.
- **Secret key** (`sk_secret_xxx`) : réservée au serveur (edge functions, scripts admin). Ne JAMAIS l'exposer côté client.

### Ancien système (deprecated)

Les anciennes clés `anon` et `service_role` fonctionnent encore pendant la période de transition mais il faut migrer :

```env
# Ancien (deprecated)
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...

# Nouveau
VITE_SUPABASE_PUBLIC_KEY=sb_publishable_xxx
```

Code concerné : `src/lib/supabase.ts`, `src/vite-env.d.ts`.

## Variables d'environnement du projet

### Client (`.env.local` + Vercel)

| Variable | Description | Obligatoire |
|----------|-------------|-------------|
| `VITE_SUPABASE_URL` | URL du projet Supabase | Oui |
| `VITE_SUPABASE_PUBLIC_KEY` | Publishable key | Oui |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Clé publique Stripe | Non (simulation si absente) |
| `VITE_STRIPE_PREMIUM_PRICE_ID` | Price ID du produit Premium | Non |

### Edge Functions (secrets Supabase)

| Secret | Description |
|--------|-------------|
| `STRIPE_SECRET_KEY` | Clé secrète Stripe pour les sessions Checkout |
| `STRIPE_PREMIUM_PRICE_ID` | Price ID côté serveur |

Définir via dashboard (Settings → Vault) ou CLI :

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxx
supabase secrets set STRIPE_PREMIUM_PRICE_ID=price_xxx
```

## Migrations

Dans `supabase/migrations/` :

- `001_initial_schema.sql` — création des tables (`users`, `anonymous_users`, `leagues`, `league_players`, `tournaments`, `tournament_players`, `matches`, `elo_history`, `user_identity_merges`), triggers, RLS.
- `002_add_anti_cheat.sql` — ajout de `anti_cheat_enabled` sur `leagues`/`tournaments` et du système de confirmation de matchs (`status`, `confirmed_by_*`, `confirmed_at`).

Appliquer via CLI :

```bash
supabase db push
```

Ou copier le SQL dans Dashboard → SQL Editor.

## Edge Functions

Sources dans `supabase/functions/`. Deux functions actuellement :

- `create-checkout-session` — crée une Stripe Checkout Session.
- `verify-payment-session` — vérifie le paiement après redirect.

### Installation CLI

```bash
# macOS
brew install supabase/tap/supabase
# ou
npm install -g supabase
```

### Déploiement

```bash
supabase login
supabase link --project-ref <project-ref>

supabase functions deploy create-checkout-session
supabase functions deploy verify-payment-session
supabase functions list
```

### Test local

```bash
supabase start               # démarre Supabase local (Docker requis)
supabase functions serve

curl -i --location --request POST \
  'http://localhost:54321/functions/v1/create-checkout-session' \
  --header 'Authorization: Bearer <publishable-key>' \
  --header 'Content-Type: application/json' \
  --data '{"userId":"test-id","priceId":"price_xxx"}'
```

### Logs en production

Dashboard Supabase → Functions → `<function-name>` → Logs.

## Authentification

Providers à activer dans Dashboard → Authentication → Providers :

- **Email** : `Enable Email provider` + `Enable Email Signup`. Magic link en production, password autorisé pour les comptes de test en dev.

**Redirect URLs** (Authentication → URL Configuration) :

```
http://localhost:5173/auth/callback
http://localhost:5173/**
https://*.vercel.app/auth/callback
https://beer-pong-elo.com/auth/callback
```

Détails du flow d'auth : [auth-identity.md](./auth-identity.md).

## Row Level Security (RLS)

Activée sur toutes les tables. Les policies autorisent les lectures/écritures sur les ressources appartenant à l'utilisateur (authentifié via JWT ou anonyme via `anonymous_user_id` passé explicitement). Voir les fichiers de migration pour le détail.

## Dépannage

- **Warning "anon key is deprecated"** → migrer vers `VITE_SUPABASE_PUBLIC_KEY` dans `.env.local` et Vercel.
- **Edge function not found** → redéployer (`supabase functions deploy <name>`), vérifier `supabase functions list`.
- **"No Stripe API key provided" côté function** → secret `STRIPE_SECRET_KEY` non défini, redéployer après `supabase secrets set`.
- **CORS / realtime bloqué** → autoriser le domaine Vercel dans Supabase.
