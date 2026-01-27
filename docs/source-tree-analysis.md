# Beer Pong League - Source Tree Analysis

**Date:** 2026-01-22

## Overview

Single-part React SPA (Vite + TypeScript) with Supabase backend. Source lives under `src/`; config and migrations at project root.

## Complete Directory Structure

```
beer-pong-league/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── layout/       # MenuDrawer, layout pieces
│   │   └── *Modal, *Display, *Spinner, etc.
│   ├── context/          # React Context (Auth, Identity, League)
│   ├── hooks/            # useAuth, useIdentity
│   ├── lib/              # Supabase client
│   ├── pages/            # Route-level views
│   ├── services/         # Auth, DB, migration, identity services
│   ├── types/            # Supabase generated types
│   ├── utils/            # deviceFingerprint, elo
│   ├── App.tsx           # Root app, routing, providers
│   ├── main.tsx          # Entry point
│   ├── index.css         # Global styles
│   └── types.ts          # Shared types
├── supabase/
│   └── migrations/       # 001_initial_schema, 002_add_anti_cheat
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── vercel.json
└── *.md                  # README, DEPLOYMENT, etc.
```

## Critical Directories

### `src/`

Main application source. Components, pages, context, services, and utilities.

**Purpose:** React app and Supabase integration  
**Entry Points:** `main.tsx` → `App.tsx`

### `src/components/`

Reusable UI: modals (Auth, Identity, CreateIdentity), layout (MenuDrawer), display (EloChange, EmptyState, LoadingSpinner).

### `src/pages/`

Route-level views: CreateLeague, LeagueDashboard, CreateTournament, TournamentDashboard, PlayerProfile, UserProfile, DisplayView, TournamentDisplayView, TournamentInvite, TournamentJoin, AuthCallback.

### `src/context/`

AuthContext, IdentityContext, LeagueContext — global state.

### `src/services/`

AuthService, DatabaseService, LocalUserService, AnonymousUserService, IdentityMergeService, MigrationService — Supabase and local persistence.

### `src/lib/`

Supabase client initialization.

### `supabase/migrations/`

PostgreSQL schema and migrations (users, leagues, tournaments, matches, ELO, RLS).

## Entry Points

- **Main:** `src/main.tsx` → mounts React app, `index.html` loads it
- **App bootstrap:** `App.tsx` — Router, AuthProvider, IdentityProvider, LeagueProvider, Toaster

## Configuration Files

- `package.json` — deps, scripts (dev, build, lint, preview)
- `vite.config.ts` — Vite + React, `@/` alias
- `tsconfig.json` — TypeScript, `src` include
- `tailwind.config.js` — Tailwind
- `vercel.json` — Vercel deployment
- `.env.local` — `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLIC_KEY`

## File Organization Patterns

- **Components:** `components/` + `layout/` subfolder
- **Routes:** one component per route under `pages/`
- **State:** React Context in `context/`, consumed via hooks in `hooks/`
- **Data:** Supabase in `lib/` + `services/`; types in `types/` and `types.ts`

---

_Generated using BMAD Method `document-project` workflow_
