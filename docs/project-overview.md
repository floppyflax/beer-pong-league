# Beer Pong League - Project Overview

**Date:** 2026-01-22  
**Type:** Web (React SPA)  
**Architecture:** Component-based SPA + Supabase BaaS

## Executive Summary

Beer Pong League is a React + TypeScript application for managing beer-pong leagues, tournaments, matches, and ELO-based rankings. It supports both authenticated users (email + OTP) and anonymous users (device-bound), with optional merge. The app uses Supabase for auth and database, with a localStorage fallback when offline, and is deployed as a static SPA on Vercel.

## Project Classification

- **Repository Type:** Monolith (single codebase)
- **Project Type:** Web
- **Primary Language:** TypeScript
- **Architecture Pattern:** React SPA with Supabase BaaS; React Context for state

## Technology Stack Summary

| Category | Technology |
|----------|------------|
| Framework | React 18 |
| Language | TypeScript 5 |
| Build | Vite 5 |
| Styling | Tailwind CSS |
| Backend | Supabase (Auth, Postgres, Realtime) |
| Routing | React Router 6 |
| Hosting | Vercel |

## Key Features

- League and tournament management
- ELO ranking system
- Auth (email + OTP) and anonymous play
- User and player profiles
- Display view for live projection
- Offline-first with localStorage fallback and Supabase sync
- Anti-cheat options (match confirmation) for leagues/tournaments

## Architecture Highlights

- Single `src/` app: components, pages, context, services, lib, utils.
- Supabase client in `lib/`; services layer for DB and auth.
- React Context (Auth, Identity, League) + hooks.
- Migrations in `supabase/migrations/`; RLS for security.

## Development Overview

### Prerequisites

Node 18+, npm, Supabase project, Git.

### Getting Started

```bash
npm install
# Add .env.local with VITE_SUPABASE_URL, VITE_SUPABASE_PUBLIC_KEY
npm run dev
```

### Key Commands

- **Install:** `npm install`
- **Dev:** `npm run dev`
- **Build:** `npm run build`
- **Lint:** `npm run lint`

## Repository Structure

- `src/` — App source (components, pages, context, services, lib, utils, types)
- `supabase/migrations/` — PostgreSQL schema and migrations
- Root config: `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`, `vercel.json`

## Documentation Map

- [index.md](./index.md) — Master documentation index
- [architecture.md](./architecture.md) — Detailed architecture
- [source-tree-analysis.md](./source-tree-analysis.md) — Directory structure
- [development-guide.md](./development-guide.md) — Development workflow
- [deployment-guide.md](./deployment-guide.md) — Deployment
- [api-contracts.md](./api-contracts.md) — Supabase usage
- [data-models.md](./data-models.md) — Database schema
- [component-inventory.md](./component-inventory.md) — UI components

---

_Generated using BMAD Method `document-project` workflow_
