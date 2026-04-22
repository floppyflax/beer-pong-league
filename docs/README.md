# Documentation Beer Pong League

Documentation technique et produit de l'application Beer Pong League. Ce dossier centralise tout ce qu'il faut savoir pour contribuer, déployer et opérer le projet.

## Sommaire

- [Getting Started](./getting-started.md) — prérequis, installation, premier lancement local.
- [Architecture](./architecture.md) — stack, arborescence, modèle de données Supabase, inventaire des composants, contrats API.
- [Product Context](./product-context.md) — règles de codage, patterns, anti-patterns (TypeScript, React, Supabase, DS Arcade).
- [Authentification & identité](./auth-identity.md) — flow anonyme → OTP → merge, comptes de test dev, configuration des providers.
- [Paiements Stripe](./payments.md) — setup Stripe, Price IDs, edge functions checkout/verify, cartes de test.
- [Supabase](./supabase.md) — projet Supabase, nouvelles clés `sb_publishable_*`, variables d'environnement, déploiement edge functions.
- [Testing](./testing.md) — stratégie, Vitest, Playwright, commandes et guide manuel.
- [Déploiement](./deployment.md) — Vercel (prod + preview), variables d'env, domaine `beer-pong-elo.com`.
- [Roadmap](./roadmap.md) — vision, personas, fonctionnalités livrées, en cours et backlog.
- [Archive BMAD legacy](./archive/bmad-legacy/) — snapshots produit de l'ère BMAD (jan–fév 2026), non maintenus.

## Projet en un coup d'œil

Application web (React 18 + TypeScript + Vite) de gestion de ligues et tournois de beer-pong avec classement ELO. Backend Supabase (Auth, Postgres, Edge Functions). Paiement premium via Stripe. Hébergement Vercel. Mode offline-first avec fallback `localStorage`.
