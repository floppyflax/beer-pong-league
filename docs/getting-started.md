# Getting Started

Guide d'installation et de premier lancement en local. Pour le détail de chaque brique (Supabase, Stripe, tests, deploy), voir les documents dédiés.

## Prérequis

- Node.js 18 ou supérieur
- npm
- Un projet Supabase (URL + publishable key au format `sb_publishable_xxx`)
- Git

## Installation

```bash
git clone https://github.com/floppyflax/beer-pong-league.git
cd beer-pong-league
npm install
```

## Variables d'environnement

Créer un fichier `.env.local` à la racine :

```env
VITE_SUPABASE_URL=https://<votre-projet>.supabase.co
VITE_SUPABASE_PUBLIC_KEY=sb_publishable_xxx

# Optionnel — uniquement si vous testez les paiements
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
VITE_STRIPE_PREMIUM_PRICE_ID=price_xxx
```

La publishable key Supabase se trouve dans le dashboard → Project Settings → API. Voir [supabase.md](./supabase.md) pour la liste complète des variables.

## Lancer l'application

```bash
npm run dev
```

Le serveur démarre par défaut sur `http://localhost:5173`. Le hot reload est actif sur `src/`.

## Commandes utiles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement Vite |
| `npm run build` | Build production (`tsc` puis `vite build`) |
| `npm run preview` | Prévisualiser le build local |
| `npm run lint` | ESLint sur `.ts` / `.tsx` |
| `npm run test` | Tests Vitest |
| `npm run test:e2e` | Tests Playwright |

Voir [testing.md](./testing.md) pour le détail des scripts de test.

## Premier login en dev

Le projet embarque des comptes de test pour éviter d'avoir à recevoir un magic link à chaque fois. Après avoir configuré Supabase, créez-les via le SQL Editor puis utilisez le **DevPanel** (bouton flottant en bas à droite). Procédure complète : [auth-identity.md](./auth-identity.md).

## Et ensuite

- Configurer Supabase : [supabase.md](./supabase.md)
- Comprendre l'architecture : [architecture.md](./architecture.md)
- Lancer les tests : [testing.md](./testing.md)
- Déployer : [deployment.md](./deployment.md)
