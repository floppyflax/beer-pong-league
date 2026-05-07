# Beer Pong League

Application web (+ squelette mobile) de gestion de ligues et événements de beer-pong avec classement ELO **par contexte** (par event ou par league, pas d'ELO global). Monorepo : web React 18 + Vite, mobile React Native / Expo, package `shared` pour les types et utils. Backend Supabase, paiements Stripe, déployée sur Vercel.

**Live** : [beer-pong-elo.com](https://beer-pong-elo.com)

## Démarrage rapide

```bash
git clone https://github.com/floppyflax/beer-pong-league.git
cd beer-pong-league
npm install
```

Créer `.env.local` :

```env
VITE_SUPABASE_URL=https://<votre-projet>.supabase.co
VITE_SUPABASE_PUBLIC_KEY=sb_publishable_xxx
```

Lancer :

```bash
npm run dev
```

## Documentation

Toute la doc technique et produit est dans [`docs/`](./docs/README.md) :

- [Getting Started](./docs/getting-started.md) — install détaillée.
- [Architecture](./docs/architecture.md) — stack, modèle de données, composants.
- [Auth & identité](./docs/auth-identity.md) — flow anonyme / OTP / merge.
- [Paiements Stripe](./docs/payments.md)
- [Supabase](./docs/supabase.md) — clés, variables, edge functions.
- [Testing](./docs/testing.md)
- [Déploiement](./docs/deployment.md)
- [Roadmap](./docs/roadmap.md)

## Stack

React 18, TypeScript, Vite, Tailwind CSS, Supabase (Auth + Postgres + Edge Functions), Stripe, Vercel.
