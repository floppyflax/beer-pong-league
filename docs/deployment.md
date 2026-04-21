# Déploiement

L'application est déployée comme **SPA statique sur Vercel**, le backend étant hébergé chez **Supabase**. Domaine principal : [beer-pong-elo.com](https://beer-pong-elo.com).

## Infrastructure

| Couche | Techno | Notes |
|--------|--------|-------|
| Frontend | Vercel | SPA statique buildée avec Vite |
| Backend | Supabase | Auth, Postgres, Edge Functions |
| Paiement | Stripe | Checkout hébergé |
| Env | Vercel | `VITE_*` injectées au build |

## Prérequis

- Compte Vercel connecté au repo GitHub.
- Projet Supabase configuré (voir [supabase.md](./supabase.md)).
- Variables d'environnement Stripe si on active les paiements (voir [payments.md](./payments.md)).

## Connexion du repo

1. [vercel.com](https://vercel.com) → **Add New Project** → **Import Git Repository**.
2. Sélectionner `floppyflax/beer-pong-league`.
3. Project settings :
   - **Framework Preset** : Vite
   - **Root Directory** : `./`
   - **Build Command** : `npm run build`
   - **Output Directory** : `dist`
   - **Install Command** : `npm install`

## Variables d'environnement Vercel

**Settings → Environment Variables** :

| Variable | Environnements |
|----------|----------------|
| `VITE_SUPABASE_URL` | Production, Preview, Development |
| `VITE_SUPABASE_PUBLIC_KEY` | Production, Preview, Development |
| `VITE_STRIPE_PUBLISHABLE_KEY` (optionnel) | Production, Preview |
| `VITE_STRIPE_PREMIUM_PRICE_ID` (optionnel) | Production, Preview |

Utiliser la **publishable key** Supabase (format `sb_publishable_xxx`), pas l'ancienne `anon key`. Détails : [supabase.md](./supabase.md).

## Déploiement automatique

- Push sur `main` → déploiement **Production**.
- Push sur une autre branche ou ouverture de PR → **Preview deployment** avec URL unique.
- Les edge functions Supabase sont déployées séparément via `supabase functions deploy` (voir [supabase.md](./supabase.md)).

## Déploiement via CLI

```bash
npm i -g vercel
vercel login
vercel link              # associer au projet existant
vercel                   # deploy preview
vercel --prod            # deploy production
```

Logs et monitoring :

```bash
vercel logs
vercel list
vercel dashboard
```

## Domaine

- Principal : `beer-pong-elo.com` (mappé dans Vercel → Settings → Domains).
- URLs Vercel automatiques : `<project>.vercel.app`, `<project>-<branch>.vercel.app`.
- Toutes les URLs doivent être ajoutées dans Supabase → Authentication → URL Configuration → Redirect URLs (voir [auth-identity.md](./auth-identity.md)).

## Post-deploy

Checklist après chaque déploiement prod :

- Ouvrir l'URL, vérifier que l'app charge sans erreur console.
- Tester l'envoi d'un OTP sur un email réel.
- Vérifier qu'un tournoi peut être créé et qu'un match s'enregistre en base.
- Si paiements actifs : tester avec une carte de test Stripe en mode live ? **Non** : utiliser Stripe test mode uniquement.

## Migrations Supabase

Les migrations ne sont **pas** exécutées par Vercel. Les appliquer manuellement :

```bash
supabase db push
```

Ou copier le SQL dans Supabase Dashboard → SQL Editor. Voir `supabase/migrations/`.

## Rollback

- **Vercel** : Dashboard → Deployments → promote une ancienne version en production, ou revert sur Git.
- **Supabase** : les migrations sont forward-only, prévoir des changements backward-compatible.

## Sécurité

- Exposer uniquement la publishable key côté client ; la `STRIPE_SECRET_KEY` et les clés service role Supabase ne doivent **jamais** apparaître dans le bundle.
- Activer la RLS sur toutes les tables Supabase (déjà fait via les migrations).
- Restreindre les Redirect URLs aux domaines contrôlés.
